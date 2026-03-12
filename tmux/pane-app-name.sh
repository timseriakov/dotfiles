#!/usr/bin/env bash

set -euo pipefail

pane_current_command=${1:-}
pane_pid=${2:-}
pane_tty=${3:-}
pane_current_path=${4:-}

MAPPINGS_FILE="$(dirname "$0")/title-mappings.conf"

sanitize_comm() {
    local comm=${1:-}
    comm=${comm##*/}
    comm=${comm#-}
    printf '%s' "$comm"
}

apply_mappings() {
    local input=$1
    if [[ ! -f "$MAPPINGS_FILE" ]]; then
        printf '%s' "$input"
        return
    fi
    
    local output="$input"
    while IFS=: read -r key val || [[ -n "$key" ]]; do
        [[ -z "$key" || "$key" == \#* ]] && continue
        # Replace occurrences of key with val
        output="${output//$key/$val}"
    done < "$MAPPINGS_FILE"
    printf '%s' "$output"
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

# 1. Resolve App Name
resolved_app=""
if [[ "$pane_current_command" != "volta-shim" ]]; then
    resolved_app=$(sanitize_comm "$pane_current_command")
else
    if child=$(child_comm "$pane_pid"); then
        resolved_app="$child"
    else
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
            resolved_app="$fg_comm"
        elif [[ -n "$fg_pid" ]]; then
            if child=$(child_comm "$fg_pid"); then
                resolved_app="$child"
            fi
        fi
    fi
fi

if [[ -z "$resolved_app" ]]; then
    resolved_app=$(sanitize_comm "$pane_current_command")
fi

# 2. Resolve Path Basename
path_base=${pane_current_path##*/}
[[ -z "$path_base" ]] && path_base="/"

# 3. Apply Mappings
final_app=$(apply_mappings "$resolved_app")
final_path=$(apply_mappings "$path_base")

# 4. Output final string
if [[ "$final_app" == "$final_path" ]]; then
    printf '%s\n' "$final_app"
else
    printf '%s /%s\n' "$final_app" "$final_path"
fi
