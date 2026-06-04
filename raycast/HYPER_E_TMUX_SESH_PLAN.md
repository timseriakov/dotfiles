# Raycast Hyper-E tmux sesh launcher plan

## Request

Replace the current Raycast tmux-session-list extension on `hyper+e` with a flow that reuses Kitty and the existing tmux/sesh picker, because the in-tmux picker (`prefix+s` / Kitty `cmd+s`) is already the preferred UX.

## Current findings

- Repository root: `/Users/tim/dev/dotfiles`.
- Dotfiles deployment model: edit files in this repo, not live app config paths.
- Existing Kitty tmux passthrough:
  - `kitty/kitty.conf` maps `cmd+s` / `cmd+ы` to literal `Ctrl-a s`.
- Existing tmux session picker:
  - `tmux/sesh-fzf-picker.sh` runs `sesh list -t --icons | fzf-tmux ...` and then `sesh connect "$selected"`.
  - `.tmux.conf` binds the picker to tmux prefix flow; docs confirm `Ctrl-a s` / `cmd+s` use this picker.
- Existing Raycast script command pattern:
  - `raycast/presenterm-launcher.sh` launches `/Applications/kitty.app/Contents/MacOS/kitty` from a Raycast script command, in silent mode, as a background process.
- Karabiner has hyper mappings for other keys, but no `hyper+e` mapping in tracked config. The active `hyper+e` hotkey is likely configured in Raycast UI/export, not in plain text dotfiles.

## Recommendation

Do not make Raycast reimplement the session list. Keep Raycast as a thin launcher and keep all session UX inside tmux/sesh where it already works.

Recommended implementation:

1. Add a small Hammerspoon function/module for the actual UX action:
   - focus/reraise Kitty using Hammerspoon application/window APIs;
   - send `Ctrl-a` then `s` to the focused Kitty app using `hs.eventtap.keyStroke`, matching the existing tmux picker shortcut;
   - if Kitty is not running, launch Kitty first, attach/create tmux, then trigger the picker after the first window is ready.
2. Add a new Raycast script command, e.g. `raycast/tmux-sesh-launcher.sh`, that is only a bridge:
   - invoke the Hammerspoon function through the existing `hs` CLI (`hs.ipc.cliInstall()` is already configured in `hammerspoon/init.lua`);
   - keep Raycast responsible only for the `hyper+e` hotkey and command entry.
3. Do not duplicate sesh/fzf logic in Raycast or Hammerspoon. The picker remains the existing tmux path behind `Ctrl-a s` / `tmux/sesh-fzf-picker.sh`.
4. Because the picker runs in the existing tmux client, selecting a session switches that same visible Kitty/tmux window to the selected session.
5. Bind Raycast hotkey `hyper+e` to this new script command in Raycast.

## Design choice

Prefer Hammerspoon for the focus/key-injection mechanics, with Raycast as a thin hotkey/launcher bridge.

Trade-offs:

- Hammerspoon is already present and configured with `hs.ipc.cliInstall()` in `hammerspoon/init.lua`, so Raycast can call into it without inventing AppleScript glue.
- Hammerspoon has first-class app focus and targeted keystroke APIs (`hs.application`, `hs.eventtap.keyStroke`), which is cleaner than Raycast shell + `osascript` for this job.
- This matches the desired transition: selection happens in the existing visible Kitty/tmux client.
- Reusing the existing `Ctrl-a s` / `tmux/sesh-fzf-picker.sh` path avoids two divergent pickers and preserves current muscle memory.
- Fallback launch keeps the hotkey usable if Kitty is not running.

## Critical files to modify for implementation

- `hammerspoon/tmux_sesh_launcher.lua` — new Hammerspoon module/function for focusing Kitty and triggering `Ctrl-a s`.
- `hammerspoon/init.lua` — require/init the new module.
- `raycast/tmux-sesh-launcher.sh` — new Raycast script command bridge to Hammerspoon.
- Optional docs if desired:
  - `tmux/README.md`
  - `tmux/KEYBINDINGS.md`
  - `tmux/CHEATSHEET.md`

## Verification plan

After implementation:

1. Static syntax checks:
   - `bash -n raycast/tmux-sesh-launcher.sh`.
   - Hammerspoon/Lua load check via the `hs` CLI if available.
2. Verify required commands are available in the intended shell path: `hs`, `kitty`, `tmux`, `sesh`, `fzf-tmux`, `fish`.
3. From an already-open Kitty/tmux setup, invoke the Hammerspoon function via `hs` and confirm:
   - Kitty is focused/reused;
   - the existing `Ctrl-a s` picker appears in that same Kitty/tmux client;
   - selecting a session switches that visible client to the selected session;
   - cancelling returns to the original tmux client cleanly.
4. Invoke the Raycast script command directly and confirm it triggers the same Hammerspoon behavior.
5. With Kitty unavailable, run the script and confirm fallback launches Kitty, attaches/creates tmux, and reaches the picker.
6. If docs are updated, verify references match actual script names and keybindings.

## User clarification

Kitty is normally always open. Preferred behavior is to reuse/focus existing Kitty/tmux if possible, and have the selected session transition happen in that existing window rather than a disconnected new Kitty window. A new window is acceptable only as fallback.
