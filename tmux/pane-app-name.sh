#!/usr/bin/env bash

set -euo pipefail

pane_current_command=${1:-}
pane_pid=${2:-}
pane_tty=${3:-}

sanitize_comm() {
    local comm=${1:-}
    comm=${comm##*/}
    comm=${comm#-}
    printf '%s' "$comm"
}

child_comm() {
    local parent_pid=$1
    local child
    for child in $(pgrep -P "$parent_pid" 2>/dev/null || true); do
        local comm
        comm=$(ps -p "$child" -o comm= 2>/dev/null | head -n1)
        comm=$(sanitize_comm "$comm")
        if [[ -n "$comm" && "$comm" != "volta-shim" ]]; then
            printf '%s\n' "$comm"
            return 0
        fi
    done
    return 1
}

if [[ -z "$pane_current_command" || -z "$pane_pid" || -z "$pane_tty" ]]; then
    exit 0
fi

if [[ "$pane_current_command" != "volta-shim" ]]; then
    printf '%s\n' "$(sanitize_comm "$pane_current_command")"
    exit 0
fi

if child=$(child_comm "$pane_pid"); then
    printf '%s\n' "$child"
    exit 0
fi

tty_short=${pane_tty#/dev/}
fg_pid=""
fg_comm=""
while read -r pid stat comm; do
    if [[ "$stat" == *+* ]]; then
        fg_pid=$pid
        fg_comm=$(sanitize_comm "$comm")
        break
    fi
done < <(ps -t "$tty_short" -o pid= -o stat= -o comm= 2>/dev/null || true)

if [[ -n "$fg_comm" && "$fg_comm" != "volta-shim" ]]; then
    printf '%s\n' "$fg_comm"
    exit 0
fi

if [[ -n "$fg_pid" ]]; then
    if child=$(child_comm "$fg_pid"); then
        printf '%s\n' "$child"
        exit 0
    fi
fi

fallback=$(ps -p "$pane_pid" -o comm= 2>/dev/null | head -n1)
fallback=$(sanitize_comm "$fallback")
if [[ -n "$fallback" ]]; then
    printf '%s\n' "$fallback"
else
    printf '%s\n' "$(sanitize_comm "$pane_current_command")"
fi
