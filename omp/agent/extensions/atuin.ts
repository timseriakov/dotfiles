/**
 * Atuin extension for OMP.
 *
 * Tracks bash commands executed by OMP in Atuin history with author `omp`.
 *
 * Install with:
 *   atuin hook install omp
 *
 * Then restart OMP.
 */

import type { ExtensionAPI, ExtensionContext } from "@oh-my-pi/pi-coding-agent";

const ATUIN_AUTHOR = "omp";
const ATUIN_TIMEOUT_MS = 10_000;

async function startHistory(
  pi: ExtensionAPI,
  cwd: string,
  command: string,
): Promise<string | undefined> {
  try {
    const result = await pi.exec(
      "atuin",
      [
        "history",
        "start",
        "--author",
        ATUIN_AUTHOR,
        "--author-kind",
        "agent",
        "--",
        command,
      ],
      { cwd, timeout: ATUIN_TIMEOUT_MS },
    );

    if (result.code !== 0) return undefined;

    const id = result.stdout.trim();
    return id.length > 0 ? id : undefined;
  } catch {
    return undefined;
  }
}

async function endHistory(
  pi: ExtensionAPI,
  cwd: string,
  historyId: string,
  exitCode: number,
): Promise<void> {
  try {
    await pi.exec(
      "atuin",
      ["history", "end", historyId, "--exit", String(exitCode)],
      { cwd, timeout: ATUIN_TIMEOUT_MS },
    );
  } catch {
    // Ignore Atuin failures so command execution is never blocked.
  }
}

function resultText(result: unknown): string {
  if (!result || typeof result !== "object" || !("content" in result)) {
    return "";
  }

  const content = result.content;
  if (!Array.isArray(content)) return "";

  return content
    .map((part) => {
      if (!part || typeof part !== "object" || !("text" in part)) return "";
      return typeof part.text === "string" ? part.text : "";
    })
    .join("\n");
}

// OMP reports failed bash commands in result text rather than exposing their
// process exit code, so recover the code from the standard suffix.
function exitCodeFromResult(result: unknown, isError: boolean): number {
  if (!isError) return 0;

  const text = resultText(result);
  const exited = text.match(/Command exited with code (\d+)\s*$/);
  if (exited) return Number(exited[1]);
  if (/Command aborted\s*$/.test(text)) return 130;
  if (/Command timed out after \S+ seconds\s*$/.test(text)) return 124;
  return 1;
}

export default function atuinOmpExtension(pi: ExtensionAPI): void {
  // Atuin history IDs for in-flight bash tool calls, keyed by tool call ID.
  const pending = new Map<string, string>();

  // Observe bash executions instead of registering a competing bash tool.
  pi.on("tool_call", async (event, ctx: ExtensionContext) => {
    if (event.toolName !== "bash") return;

    const command = (event.input as { command?: unknown }).command;
    if (typeof command !== "string" || command.length === 0) return;

    const historyId = await startHistory(pi, ctx.cwd, command);
    if (historyId) pending.set(event.toolCallId, historyId);
  });

  // This event also fires when another extension blocks the call, so entries
  // started above are always closed.
  pi.on("tool_execution_end", async (event, ctx: ExtensionContext) => {
    const historyId = pending.get(event.toolCallId);
    if (!historyId) return;
    pending.delete(event.toolCallId);

    await endHistory(
      pi,
      ctx.cwd,
      historyId,
      exitCodeFromResult(event.result, event.isError),
    );
  });
}
