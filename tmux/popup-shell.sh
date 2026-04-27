#!/usr/bin/env bash
# Simple popup shell for tmux.
# Usage: popup-shell.sh [persistent|ephemeral] [parent_window_id] [start_directory]
#   persistent + window_id + cwd → reuse one popup session per tmux window; cwd applies on first create only
#   ephemeral + window_id + cwd  → start fresh session per open in current pane directory, scoped to tmux window
# Toggle/detach behavior is handled by tmux bindings.

set -euo pipefail

MODE="${1:-persistent}"
PARENT_WINDOW_ID="${2:-}"
START_DIRECTORY="${3:-}"
POPUP_WIDTH="80%"
POPUP_HEIGHT="80%"
BORDER_COLOR="#81A1C1"

usage() {
    printf 'Usage: %s [persistent|ephemeral] [parent_window_id]\n' "${0##*/}" >&2
    exit 1
}

resolve_start_directory() {
    if [[ -n "$START_DIRECTORY" && -d "$START_DIRECTORY" ]]; then
        printf '%s' "$START_DIRECTORY"
    else
        printf '%s' "$HOME"
    fi
}

sanitize_window_id() {
    local raw="$1"
    raw="${raw#@}"
    raw="${raw//[^[:alnum:]_-]/_}"
    printf '%s' "$raw"
}

set_popup_metadata() {
    local session_name="$1"
    local popup_kind="$2"
    local parent_window_id="$3"

    tmux set-option -t "$session_name" -q @is_popup_session 1
    tmux set-option -t "$session_name" -q @popup_parent_window_id "$parent_window_id"
    tmux set-option -t "$session_name" -q @popup_kind "$popup_kind"
}

case "$MODE" in
    persistent|ephemeral) ;;
    *) usage ;;
esac

if [[ -z "$PARENT_WINDOW_ID" ]]; then
    usage
fi

WINDOW_KEY="$(sanitize_window_id "$PARENT_WINDOW_ID")"

if [[ -z "$WINDOW_KEY" ]]; then
    printf 'Invalid parent_window_id: %s\n' "$PARENT_WINDOW_ID" >&2
    exit 1
fi

SESSION_START_DIRECTORY="$(resolve_start_directory)"

if [[ "$MODE" == "ephemeral" ]]; then
    POPUP_SESSION="_popup_eph_${WINDOW_KEY}"

    tmux kill-session -t "$POPUP_SESSION" 2>/dev/null || true
    TMUX='' tmux new-session -d -c "$SESSION_START_DIRECTORY" -s "$POPUP_SESSION"
    tmux set-option -t "$POPUP_SESSION" status off
    set_popup_metadata "$POPUP_SESSION" "$MODE" "$PARENT_WINDOW_ID"

    tmux display-popup \
        -E \
        -w "$POPUP_WIDTH" -h "$POPUP_HEIGHT" \
        -b rounded \
        -T " tmp " \
        -S "fg=$BORDER_COLOR" \
        "tmux attach-session -t '$POPUP_SESSION'"

    tmux kill-session -t "$POPUP_SESSION" 2>/dev/null || true
else
    POPUP_SESSION="_popup_${WINDOW_KEY}"

    if ! tmux has-session -t "$POPUP_SESSION" 2>/dev/null; then
        TMUX='' tmux new-session -d -c "$SESSION_START_DIRECTORY" -s "$POPUP_SESSION"
        tmux set-option -t "$POPUP_SESSION" status off
    fi
    set_popup_metadata "$POPUP_SESSION" "$MODE" "$PARENT_WINDOW_ID"

    tmux display-popup \
        -E \
        -w "$POPUP_WIDTH" -h "$POPUP_HEIGHT" \
        -b rounded \
        -S "fg=$BORDER_COLOR" \
        "tmux attach-session -t '$POPUP_SESSION'"
fi
