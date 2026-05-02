#!/usr/bin/env bash
set -euo pipefail

current_session_name="$(tmux display-message -p '#{session_name}')"
current_window_id="$(tmux display-message -p '#{window_id}')"
current_pane_id="$(tmux display-message -p '#{pane_id}')"
popup_client_name="$(tmux display-message -p '#{client_name}')"
parent_window_id="$(tmux show-options -qv -t "$current_session_name" @popup_parent_window_id || true)"
split_mode="${1:-vertical}"
case "$split_mode" in
    vertical) split_flag='-h'; select_direction='-R' ;;
    horizontal) split_flag='-v'; select_direction='-D' ;;
    *) exit 1 ;;
esac


popup_parent_window_id_from_session_name() {
    case "${1:-}" in
        _popup_eph_*) printf '@%s\n' "${1#_popup_eph_}" ;;
        _popup_*) printf '@%s\n' "${1#_popup_}" ;;
        *) return 1 ;;
    esac
}

if [[ "$current_session_name" != _popup* ]]; then
    exit 0
fi

if [[ -z "$parent_window_id" ]]; then
    parent_window_id="$(popup_parent_window_id_from_session_name "$current_session_name" || true)"
fi

if [[ -z "$parent_window_id" ]]; then
    exit 1
fi

parent_window_name="$(tmux display-message -p -t "$parent_window_id" '#{window_name}' 2>/dev/null || true)"

if [[ -z "$parent_window_name" ]]; then
    exit 1
fi

parent_client_name="$(tmux list-clients -F $'#{client_name}\t#{window_id}' 2>/dev/null | while IFS=$'\t' read -r client_name window_id; do
    [[ "$window_id" == "$parent_window_id" ]] || continue
    printf '%s\n' "$client_name"
    break
done)"

moved_pane_id="$(tmux join-pane -P -F '#{pane_id}' -s "$current_pane_id" -t "$parent_window_id" "$split_flag")"

if [[ -n "$parent_client_name" ]]; then
    tmux switch-client -c "$parent_client_name" -t "$parent_window_id" 2>/dev/null || true
fi

tmux select-pane -t "$moved_pane_id" 2>/dev/null || true

tmux detach-client -t "$popup_client_name" 2>/dev/null || true

tmux kill-window -t "$current_window_id" 2>/dev/null || true
