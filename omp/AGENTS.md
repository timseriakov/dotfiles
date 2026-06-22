# OMP Dotfiles Notes

## Source of Truth

OMP live config is linked into this directory:

```text
~/.omp/agent -> /Users/tim/dev/dotfiles/omp/agent
```

Edit OMP config, models, themes, and extensions in this repo, not directly in `~/.omp/agent`.

## User Shell

The user's interactive shell is `fish`.

- User-facing shell commands and examples must be `fish`-compatible, not bash snippets.
- Do not suggest `export VAR=...`, `set -a; source .env; set +a`, bash arrays, or bash-only syntax.
- Prefer running shell flows through tools directly; when the user needs to run something manually, write the `fish` version.
- Code fences for shell snippets should use `fish` unless the snippet is intentionally for another shell.

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

Keep the patch workflows version-specific:

- `apply-omp-monkey-patches.mjs` is the known-good OMP 15.10.8 workflow. Preserve it when adapting newer OMP releases.
- `apply-omp-monkey-patches-15.10.12.mjs` is the side-by-side OMP 15.10.12 adaptation.

### OMP 15.10.12 gotcha: rebuild the bundle

OMP 15.10.12 installs `omp` as a bundled CLI, not as a direct source runner:

```text
~/.bun/bin/omp -> ../install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js
```

`@oh-my-pi/pi-coding-agent/package.json` has `bin.omp = dist/cli.js`, and `scripts/bundle-dist.ts` bundles `src/cli.ts` into that file. Patching installed `src` files is therefore insufficient on 15.10.12 unless the bundle is rebuilt afterwards.

After 15.10.12 source monkey patches, rebuild from the installed package root:

```bash
cd /Users/tim/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent
bun scripts/bundle-dist.ts
```

The 15.10.12 side script should do this automatically with `rebuildBundledCli()` after applying source patches. If runtime output disagrees with patched source, suspect a stale `dist/cli.js` first.

Stale bundle signature:

- installed source contains `pwd = path.basename(pwd) || pwd;` in `status-line/segments.ts`
- installed source contains `setPromptGutter(" ")` in `interactive-mode.ts`
- but interactive startup still shows an absolute path like `/Users/tim/dev/dotfiles` and a bare `▏` prompt

Correct visual signature:

- status starts with basename `dotfiles ...`
- prompt line shows Fish/Starship-style ` ▏`

### OMP 15.10.12 drift points already handled

- `welcome.ts` refactored to a cached `render(...)` wrapper plus `#renderLines(...)`; patch the `#renderLines(...)` path for minimal `Welcome from Oh My Pi` behavior.
- `assistant-message.ts` removed the old static hidden-thinking `Thinking...` label; the 15.10.12 matcher for that label must be optional.
- Obvious renderer patches still matter: status-line padding, basename path, compact git/model segments, borderless editor, prompt gutter color, prompt gutter width fallback, and bundle rebuild.

### Visual verification standard

Do not accept patch idempotence or prompt-mode success as visual verification. `omp --no-session -p ...` can return `ok` while the interactive startup layout is still wrong.

Use a PTY-based interactive startup capture and compare against patched 15.10.8 / Fish behavior. The acceptance criteria are exact visual parity: same prompt icon ``, same left padding/indentation, and same spacing.

Useful historical capture files from the 15.10.12 debugging session:

```text
/Users/tim/tmp/opencode/omp-ptycapture-15.10.12-startup.bin          # broken pre-rebundle capture
/Users/tim/tmp/opencode/omp-ptycapture-15.10.8-startup.bin           # patched 15.10.8 comparison
/Users/tim/tmp/opencode/omp-ptycapture-15.10.12-bundled-startup.bin  # manual post-rebundle capture
/Users/tim/tmp/opencode/omp-ptycapture-15.10.12-rebundled-startup.bin # script-managed rebundle capture
```

Theme/config facts that are intentional, not accidental:

- `agent/config.yml` uses `theme.dark: starship-nord`, `statusLine.separator: none`, custom segments, `symbolPreset: nerd`, and `hideThinkingBlock: true`.
- `agent/themes/starship-nord.json` intentionally blanks many `icon.*` values, uses space separators, keeps `boxRound.*` mostly empty/space-only, and sets `nav.cursor` to ``.
- Fish Starship prompt uses `success_symbol = '[](bold green)'` and `error_symbol = '[](bold red)'` in `starship.toml`.

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
- `ctrl+k` is bound by OMP keybindings as `app.session.compact` and calls the same manual compact path as `/compact`
- `omp/agent/keybindings.yml` is the current primary OMP keybindings file; legacy `keybindings.json` was removed
- `shift+enter` and `ctrl+j` insert a newline via `tui.input.newLine`
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
