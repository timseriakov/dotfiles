import { spawn } from "node:child_process";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

const DCG = "/Users/tim/.local/bin/dcg";
const TIMEOUT_MS = 5_000;

function denyReason(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("hookSpecificOutput" in value))
    return;

  const output = value.hookSpecificOutput;
  if (
    !output ||
    typeof output !== "object" ||
    !("permissionDecision" in output) ||
    output.permissionDecision !== "deny"
  ) {
    return;
  }

  return "permissionDecisionReason" in output &&
    typeof output.permissionDecisionReason === "string"
    ? output.permissionDecisionReason
    : "Blocked by dcg.";
}

export async function blockedReason(
  command: string,
): Promise<string | undefined> {
  try {
    const child = spawn(DCG, [], { stdio: ["pipe", "pipe", "ignore"] });
    let stdout = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stdin.end(
      JSON.stringify({ tool_name: "Bash", tool_input: { command } }),
    );

    const exitCode = await new Promise<number | null>((resolve) => {
      const timeout = setTimeout(() => {
        child.kill();
        resolve(null);
      }, TIMEOUT_MS);
      const finish = (code: number | null) => {
        clearTimeout(timeout);
        resolve(code);
      };
      child.once("error", () => finish(null));
      child.once("close", (code) =>
        finish(typeof code === "number" ? code : null),
      );
    });
    if (exitCode !== 0 || !stdout) return;

    return denyReason(JSON.parse(stdout));
  } catch {
    // dcg is optional at runtime; unavailable or invalid responses fail open.
  }
}

export default function dcgGuard(pi: ExtensionAPI): void {
  pi.on("tool_call", async (event) => {
    if (event.toolName !== "bash") return;

    const reason = await blockedReason(event.input.command);
    return reason ? { block: true, reason } : undefined;
  });
}
