#!/usr/bin/env bash
set -euo pipefail

# Cycle tmux sessions while skipping utility sessions that should not appear in
# day-to-day Cmd+h/Cmd+l navigation.
#
# Skipped by default:
# - popup sessions: _popup*, or sessions tagged @is_popup_session=1
# - utility sessions named alacritty or monitor
#
# Additional sessions can opt out with:
#   tmux set-option -t <session> @session_nav_skip 1

direction="${1:-}"
case "$direction" in
    prev|previous) step=-1 ;;
    next) step=1 ;;
    *)
        printf 'usage: %s prev|next\n' "${0##*/}" >&2
        exit 64
        ;;
esac

current_session="$(tmux display-message -p '#{session_name}')"

sessions=()
current_index=-1
index=0

while IFS=$'\t' read -r session_name is_popup_session session_nav_skip; do
    [[ -n "$session_name" ]] || continue

    case "$session_name" in
        _popup*|alacritty|monitor) continue ;;
    esac

    [[ "$is_popup_session" == "1" ]] && continue
    [[ "$session_nav_skip" == "1" ]] && continue

    sessions+=("$session_name")
    if [[ "$session_name" == "$current_session" ]]; then
        current_index=$index
    fi
    ((index += 1))
done < <(tmux list-sessions -F $'#{session_name}\t#{@is_popup_session}\t#{@session_nav_skip}')

count=${#sessions[@]}
if (( count == 0 )); then
    exit 0
fi

if (( current_index < 0 )); then
    # If the current session is excluded, jump to the first navigable session.
    target_index=0
elif (( count == 1 )); then
    exit 0
else
    target_index=$(( (current_index + step + count) % count ))
fi

tmux switch-client -t "${sessions[$target_index]}"
