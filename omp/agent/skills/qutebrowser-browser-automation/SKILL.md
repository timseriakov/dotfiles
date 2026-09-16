---
name: qutebrowser-browser-automation
description: Use before qutebrowser, CDP, OMP browser automation, agent windows, browser focus, cookies, login sessions, or Helium relay work. Requires a same-profile marked qutebrowser window and forbids implicit foreground-window attachment.
---

# Qutebrowser browser automation

Use the normal qutebrowser profile so cookies, logins, and authenticated state are shared.

## Required target

OMP creates the separate normal-profile agent window automatically on first use
when its target is absent. The qutebrowser config hook permanently tags every
page title in that window with `OMP_AGENT_WINDOW_9f2c`, including after
cross-origin navigation.

Connect to qutebrowser CDP at `http://127.0.0.1:9223`. OMP injects the
persistent `OMP_AGENT_WINDOW_9f2c` title target automatically. Callers may pass
that same marker explicitly; any other target is rejected. Never select the
foreground, first, or last available page. If automatic creation fails, fail
closed.

## Missing marker recovery

Marker creation gets at most one total attempt. OMP already invokes the
launcher automatically, so after `Could not create the marked qutebrowser
agent window` do not call the launcher manually and do not retry browser
attach. Diagnose CDP ownership and the active qutebrowser IPC runtime instead.

The launcher must reuse the `TMPDIR` of the process owning CDP `9223`, serialize
concurrent calls, and use bounded waits. Never substitute a canonical temp
directory, open another profile, connect through a page `webSocketDebuggerUrl`,
or terminate the CDP-owning process. On timeout, cleanup may target only the
exact child created by that launcher invocation.

OMP browser relay is disabled by default. It is allowed only with an explicit
`app.relay: true` request for a named capability that qutebrowser CDP cannot
provide. A missing agent marker is not such a capability gap and must fail.

Never silently switch to relay or use relay for ordinary qutebrowser navigation.

## Focus and safety

Do not use desktop automation to focus or switch windows as part of browser work. Do not alter the user's main tabs. Validate the target before navigation.

`qutebrowser-dev` and CDP `9224` are separate-profile isolation options only; they do not share normal-profile cookies and require an explicit user decision.
