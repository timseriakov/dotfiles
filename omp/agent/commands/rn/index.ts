// /rn <name> — strips vowels, spaces→-, lowercase, preserves Nerd icon.
import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const TMUX_OPTS = { timeout: 3000 };

export default function renameCommand(api: CustomCommandAPI): CustomCommand {
  return {
    name: "rn",
    description: "Rename tmux window (strips vowels, spaces→-, lowercase, preserves nerd icon)",
    async execute(args: string[], ctx: HookCommandContext): Promise<string | undefined> {
      const name = args.join(" ");
      if (!name) return;

      let currentName = "";
      let windowId = "";
      try {
        [currentName, windowId] = await Promise.all([
          tmux(api, "display-message", "-p", "#{window_name}"),
          tmux(api, "display-message", "-p", "#{window_id}"),
        ]);
      } catch {
        ctx.ui.notify("not in tmux", "error");
        return;
      }

      const m = currentName.match(/^([^\x20-\x7E]+ ?)/);
      const icon = m ? m[1].trimEnd() : "";

      const stripped = name
        .replace(/[aeiouyаеёиоуыэюяAEIOUYАЕЁИОУЫЭЮЯ]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();

      const newName = icon ? `${icon} ${stripped}` : stripped;

      try {
        await tmux(api, "rename-window", "-t", windowId, newName);
      } catch {
        ctx.ui.notify(`failed to rename to "${newName}"`, "error");
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
