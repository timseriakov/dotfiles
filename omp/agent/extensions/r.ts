// ponytail: pure fn extracted for testability
export function transformTmuxName(raw: string): string {
  return raw
    .split(/\s+/)
    .map((w) => {
      if (w.length <= 3) return w;
      return /^[aeiouyаеёиоуыэюя]/i.test(w)
        ? w[0] + w.slice(1).replace(/[aeiouyаеёиоуыэюя]/gi, "")
        : w.replace(/[aeiouyаеёиоуыэюя]/gi, "");
    })
    .join(" ")
    .replace(/[.,"'«»—\u2018\u2019\u201c\u201d«»]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

// Intercept /r <name>: rename tmux window (strips vowels, etc.)
// then forward to builtin /rename for session rename + proper UI cleanup.
export default function (pi) {
  pi.on("input", async (event) => {
    const text = event.text;
    if (!text.startsWith("/r") || (text.length > 2 && text[2] !== " ")) return;

    let name = text.slice(2).trim();
    name = name.replace(/[«»"'""\u2018\u2019\u201c\u201d«»]/g, "").trim();
    if (!name) return;

    // Tmux rename side-effect (fire-and-forget with 3s timeout)
    const opts = { timeout: 3000 };
    try {
      const cur = await pi.exec(
        "tmux",
        ["display-message", "-p", "#{window_name}"],
        opts,
      );
      const currentName = cur.stdout.trim();
      const icon =
        currentName.match(/^([^\x20-\x7E]+ ?)/)?.[1]?.trimEnd() ?? "";
      const stripped = transformTmuxName(name);
      const newName = icon ? `${icon} ${stripped}` : stripped;
      await pi.exec("tmux", ["rename-window", newName], opts);
    } catch {
      // not in tmux — ignore
    }

    // Redirect to builtin /rename for session rename + proper UI cleanup
    return { text: `/rename ${name}` };
  });
}
