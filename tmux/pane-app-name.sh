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

# Recursively find the actual child process (skip volta-shim and other wrappers)
find_real_child() {
    local parent_pid=$1
    local max_depth=${2:-5}
    local depth=0
    local current_pid=$parent_pid
    
    while [[ $depth -lt $max_depth ]]; do
        local child
        child=$(pgrep -P "$current_pid" 2>/dev/null | head -n1) || return 1
        [[ -z "$child" ]] && return 1
        
        local comm
        comm=$(ps -p "$child" -o comm= 2>/dev/null | head -n1) || return 1
        comm=$(sanitize_comm "$comm")
        
        # Skip wrapper processes
        if [[ -n "$comm" && "$comm" != "volta-shim" && "$comm" != "node" ]]; then
            printf '%s\n' "$comm"
            return 0
        fi
        
        # For node, check if it's actually running something interesting
        if [[ "$comm" == "node" ]]; then
            local args
            args=$(ps -p "$child" -o args= 2>/dev/null | head -n1) || return 1
            # Check for known node-based tools in args
            if [[ "$args" == *"nvim"* || "$args" == *"neovim"* ]]; then
                printf 'nvim\n'
                return 0
            elif [[ "$args" == *"opencode"* ]]; then
                printf 'opencode\n'
                return 0
            fi
        fi
        
        current_pid=$child
        ((depth++))
    done
    
    return 1
}

# Find foreground process on TTY
find_fg_process() {
    local tty_short=$1
    local fg_pid=""
    local fg_comm=""
    
    while read -r pid stat comm; do
        if [[ "$stat" == *+* ]]; then
            fg_pid=$pid
            fg_comm=$(sanitize_comm "$comm")
            break
        fi
    done < <(ps -t "$tty_short" -o pid= -o stat= -o comm= 2>/dev/null || true)
    
    if [[ -n "$fg_comm" && "$fg_comm" != "volta-shim" ]]; then
        printf '%s\n' "$fg_comm"
        return 0
    elif [[ -n "$fg_pid" ]]; then
        find_real_child "$fg_pid" && return 0
    fi
    
    return 1
}

# 1. Resolve App Name
resolved_app=""

if [[ "$pane_current_command" != "volta-shim" ]]; then
    resolved_app=$(sanitize_comm "$pane_current_command")
else
    # Try to find the real child process
    if child=$(find_real_child "$pane_pid"); then
        resolved_app="$child"
    else
        # Fallback: check TTY foreground process
        tty_short=${pane_tty#/dev/}
        if fg=$(find_fg_process "$tty_short"); then
            resolved_app="$fg"
        fi
    fi
fi

# Final fallback
if [[ -z "$resolved_app" ]]; then
    resolved_app=$(sanitize_comm "$pane_current_command")
fi

# 2. Resolve Path Basename
path_base=${pane_current_path##*/}
[[ -z "$path_base" ]] && path_base="/"

# 3. Apply Mappings (only for app, not path)
final_app=$(apply_mappings "$resolved_app")
final_path="$path_base"

# 4. Output final string
if [[ "$final_app" == "$final_path" ]]; then
    printf '%s\n' "$final_app"
else
    printf '%s %s\n' "$final_app" "$final_path"
fi