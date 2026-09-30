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

### Missing marker recovery

Marker creation gets at most one total attempt. OMP already invokes
`qutebrowser-agent` automatically; after `Could not create the marked
qutebrowser agent window`, do not invoke it manually or retry browser attach.
Diagnose CDP ownership and the active instance IPC runtime instead.

The launcher must reuse the `TMPDIR` of the qutebrowser process that owns CDP
`9223`, serialize concurrent calls, and bound both lock and child waits. It must
never substitute `DARWIN_USER_TEMP_DIR`, start another profile, or leave a
spawned child running after timeout. Cleanup is limited to the exact child
spawned by that launcher invocation; the CDP-owning process and user tabs are
never terminated or navigated. A page `webSocketDebuggerUrl` is not a browser
CDP endpoint.

## Playwright compatibility shim

QtWebEngine rejects Playwright's `Browser.setDownloadBehavior` request even
when no download is needed. Clients that use Playwright or
`d3k agent-browser` must therefore connect through the local compatibility
shim instead of connecting directly to qutebrowser.

| Component                  | Address                 | Requirement                                      |
| -------------------------- | ----------------------- | ------------------------------------------------ |
| Normal-profile qutebrowser | `http://127.0.0.1:9223` | Must be running for proxied requests to succeed. |
| CDP compatibility shim     | `http://127.0.0.1:9225` | Used by Playwright and `d3k agent-browser`.      |

The shim rewrites the browser WebSocket URL to port `9225`, answers
`Browser.setDownloadBehavior` locally, and forwards all other HTTP and
WebSocket traffic to port `9223`. It does not start qutebrowser and does not
provide a fallback browser.

### Automatic startup

The macOS LaunchAgent definition is stored in the repository:

```text
qutebrowser/launchd/com.timhq.qutebrowser-cdp-shim.plist
```

Install it once by linking it into the per-user LaunchAgents directory and
bootstrapping it:

```fish
mkdir -p ~/Library/Logs/qutebrowser
ln -sfn /Users/tim/dev/dotfiles/qutebrowser/launchd/com.timhq.qutebrowser-cdp-shim.plist \
  ~/Library/LaunchAgents/com.timhq.qutebrowser-cdp-shim.plist
launchctl bootstrap gui/(id -u) \
  ~/Library/LaunchAgents/com.timhq.qutebrowser-cdp-shim.plist
```

After installation, `launchd` starts the shim at login and restarts it after
an unexpected exit. The service uses `/Users/tim/.volta/bin/node`, runs
`qutebrowser/bin/qutebrowser-cdp-shim.mjs`, listens only on `127.0.0.1:9225`,
and proxies to `http://127.0.0.1:9223`.

If the job is already loaded after changing the plist, reload it explicitly:

```fish
launchctl bootout gui/(id -u)/com.timhq.qutebrowser-cdp-shim
launchctl bootstrap gui/(id -u) \
  ~/Library/LaunchAgents/com.timhq.qutebrowser-cdp-shim.plist
```

### Verification and diagnostics

```fish
launchctl print gui/(id -u)/com.timhq.qutebrowser-cdp-shim
lsof -nP -iTCP:9225 -sTCP:LISTEN
curl -fsS http://127.0.0.1:9225/json/version
```

The returned `webSocketDebuggerUrl` must begin with
`ws://127.0.0.1:9225/`. Logs are written to:

```text
~/Library/Logs/qutebrowser/cdp-shim.log
```

If port `9225` is listening but `/json/version` fails, first verify that the
normal qutebrowser process owns port `9223`. Do not start another browser or
profile to compensate for a missing upstream. The implementation supports
`QUTEBROWSER_CDP_UPSTREAM`, `QUTEBROWSER_CDP_SHIM_HOST`, and
`QUTEBROWSER_CDP_SHIM_PORT` overrides, but the LaunchAgent intentionally pins
the normal production addresses above.

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
- `qutebrowser/bin/qutebrowser-cdp-shim.mjs` — Playwright compatibility proxy.
- `qutebrowser/bin/qutebrowser-cdp-shim.test.mjs` — unit and live proxy coverage.
- `qutebrowser/launchd/com.timhq.qutebrowser-cdp-shim.plist` — automatic shim startup.
