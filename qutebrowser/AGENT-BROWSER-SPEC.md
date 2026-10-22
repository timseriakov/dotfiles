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
including after cross-origin navigation. This marker identifies the safe window,
not ownership of every tab in it. For CDP `9223`, callers omit `app.target` or
pass this public marker; other selectors are rejected. OMP derives an exact
`OMP_AGENT_WINDOW_9f2c_TOKEN_<token>` title token from session ID and tab name,
creates that target when absent, and scopes selection/release to its owner.
Keep the same tab name within a workflow and never adopt another session's token
tab. Foreground/first/last-page fallback selection is forbidden.

This shares cookies, logins, and authenticated state while keeping agent actions
out of the user's main window.

The separate `qutebrowser-dev` profile at `~/.local/share/qutebrowser-dev` and
CDP `127.0.0.1:9224` is optional isolation only. It has separate cookies and
sessions and requires an explicit user decision; it is not the default.

If automatic marker-target creation fails, automation fails closed. Chrome,
headless Chrome, and implicit foreground attachment are forbidden.

### Missing marker recovery

OMP invokes `qutebrowser-agent` automatically; after `Could not create the marked
qutebrowser agent window`, do not invoke it manually or retry browser attach.
Diagnose CDP ownership and the active instance IPC runtime instead. Successful
bootstrap clears its cache so OMP can later recreate a lost owned tab; this does
not authorize manual retry loops after failure. Launcher `--open` routes plain
URLs through the existing IPC runtime but does not establish session ownership
and is not a bootstrap-recovery substitute.

The launcher must reuse the `TMPDIR` of the qutebrowser process that owns CDP
`9223`, serialize concurrent calls, and bound both lock and child waits. It must
never substitute `DARWIN_USER_TEMP_DIR`, start another profile, or leave a
spawned child running after timeout. Cleanup is limited to the exact child
spawned by that launcher invocation; the CDP-owning process and user tabs are
never terminated or navigated. A page `webSocketDebuggerUrl` is not a browser
CDP endpoint; internal `Page.navigate` on a verified owned target is valid.

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

Use explicit `--cdp 9225` for every `d3k agent-browser` invocation; do not combine
it with `--require-d3k-browser`. Without explicit CDP, d3k may first auto-connect
to the raw port recorded in its session, including for `--version`.

For project QA, discover the app URL/port and already-running runtime through
the project's runbook. d3k targets must be marked `page` entries at that app URL;
service workers and unrelated marked pages are not the requested surface. The
client must select and recheck the exact tab before navigation. OMP's session
ownership is not automatically applied to agent-browser. Stop and rediscover
after tab loss rather than accepting a neighboring-tab fallback; check the
actual binary's capabilities before using newer session/pinning flags.

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

First read `/json/version` on both `9223` and `9225`, then canonical `/json/list`
on `9223`. Compare target IDs, URLs, and exact whitespace-delimited title tokens
with the shim inventory and client tab list. Multiple marked pages are valid;
an empty/filtered client result is not proof that the agent window is absent.
An inventory mismatch calls for adapter diagnosis, not a new browser/profile.

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

For CLI/daemon failures, run `pnpm exec d3k agent-browser --cdp 9225 --version`
from the app package directory and compare with dependencies and d3k's binary
resolution order. A global binary can win over the repo dependency. Read
existing `d3k status --json`, `logs`, and `errors --context` from that directory;
do not restart a live runtime just because it owns a lock. For IPC diagnosis,
inspect the CDP owner's IPC socket/TMPDIR without dumping its full environment
or credentials. Follow the project's server-start ownership rules.

## Agent browser automation order

1. Use the session-owned normal-profile qutebrowser tab through OMP on `9223`,
   or the verified marked app page through agent-browser/Playwright on `9225`.
2. Only on an explicit user request for an external site unsupported by
   qutebrowser, use Helium relay per call with
   `browser.open({ app: { relay: true, target: "<specific URL/title substring>" } })`.
   Name the target before acting, never adopt foreground/visible tabs, remain
   on that target, and release it afterward. Prefer the broker's auto-start;
   do not enable `browser.relay` globally and restore any temporarily changed
   global setting.
3. Missing markers never justify relay. Helium does not replace qutebrowser
   evidence for local d3k surfaces.

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
