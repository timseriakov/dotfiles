#!/usr/bin/env bash
set -euo pipefail

start_directory=${1:?start directory required}
if [[ $start_directory == '#{'* ]]; then
  start_directory=$(tmux display-message -p '#{pane_current_path}')
fi
shift

repo_root=$(git -C "$start_directory" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$start_directory")

exec tmux display-popup -E -w 95% -h 90% -b rounded -S 'fg=#81A1C1,bg=#2e3440' \
  sh -c 'cd "$1" && shift && exec "$@"' sh "$repo_root" "$@"
