// /rename <name> — strips vowels, preserves Nerd icon prefix.
export default function (pi) {
  pi.registerCommand("rename", {
    description: "Rename tmux window (strips vowels, preserves nerd icon)",
    handler: async (args) => {
      const name = args.trim();
      if (!name) return;

      let current = "";
      try {
        current = (
          await pi.exec("tmux", ["display-message", "-p", "#{window_name}"])
        ).stdout.trim();
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

      await pi.exec("tmux", [
        "rename-window",
        icon ? `${icon} ${stripped}` : stripped,
      ]);
    },
  });
}
