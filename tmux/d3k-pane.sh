#!/usr/bin/env bash
set -euo pipefail

side=${1:-}
service=${2:-}
window=${3:-}

case "$side" in
  left|right) ;;
  *) printf 'Usage: %s {left|right} {crm|web} [window_id]\n' "${0##*/}" >&2; exit 2 ;;
esac

case "$service" in
  crm|web) ;;
  *) printf 'Usage: %s {left|right} {crm|web} [window_id]\n' "${0##*/}" >&2; exit 2 ;;
esac

if [[ -z "$window" || "$window" == '#{'* ]]; then
  window=$(tmux display-message -p '#{window_id}')
fi

pane=$(tmux list-panes -t "$window" -F '#{pane_id} #{pane_left}' \
  | sort -k2,2n \
  | { [[ "$side" == left ]] && sed -n '1p' || sed -n '$p'; } \
  | cut -d' ' -f1)

if [[ -z "$pane" ]]; then
  printf 'No %s pane found in %s\n' "$side" "$window" >&2
  exit 1
fi

project=/Users/tim/dev/my/urban-prime-mono
restart=${D3K_RESTART_SH:-/Users/tim/dev/dotfiles/tmux/d3k-restart.sh}

wait_for_shell() {
  local command
  for _ in {1..50}; do
    command=$(tmux display-message -p -t "$pane" '#{pane_current_command}')
    case "$command" in fish|bash|zsh|sh) return 0 ;; esac
    sleep 0.1
  done
  return 1
}

tmux send-keys -t "$pane" C-c C-c
wait_for_shell || { tmux send-keys -t "$pane" C-z; wait_for_shell; } || {
  tmux display-message "d3k:${service}: target pane did not return to shell"
  exit 1
}

tmux send-keys -t "$pane" C-u "jobs -p | xargs kill -TERM 2>/dev/null; $restart $service" C-m
