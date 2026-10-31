---
name: mcp-router
description: Use when a task may need external MCP tools through MCPProxy: desktop/computer use, browser/web automation, search, memory, design canvas, or any user request mentioning MCP tools. Routes by intent so MCPProxy BM25 can retrieve the right small tool set instead of dumping every tool.
---

# MCP Router

Use MCPProxy as the single MCP entry point:

```text
http://127.0.0.1:8080/mcp/
```

Do not connect directly to individual MCP servers from OMP.

## Routing rule

When the task needs an MCP tool, state the intent in concrete words before tool selection:

```text
Need to <action> using <target app/site/service/object>.
```

Good BM25 queries include:

- the server/domain word: `mac`, `desktop`, `screen`, `browser`, `doop`, `memory`, `dayflow`
- the action: `screenshot`, `click`, `type`, `window`, `clipboard`, `search`, `canvas`, `save`
- the object: app name, website, file, canvas, category, date

Avoid vague queries like `use tool`, `do it`, `open thing`.

## Minimal discovery

1. If the exact tool is obvious, call it.
2. If not obvious, ask MCPProxy for the smallest matching tool set by intent.
3. Do not list all tools unless the user asks for inventory/debugging.

## Browser automation

Use `ego-browser` by default for webpage/browser automation (run `ego-browser skill` and follow its version-matched guide). Agent Desktop is for native desktop UI, not webpages. Use Helium through OMP Browser Relay only when the task needs an existing Helium tab or ego-browser is unsuitable; every Relay call requires per-call `app.relay=true` and an explicit intended `app.target`. Never adopt a foreground/random user tab, switch targets implicitly, or enable Relay globally.

For native macOS desktop tasks, follow `skill://mac-use-router`: Agent Desktop is the default; `mac-use-mcp` is a capability-based fallback only. Never use the fallback to bypass a permission denial. Route all MCP access through MCPProxy.

## Desktop safety

For `mac-use-mcp` / computer-use tasks:

1. Start with `check_permissions` when permissions are unknown.
2. Prefer `screenshot`, `list_windows`, `get_ui_elements`, and `get_cursor_position` before actions.
3. Ask before destructive or hard-to-undo clicks/types.
4. Use `focus_window` immediately before `click`, `drag`, or typing into an app.

## Examples

```text
Need native macOS UI state from an app. Follow skill://mac-use-router; default to `agent-desktop snapshot` and consult `skill://agent-desktop`.
```

```text
Need a macOS capability Agent Desktop does not support. Search MCPProxy intent: mac desktop <specific action> <target>; use mac-use-mcp only as a capability fallback, never to bypass denied permissions.
```

```text
Need webpage content or controls. Use `ego-browser` and its current guide; use OMP Browser Relay only for an existing Helium tab with per-call `app.relay=true` and explicit `app.target`.
```

```text
Need to save a project note in memory. Search intent: memory save observation project.
```
