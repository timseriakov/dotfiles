#!/usr/bin/env bash
set -euo pipefail

LOG=/tmp/yazi-popup.log
{
  printf '\n[%s] start args:' "$(date '+%F %T')"
  printf ' <%s>' "$@"
  printf '\n'
} >>"$LOG"

parent_window_id=${1:-}
start_directory=${2:-}

if [[ -z $parent_window_id || $parent_window_id == '#{'* ]]; then
  parent_window_id=$(tmux display-message -p '#{window_id}')
fi
if [[ -z $start_directory || $start_directory == '#{'* ]]; then
  start_directory=$(tmux display-message -p '#{pane_current_path}')
fi

root=$(git -C "$start_directory" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$start_directory")
window_key=${parent_window_id//[^A-Za-z0-9_-]/_}
session="_popup_yazi_${window_key}"

{
  printf '[%s] parent=%s start=%s root=%s session=%s\n' "$(date '+%F %T')" "$parent_window_id" "$start_directory" "$root" "$session"
} >>"$LOG"

tmux kill-session -t "$session" 2>/dev/null || true
TMUX='' tmux new-session -d -c "$root" -s "$session" \
  sh -c 'until [ -n "$(tmux list-clients -t "$1" 2>/dev/null)" ]; do sleep 0.05; done; exec yazi' sh "$session" >>"$LOG" 2>&1
tmux set-option -t "$session" status off >>"$LOG" 2>&1
tmux set-option -t "$session" @is_popup_session 1 >>"$LOG" 2>&1
tmux set-option -t "$session" @popup_parent_window_id "$parent_window_id" >>"$LOG" 2>&1
tmux set-option -t "$session" @popup_kind ephemeral >>"$LOG" 2>&1
tmux set-option -t "$session" @popup_label yazi >>"$LOG" 2>&1
tmux set-option -t "$session" @popup_start_directory "$root" >>"$LOG" 2>&1

{
  printf '[%s] before display-popup\n' "$(date '+%F %T')"
} >>"$LOG"

tmux display-popup \
  -E \
  -w 95% -h 90% \
  -b rounded \
  -S 'fg=#81A1C1,bg=#2e3440' \
  "tmux attach-session -t '$session'" >>"$LOG" 2>&1 || true

{
  printf '[%s] after display-popup status=$?\n' "$(date '+%F %T')"
} >>"$LOG"

tmux kill-session -t "$session" 2>/dev/null || true
