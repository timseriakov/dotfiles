#!/usr/bin/env bash
set -euo pipefail

TMUX_BIN="${TMUX_BIN:-tmux}"
POPUP_PREFIX="_popup"
PARENT_OPTION="@popup_parent_window_id"

windows="$($TMUX_BIN list-windows -a -F '#{window_id}' 2>/dev/null || true)"
sessions="$($TMUX_BIN list-sessions -F '#{session_name}' 2>/dev/null || true)"

[[ -n "$sessions" ]] || exit 0

while IFS= read -r session_name; do
    [[ -n "$session_name" ]] || continue
    [[ "$session_name" == ${POPUP_PREFIX}* ]] || continue

    parent_window_id="$($TMUX_BIN show-options -t "$session_name" -vq "$PARENT_OPTION" 2>/dev/null || true)"
    [[ -n "$parent_window_id" ]] || continue

    if ! grep -Fqx -- "$parent_window_id" <<<"$windows"; then
        $TMUX_BIN kill-session -t "$session_name" 2>/dev/null || true
    fi
done <<<"$sessions"
