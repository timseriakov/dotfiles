# Repository Guidelines

## Project Overview

This directory is the dotfiles-owned customization layer for Oh My Pi (OMP), not the upstream OMP source tree. It stores the live OMP agent config, local extensions/commands/themes, and monkey-patch scripts that are reapplied after OMP package updates.

Source of truth:

```text
/Users/tim/dev/dotfiles/omp/agent -> ~/.omp/agent
```

Edit OMP config in this repo. Do not edit linked live config in place under `~/.omp/agent`.

## Architecture & Data Flow

- `agent/` contains OMP runtime configuration loaded by the installed `omp` CLI.
- `agent/settings.json` tells OMP which npm plugin packages to load, including Plannotator, Engram, side-chat, and MCP adapter packages.
- `agent/mcp.json` configures MCP servers such as Engram and Dayflow.
- `agent/models.yml` defines OmniRoute/Zen model providers and model aliases consumed by OMP.
- `agent/commands/*/index.ts` exports OMP custom slash commands.
- `agent/extensions/*.ts` exports OMP extension hooks that receive an `ExtensionAPI`/`pi` object and subscribe to events or call `pi.exec`.
- `patches/*.mjs` contains small patch factories for installed OMP, `pi-tui`, `pi-ai`, and plugin files.
- `apply-omp-monkey-patches.mjs` orchestrates all OMP patch routes, runtime-state symlinks, plugin patching, and bundled CLI rebuild.
- `apply-backpass-omp-patches.mjs` patches the installed Backpass package so Backpass can analyze through `omp acp` via `acpx`.

Patch flow after an OMP update:

```text
installed OMP package source
  -> apply-omp-monkey-patches.mjs
  -> patched installed source + rebuilt dist/cli.js
  -> omp runtime behavior
```

Backpass flow:

```text
backpass analyze
  -> installed Backpass harness
  -> acpx --agent "omp acp" prompt -s <session> --file <prompt>
  -> OMP ACP session
```

## Key Directories

- `agent/` — OMP config, models, MCP config, commands, extensions, themes, and linked runtime entry point.
- `agent/commands/backpass/` — `/backpass`, `/bp`, `/бп`; runs Backpass and asks OMP to summarize the result.
- `agent/commands/c/` — `/c` and `/с`; expands to the user-facing commit prompt.
- `agent/extensions/` — local OMP hooks: Atuin integration, rename helper, DCG guard, Wakatime heartbeat, Workmux status.
- `agent/themes/` — `starship-nord.json`, the minimal Nord/Starship-like OMP theme.
- `agent/npm/` — local npm dependency install for OMP extension packages; package files are ignored unless force-added intentionally.
- `patches/` — version-sensitive patch modules grouped by subsystem: status line, UI components, input/session, TUI/editor/terminal, commands runtime, Plannotator, Rejudge, side-chat, routes.
- `agent/tmp/`, `agent/agent.db*`, `agent/history.db*`, `agent/sessions`, `agent/blobs` — runtime state paths; preserve/move via symlinks, never delete as cleanup.

## Development Commands

Run from `/Users/tim/dev/dotfiles/omp` unless noted.

```fish
# Reapply local patches after an OMP update
node apply-omp-monkey-patches.mjs

# Patch installed Backpass integration with OMP/acpx
node apply-backpass-omp-patches.mjs

# Syntax-check patch scripts
node --check apply-omp-monkey-patches.mjs
node --check apply-backpass-omp-patches.mjs
node --check patches/status-line.mjs

# Smoke-test OMP through fish so env vars are loaded
fish -lc 'timeout 45s omp --no-session -p "Ответь одним словом: ok"'

# Check Backpass integration
backpass status
backpass analyze --max-transcripts 1 --jobs 1

# Update Plannotator in the local agent npm tree
npm --prefix agent/npm install @plannotator/pi-extension@latest

# Update the live OMP plugin install too
npm --prefix ~/.omp/plugins pkg set 'dependencies.@plannotator/pi-extension=<version>'
npm --prefix ~/.omp/plugins install
node apply-omp-monkey-patches.mjs
```

OMP update workflow:

```fish
omp --version
omp update
node apply-omp-monkey-patches.mjs
omp --version
fish -lc 'timeout 45s omp --no-session -p "ok"'
```

After source patches, verify bundled markers in `~/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js` when visual behavior matters.

## Code Conventions & Common Patterns

- Keep patches small and anchor-based. Prefer adding alternatives to `replaceAny(...)` over loosening validation.
- Patch helpers should fail loudly on upstream drift; do not silently skip unknown source shapes.
- Preserve older replacement alternatives when adapting to new OMP versions.
- Use TypeScript ESM style for commands/extensions: `export default function (...)` returning commands or registering hooks.
- Keep command output bounded. Example: `agent/commands/backpass/index.ts` trims output to `MAX_OUTPUT` before returning it to the model.
- Prefer pure helpers for testable logic. Example: `agent/extensions/r.ts` exports `transformTmuxName(...)`, tested by `agent/extensions/r.test.ts`.
- Event extensions should be cheap and non-blocking; fire-and-forget external status updates should catch errors, e.g. `pi.exec(...).catch(() => {})`.
- User-facing shell snippets should be Fish-compatible.
- For new image-processing code, prefer Bun 1.4+ `Bun.Image` / `Bun.file(path).image()` before adding `sharp`.
- Avoid speculative abstractions. This repo favors direct, boring patch modules and explicit command wrappers.

## Important Files

- `AGENTS.md` — this repository guide.
- `agent/config.yml` — primary OMP runtime behavior: quiet startup, theme, STT, status line, model/provider order, UI defaults.
- `agent/models.yml` — OmniRoute/Zen model provider definitions and model aliases.
- `agent/settings.json` — OMP plugin package list and npm command.
- `agent/mcp.json` — MCP server configuration.
- `agent/keybindings.yml` — keybindings such as `ctrl+k` compact and `shift+enter`/`ctrl+j` newline.
- `agent/themes/starship-nord.json` — intentional Starship-like visual design.
- `agent/commands/backpass/index.ts` — Backpass slash command wrapper.
- `agent/extensions/r.ts` and `agent/extensions/r.test.ts` — rename helper and its minimal test.
- `apply-omp-monkey-patches.mjs` — main OMP patch orchestrator and runtime-state link setup.
- `patches/routes.mjs` — maps patch functions to installed OMP, TUI, AI, and plugin file targets.
- `patches/status-line.mjs` — Starship-like status-line path/git/model/session segment patches.
- `patches/installed-ai-plannotator.mjs` and `patches/plannotator.mjs` — Plannotator/runtime compatibility patches.
- `apply-backpass-omp-patches.mjs` — installed Backpass compatibility patcher.

## Runtime/Tooling Preferences

- Interactive shell: Fish. Write manual commands in Fish syntax.
- OMP installed package root: `~/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent`.
- OMP bundled CLI: `~/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js`; source patches must be followed by bundle rebuild via the patch script.
- Backpass installed package root is discovered from `command -v backpass`; common path is `~/.volta/tools/image/packages/backpass/lib/node_modules/backpass`.
- `acpx` custom-agent prompt syntax for OMP is subcommand-based:

```fish
acpx --agent "omp acp" prompt -s <session> --file <prompt-file>
```

- Live plugin install is separate from `agent/npm`: `~/.omp/plugins`. Updating `agent/npm` alone does not update the OMP-loaded plugin.
- OMP runtime state must live outside git. The patch script redirects sessions/blobs/databases to `~/.local/share/omp` and terminal sessions to `~/.local/state/omp`.
- Web search provider convention: start with `provider: "parallel"`; if it fails, retry `serper`, then `tavily`, then `exa`.

## Testing & QA

Use the smallest command that covers the change.

- Patch-script syntax:

```fish
node --check apply-omp-monkey-patches.mjs
node --check apply-backpass-omp-patches.mjs
```

- Reapply all OMP patches and rebuild bundle:

```fish
node apply-omp-monkey-patches.mjs
```

- OMP prompt smoke:

```fish
fish -lc 'timeout 45s omp --no-session -p "Ответь одним словом: ok"'
```

Expected output includes `ok`.

- Interactive visual verification is required for UI/status-line/editor changes. Capture a PTY startup and check for:
  - `Welcome from Oh My Pi`
  - basename path such as `omp`, not `/Users/tim/dev/dotfiles/omp`
  - Starship-like `on  ... via ... OMNi`
  - prompt gutter ` `

- Backpass compatibility smoke:

```fish
node apply-backpass-omp-patches.mjs
backpass analyze --max-transcripts 1 --jobs 1
```

Expected result: `0 failed`. Older failed transcript rows in `backpass status` are retried by the next analyze run.

- Extension unit test example:

```fish
bun test agent/extensions/r.test.ts
```

- Before committing, inspect only intended paths:

```fish
git -C /Users/tim/dev/dotfiles status --short -- omp
git -C /Users/tim/dev/dotfiles diff --stat -- omp
```

Do not include unrelated parent-repo changes such as other dotfile areas unless the user explicitly asks.
