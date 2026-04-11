/**
 * Traces OpenCode Plugin
 *
 * Provides deep integration between Traces and OpenCode:
 *
 * 1. `shell.env` hook — Injects TRACES_CURRENT_TRACE_ID and TRACES_CURRENT_AGENT
 *    into every bash tool call so `traces share` can deterministically identify
 *    the active session.
 *
 * 2. `traces_share` tool — LLM-callable tool that runs `traces share` and returns
 *    the share URL. The agent can call this directly instead of using the bash tool.
 *
 * 3. `event` hook — Listens for session.idle events. Can be extended to auto-share
 *    or prompt the user.
 *
 * Install:
 *   Copy this file to .opencode/plugins/traces.ts
 *   Ensure .opencode/package.json has "@opencode-ai/plugin" as a dependency.
 */

import { type Plugin, tool } from "@opencode-ai/plugin";

export const TracesPlugin: Plugin = async ({ $, directory }) => {
  return {
    // ----------------------------------------------------------------
    // shell.env — inject session ID into bash tool environment
    // ----------------------------------------------------------------
    "shell.env": async (input, output) => {
      if (input.sessionID) {
        output.env.TRACES_CURRENT_TRACE_ID = input.sessionID;
        output.env.TRACES_CURRENT_AGENT = "opencode";
      }
    },

    // ----------------------------------------------------------------
    // traces_share — LLM-callable tool
    // ----------------------------------------------------------------
    tool: {
      traces_share: tool({
        description:
          "Share the current coding session to Traces and return the share URL. " +
          "Use this when the user asks to share, publish, or export their session to Traces.",
        args: {
          visibility: tool.schema
            .enum(["public", "direct", "private"])
            .optional()
            .describe(
              "Only set if the user explicitly requests a visibility level (e.g. 'share as public'). Omit to use the correct default based on namespace type.",
            ),
        },
        async execute(args, context) {
          const flags = [
            "traces",
            "share",
            "--cwd",
            context.directory,
            "--agent",
            "opencode",
            "--json",
          ];
          if (args.visibility) {
            flags.push("--visibility", args.visibility);
          }

          try {
            const env: Record<string, string> = {
              TRACES_CURRENT_TRACE_ID: context.sessionID,
              TRACES_CURRENT_AGENT: "opencode",
            };

            const result = await $`${flags}`.env(env).text();
            const parsed = JSON.parse(result);

            if (parsed.ok) {
              return `Session shared successfully!\nURL: ${parsed.data.sharedUrl}\nTrace: ${parsed.data.traceId} (${parsed.data.agentId})\nSelected by: ${parsed.data.selectedBy}`;
            }

            return `Share failed (${parsed.error.code}): ${parsed.error.message}`;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            return `Failed to share: ${message}. Make sure the 'traces' CLI is installed and you are logged in (run: traces login).`;
          }
        },
      }),

      traces_list: tool({
        description:
          "List available traces that can be shared to Traces. " +
          "Use this to discover which sessions are available before sharing.",
        args: {
          agent: tool.schema
            .string()
            .optional()
            .describe(
              "Filter by agent ID (e.g., 'opencode', 'claude-code'). Omit to show all.",
            ),
        },
        async execute(args, context) {
          const flags = [
            "traces",
            "share",
            "--list",
            "--cwd",
            context.directory,
            "--json",
          ];
          if (args.agent) {
            flags.push("--agent", args.agent);
          }

          try {
            const result = await $`${flags}`.text();
            const parsed = JSON.parse(result);

            if (parsed.ok && parsed.data.traces.length > 0) {
              const lines = parsed.data.traces.map(
                (t: {
                  id: string;
                  agentId: string;
                  title: string;
                  timestamp: number;
                  sharedUrl?: string;
                }) => {
                  const ts = new Date(t.timestamp).toISOString();
                  const shared = t.sharedUrl ? ` [shared: ${t.sharedUrl}]` : "";
                  return `${ts}  ${t.agentId}  ${t.id}  ${t.title}${shared}`;
                },
              );
              return `Found ${parsed.data.count} trace(s):\n${lines.join("\n")}\n\nUse traces_share to share a session, or specify --trace-id for a specific one.`;
            }

            return `No traces found in ${context.directory}.`;
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            return `Failed to list traces: ${message}. Make sure the 'traces' CLI is installed.`;
          }
        },
      }),
    },

    // ----------------------------------------------------------------
    // event — listen for session lifecycle events
    // ----------------------------------------------------------------
    event: async ({ event }) => {
      // Placeholder for future auto-share or notification features.
      // When session goes idle, we could prompt the user to share.
      if (event.type === "session.idle") {
        // Future: auto-share or suggest sharing
      }
    },
  };
};
