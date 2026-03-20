# Atuin

This directory holds the tracked Atuin configuration.

## Upgrade notes

- Homebrew is the source of the `atuin` binary via `../Brewfile`.
- Fish shell integration lives in `../fish/conf.d/40-plugins.fish`.
- Do not source `~/.atuin/bin/env.fish` from fish startup when Homebrew is the canonical install. That file prepends `~/.atuin/bin` and can silently override `/opt/homebrew/bin/atuin`.

## Current shell model

- `ATUIN_NOBIND=true` keeps Atuin from installing its default keybindings.
- `atuin init fish | source` loads the integration hooks.
- `Ctrl-R` is bound manually to `_atuin_search` so the behavior stays explicit and predictable.

## Config highlights

- `filter_mode = "host"` keeps history scoped to the current host by default.
- `workspaces = true` automatically narrows history inside Git repositories.
- `invert = true` puts the search bar at the top.
- `enter_accept = true` runs the selected command immediately; use `Tab` to return to the shell buffer for editing.
- `search_mode = "daemon-fuzzy"` uses the daemon-backed in-memory index introduced in Atuin 18.13.
- `[daemon] enabled = true` with `autostart = true` is intentional; disable those two settings together if the daemon ever becomes the source of startup or background-process issues.

## Verify after upgrades

Run these checks in a fresh fish shell:

```bash
command -v atuin
atuin --version
which -a atuin
atuin doctor
```

Expected outcome:

- `command -v atuin` points at `/opt/homebrew/bin/atuin`
- `atuin --version` reports the expected Homebrew version
- `which -a atuin` may still show `~/.atuin/bin/atuin`, but it should not win

## Daily usage refresher

1. Press `Ctrl-R` to open Atuin search.
2. Start typing to search command history.
3. Use filter toggles when needed; host and workspace scoping are already enabled by default.
4. Press `Enter` to run the selected command immediately.
5. Press `Tab` instead if you want the command copied back into the shell for editing.

## Optional follow-ups

- Review daemon-fuzzy score tuning under `[search]` if ranking feels off.
- Evaluate AI features separately; they are not part of the base dotfiles workflow.
