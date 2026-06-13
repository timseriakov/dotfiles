#!/usr/bin/env node
/**
 * Reapply Tim's local OMP UI monkey patches after @oh-my-pi/pi-coding-agent updates.
 *
 * Usage:
 *   node ~/dev/dotfiles/omp/apply-omp-monkey-patches-15.10.12.mjs
 *
 * What this patches:
 * - status line path: basename only (last directory segment)
 * - status line git: Starship-style `on  branch`, with `on` white and git info purple
 * - status line model: Starship-style `via Model Name OMNi`, with `via` white, model green, dim provider suffix, no Node.js hexagon icon
 * - status line spacing: no outer padding, configured separator only between segments
 * - chat messages: remove 1-column left padding from assistant/user text
 * - default editor: borderless, paddingX 0, green prompt gutter ` `
 * - visible width: strip ANSI SGR/control sequences before measuring styled status segments
 * - editor status line: render top status line even when border chrome is hidden
 * - editor prompt gutter width: reserve 1 cell even if the glyph measures as width 0
 * - welcome screen: replace the full logo/tips/recent-sessions box with only `Welcome from Oh My Pi`
 * - session name: right status segment is muted, truncated to 48 terminal cells, and padded right
 * - session persistence: close drains pending atomic rewrites even before append writer opens
 * - OpenAI-compatible wire schemas: strip regex `pattern` keywords containing lookaround, because
 *   OpenAI rejects them in tool schemas even though JavaScript accepts them
 * - OpenAI-completions tools: sanitize non-strict tool schemas too (OMNiRoute uses this path)
 *
 * Note: prompt/editor gutter glyph is also set by the dotfiles extension:
 *   ~/dev/dotfiles/omp/agent/extensions/starship-minimal-editor.ts
 *
 * Config/theme/extension files live under ~/dev/dotfiles/omp/agent and are symlinked
 * from ~/.omp/agent, so this script only patches installed package source files.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const home = os.homedir();
const packageRoot = path.join(
  home,
  ".bun/install/global/node_modules/@oh-my-pi/pi-coding-agent",
);
const srcRoot = path.join(packageRoot, "src");
const tuiSrcRoot = path.join(
  home,
  ".bun/install/global/node_modules/@oh-my-pi/pi-tui/src",
);

function file(rel) {
  return path.join(srcRoot, rel);
}

function tuiFile(rel) {
  return path.join(tuiSrcRoot, rel);
}

function piAiFile(rel) {
  return path.join(
    home,
    ".bun/install/global/node_modules/@oh-my-pi/pi-ai/src",
    rel,
  );
}

function read(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function write(filePath, content) {
  fs.writeFileSync(filePath, content);
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Missing OMP source file: ${filePath}\nIs @oh-my-pi/pi-coding-agent installed globally with Bun?`,
    );
  }
}

function replaceOnce(content, oldText, newText, label) {
  if (content.includes(newText)) {
    return { content, changed: false, already: true };
  }
  const count = content.split(oldText).length - 1;
  if (count !== 1) {
    throw new Error(
      `Patch '${label}' expected exactly one match, found ${count}. Upstream source changed.`,
    );
  }
  return {
    content: content.replace(oldText, () => newText),
    changed: true,
    already: false,
  };
}

function replaceAny(content, alternatives, newText, label) {
  if (content.includes(newText)) {
    return { content, changed: false, already: true };
  }
  for (const oldText of alternatives) {
    const count = content.split(oldText).length - 1;
    if (count === 1) {
      return {
        content: content.replace(oldText, () => newText),
        changed: true,
        already: false,
      };
    }
  }
  const counts = alternatives
    .map((oldText) => content.split(oldText).length - 1)
    .join(", ");
  throw new Error(
    `Patch '${label}' expected one of ${alternatives.length} alternatives, counts [${counts}]. Upstream source changed.`,
  );
}

function replaceOptionalAny(content, alternatives, newText, label) {
  if (content.includes(newText)) {
    return { content, changed: false, already: true };
  }
  for (const oldText of alternatives) {
    const count = content.split(oldText).length - 1;
    if (count === 1) {
      return {
        content: content.replace(oldText, () => newText),
        changed: true,
        already: false,
      };
    }
  }
  return { content, changed: false, already: false };
}

function insertAfter(content, anchor, insertion, label) {
  if (content.includes(insertion)) {
    return { content, changed: false, already: true };
  }
  const count = content.split(anchor).length - 1;
  if (count !== 1) {
    throw new Error(
      `Patch '${label}' expected exactly one anchor, found ${count}. Upstream source changed.`,
    );
  }
  return {
    content: content.replace(anchor, () => anchor + insertion),
    changed: true,
    already: false,
  };
}

function insertBefore(content, anchor, insertion, label) {
  if (content.includes(insertion)) {
    return { content, changed: false, already: true };
  }
  const count = content.split(anchor).length - 1;
  if (count !== 1) {
    throw new Error(
      `Patch '${label}' expected exactly one anchor, found ${count}. Upstream source changed.`,
    );
  }
  return {
    content: content.replace(anchor, () => insertion + anchor),
    changed: true,
    already: false,
  };
}

function patchFile(rel, mutator) {
  patchAbsoluteFile(file(rel), rel, mutator);
}

function patchFirstExistingFile(candidates, mutator) {
  for (const rel of candidates) {
    const filePath = file(rel);
    if (fs.existsSync(filePath)) {
      patchAbsoluteFile(filePath, rel, mutator);
      return;
    }
  }

  throw new Error(
    `Missing OMP source file: tried ${candidates.map((rel) => file(rel)).join(", ")}\nIs @oh-my-pi/pi-coding-agent installed globally with Bun?`,
  );
}

function patchTuiFile(rel, mutator) {
  patchAbsoluteFile(tuiFile(rel), `pi-tui/${rel}`, mutator);
}

function patchPiAiFile(rel, mutator) {
  patchAbsoluteFile(piAiFile(rel), `pi-ai/${rel}`, mutator);
}

function patchAbsoluteFile(filePath, label, mutator) {
  requireFile(filePath);
  const before = read(filePath);
  const after = mutator(before, filePath);
  if (after !== before) {
    write(filePath, after);
    console.log(`patched ${label}`);
  } else {
    console.log(`ok      ${label}`);
  }
}

function rebuildBundledCli() {
  const bundleScript = path.join(packageRoot, "scripts/bundle-dist.ts");
  requireFile(bundleScript);

  console.log("rebundle dist/cli.js");
  const result = spawnSync(
    "bun",
    [
      "build",
      "--target=bun",
      "--outdir",
      "dist",
      "--minify-whitespace",
      "--minify-syntax",
      "--keep-names",
      "--external",
      "mupdf",
      "--external",
      "@oh-my-pi/pi-natives",
      "--external",
      "@huggingface/transformers",
      "--define",
      'process.env.PI_BUNDLED="true"',
      "./src/cli.ts",
    ],
    {
      cwd: packageRoot,
      stdio: "inherit",
    },
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(
      `Failed to rebundle OMP CLI: bun build exited with status ${result.status}`,
    );
  }
}

function ensureRuntimeLink(linkPath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });

  if (
    fs.existsSync(linkPath) ||
    fs.lstatSync(linkPath, { throwIfNoEntry: false })?.isSymbolicLink()
  ) {
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      const currentTarget = fs.readlinkSync(linkPath);
      if (currentTarget === targetPath) return;
      fs.rmSync(linkPath);
    } else if (!fs.existsSync(targetPath)) {
      fs.renameSync(linkPath, targetPath);
    } else {
      if (stat.isDirectory()) {
        fs.cpSync(linkPath, targetPath, {
          recursive: true,
          force: false,
          errorOnExist: false,
        });
      }
      fs.rmSync(linkPath, { recursive: true, force: true });
    }
  }

  fs.symlinkSync(targetPath, linkPath);
}

function setupRuntimeStateLinks() {
  const agentDir = path.join(home, "dev/dotfiles/omp/agent");
  const dataRoot = path.join(home, ".local/share/omp");
  const stateRoot = path.join(home, ".local/state/omp");

  fs.mkdirSync(path.join(dataRoot, "sessions"), { recursive: true });
  fs.mkdirSync(path.join(dataRoot, "blobs"), { recursive: true });
  fs.mkdirSync(path.join(stateRoot, "terminal-sessions"), { recursive: true });

  const links = [
    ["agent.db", path.join(dataRoot, "agent.db")],
    ["agent.db-shm", path.join(dataRoot, "agent.db-shm")],
    ["agent.db-wal", path.join(dataRoot, "agent.db-wal")],
    ["history.db", path.join(dataRoot, "history.db")],
    ["history.db-shm", path.join(dataRoot, "history.db-shm")],
    ["history.db-wal", path.join(dataRoot, "history.db-wal")],
    ["models.db", path.join(dataRoot, "models.db")],
    ["models.db-shm", path.join(dataRoot, "models.db-shm")],
    ["models.db-wal", path.join(dataRoot, "models.db-wal")],
    ["sessions", path.join(dataRoot, "sessions")],
    ["blobs", path.join(dataRoot, "blobs")],
    ["terminal-sessions", path.join(stateRoot, "terminal-sessions")],
  ];

  for (const [name, target] of links) {
    ensureRuntimeLink(path.join(agentDir, name), target);
  }

  console.log("ok      OMP runtime state links");
}

function patchPiAiOpenAICompletions(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `import { adaptSchemaForStrict, NO_STRICT, toolWireSchema } from "../utils/schema";`,
      `import { adaptSchemaForStrict, NO_STRICT, sanitizeSchemaForOpenAIResponses, toolWireSchema } from "../utils/schema";`,
    ],
    `import { adaptSchemaForStrict, NO_STRICT, sanitizeSchemaForOpenAIResponses, toolWireSchema } from "../utils/schema";`,
    "pi-ai openai-completions import schema sanitizer",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tconst baseParameters = toolWireSchema(tool);\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
      `\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
    ],
    `\t\tconst baseParameters = sanitizeSchemaForOpenAIResponses(toolWireSchema(tool));\n\t\tconst adapted = adaptSchemaForStrict(baseParameters, strict);`,
    "pi-ai openai-completions sanitize base tool schema",
  );
  out = r.content;

  return out;
}

function patchPiAiSchemaNormalize(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `const OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
      `const UNSUPPORTED_OPENAI_REGEX_TOKENS = /\\(\\?[=!<]/;\n\nconst OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
    ],
    `const UNSUPPORTED_OPENAI_REGEX_TOKENS = /\\(\\?[=!<]/;\n\nconst OPENAI_RESPONSES_SCHEMA_VALUE_KEYS = new Set([\n\t"items",`,
    "pi-ai openai schema unsupported regex constant",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
      `\t\tif (key === "pattern" && typeof value.pattern === "string" && UNSUPPORTED_OPENAI_REGEX_TOKENS.test(value.pattern)) {\n\t\t\tchanged = true;\n\t\t\tcontinue;\n\t\t}\n\n\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
    ],
    `\t\tif (key === "pattern" && typeof value.pattern === "string" && UNSUPPORTED_OPENAI_REGEX_TOKENS.test(value.pattern)) {\n\t\t\tchanged = true;\n\t\t\tcontinue;\n\t\t}\n\n\t\tconst child = value[key];\n\t\tlet next: unknown = child;`,
    "pi-ai openai schema strip lookaround patterns",
  );
  out = r.content;

  return out;
}

function patchPlannotatorBrowser(content) {
  let out = content;
  let r;

  if (!out.includes(`import { homedir, tmpdir } from "node:os";`)) {
    r = replaceOnce(
      out,
      `import { tmpdir } from "node:os";`,
      `import { homedir, tmpdir } from "node:os";`,
      "plannotator browser homedir import",
    );
    out = r.content;
  }

  r = replaceAny(
    out,
    [
      `const __dirname = dirname(fileURLToPath(import.meta.url));
let planHtmlContent = "";
let reviewHtmlContent = "";

try {
	planHtmlContent = readFileSync(resolve(__dirname, "plannotator.html"), "utf-8");
} catch {
	// built assets unavailable
}

try {
	reviewHtmlContent = readFileSync(resolve(__dirname, "review-editor.html"), "utf-8");
} catch {
	// built assets unavailable
}`,
      `const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginAssetDir = resolve(homedir(), ".omp/plugins/node_modules/@plannotator/pi-extension");
let planHtmlContent = "";
let reviewHtmlContent = "";

function readBundledAsset(fileName: string): string {
	const candidates = [resolve(__dirname, fileName), resolve(pluginAssetDir, fileName)];
	for (const candidate of candidates) {
		try {
			return readFileSync(candidate, "utf-8");
		} catch {
			// try the next candidate
		}
	}
	return "";
}

planHtmlContent = readBundledAsset("plannotator.html");
reviewHtmlContent = readBundledAsset("review-editor.html");`,
    ],
    `const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginAssetDir = resolve(homedir(), ".omp/plugins/node_modules/@plannotator/pi-extension");
let planHtmlContent = "";
let reviewHtmlContent = "";

function readBundledAsset(fileName: string): string {
	const candidates = [resolve(__dirname, fileName), resolve(pluginAssetDir, fileName)];
	for (const candidate of candidates) {
		try {
			return readFileSync(candidate, "utf-8");
		} catch {
			// try the next candidate
		}
	}
	return "";
}

planHtmlContent = readBundledAsset("plannotator.html");
reviewHtmlContent = readBundledAsset("review-editor.html");`,
    "plannotator browser asset fallback",
  );
  out = r.content;

  return out;
}

function patchStatusLineTs(content) {
  let out = content;
  let r;

  r = insertAfter(
    out,
    `\t#gitStatusLastFetch = 0;\n\t#gitStatusInFlight = false;`,
    `\n\t#cachedGitRemote: { ahead: number; behind: number } | null = null;\n\t#gitRemoteLastFetch = 0;\n\t#gitRemoteInFlight = false;`,
    "status-line git remote cache fields",
  );
  out = r.content;

  const remoteMethod = `\n\t#getGitRemote(): { ahead: number; behind: number } | null {\n\t\tif (this.#gitRemoteInFlight || Date.now() - this.#gitRemoteLastFetch < 5000) {\n\t\t\treturn this.#cachedGitRemote;\n\t\t}\n\n\t\tthis.#gitRemoteInFlight = true;\n\n\t\t(async () => {\n\t\t\ttry {\n\t\t\t\tconst result = await $\`git rev-list --left-right --count @{upstream}...HEAD\`.cwd(getProjectDir()).quiet().nothrow();\n\t\t\t\tif (result.exitCode !== 0) {\n\t\t\t\t\tthis.#cachedGitRemote = null;\n\t\t\t\t\treturn;\n\t\t\t\t}\n\t\t\t\tconst [behindText, aheadText] = result.stdout.toString().trim().split(/\\s+/);\n\t\t\t\tconst behind = Number.parseInt(behindText ?? "0", 10);\n\t\t\t\tconst ahead = Number.parseInt(aheadText ?? "0", 10);\n\t\t\t\tthis.#cachedGitRemote = {\n\t\t\t\t\tahead: Number.isFinite(ahead) ? ahead : 0,\n\t\t\t\t\tbehind: Number.isFinite(behind) ? behind : 0,\n\t\t\t\t};\n\t\t\t} catch {\n\t\t\t\tthis.#cachedGitRemote = null;\n\t\t\t} finally {\n\t\t\t\tthis.#gitRemoteLastFetch = Date.now();\n\t\t\t\tthis.#gitRemoteInFlight = false;\n\t\t\t}\n\t\t})();\n\n\t\treturn this.#cachedGitRemote;\n\t}\n`;
  r = insertBefore(
    out,
    `\n\t#lookupPr(): { number: number; url: string } | null {`,
    remoteMethod,
    "status-line #getGitRemote method",
  );
  out = r.content;

  r = replaceOnce(
    out,
    `\t\t\tgit: {\n\t\t\t\tbranch: this.#getCurrentBranch(),\n\t\t\t\tstatus: this.#getGitStatus(),\n\t\t\t\tpr: this.#lookupPr(),\n\t\t\t},`,
    `\t\t\tgit: {\n\t\t\t\tbranch: this.#getCurrentBranch(),\n\t\t\t\tstatus: this.#getGitStatus(),\n\t\t\t\tremote: this.#getGitRemote(),\n\t\t\t\tpr: this.#lookupPr(),\n\t\t\t},`,
    "status-line context git.remote",
  );
  out = r.content;

  r = replaceOnce(
    out,
    `\t\t\tconst sepTotal = Math.max(0, parts.length - 1) * (sepWidth + 2);\n\t\t\treturn partsWidth + sepTotal + 2 + capWidth;`,
    `\t\t\tconst sepTotal = Math.max(0, parts.length - 1) * sepWidth;\n\t\t\treturn partsWidth + sepTotal + capWidth;`,
    "status-line group width no outer padding",
  );
  out = r.content;

  const renderGroupAlreadyPatched =
    out.includes(
      '\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += parts.join(`${sepAnsi}${sep}${fgAnsi}`);\n\t\t\tcontent += "\\x1b[0m";',
    ) ||
    out.includes(
      `\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += parts.join(\`\${sepAnsi}\${sep}\${fgAnsi}\`);\n\t\t\tcontent += "\x1b[0m";`,
    );
  if (!renderGroupAlreadyPatched) {
    r = replaceAny(
      out,
      [
        `\t\t\tlet content = bgAnsi + fgAnsi + " ";\n\t\t\tcontent += parts.join(\`\${sepAnsi} \${sep} \${fgAnsi}\`);\n\t\t\tcontent += " \x1b[0m";`,
        '\t\t\tlet content = bgAnsi + fgAnsi + " ";\n\t\t\tcontent += parts.join(`${sepAnsi} ${sep} ${fgAnsi}`);\n\t\t\tcontent += " \x1b[0m";',
        "\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += ` ${parts.join(` ${sepAnsi}${sep}${fgAnsi} `)} `;",
      ],
      `\t\t\tlet content = bgAnsi + fgAnsi;\n\t\t\tcontent += parts.join(\`\${sepAnsi}\${sep}\${fgAnsi}\`);\n\t\t\tcontent += "\x1b[0m";`,
      "status-line render group no outer padding",
    );
    out = r.content;
  }

  return out;
}

function patchStatusTypes(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };`,
      `\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };`,
      `path?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean };`,
      `path?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };`,
    ],
    `\tpath?: { abbreviate?: boolean; maxLength?: number; stripWorkPrefix?: boolean; lastSegment?: boolean };`,
    "status-line path.lastSegment option",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tgit?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean };`,
      `\tgit?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean; compactDirty?: boolean; showAheadBehind?: boolean };`,
      `git?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean };`,
      `git?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean; compactDirty?: boolean; showAheadBehind?: boolean };`,
    ],
    `\tgit?: { showBranch?: boolean; showStaged?: boolean; showUnstaged?: boolean; showUntracked?: boolean; compactDirty?: boolean; showAheadBehind?: boolean };`,
    "status-line git compact/ahead options",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tgit: {\n\t\tbranch: string | null;\n\t\tstatus: { staged: number; unstaged: number; untracked: number } | null;\n\t\tpr: { number: number; url: string } | null;\n\t};`,
      `\tgit: {\n\t\tbranch: string | null;\n\t\tstatus: { staged: number; unstaged: number; untracked: number } | null;\n\t\tremote: { ahead: number; behind: number } | null;\n\t\tpr: { number: number; url: string } | null;\n\t};`,
    ],
    `\tgit: {\n\t\tbranch: string | null;\n\t\tstatus: { staged: number; unstaged: number; untracked: number } | null;\n\t\tremote: { ahead: number; behind: number } | null;\n\t\tpr: { number: number; url: string } | null;\n\t};`,
    "status-line types git.remote",
  );
  out = r.content;

  return out;
}

function patchSegments(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `import { TERMINAL } from "@oh-my-pi/pi-tui";`,
      `import { TERMINAL, truncateToWidth, visibleWidth } from "@oh-my-pi/pi-tui";`,
    ],
    `import { TERMINAL, truncateToWidth, visibleWidth } from "@oh-my-pi/pi-tui";`,
    "segments width helpers import",
  );
  out = r.content;

  r = replaceOnce(
    out,
    `\t\tif (opts.abbreviate !== false) {\n\t\t\tpwd = shortenPath(pwd);\n\t\t}`,
    `\t\t// Starship-style minimal path: always show only the last directory segment.\n\t\t// This keeps the display stable even if custom statusLine.segmentOptions are not loaded.\n\t\tpwd = path.basename(pwd) || pwd;`,
    "segments path basename only",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tlet content = withIcon(theme.icon.model, modelName);`,
      `\t\tlet content = \`via \${withIcon(theme.icon.model, modelName)}\`;`,
      `\t\tlet content = \`via \${modelName}\`;`,
      `\t\tlet content = modelName;`,
    ],
    `\t\tlet content = modelName;`,
    "segments model no icon",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\treturn { content: theme.fg("statusLineModel", content), visible: true };`,
      `\t\treturn { content: \`\${theme.fg("text", "via ")}\${theme.fg("statusLineModel", content)}\`, visible: true };`,
      `\t\tconst providerMatch = content.match(/^(.*) (OMNi)$/);\n\t\tconst modelContent = providerMatch\n\t\t\t? \`\${theme.fg("statusLineModel", providerMatch[1])} \${theme.fg("dim", providerMatch[2])}\`\n\t\t\t: theme.fg("statusLineModel", content);\n\t\treturn { content: \`\${theme.fg("text", "via ")}\${modelContent}\`, visible: true };`,
    ],
    `\t\tconst providerMatch = content.match(/^(.*) (OMNi)$/);\n\t\tconst modelContent = providerMatch\n\t\t\t? \`\${theme.fg("statusLineModel", providerMatch[1])} \${theme.fg("dim", providerMatch[2])}\`\n\t\t\t: theme.fg("statusLineModel", content);\n\t\treturn { content: \`\${theme.fg("text", "via ")}\${modelContent}\`, visible: true };`,
    "segments model dim provider suffix",
  );
  out = r.content;

  const oldGit = `const gitSegment: StatusLineSegment = {\n\tid: "git",\n\trender(ctx) {\n\t\tconst { branch, status } = ctx.git;\n\t\tif (!branch && !status) return { content: "", visible: false };\n\n\t\tconst opts = ctx.options.git ?? {};\n\t\tconst gitStatus = status;\n\t\tconst isDirty = gitStatus && (gitStatus.staged > 0 || gitStatus.unstaged > 0 || gitStatus.untracked > 0);\n\n\t\tconst showBranch = opts.showBranch !== false;\n\t\tlet content = "";\n\t\tif (showBranch && branch) {\n\t\t\tcontent = withIcon(theme.icon.branch, branch);\n\t\t}\n\n\t\t// Add status indicators\n\t\tif (gitStatus) {\n\t\t\tconst indicators: string[] = [];\n\t\t\tif (opts.showUnstaged !== false && gitStatus.unstaged > 0) {\n\t\t\t\tindicators.push(theme.fg("statusLineDirty", \`*\${gitStatus.unstaged}\`));\n\t\t\t}\n\t\t\tif (opts.showStaged !== false && gitStatus.staged > 0) {\n\t\t\t\tindicators.push(theme.fg("statusLineStaged", \`+\${gitStatus.staged}\`));\n\t\t\t}\n\t\t\tif (opts.showUntracked !== false && gitStatus.untracked > 0) {\n\t\t\t\tindicators.push(theme.fg("statusLineUntracked", \`?\${gitStatus.untracked}\`));\n\t\t\t}\n\t\t\tif (indicators.length > 0) {\n\t\t\t\tconst indicatorText = indicators.join(" ");\n\t\t\t\tif (!content && showBranch === false) {\n\t\t\t\t\tcontent = withIcon(theme.icon.git, indicatorText);\n\t\t\t\t} else {\n\t\t\t\t\tcontent += content ? \` \${indicatorText}\` : indicatorText;\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\n\t\tif (!content) return { content: "", visible: false };\n\n\t\treturn { content: theme.fg(isDirty ? "statusLineGitDirty" : "statusLineGitClean", content), visible: true };\n\t},\n};`;
  const upstreamGitWithColorName = `const gitSegment: StatusLineSegment = {
	id: "git",
	render(ctx) {
		const { branch, status } = ctx.git;
		if (!branch && !status) return { content: "", visible: false };

		const opts = ctx.options.git ?? {};
		const gitStatus = status;
		const isDirty = gitStatus && (gitStatus.staged > 0 || gitStatus.unstaged > 0 || gitStatus.untracked > 0);

		const showBranch = opts.showBranch !== false;
		let content = "";
		if (showBranch && branch) {
			content = withIcon(theme.icon.branch, branch);
		}

		// Add status indicators
		if (gitStatus) {
			const indicators: string[] = [];
			if (opts.showUnstaged !== false && gitStatus.unstaged > 0) {
				indicators.push(theme.fg("statusLineDirty", \`*\${gitStatus.unstaged}\`));
			}
			if (opts.showStaged !== false && gitStatus.staged > 0) {
				indicators.push(theme.fg("statusLineStaged", \`+\${gitStatus.staged}\`));
			}
			if (opts.showUntracked !== false && gitStatus.untracked > 0) {
				indicators.push(theme.fg("statusLineUntracked", \`?\${gitStatus.untracked}\`));
			}
			if (indicators.length > 0) {
				const indicatorText = indicators.join(" ");
				if (!content && showBranch === false) {
					content = withIcon(theme.icon.git, indicatorText);
				} else {
					content += content ? \` \${indicatorText}\` : indicatorText;
				}
			}
		}

		if (!content) return { content: "", visible: false };

		const colorName = isDirty ? "statusLineGitDirty" : "statusLineGitClean";
		return { content: theme.fg(colorName, content), visible: true };
	},
};`;
  const newGit = `const gitSegment: StatusLineSegment = {\n\tid: "git",\n\trender(ctx) {\n\t\tconst { branch, status, remote } = ctx.git;\n\t\tif (!branch && !status && !remote) return { content: "", visible: false };\n\n\t\tconst opts = ctx.options.git ?? {};\n\t\tconst gitStatus = status;\n\t\tconst showBranch = opts.showBranch !== false;\n\t\tlet content = "";\n\t\tif (showBranch && branch) {\n\t\t\tcontent = withIcon(theme.icon.branch, branch);\n\t\t}\n\n\t\tconst parts: string[] = [];\n\t\tif (remote && opts.showAheadBehind !== false) {\n\t\t\tif (remote.ahead > 0) parts.push(theme.fg("statusLineStaged", \`↑\${remote.ahead}\`));\n\t\t\tif (remote.behind > 0) parts.push(theme.fg("statusLineDirty", \`↓\${remote.behind}\`));\n\t\t}\n\n\t\tif (gitStatus) {\n\t\t\tconst dirtyParts: string[] = [];\n\t\t\tif (opts.showUnstaged !== false && gitStatus.unstaged > 0) {\n\t\t\t\tdirtyParts.push(opts.compactDirty === true ? "!" : \`*\${gitStatus.unstaged}\`);\n\t\t\t}\n\t\t\tif (opts.showStaged !== false && gitStatus.staged > 0) {\n\t\t\t\tdirtyParts.push(opts.compactDirty === true ? "+" : \`+\${gitStatus.staged}\`);\n\t\t\t}\n\t\t\tif (opts.showUntracked !== false && gitStatus.untracked > 0) {\n\t\t\t\tdirtyParts.push(opts.compactDirty === true ? "?" : \`?\${gitStatus.untracked}\`);\n\t\t\t}\n\t\t\tif (dirtyParts.length > 0) {\n\t\t\t\tconst dirtyText = opts.compactDirty === true ? \`[\${dirtyParts.join("")}]\` : dirtyParts.join(" ");\n\t\t\t\tparts.push(theme.fg("statusLineDirty", dirtyText));\n\t\t\t}\n\t\t}\n\n\t\tif (parts.length > 0) {\n\t\t\tconst indicatorText = parts.join(" ");\n\t\t\tif (!content && showBranch === false) {\n\t\t\t\tcontent = withIcon(theme.icon.git, indicatorText);\n\t\t\t} else {\n\t\t\t\tcontent += content ? \` \${indicatorText}\` : indicatorText;\n\t\t\t}\n\t\t}\n\n\t\tif (!content) return { content: "", visible: false };\n\n\t\treturn { content: \`\${theme.fg("text", "on ")}\${theme.fg("statusLineGitClean", content)}\`, visible: true };\n\t},\n};`;
  r = replaceAny(
    out,
    [oldGit, upstreamGitWithColorName, newGit],
    newGit,
    "segments compact git renderer",
  );
  out = r.content;

  const upstreamSessionName15_8 = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst ansi = getSessionAccentAnsi(getSessionAccentHex(name)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
  const upstreamSessionName15_9 = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst ansi =\n\t\t\tgetSessionAccentAnsi(getSessionAccentHex(name, theme.accentSurfaceLuminance)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
  const upstreamSessionName15_12 = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst ansi =\n\t\t\tgetSessionAccentAnsi(\n\t\t\t\tgetSessionAccentHex(name, theme.getMajorThemeColorHexes(), theme.accentSurfaceLuminance),\n\t\t\t) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${sanitizeStatusText(name)}\\x1b[39m\`, visible: true };\n\t},\n};`;
  const accentedLimitedSessionName = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst maxSessionNameWidth = 24;\n\t\tconst cleanName = sanitizeStatusText(name);\n\t\tconst display = visibleWidth(cleanName) > maxSessionNameWidth ? truncateToWidth(cleanName, maxSessionNameWidth) : cleanName;\n\n\t\tconst ansi = getSessionAccentAnsi(getSessionAccentHex(name)) ?? theme.getFgAnsi("accent");\n\t\treturn { content: \`\${ansi}\${display}\\x1b[39m\`, visible: true };\n\t},\n};`;
  const limitedSessionName = `const sessionNameSegment: StatusLineSegment = {\n\tid: "session_name",\n\trender(ctx) {\n\t\tconst sessionManager = ctx.session.sessionManager;\n\t\tconst name = sessionManager?.getSessionName();\n\t\tif (!name) return { content: "", visible: false };\n\n\t\tconst maxSessionNameWidth = 48;\n\t\tconst cleanName = sanitizeStatusText(name);\n\t\tconst display = visibleWidth(cleanName) > maxSessionNameWidth ? truncateToWidth(cleanName, maxSessionNameWidth) : cleanName;\n\n\t\treturn { content: \`\${theme.fg("muted", display)}  \`, visible: true };\n\t},\n};`;

  r = replaceAny(
    out,
    [
      upstreamSessionName15_8,
      upstreamSessionName15_9,
      upstreamSessionName15_12,
      accentedLimitedSessionName,
      limitedSessionName,
    ],
    limitedSessionName,
    "segments session name max width",
  );
  out = r.content;

  return out;
}

function patchWelcome(content) {
  const alreadyPatched = `\trender(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
  const patchedRenderLines = `\t#renderLines(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi")];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
  const upstream = `\trender(termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`;
  return replaceAny(
    content,
    [
      `\t#renderLines(_termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
      `\t#renderLines(termWidth: number): string[] {\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
      patchedRenderLines,
      upstream,
      alreadyPatched,
      `\trender(_termWidth: number): string[] {\n\t\treturn [theme.bold("Welcome from Oh My Pi"), ""];\n\n\t\t// Box dimensions - responsive with max width and small-terminal support`,
    ],
    patchedRenderLines,
    "welcome minimal text only",
  ).content;
}

function patchAssistantMessage(content) {
  let out = content;
  const replacements = [
    [
      [
        "new Markdown(content.text.trim(), 1, 0, getMarkdownTheme())",
        "new Markdown(trimmed, 1, 0, getMarkdownTheme())",
        "new Markdown(content.text.trim(), 0, 0, getMarkdownTheme())",
        "new Markdown(trimmed, 0, 0, getMarkdownTheme())",
      ],
      "new Markdown(trimmed, 0, 0, getMarkdownTheme())",
      "assistant text padding",
    ],
    [
      [
        'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 1, 0)',
        'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0)',
      ],
      'new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0)',
      "assistant thinking label padding",
    ],
    [
      [
        "new Markdown(thinkingText, 1, 0, getMarkdownTheme(), {",
        "new Markdown(thinkingText, 0, 0, getMarkdownTheme(), {",
      ],
      "new Markdown(thinkingText, 0, 0, getMarkdownTheme(), {",
      "assistant thinking block padding",
    ],
    [
      [
        'new Text(theme.fg("error", abortMessage), 1, 0)',
        'new Text(theme.fg("error", abortMessage), 0, 0)',
      ],
      'new Text(theme.fg("error", abortMessage), 0, 0)',
      "assistant abort padding",
    ],
    [
      [
        'new Text(theme.fg("dim", parts.join("  ")), 1, 0)',
        'new Text(theme.fg("dim", parts.join("  ")), 0, 0)',
      ],
      'new Text(theme.fg("dim", parts.join("  ")), 0, 0)',
      "assistant usage padding",
    ],
  ];
  for (const [alternatives, newText, label] of replacements) {
    if (label === "assistant thinking label padding") {
      out = replaceOptionalAny(out, alternatives, newText, label).content;
      continue;
    }
    out = replaceAny(out, alternatives, newText, label).content;
  }
  return out;
}

function patchUserMessage(content) {
  return replaceOnce(
    content,
    "new Markdown(text, 1, 1, getMarkdownTheme(), {",
    "new Markdown(text, 0, 1, getMarkdownTheme(), {",
    "user message padding",
  ).content;
}

function patchInteractiveMode(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(new Spacer(1));\n\t\t\tthis.ui.addChild(this.#welcomeComponent);\n\t\t\tthis.ui.addChild(new Spacer(1));`,
      `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(this.#welcomeComponent);`,
    ],
    `\t\t\t// Setup UI layout\n\t\t\tthis.ui.addChild(this.#welcomeComponent);`,
    "interactive welcome spacing",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    ],
    `\t\tthis.editor = new CustomEditor(getEditorTheme());\n\t\tthis.editor.setBorderVisible(false);\n\t\tthis.editor.setPaddingX(0);\n\t\tthis.editor.setPromptGutter(" ");\n\t\tthis.editor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tthis.editor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    "interactive editor default gutter",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
      `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    ],
    `\t\tconst nextEditor = factory\n\t\t\t? factory(this.ui, getEditorTheme(), this.keybindings)\n\t\t\t: new CustomEditor(getEditorTheme());\n\n\t\tnextEditor.setBorderVisible(false);\n\t\tnextEditor.setPaddingX(0);\n\t\tnextEditor.setPromptGutter(" ");\n\t\tnextEditor.setPromptGutterColor(theme.fg.bind(theme, "success"));\n\t\tnextEditor.setUseTerminalCursor(this.ui.getShowHardwareCursor());`,
    "interactive replacement editor gutter",
  );
  out = r.content;

  return out;
}

function patchTuiVisibleWidth(content) {
  // Upstream 15.10+ handles ANSI natively via Bun.stringWidth and its own
  // escape scanner — the old ANSI-strip workaround is no longer needed.
  return content;
}

function patchInputController(content) {
  return replaceAny(
    content,
    [
      `	handleCtrlZ(): void {
		// Set up handler to restore TUI when resumed
		process.once("SIGCONT", () => {
			this.ctx.ui.start();
			this.ctx.ui.requestRender(true);
		});

		// Stop the TUI (restore terminal to normal mode)
		this.ctx.ui.stop();

		// Send SIGTSTP to process group (pid=0 means all processes in group)
		process.kill(0, "SIGTSTP");
	}`,
      `	handleCtrlZ(): void {
		if (process.platform === "win32" || !process.stdout.isTTY) return;

		// Set up handler to restore TUI when resumed
		process.once("SIGCONT", () => {
			this.ctx.ui.start();
			this.ctx.ui.requestRender(true);
		});

		// Stop the TUI (restore terminal to normal mode)
		this.ctx.ui.stop();

		// Send SIGTSTP to this process. Sending it to process group 0 can also stop
		// the parent interactive shell in some terminals, so fish never regains
		// job-control ownership for a normal bg/fg flow.
		process.kill(process.pid, "SIGTSTP");
	}`,
      `	handleCtrlZ(): void {
		// SIGTSTP is POSIX job-control: Windows has no equivalent and
		// \`process.kill(_, "SIGTSTP")\` throws \`TypeError: Unknown signal:
		// SIGTSTP\` there, taking the whole agent down via an uncaught
		// exception (issue #2036). No-op on platforms that cannot suspend.
		if (process.platform === "win32") {
			this.ctx.showStatus("Suspend (Ctrl+Z) is not supported on this platform");
			return;
		}

		// Capture the listener so we can detach it if the signal never
		// fires; otherwise a failed suspend would leave a stale SIGCONT
		// handler that fires on the next unrelated continue and tries to
		// re-\`start()\` an already-running TUI.
		const onResume = (): void => {
			this.ctx.ui.start();
			this.ctx.ui.requestRender(true);
		};
		process.once("SIGCONT", onResume);

		// Stop the TUI (restore terminal to normal mode) before sending the
		// signal so the parent shell sees a sane terminal state.
		this.ctx.ui.stop();

		try {
			// pid=0 \u2192 entire foreground process group; the shell receives
			// SIGTSTP and parks the job.
			process.kill(0, "SIGTSTP");
		} catch (err) {
			// Either the runtime refused the signal or the kernel rejected
			// it (some sandboxes block sending to pid=0). Tear the resume
			// hook down and bring the TUI back so the user is not stranded
			// on a frozen prompt.
			process.removeListener("SIGCONT", onResume);
			this.ctx.ui.start();
			this.ctx.ui.requestRender(true);
			const reason = err instanceof Error ? err.message : String(err);
			this.ctx.showError(\`Failed to suspend: \${reason}\`);
		}
	}`,
    ],
    `	handleCtrlZ(): void {
		// SIGTSTP is POSIX job-control: Windows has no equivalent and
		// \`process.kill(_, "SIGTSTP")\` throws \`TypeError: Unknown signal:
		// SIGTSTP\` there, taking the whole agent down via an uncaught
		// exception (issue #2036). No-op on platforms that cannot suspend.
		if (process.platform === "win32") {
			this.ctx.showStatus("Suspend (Ctrl+Z) is not supported on this platform");
			return;
		}

		// Capture the listener so we can detach it if the signal never
		// fires; otherwise a failed suspend would leave a stale SIGCONT
		// handler that fires on the next unrelated continue and tries to
		// re-\`start()\` an already-running TUI.
		const onResume = (): void => {
			this.ctx.ui.start();
			this.ctx.ui.requestRender(true);
		};
		process.once("SIGCONT", onResume);

		// Stop the TUI (restore terminal to normal mode) before sending the
		// signal so the parent shell sees a sane terminal state.
		this.ctx.ui.stop();

		try {
			// Send SIGTSTP to this process, not pid=0. Sending to pid=0 (entire
			// foreground process group) can also stop the parent interactive shell
			// in some terminals, so fish never regains job-control ownership for
			// a normal bg/fg flow.
			process.kill(process.pid, "SIGTSTP");
		} catch (err) {
			// Either the runtime refused the signal or the kernel rejected
			// it (some sandboxes block sending signals). Tear the resume
			// hook down and bring the TUI back so the user is not stranded
			// on a frozen prompt.
			process.removeListener("SIGCONT", onResume);
			this.ctx.ui.start();
			this.ctx.ui.requestRender(true);
			const reason = err instanceof Error ? err.message : String(err);
			this.ctx.showError(\`Failed to suspend: \${reason}\`);
		}
	}`,
    "input-controller ctrl-z suspends only omp process",
  ).content;
}

function patchSessionManager(content) {
  let out = content;
  let r;

  r = insertAfter(
    out,
    `function createSessionId(): string {\n\treturn Bun.randomUUIDv7();\n}\n`,
    `\nfunction inferSessionIdFromPath(filePath: string): string | undefined {\n\tconst fileName = path.basename(filePath, ".jsonl");\n\tconst separator = fileName.lastIndexOf("_");\n\tconst candidate = separator >= 0 ? fileName.slice(separator + 1) : fileName;\n\treturn /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)\n\t\t? candidate\n\t\t: undefined;\n}\n`,
    "session-manager infer id from session file path",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\t} else {\n\t\t\tconst explicitPath = this.#sessionFile;\n\t\t\tthis.#newSessionSync();\n\t\t\tthis.#sessionFile = explicitPath; // preserve explicit path from --session flag\n\t\t\tawait this.#rewriteFile();\n\t\t\tthis.#flushed = true;\n\t\t\tthis.#ensuredOnDisk = true;\n\t\t\treturn;\n\t\t}`,
      `\t\t} else {\n\t\t\tconst explicitPath = this.#sessionFile;\n\t\t\tthis.#newSessionSync();\n\t\t\tthis.#sessionFile = explicitPath; // preserve explicit path from --session flag\n\t\t\tconst explicitSessionId = inferSessionIdFromPath(explicitPath);\n\t\t\tif (explicitSessionId) {\n\t\t\t\tthis.#sessionId = explicitSessionId;\n\t\t\t\tconst header = this.#fileEntries.find(e => e.type === "session") as SessionHeader | undefined;\n\t\t\t\tif (header) header.id = explicitSessionId;\n\t\t\t}\n\t\t\tawait this.#rewriteFile();\n\t\t\tthis.#flushed = true;\n\t\t\tthis.#ensuredOnDisk = true;\n\t\t\treturn;\n\t\t}`,
    ],
    `\t\t} else {\n\t\t\tconst explicitPath = this.#sessionFile;\n\t\t\tthis.#newSessionSync();\n\t\t\tthis.#sessionFile = explicitPath; // preserve explicit path from --session flag\n\t\t\tconst explicitSessionId = inferSessionIdFromPath(explicitPath);\n\t\t\tif (explicitSessionId) {\n\t\t\t\tthis.#sessionId = explicitSessionId;\n\t\t\t\tconst header = this.#fileEntries.find(e => e.type === "session") as SessionHeader | undefined;\n\t\t\t\tif (header) header.id = explicitSessionId;\n\t\t\t}\n\t\t\tawait this.#rewriteFile();\n\t\t\tthis.#flushed = true;\n\t\t\tthis.#ensuredOnDisk = true;\n\t\t\treturn;\n\t\t}`,
    "session-manager recovery keeps path id",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tasync close(): Promise<void> {\n\t\tif (!this.#persistWriter) return;\n\t\tawait this.#queuePersistTask(async () => {\n\t\t\tawait this.#closePersistWriterInternal();\n\t\t\tthis.#flushed = true;\n\t\t});\n\t\tif (this.#persistError) throw this.#persistError;\n\t}`,
      `\tasync close(): Promise<void> {\n\t\tawait this.#queuePersistTask(async () => {\n\t\t\tawait this.#closePersistWriterInternal();\n\t\t\tthis.#flushed = true;\n\t\t}, { ignoreError: true });\n\t\tif (this.#persistError) throw this.#persistError;\n\t}`,
    ],
    `\tasync close(): Promise<void> {\n\t\tawait this.#queuePersistTask(async () => {\n\t\t\tawait this.#closePersistWriterInternal();\n\t\t\tthis.#flushed = true;\n\t\t}, { ignoreError: true });\n\t\tif (this.#persistError) throw this.#persistError;\n\t}`,
    "session-manager close drains pending rewrites",
  );
  out = r.content;

  return out;
}

function patchEditorGutterWidth(content) {
  let out = content;
  let r;

  r = replaceAny(
    out,
    [
      `\t#promptGutter: string | undefined;`,
      `\t#promptGutter: string | undefined;\n\t#promptGutterColor: ((str: string) => string) | undefined;`,
    ],
    `\t#promptGutter: string | undefined;\n\t#promptGutterColor: ((str: string) => string) | undefined;`,
    "editor prompt gutter color field",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}`,
      `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}\n\n\tsetPromptGutterColor(color: ((str: string) => string) | undefined): void {\n\t\tthis.#promptGutterColor = color;\n\t}`,
    ],
    `\tsetPromptGutter(promptGutter: string | undefined): void {\n\t\tthis.#promptGutter = promptGutter;\n\t}\n\n\tsetPromptGutterColor(color: ((str: string) => string) | undefined): void {\n\t\tthis.#promptGutterColor = color;\n\t}`,
    "editor prompt gutter color setter",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\treturn {\n\t\t\tfirstLine: sliceByColumn(this.#promptGutter, 0, gutterWidth, true),\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
      `\t\tconst firstLine = sliceByColumn(this.#promptGutter, 0, gutterWidth, true);\n\t\treturn {\n\t\t\tfirstLine: this.#promptGutterColor ? this.#promptGutterColor(firstLine) : firstLine,\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
    ],
    `\t\tconst firstLine = sliceByColumn(this.#promptGutter, 0, gutterWidth, true);\n\t\treturn {\n\t\t\tfirstLine: this.#promptGutterColor ? this.#promptGutterColor(firstLine) : firstLine,\n\t\t\tcontinuation: padding(gutterWidth),\n\t\t\twidth: gutterWidth,\n\t\t};`,
    "editor prompt gutter green style",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2);\n\t}`,
      `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2 - this.#getPromptGutterWidth(terminalWidth, paddingX));\n\t}`,
    ],
    `\tgetTopBorderAvailableWidth(terminalWidth: number): number {\n\t\tconst paddingX = this.#getEditorPaddingX();\n\t\tconst borderWidth = this.#getHorizontalChromeWidth(paddingX);\n\t\treturn Math.max(0, terminalWidth - borderWidth * 2);\n\t}`,
    "editor status width ignores gutter",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\treturn Math.min(visibleWidth(this.#promptGutter), availableWidth);\n\t}\n`,
      `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\tconst promptGutterWidth = visibleWidth(this.#promptGutter);\n\t\treturn Math.min(promptGutterWidth > 0 ? promptGutterWidth : 1, availableWidth);\n\t}\n`,
    ],
    `\t#getPromptGutterWidth(width: number, paddingX: number): number {\n\t\tif (this.#borderVisible || !this.#promptGutter) return 0;\n\t\tconst chromeWidth = 2 * this.#getHorizontalChromeWidth(paddingX);\n\t\tconst availableWidth = Math.max(0, width - chromeWidth);\n\t\tconst promptGutterWidth = visibleWidth(this.#promptGutter);\n\t\treturn Math.min(promptGutterWidth > 0 ? promptGutterWidth : 1, availableWidth);\n\t}\n`,
    "editor prompt gutter width fallback",
  );
  out = r.content;

  r = replaceAny(
    out,
    [
      `\t\t// Render each layout line\n`,
      `\t\tif (!borderVisible && this.#topBorderContent) {\n\t\t\tconst gutterPrefix = promptGutter?.continuation ?? "";\n\t\t\tconst contentWidth = Math.max(0, width - visibleWidth(gutterPrefix));\n\t\t\tconst { content, width: statusWidth } = this.#topBorderContent;\n\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\tresult.push(gutterPrefix + content + padding(contentWidth - statusWidth));\n\t\t\t} else {\n\t\t\t\tresult.push(gutterPrefix + truncateToWidth(content, contentWidth));\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
      `\t\tif (!borderVisible && this.#topBorderContent) {\n\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\tconst { content, width: statusWidth } = this.#topBorderContent;\n\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t} else {\n\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
    ],
    `\t\tif (!borderVisible && this.#topBorderContent) {\n\t\t\tconst contentWidth = Math.max(0, width);\n\t\t\tconst { content, width: statusWidth } = this.#topBorderContent;\n\t\t\tif (statusWidth <= contentWidth) {\n\t\t\t\tresult.push(content + padding(contentWidth - statusWidth));\n\t\t\t} else {\n\t\t\t\tresult.push(truncateToWidth(content, contentWidth));\n\t\t\t}\n\t\t}\n\n\t\t// Render each layout line\n`,
    "editor borderless status line render",
  );
  out = r.content;

  return out;
}

try {
  setupRuntimeStateLinks();
  patchFile("modes/interactive-mode.ts", patchInteractiveMode);
  patchFirstExistingFile(
    [
      "modes/components/status-line/component.ts",
      "modes/components/status-line.ts",
    ],
    patchStatusLineTs,
  );
  patchFirstExistingFile(
    [
      "modes/components/status-line/types.ts",
      "modes/components/status-line.ts",
    ],
    patchStatusTypes,
  );
  patchFirstExistingFile(
    [
      "modes/components/status-line/segments.ts",
      "modes/components/status-line.ts",
    ],
    patchSegments,
  );
  patchFile("modes/components/welcome.ts", patchWelcome);
  patchFile("modes/components/assistant-message.ts", patchAssistantMessage);
  patchFile("modes/components/user-message.ts", patchUserMessage);
  patchFile("modes/controllers/input-controller.ts", patchInputController);
  patchFile("session/session-manager.ts", patchSessionManager);
  patchTuiFile("utils.ts", patchTuiVisibleWidth);
  patchTuiFile("components/editor.ts", patchEditorGutterWidth);
  patchPiAiFile("utils/schema/normalize.ts", patchPiAiSchemaNormalize);
  patchPiAiFile("providers/openai-completions.ts", patchPiAiOpenAICompletions);
  patchAbsoluteFile(
    path.join(
      home,
      ".omp/plugins/node_modules/@plannotator/pi-extension/plannotator-browser.ts",
    ),
    "plannotator browser asset fallback",
    patchPlannotatorBrowser,
  );
  rebuildBundledCli();
  console.log("OMP monkey patches applied.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
