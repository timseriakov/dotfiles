#!/usr/bin/env bash
set -euo pipefail

parent_window_id="${1:?parent window id required}"
start_directory="${2:?start directory required}"
window_key="${parent_window_id#@}"
session="_popup_notes_${window_key//[^[:alnum:]_-]/_}"

if ! tmux has-session -t "$session" 2>/dev/null; then
  notes_root="$(git -C "$start_directory" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$start_directory")"
  touch "$notes_root/NOTES.md"
  printf -v command 'exec nvim %q' "$notes_root/NOTES.md"
  TMUX='' tmux new-session -d -c "$notes_root" -s "$session" "$command"
  tmux set-option -t "$session" status off
fi

tmux set-option -t "$session" -q @is_popup_session 1
tmux set-option -t "$session" -q @popup_parent_window_id "$parent_window_id"
tmux set-option -t "$session" -q @popup_kind persistent
tmux set-option -t "$session" -q @popup_label notes
tmux set-option -t "$session" -q @popup_start_directory "$start_directory"

tmux display-popup -E -x '#{e|-:#{e|-:#{client_width},#{popup_width}},#{e|/:#{client_width},40}}' -w 50% -h 90% -b rounded -T ' notes ' -S 'fg=#81A1C1' \
  "tmux attach-session -t '$session'"
