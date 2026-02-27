#!/usr/bin/env fish
# Keybindings and cursor shapes

# Interactive guard
if not status is-interactive
    return
end

# Use custom keybindings function
set -U fish_key_bindings fish_user_key_bindings

# Apply custom keybindings if function exists
if type -q fish_user_key_bindings
    fish_user_key_bindings
    set -U fish_key_bindings fish_user_key_bindings
end

# Cursor shapes
set -gx fish_cursor_default block
set -gx fish_cursor_visual block
set -gx fish_cursor_insert line
set -gx fish_cursor_replace underscore
set -gx fish_cursor_replace_one underscore
set -gx fish_cursor_external line
