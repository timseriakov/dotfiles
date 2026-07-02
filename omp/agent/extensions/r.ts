// /r <name> — renames both tmux window and OMP session.
// Tmux: strips vowels, spaces→-, lowercase, preserves Nerd icon.
// OMP: original name as-is.
export default function (pi) {
  pi.registerCommand("r", {
    description:
      "Rename tmux window + OMP session. Tmux: strips vowels, spaces→-, lowercase, icon preserved.",
    handler: async (args, ctx) => {
      const name = args.trim();
      if (!name) {
        ctx.ui.setEditorText("");
        return;
      }

      // 1. Rename OMP session with original name
      try {
        await ctx.sessionManager.setSessionName(name, "user");
      } catch {
        /* ignore */
      }

      // 2. Rename tmux window with transformed name.
      //    Use plain rename-window (current window), no -t needed.
      //    Extract Nerd icon from current window name first.
      try {
        const cur = await pi.exec("tmux", [
          "display-message",
          "-p",
          "#{window_name}",
        ]);

        const currentName = cur.stdout.trim();
        const icon =
          currentName.match(/^([^\x20-\x7E]+ ?)/)?.[1]?.trimEnd() ?? "";

        const stripped = name
          .replace(/[aeiouyаеёиоуыэюяAEIOUYАЕЁИОУЫЭЮЯ]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase();

        const newName = icon ? `${icon} ${stripped}` : stripped;

        await pi.exec("tmux", ["rename-window", newName]);
      } catch {
        // not in tmux — session rename already done
      }

      ctx.ui.setEditorText("");
    },
  });
}
