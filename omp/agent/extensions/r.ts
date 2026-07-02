// /rn <name> — renames both tmux window and OMP session.
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

      const opts = { timeout: 3000 };

      // 1. Rename OMP session with original name
      try {
        await ctx.sessionManager.setSessionName(name, "user");
      } catch {
        /* ignore */
      }

      // 2. Rename tmux window with transformed name
      try {
        const [cur, wid] = await Promise.all([
          pi.exec("tmux", ["display-message", "-p", "#{window_name}"], opts),
          pi.exec("tmux", ["display-message", "-p", "#{window_id}"], opts),
        ]);
        const currentName = cur.stdout.trim();
        const windowId = wid.stdout.trim();

        const icon = (currentName.match(/^([^\x20-\x7E]+ ?)/) || [])[1]?.trimEnd() ?? "";

        const stripped = name
          .replace(/[aeiouyаеёиоуыэюяAEIOUYАЕЁИОУЫЭЮЯ]/g, "")
          .replace(/\s+/g, "-")
          .toLowerCase();

        const newName = icon ? `${icon} ${stripped}` : stripped;

        await pi.exec("tmux", ["rename-window", "-t", windowId, newName], opts);
      } catch {
        // not in tmux or failed — session rename already done, that's fine
      }

      ctx.ui.setEditorText("");
    },
  });
}
