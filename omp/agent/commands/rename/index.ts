// /rename <name> — strips vowels, replaces spaces with -, lowercase,
// preserves Nerd Font icon prefix.
import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const TMUX_OPTIONS = { timeout: 3000 };

export default function renameCommand(api: CustomCommandAPI): CustomCommand {
  return {
    name: "rename",
    description: "Rename tmux window (strips vowels, spaces→-, lowercase, preserves nerd icon)",
    async execute(args: string[], _ctx: HookCommandContext): Promise<void> {
      const name = args.join(" ");
      if (!name) return;

      // Get current tmux window name to extract Nerd Font icon
      let current = "";
      try {
        const result = await api.exec(
          "tmux",
          ["display-message", "-p", "#{window_name}"],
          TMUX_OPTIONS,
        );
        current = result.stdout.trim();
      } catch {
        return;
      }

      // Extract Nerd Font icon prefix (non-ASCII chars at start)
      const m = current.match(/^([^\x20-\x7E]+ ?)/);
      const icon = m ? m[1].trimEnd() : "";

      // Strip vowels (EN + RU), spaces → -, lowercase
      const stripped = name
        .replace(/[aeiouyаеёиоуыэюяAEIOUYАЕЁИОУЫЭЮЯ]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

      await api.exec(
        "tmux",
        ["rename-window", icon ? `${icon} ${stripped}` : stripped],
        TMUX_OPTIONS,
      );
    },
  };
}
