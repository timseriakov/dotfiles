---
name: mac-use-router
description: Use for mac-use-mcp desktop automation on macOS: current macOS UI state, direct desktop control, privacy-aware live smoke tests, screenshots, mouse clicks, typing, scrolling, windows, app focus/opening, menus, clipboard, UI elements, or permission checks. Also use for Russian requests about экран, скриншот, клик, мышь, клавиатура, напечатай, окно, открыть приложение, меню, буфер обмена, управление Mac. Routes requests to the right mac-use tool with BM25-friendly intent words.
---

# mac-use-mcp Router

Use this before any macOS desktop/computer-use action.

## First step

If permissions are unknown, call:

```text
mac desktop permissions screen recording accessibility check_permissions
```

Then route by the smallest safe tool.

## Tool routing

| User intent            | BM25 intent words                                         | Tool                  |
| ---------------------- | --------------------------------------------------------- | --------------------- |
| Check permissions      | `mac desktop permissions accessibility screen recording`  | `check_permissions`   |
| Wait for UI change     | `mac desktop wait delay pause`                            | `wait`                |
| Screen/display size    | `mac screen display resolution scale info`                | `get_screen_info`     |
| Current mouse position | `mac cursor mouse position coordinates`                   | `get_cursor_position` |
| See the screen         | `mac screenshot screen image capture window region`       | `screenshot`          |
| Move pointer only      | `mac mouse move pointer coordinates`                      | `move_mouse`          |
| Click something        | `mac mouse click coordinates left right double triple`    | `click`               |
| Scroll page/list       | `mac scroll wheel up down left right`                     | `scroll`              |
| Drag/drop/resize       | `mac drag mouse from to coordinates`                      | `drag`                |
| Type text              | `mac keyboard type text input`                            | `type_text`           |
| Press shortcut/key     | `mac keyboard press key shortcut modifiers`               | `press_key`           |
| Find windows           | `mac windows list apps titles`                            | `list_windows`        |
| Bring app/window front | `mac focus window application frontmost`                  | `focus_window`        |
| Launch app             | `mac open launch application app`                         | `open_application`    |
| Read clipboard         | `mac clipboard pasteboard read text`                      | `clipboard_read`      |
| Write clipboard        | `mac clipboard pasteboard write copy text`                | `clipboard_write`     |
| Menu item              | `mac menu click menu bar item path application`           | `click_menu`          |
| Inspect native UI tree | `mac accessibility ui elements buttons fields text roles` | `get_ui_elements`     |

## Observation strategy

- Use `get_ui_elements` for native macOS labels, buttons, fields, roles, states, and coordinates when a screenshot would add noise.
- Use `screenshot` for visual layout, pixels, colors, screen/menu-bar targets, or when Accessibility data is missing/incomplete.
- Use browser tooling for web page DOM/content when available; use mac-use for browser chrome, native dialogs, menus, permissions, windows, and non-browser apps.
- Treat UI element coordinates as current-state only. After any mutating action, inspect again before the next precise action.

## Safe sequence

1. Inspect first: `get_ui_elements`, `screenshot`, `list_windows`, or `get_cursor_position`.
2. Prefer UI/accessibility targets from `get_ui_elements`; use raw coordinates only as the fallback.
3. Before `click`, `drag`, or `type_text`, call `focus_window` for the target app/window.
4. Prefer `click_menu` over coordinate clicks for menu commands.
5. Prefer `clipboard_write` + paste shortcut for long text instead of slow typing.
6. Ask before destructive or hard-to-undo actions.

## Examples

```text
Need to see the current desktop. Search intent: mac screenshot screen image capture.
```

```text
Need to type in Safari. Search intent: mac focus window Safari, then mac keyboard type text input.
```

```text
Need to choose File > Save As in Preview. Search intent: mac menu click menu bar item path Preview.
```
