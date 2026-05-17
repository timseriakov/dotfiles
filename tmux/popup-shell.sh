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
POPUP_WIDTH="95%"
POPUP_HEIGHT="90%"
BORDER_COLOR="#81A1C1"
EPHEMERAL_BORDER_COLOR="#EBCB8B"
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
    local popup_start_directory="$4"

    tmux set-option -t "$session_name" -q @is_popup_session 1
    tmux set-option -t "$session_name" -q @popup_parent_window_id "$parent_window_id"
    tmux set-option -t "$session_name" -q @popup_kind "$popup_kind"
    tmux set-option -t "$session_name" -q @popup_start_directory "$popup_start_directory"
}

close_parent_workmux_sidebar_if_open() {
    local panes=""

    panes="$(tmux list-panes -t "$PARENT_WINDOW_ID" -F '#{pane_current_command}\t#{pane_start_command}\t#{pane_title}' 2>/dev/null || true)"

    if printf '%s\n' "$panes" | grep -Eiq '(^workmux\t|workmux .*_sidebar-|\tsidebar($|\t))'; then
        /opt/homebrew/bin/workmux sidebar >/dev/null 2>&1 || true
    fi
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

close_parent_workmux_sidebar_if_open

if command -v im-select >/dev/null 2>&1; then
    im-select com.apple.keylayout.ABC >/dev/null 2>&1 || true
fi
if [[ "$MODE" == "ephemeral" ]]; then
    POPUP_SESSION="_popup_eph_${WINDOW_KEY}"

    tmux kill-session -t "$POPUP_SESSION" 2>/dev/null || true
    TMUX='' tmux new-session -d -c "$SESSION_START_DIRECTORY" -s "$POPUP_SESSION"
    tmux set-option -t "$POPUP_SESSION" status off
    set_popup_metadata "$POPUP_SESSION" "$MODE" "$PARENT_WINDOW_ID" "$SESSION_START_DIRECTORY"

    tmux display-popup \
        -E \
        -w "$POPUP_WIDTH" -h "$POPUP_HEIGHT" \
        -b rounded \
        -T " tmp " \
        -S "fg=$EPHEMERAL_BORDER_COLOR" \
        "tmux attach-session -t '$POPUP_SESSION'"

    tmux kill-session -t "$POPUP_SESSION" 2>/dev/null || true
else
    POPUP_SESSION="_popup_${WINDOW_KEY}"

    if ! tmux has-session -t "$POPUP_SESSION" 2>/dev/null; then
        TMUX='' tmux new-session -d -c "$SESSION_START_DIRECTORY" -s "$POPUP_SESSION"
        tmux set-option -t "$POPUP_SESSION" status off
    fi
    set_popup_metadata "$POPUP_SESSION" "$MODE" "$PARENT_WINDOW_ID" "$SESSION_START_DIRECTORY"

    tmux display-popup \
        -E \
        -w "$POPUP_WIDTH" -h "$POPUP_HEIGHT" \
        -b rounded \
        -S "fg=$BORDER_COLOR" \
        "tmux attach-session -t '$POPUP_SESSION'"
fi
