import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent/extensibility/extensions";

const aliases: Array<[string, string, string]> = [
  ["p-review", "plannotator-review", "Open Plannotator code review"],
  ["p-annotate", "plannotator-annotate", "Open Plannotator annotation UI"],
  ["p-last", "plannotator-last", "Annotate the last assistant message"],
];

export default function plannotatorAliases(pi: ExtensionAPI): void {
  for (const [alias, target, description] of aliases) {
    pi.registerCommand(alias, {
      description: `${description} (alias for /${target})`,
      handler: async (args) => {
        pi.sendUserMessage(args ? `/${target} ${args}` : `/${target}`);
      },
    });
  }
}
