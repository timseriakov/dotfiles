#!/usr/bin/env bash
# Simple popup shell for tmux.
# Usage: popup-shell.sh [ephemeral]
#   (no args)   → persistent session "_popup", reused across all sessions
#   ephemeral   → throwaway session "_popup_eph", killed when popup closes
# Toggle is handled by if-shell in .tmux.conf bindings.

set -euo pipefail

MODE="${1:-persistent}"
POPUP_WIDTH="80%"
POPUP_HEIGHT="80%"
BORDER_COLOR="#81A1C1"

if [[ "$MODE" == "ephemeral" ]]; then
    POPUP_SESSION="_popup_eph"
    # Always start fresh for ephemeral
    tmux kill-session -t "$POPUP_SESSION" 2>/dev/null || true
    TMUX='' tmux new-session -d -s "$POPUP_SESSION"
    tmux set-option -t "$POPUP_SESSION" status off
    # -E blocks until popup closes, then kill the session
    tmux display-popup \
        -E \
        -w "$POPUP_WIDTH" -h "$POPUP_HEIGHT" \
        -b rounded \
        -T " tmp " \
        -S "fg=$BORDER_COLOR" \
        "tmux attach-session -t '$POPUP_SESSION'"
    tmux kill-session -t "$POPUP_SESSION" 2>/dev/null || true
else
    POPUP_SESSION="_popup"
    # Ensure persistent session exists
    if ! tmux has-session -t "$POPUP_SESSION" 2>/dev/null; then
        TMUX='' tmux new-session -d -s "$POPUP_SESSION"
        tmux set-option -t "$POPUP_SESSION" status off
    fi
    tmux display-popup \
        -E \
        -w "$POPUP_WIDTH" -h "$POPUP_HEIGHT" \
        -b rounded \
        -S "fg=$BORDER_COLOR" \
        "tmux attach-session -t '$POPUP_SESSION'"
fi
