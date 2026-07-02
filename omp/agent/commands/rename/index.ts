// /rename <name> — strips vowels, replaces spaces with -, lowercase,
// preserves Nerd Font icon prefix.
import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const TMUX_OPTS = { timeout: 3000 };

export default function renameCommand(api: CustomCommandAPI): CustomCommand {
  return {
    name: "rename",
    description: "Rename tmux window (strips vowels, spaces→-, lowercase, preserves nerd icon)",
    async execute(args: string[], ctx: HookCommandContext): Promise<string | undefined> {
      const name = args.join(" ");
      if (!name) return;

      // Resolve the active tmux window — use pane_current_path for git root later,
      // and window_id to target explicitly.
      let currentName = "";
      let windowId = "";
      try {
        [currentName, windowId] = await Promise.all([
          tmux(api, "display-message", "-p", "#{window_name}"),
          tmux(api, "display-message", "-p", "#{window_id}"),
        ]);
      } catch {
        return "not in tmux";
      }

      // Extract Nerd Font icon prefix
      const m = currentName.match(/^([^\x20-\x7E]+ ?)/);
      const icon = m ? m[1].trimEnd() : "";

      // Strip vowels (EN + RU), spaces → -, lowercase
      const stripped = name
        .replace(/[aeiouyаеёиоуыэюяAEIOUYАЕЁИОУЫЭЮЯ]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newName = icon ? `${icon} ${stripped}` : stripped;

      // Target the window explicitly via window_id
      try {
        await tmux(api, "rename-window", "-t", windowId, newName);
        // Fire-and-forget: show feedback in tmux status bar
        void tmux(api, "display-message", `renamed to: ${newName}`);
      } catch {
        return `failed to rename to "${newName}"`;
      }
    },
  };
}

async function tmux(
  api: CustomCommandAPI,
  ...args: string[]
): Promise<string> {
  const r = await api.exec("tmux", args, TMUX_OPTS);
  return r.stdout.trim();
}
