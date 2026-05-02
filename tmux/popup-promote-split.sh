#!/usr/bin/env bash
set -euo pipefail

LOG_DIR="${TMPDIR:-/tmp}"
if [[ -z "$LOG_DIR" || "$LOG_DIR" == *'$'* || ! -d "$LOG_DIR" ]]; then
    LOG_DIR="/tmp"
fi
LOG_FILE="$LOG_DIR/tmux-popup-promote-split.log"
log() {
    mkdir -p "${LOG_FILE%/*}" 2>/dev/null || true
    printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG_FILE" 2>/dev/null || true
}

current_session_name="$(tmux display-message -p '#{session_name}')"
current_window_id="$(tmux display-message -p '#{window_id}')"
current_pane_id="$(tmux display-message -p '#{pane_id}')"
popup_client_name="$(tmux display-message -p '#{client_name}')"
parent_window_id="$(tmux show-options -qv -t "$current_session_name" @popup_parent_window_id || true)"
split_mode="${1:-vertical}"
case "$split_mode" in
    vertical) split_flag='-h' ;;
    horizontal) split_flag='-v' ;;
    *) exit 0 ;;
esac

log "start mode=$split_mode session=$current_session_name window=$current_window_id pane=$current_pane_id client=${popup_client_name:-}"
log "initial parent_window_id=${parent_window_id:-}"


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
    log "fallback parent_window_id=${parent_window_id:-}"
fi

if [[ -z "$parent_window_id" ]]; then
    exit 0
fi

parent_window_name="$(tmux display-message -p -t "$parent_window_id" '#{window_name}' 2>/dev/null || true)"

if [[ -z "$parent_window_name" ]]; then
    exit 0
fi

parent_pane_id="$(tmux display-message -p -t "$parent_window_id" '#{pane_id}' 2>/dev/null || true)"
log "resolved parent_window_id=$parent_window_id parent_window_name=${parent_window_name:-} parent_pane_id=${parent_pane_id:-}"

if [[ -z "$parent_pane_id" ]]; then
    exit 0
fi

parent_client_name="$(tmux list-clients -F $'#{client_name}\t#{window_id}' 2>/dev/null | while IFS=$'\t' read -r client_name window_id; do
    [[ "$window_id" == "$parent_window_id" ]] || continue
    printf '%s\n' "$client_name"
    break
done)"

log "parent_client_name=${parent_client_name:-}"

join_output="$(tmux join-pane -s "$current_pane_id" -t "$parent_pane_id" "$split_flag" 2>&1)" || {
    log "join-pane failed: $join_output"
    exit 0
}
log "join-pane ok: ${join_output:-}"

if [[ -n "$parent_client_name" ]]; then
    switch_output="$(tmux switch-client -c "$parent_client_name" -t "$parent_window_id" 2>&1)" || log "switch-client failed: $switch_output"
fi

select_output="$(tmux select-pane -t "$current_pane_id" 2>&1)" || log "select-pane failed: $select_output"

tmux detach-client -t "$popup_client_name" 2>/dev/null || true

tmux kill-window -t "$current_window_id" 2>/dev/null || true
log "done"
