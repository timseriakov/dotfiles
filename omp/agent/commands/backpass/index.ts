import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const DEFAULT_ARGS = ["status"];
const MAX_OUTPUT = 12_000;

function trimOutput(text: string): string {
  if (text.length <= MAX_OUTPUT) return text;
  return `${text.slice(0, MAX_OUTPUT)}\n\n[trimmed ${text.length - MAX_OUTPUT} chars]`;
}

export default function (api: CustomCommandAPI): CustomCommand[] {
  const command: CustomCommand = {
    name: "backpass",
    description: "Run Backpass for the current repo",
    async execute(args: string[], ctx: HookCommandContext): Promise<string> {
      const backpassArgs = args.length ? args : DEFAULT_ARGS;
      const result = await api.exec("backpass", backpassArgs, {
        timeout: 600_000,
      });
      const output = trimOutput(
        [result.stdout, result.stderr].filter(Boolean).join("\n"),
      );
      const status =
        result.exitCode === 0
          ? "completed"
          : `failed with exit ${result.exitCode}`;

      ctx.ui.notify(
        `backpass ${backpassArgs.join(" ")} ${status}`,
        result.exitCode === 0 ? "info" : "error",
      );

      return `Backpass command: backpass ${backpassArgs.join(" ")}\nStatus: ${status}\n\n\`\`\`text\n${output}\n\`\`\`\n\nSummarize this Backpass result and suggest the next safest command. Do not apply edits unless explicitly asked.`;
    },
  };

  return [command, { ...command, name: "bp" }, { ...command, name: "бп" }];
}
