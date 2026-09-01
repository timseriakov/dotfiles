# Qutebrowser agent/browser spec

Read this before changing qutebrowser launch, CDP, browser automation, or `Cmd+hjkl` navigation bindings.

## Profiles and CDP

There are two qutebrowser profiles:

| Profile   | Launcher          | Basedir                          | CDP              |
| --------- | ----------------- | -------------------------------- | ---------------- |
| Normal    | `qutebrowser`     | default qutebrowser basedir      | `127.0.0.1:9223` |
| Dev/agent | `qutebrowser-dev` | `~/.local/share/qutebrowser-dev` | `127.0.0.1:9224` |

Important: normal qutebrowser is **not CDP-free**. Both profiles expose CDP; the difference is profile/data separation and port number. Do not describe the normal profile as isolated from CDP.

`qutebrowser-dev` is seeded once from `~/.local/share/qutebrowser` into `~/.local/share/qutebrowser-dev/data`, then diverges.

## Agent browser automation order

Agents should use:

1. Dev/agent qutebrowser CDP: `127.0.0.1:9224`.
2. Normal qutebrowser CDP: `127.0.0.1:9223` as fallback.
3. Do not use Helium CDP by default.

## Navigation bindings

Keep the tmux/kitty muscle-memory split:

| Bind    | Scope   | Action                      |
| ------- | ------- | --------------------------- |
| `Cmd+h` | windows | previous qutebrowser window |
| `Cmd+l` | windows | next qutebrowser window     |
| `Cmd+j` | tabs    | previous tab                |
| `Cmd+k` | tabs    | next tab                    |

Window cycling is qutebrowser-side and uses qutebrowser/Qt runtime state: `objreg.window_registry` plus `mainwindow.raise_window(...)`. It does not use CDP window IDs and does not require Hammerspoon.

## Relevant files

- `qutebrowser/config.py` — CDP port selection (`9223` normal, `9224` dev).
- `qutebrowser/bin/qutebrowser-dev` — dev/agent profile launcher.
- `qutebrowser/modules/bindings.py` — `Cmd+hjkl` bindings.
- `qutebrowser/scripts/window-cycle-next.py` — next-window helper.
- `qutebrowser/scripts/window-cycle-prev.py` — previous-window helper.
- `omp/agent/skills/mcp-router/SKILL.md` — agent CDP priority notes.
