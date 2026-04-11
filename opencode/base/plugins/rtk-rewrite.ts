/**
 * RTKRewrite — OpenCode local plugin
 *
 * Rewrites common Bash commands to `rtk ...` equivalents before execution,
 * reducing tool output size and token usage.
 */

const GIT_SUB = new Set([
  "status",
  "diff",
  "log",
  "add",
  "commit",
  "push",
  "pull",
  "branch",
  "fetch",
  "stash",
]);

const CARGO_SUB = new Set(["test", "build", "clippy"]);
const GO_SUB = new Set(["test", "build", "vet"]);
const DOCKER_SUB = new Set(["ps", "images", "logs"]);
const KUBECTL_SUB = new Set(["get", "logs"]);
const GH_SUB = new Set(["pr", "issue", "run"]);
const PIP_SUB = new Set(["list", "install", "outdated"]);
const RUFF_SUB = new Set(["check", "format"]);
const PNPM_SUB = new Set(["test", "tsc", "lint", "list", "ls", "outdated"]);

const GREP_SHORT_WITH_VALUE = new Set(["A", "B", "C", "m", "g", "e", "f"]);
const GREP_LONG_WITH_VALUE = new Set([
  "after-context",
  "before-context",
  "context",
  "max-count",
  "glob",
  "regexp",
  "file",
  "type",
  "type-not",
]);

const RTK_FALLBACKS = ["/opt/homebrew/bin/rtk", "/usr/local/bin/rtk"];

function isComplexCommand(cmd: string): boolean {
  return (
    cmd.includes("<<") ||
    cmd.includes("&&") ||
    cmd.includes("||") ||
    cmd.includes(";") ||
    cmd.includes("|")
  );
}

function tokenizeShellArgs(input: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (!ch) continue;

    if (quote) {
      if (ch === quote) {
        quote = null;
        continue;
      }

      if (ch === "\\" && quote === '"') {
        const next = input[i + 1];
        if (next) {
          current += next;
          i += 1;
          continue;
        }
      }

      current += ch;
      continue;
    }

    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }

    if (/\s/.test(ch)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    if (ch === "\\") {
      const next = input[i + 1];
      if (next) {
        current += next;
        i += 1;
      }
      continue;
    }

    current += ch;
  }

  if (current.length > 0) tokens.push(current);
  return tokens;
}

function shellEscapeArg(arg: string): string {
  if (arg.length === 0) return "''";
  if (/^[A-Za-z0-9_./:@%+=,~\-]+$/.test(arg)) return arg;
  return `'${arg.replace(/'/g, `'"'"'`)}'`;
}

function parseLeadingGrepOption(
  args: string[],
  index: number,
): [string[], number] | null {
  const token = args[index];
  if (!token || token === "--" || token === "-") return null;
  if (!token.startsWith("-")) return null;

  const out = [token];

  if (token.startsWith("--")) {
    const key = token.slice(2);
    if (!key || key.includes("=")) return [out, 1];
    if (GREP_LONG_WITH_VALUE.has(key) && index + 1 < args.length) {
      out.push(args[index + 1] || "");
      return [out, 2];
    }
    return [out, 1];
  }

  const short = token[1] || "";
  if (
    token.length === 2 &&
    GREP_SHORT_WITH_VALUE.has(short) &&
    index + 1 < args.length
  ) {
    out.push(args[index + 1] || "");
    return [out, 2];
  }

  return [out, 1];
}

function normalizeGrepArgs(
  args: string[],
): { pattern: string; path: string; flags: string[] } | null {
  if (args.length === 0) return null;

  const leadingFlags: string[] = [];
  let i = 0;

  while (i < args.length) {
    if (args[i] === "--") {
      i += 1;
      break;
    }

    const parsed = parseLeadingGrepOption(args, i);
    if (!parsed) break;
    leadingFlags.push(...parsed[0]);
    i += parsed[1];
  }

  const pattern = args[i];
  if (!pattern) return null;
  i += 1;

  let path = ".";
  if (i < args.length && args[i] !== "--") {
    path = args[i] || ".";
    i += 1;
  }

  if (i < args.length && args[i] === "--") i += 1;
  const trailingFlags = args.slice(i);

  return {
    pattern,
    path,
    flags: [...leadingFlags, ...trailingFlags],
  };
}

function getGitSubcommand(parts: string[]): string {
  let i = 1;
  while (i < parts.length) {
    const p = parts[i];
    if (!p) return "";
    if (p === "-C" || p === "--git-dir" || p === "--work-tree" || p === "-c") {
      i += 2;
      continue;
    }
    if (p.startsWith("-")) {
      i += 1;
      continue;
    }
    return p;
  }
  return "";
}

async function resolveRtkBin(): Promise<string | null> {
  const fromPath = Bun.which("rtk");
  if (fromPath) return fromPath;

  for (const candidate of RTK_FALLBACKS) {
    if (await Bun.file(candidate).exists()) return candidate;
  }

  return null;
}

export const RTKRewrite = async () => {
  const rtkBin = await resolveRtkBin();

  return {
    "tool.execute.before": async (input: any, output: any) => {
      if (!rtkBin) return;
      const cmd = (output.args?.command || "").trim();
      if (!cmd) return;
      if (cmd.startsWith("rtk ") || cmd.startsWith(`${rtkBin} `)) return;
      if (isComplexCommand(cmd)) return;

      const parts = cmd.split(/\s+/);
      const c0 = parts[0];
      const c1 = parts[1] || "";
      const rest = parts.slice(1).join(" ");
      const gitSub = c0 === "git" ? getGitSubcommand(parts) : "";

      if (c0 === "git" && GIT_SUB.has(gitSub)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "ls") {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "cat" && rest) {
        output.args.command = `${rtkBin} read ${rest}`;
        return;
      }

      if (c0 === "grep" || c0 === "rg") {
        const grepArgs = tokenizeShellArgs(cmd.slice(c0.length).trim());
        const normalized = normalizeGrepArgs(grepArgs);
        if (!normalized) return;

        const rewritten = [
          rtkBin,
          "grep",
          normalized.pattern,
          normalized.path,
          ...normalized.flags,
        ]
          .map(shellEscapeArg)
          .join(" ");

        output.args.command = rewritten;
        return;
      }

      if (
        c0 === "pytest" ||
        c0 === "tsc" ||
        c0 === "prettier" ||
        c0 === "playwright" ||
        c0 === "prisma" ||
        c0 === "curl" ||
        c0 === "wget"
      ) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "vitest") {
        output.args.command = `${rtkBin} vitest run`;
        return;
      }

      if (c0 === "eslint") {
        output.args.command = `${rtkBin} lint ${rest}`.trim();
        return;
      }

      if (c0 === "golangci-lint" && c1 === "run") {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "cargo" && CARGO_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "go" && GO_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "docker" && DOCKER_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "kubectl" && KUBECTL_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "gh" && GH_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "pip" && PIP_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "ruff" && RUFF_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "pnpm" && PNPM_SUB.has(c1)) {
        if (c1 === "test") {
          output.args.command = `${rtkBin} vitest run`;
          return;
        }
        if (c1 === "tsc") {
          output.args.command = `${rtkBin} tsc`;
          return;
        }
        if (c1 === "lint") {
          output.args.command = `${rtkBin} lint`;
          return;
        }
        output.args.command = `${rtkBin} ${cmd}`;
        return;
      }

      if (c0 === "npm" && c1 === "test") {
        output.args.command = `${rtkBin} test ${cmd}`;
      }
    },
  };
};

export default RTKRewrite;
