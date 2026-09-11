# Qutebrowser agent/browser spec

Read this before changing qutebrowser launch, CDP, browser automation, or `Cmd+hjkl` navigation bindings.

## Profiles and CDP

The primary automation profile is the normal qutebrowser profile:

| Profile | Basedir                     | CDP              |
| ------- | --------------------------- | ---------------- |
| Normal  | default qutebrowser basedir | `127.0.0.1:9223` |

OMP automatically runs `qutebrowser/bin/qutebrowser-agent` when the marked
normal-profile target is absent. The qutebrowser config hook tags every page
title in that window with the persistent marker `OMP_AGENT_WINDOW_9f2c`,
including after cross-origin navigation. OMP matches that marker and never uses
foreground/first-page fallback selection.
For CDP `9223`, OMP injects this marker as the effective target automatically.
Callers may pass the same marker explicitly; any other target is rejected.

This shares cookies, logins, and authenticated state while keeping agent actions
out of the user's main window.

The separate `qutebrowser-dev` profile at `~/.local/share/qutebrowser-dev` and
CDP `127.0.0.1:9224` is optional isolation only. It has separate cookies and
sessions and requires an explicit user decision; it is not the default.

If automatic marker-target creation fails, automation fails closed. Chrome,
headless Chrome, and implicit foreground attachment are forbidden.

## Agent browser automation order

1. Use the marked normal-profile qutebrowser window on CDP `9223`.
2. Use Helium's OMP relay only through explicit `app.relay: true` when a
   documented qutebrowser-CDP capability gap requires it.
3. Never use relay as a fallback for a missing marker target.

## Focus and navigation

The browser worker must not activate the selected page whether `target` was
implicit or explicit. Main-window tabs and focus must remain unchanged.

Every newly created qutebrowser window is maximized, including the automatic
OMP agent window. This changes geometry only and must not activate or raise the
window.

Keep the tmux/kitty muscle-memory split:

| Bind    | Scope   | Action                      |
| ------- | ------- | --------------------------- |
| `Cmd+h` | windows | previous qutebrowser window |
| `Cmd+l` | windows | next qutebrowser window     |
| `Cmd+j` | tabs    | previous tab                |
| `Cmd+k` | tabs    | next tab                    |

Window cycling uses qutebrowser runtime `win_id` values and is unrelated to CDP
target IDs.

## Separate profile policy

`qutebrowser-dev` must not be silently selected: its cookies, logins, and session
files are separate from the normal profile.

## Relevant files

- `qutebrowser/config.py` — CDP port selection.
- `qutebrowser/bin/qutebrowser-dev` — optional separate-profile launcher.
- `omp/agent/skills/qutebrowser-browser-automation/SKILL.md` — active policy.
