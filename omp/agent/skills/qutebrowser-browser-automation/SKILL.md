---
name: qutebrowser-browser-automation
description: Guides safe automation of this workstation's qutebrowser and marked agent tabs. Use before qutebrowser/CDP operations, OMP browser attachment, d3k browser QA, agent-window recovery, or Helium relay; not for unrelated cookie/auth code or ordinary browser research.
---

# Qutebrowser browser automation

Use the normal profile to share cookies and logins. Load the repository's local
runtime/browser runbook before project QA; it owns app URLs and server startup.

## Choose the connection and target

| Client                           | Browser endpoint        | Target ownership             |
| -------------------------------- | ----------------------- | ---------------------------- |
| OMP browser tool                 | `http://127.0.0.1:9223` | OMP session-owned tab        |
| Raw CDP client                   | `http://127.0.0.1:9223` | Client must verify ownership |
| `d3k agent-browser` / Playwright | `http://127.0.0.1:9225` | Verified marked app page     |

`9225` is the compatibility shim for QtWebEngine's unsupported
`Browser.setDownloadBehavior`; it neither starts nor replaces qutebrowser.
Use explicit `--cdp 9225` for every `d3k agent-browser` invocation; do not combine
it with `--require-d3k-browser`.

The config hook preserves `OMP_AGENT_WINDOW_9f2c` across navigation. This token
identifies the safe agent window, not ownership of every tab in it. Match a
complete title token, not a substring. Never choose foreground/first/last page.

- **OMP:** omit `app.target` or pass the public marker above; other qutebrowser
  selectors are rejected. OMP derives an exact `_TOKEN_...` marker from session
  ID and tab name, and automatically creates its missing target. Reuse the same
  tab name within a workflow; never adopt another session's token tab. Let OMP
  manage tokens and release its owned tabs with the browser tool when finished.
- **d3k:** verify `type === "page"`, the persistent marker, and the expected
  app URL/port from the project runtime. Ignore service workers and unmarked
  pages. Select that exact tab in the same agent-browser session before any
  navigation or interaction, then recheck its identity after selection. OMP's
  ownership checks do not automatically protect agent-browser commands. On tab
  loss, stop and rediscover; do not accept a neighboring-tab fallback. Check the
  actual binary's capabilities before using newer session/pinning flags.

## Diagnose before recovery

1. For project QA, check the already-running runtime using documented discovery
   commands and `d3k status --json` from the app package directory. Read existing
   `d3k logs` / `d3k errors --context`; a live runtime lock is not a stale lock.
   Follow project rules for who starts servers; do not start a competing runtime.
2. Read `/json/version` on `9223`; for agent-browser/Playwright also check
   `9225`. Required endpoints must report qutebrowser; the shim's browser
   WebSocket must point to `9225`.
3. Read canonical `/json/list` on `9223` and compare it with the client's tab
   list (and `9225` for shim clients). Record page IDs, URLs, and exact tokens.
   Multiple marked pages are valid. A filtered/empty tab list does not prove
   the agent window is absent; disagreement means discovery/adapter mismatch.
4. For CLI/daemon errors, check the chosen binary from the same package cwd:
   `pnpm exec d3k agent-browser --cdp 9225 --version`. Explicit `--cdp` avoids
   d3k's preliminary auto-connect to the raw session port, even for `--version`.
   Compare with installed dependencies and CLI resolution order: a global
   binary may win. Do not infer the running version from the lockfile alone.
5. For bootstrap/IPC errors, identify the process owning `9223` and its active
   qutebrowser IPC socket/TMPDIR. Inspect only needed metadata; do not dump the
   process environment, cookies, or credentials. See the runtime spec below.

After automatic bootstrap fails, do not call the launcher manually or repeat
attach. Stop browser QA and report the checked runtime/endpoints/target IDs,
the mismatch, and the required user action. Successful OMP bootstrap clears its
cache, allowing later automatic recreation of a lost owned tab; this does not
authorize a manual retry loop after failure.

## Launcher and browser boundaries

The launcher must reuse the `TMPDIR` of the process owning `9223`, serialize
bootstrap calls, and use bounded waits. Never substitute a canonical temp dir,
start another profile, or terminate the CDP owner. Timeout cleanup may target
only the exact child created by that invocation. Launcher `--open` routes plain
URLs through the existing IPC runtime; it does not establish session ownership
and is not a bootstrap-recovery substitute.

A page `webSocketDebuggerUrl` is not a browser endpoint. Internal `Page.navigate`
on an already verified owned target is valid; do not pass its page socket to a
client expecting a browser endpoint. Do not focus/switch windows with desktop
automation or alter the user's main tabs. Separate-profile `qutebrowser-dev`
on `9224` has different cookies and requires an explicit user decision.

## Helium relay exception

Use only on an explicit user request for a particular external site that
qutebrowser cannot support. Name the chosen target before acting and pass
`browser.open({ app: { relay: true, target: "<specific URL/title substring>" } })`.
The target is mandatory; never adopt the foreground/visible tab. Stay on that
target and release it afterward. Use the broker's auto-start; do not enable
`browser.relay` globally or switch silently. Restore any temporarily changed
global setting. Missing markers are not a capability gap. Helium does not
replace qutebrowser evidence for local d3k surfaces.

## References

- [Runtime, IPC and shim details](/Users/tim/dev/dotfiles/qutebrowser/AGENT-BROWSER-SPEC.md)
- [Urban Prime local runtime and QA](/Users/tim/dev/my/urban-prime-mono/.memory-bank/runbooks/local-development.md)
