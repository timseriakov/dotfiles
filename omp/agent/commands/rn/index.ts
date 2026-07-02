// /rn <name> — renames both tmux window and OMP session.
// Tmux: strips vowels, spaces→-, lowercase, preserves Nerd icon.
// OMP: original name as-is.
import type {
  CustomCommand,
  CustomCommandAPI,
} from "@oh-my-pi/pi-coding-agent/extensibility/custom-commands";
import type { HookCommandContext } from "@oh-my-pi/pi-coding-agent/extensibility/hooks/types";

const TMUX_OPTS = { timeout: 3000 };

export default function renameCommand(api: CustomCommandAPI): CustomCommand {
  return {
    name: "rn",
    description: "Rename tmux window + OMP session. Tmux: strips vowels, spaces→-, lowercase, icon preserved.",
    async execute(
      args: string[],
      ctx: HookCommandContext,
    ): Promise<string | undefined> {
      const name = args.join(" ");
      if (!name) return;

      // 1. Rename OMP session with original name
      try {
        await ctx.sessionManager.setSessionName(name, "user");
      } catch {
        ctx.ui.notify("failed to rename session", "error");
      }

      // 2. Rename tmux window with transformed name
      let currentName = "";
      let windowId = "";
      try {
        [currentName, windowId] = await Promise.all([
          tmux(api, "display-message", "-p", "#{window_name}"),
          tmux(api, "display-message", "-p", "#{window_id}"),
        ]);
      } catch {
        // not in tmux — session rename already done, that's enough
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
        ctx.ui.notify(`failed to rename tmux window to "${newName}"`, "error");
      }
      // Clear the editor so user doesn't need to press Enter again
      ctx.ui.setEditorText("");
    },
  };
}

async function tmux(api: CustomCommandAPI, ...args: string[]): Promise<string> {
  const r = await api.exec("tmux", args, TMUX_OPTS);
  return r.stdout.trim();
}
