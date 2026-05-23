# OMP Dotfiles Notes

## Source of Truth

OMP live config is linked into this directory:

```text
~/.omp/agent -> /Users/tim/dev/dotfiles/omp/agent
```

Edit OMP config, models, themes, and extensions in this repo, not directly in `~/.omp/agent`.

## Monkey Patches After OMP Updates

Some UI behavior is patched directly in the installed OMP package because OMP does not currently expose these options via config/extension APIs.

Reapply patches after any OMP package update/reinstall:

```bash
node /Users/tim/dev/dotfiles/omp/apply-omp-monkey-patches.mjs
```

The patch script is intended to be idempotent. It patches installed sources under:

```text
~/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/src
~/.bun/install/global/node_modules/@oh-my-pi/pi-tui/src
```

Current patched behavior:

- status-line path renders only the last directory segment, e.g. `dotfiles`
- git display is Starship-like: `on  master ↑N ↓N [!+?]`; `on` is white/text color, git info is purple
- model display is Starship-like text only: `via Reasoning Main OMNi`; `via` is white/text color, model is green, provider suffix `OMNi` is dim Nord color, no `⬢` because that is a Node.js/package glyph in the shell prompt
- status-line group padding is reduced
- pi-tui `visibleWidth()` is patched to strip ANSI escape sequences before measuring styled status segments; without this, white `on`/`via` splits make the status line overflow/collide
- status-line segment separator should be Starship-like one space via theme `sep.space: " "`
- status-line auto-compaction icon `⟲` is intentionally disabled via theme `icon.auto: ""`
- assistant/user message left padding is reduced
- default editor is patched to be borderless with `paddingX = 0` and green prompt gutter ` `
- borderless editor still renders the status/top line; status starts at the left edge like Starship/fish, while only the input line uses the ` ` gutter
- prompt gutter should match Starship: green ` ` (`U+F105` plus one following space)
- prompt gutter width reserves 1 cell even if terminal width detection reports `` as width 0

## Startup Banner

The large OMP welcome screen is controlled by:

```yaml
startup:
  quiet: true
```

This should stay enabled for the minimal Starship-like setup.

After running the patch script, verify OMP through fish so `OMNIROUTE_OMP_API_KEY` is loaded:

```bash
fish -lc 'timeout 45s omp --no-session -p "Ответь одним словом: ok"'
```

Expected output:

```text
ok
```
