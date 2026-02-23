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
])

const CARGO_SUB = new Set(["test", "build", "clippy"])
const GO_SUB = new Set(["test", "build", "vet"])
const DOCKER_SUB = new Set(["ps", "images", "logs"])
const KUBECTL_SUB = new Set(["get", "logs"])
const GH_SUB = new Set(["pr", "issue", "run"])
const PIP_SUB = new Set(["list", "install", "outdated"])
const RUFF_SUB = new Set(["check", "format"])
const PNPM_SUB = new Set(["test", "tsc", "lint", "list", "ls", "outdated"])

const RTK_FALLBACKS = ["/opt/homebrew/bin/rtk", "/usr/local/bin/rtk"]

function isComplexCommand(cmd: string): boolean {
  return (
    cmd.includes("<<") ||
    cmd.includes("&&") ||
    cmd.includes("||") ||
    cmd.includes(";") ||
    cmd.includes("|")
  )
}

function getGitSubcommand(parts: string[]): string {
  let i = 1
  while (i < parts.length) {
    const p = parts[i]
    if (!p) return ""
    if (p === "-C" || p === "--git-dir" || p === "--work-tree" || p === "-c") {
      i += 2
      continue
    }
    if (p.startsWith("-")) {
      i += 1
      continue
    }
    return p
  }
  return ""
}

async function resolveRtkBin(): Promise<string | null> {
  const fromPath = Bun.which("rtk")
  if (fromPath) return fromPath

  for (const candidate of RTK_FALLBACKS) {
    if (await Bun.file(candidate).exists()) return candidate
  }

  return null
}

export const RTKRewrite = async () => {
  const rtkBin = await resolveRtkBin()

  return {
    "tool.execute.before": async (input: any, output: any) => {
      if (!rtkBin) return
      const cmd = (output.args?.command || "").trim()
      if (!cmd) return
      if (cmd.startsWith("rtk ") || cmd.startsWith(`${rtkBin} `)) return
      if (isComplexCommand(cmd)) return

      const parts = cmd.split(/\s+/)
      const c0 = parts[0]
      const c1 = parts[1] || ""
      const rest = parts.slice(1).join(" ")
      const gitSub = c0 === "git" ? getGitSubcommand(parts) : ""

      if (c0 === "git" && GIT_SUB.has(gitSub)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "ls") {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "cat" && rest) {
        output.args.command = `${rtkBin} read ${rest}`
        return
      }

      if ((c0 === "grep" || c0 === "rg") && rest) {
        output.args.command = `${rtkBin} grep ${rest}`
        return
      }

      if (c0 === "pytest" || c0 === "tsc" || c0 === "prettier" || c0 === "playwright" || c0 === "prisma" || c0 === "curl" || c0 === "wget") {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "vitest") {
        output.args.command = `${rtkBin} vitest run`
        return
      }

      if (c0 === "eslint") {
        output.args.command = `${rtkBin} lint ${rest}`.trim()
        return
      }

      if (c0 === "golangci-lint" && c1 === "run") {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "cargo" && CARGO_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "go" && GO_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "docker" && DOCKER_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "kubectl" && KUBECTL_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "gh" && GH_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "pip" && PIP_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "ruff" && RUFF_SUB.has(c1)) {
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "pnpm" && PNPM_SUB.has(c1)) {
        if (c1 === "test") {
          output.args.command = `${rtkBin} vitest run`
          return
        }
        if (c1 === "tsc") {
          output.args.command = `${rtkBin} tsc`
          return
        }
        if (c1 === "lint") {
          output.args.command = `${rtkBin} lint`
          return
        }
        output.args.command = `${rtkBin} ${cmd}`
        return
      }

      if (c0 === "npm" && c1 === "test") {
        output.args.command = `${rtkBin} test ${cmd}`
      }
    },
  }
}

export default RTKRewrite
