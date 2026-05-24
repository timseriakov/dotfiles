# OMP Dotfiles Notes

## Source of Truth

OMP live config is linked into this directory:

```text
~/.omp/agent -> /Users/tim/dev/dotfiles/omp/agent
```

Edit OMP config, models, themes, and extensions in this repo, not directly in `~/.omp/agent`.

## Runtime State

OMP sessions and SQLite state must persist, but must not live as normal files in git. The patch script `omp/apply-omp-monkey-patches.mjs` keeps config in dotfiles and redirects runtime paths through symlinks:

```text
/Users/tim/dev/dotfiles/omp/agent/sessions -> /Users/tim/.local/share/omp/sessions
/Users/tim/dev/dotfiles/omp/agent/blobs -> /Users/tim/.local/share/omp/blobs
/Users/tim/dev/dotfiles/omp/agent/agent.db* -> /Users/tim/.local/share/omp/agent.db*
/Users/tim/dev/dotfiles/omp/agent/history.db* -> /Users/tim/.local/share/omp/history.db*
/Users/tim/dev/dotfiles/omp/agent/models.db* -> /Users/tim/.local/share/omp/models.db*
/Users/tim/dev/dotfiles/omp/agent/terminal-sessions -> /Users/tim/.local/state/omp/terminal-sessions
```

Do not run `rm -rf omp/agent/sessions` as routine cleanup. If runtime paths appear under `omp/agent/`, preserve/move them; never delete sessions just to clean git status. They are gitignored only as a safety net.

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
- `ctrl+k` is bound by the OMP editor extension to compact context, matching the user's OpenCode shortcut
- `shift+enter` and `ctrl+j` are bound in `omp/agent/keybindings.json` to insert a newline (`tui.input.newLine`)
- session persistence is patched so `SessionManager.close()` always drains pending atomic rewrites before exit; otherwise print/smoke sessions can remain as hidden `.tmp` files and `--resume` shows `No sessions found`
- `Ctrl+Z` suspend is patched to send `SIGTSTP` only to the OMP process (`process.pid`) instead of process group `0`; this preserves normal shell job-control flow so `fg` can resume OMP

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
