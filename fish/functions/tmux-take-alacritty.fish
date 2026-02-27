# Move all windows from alacritty session to current tmux session
# Usage: tmux-take-alacritty [target-session]

function tmux-take-alacritty
    # Check if we're inside tmux
    if not set -q TMUX
        echo "Error: Not inside a tmux session"
        return 1
    end

    # Get target session (current session or provided argument)
    if set -q argv[1]
        set target_session $argv[1]
    else
        set target_session (tmux display-message -p '#S')
    end

    # Check if source session exists
    if not tmux has-session -t alacritty 2>/dev/null
        echo "Warning: alacritty session does not exist"
        return 1
    end

    # Get all windows from alacritty session
    set windows (tmux list-windows -t alacritty -F '#{window_id}')

    # Move each window to target session
    for window_id in $windows
        tmux move-window -s $window_id -t $target_session: 2>/dev/null
    end

    # Check if alacritty session is now empty and kill it
    if not tmux list-windows -t alacritty 2>/dev/null
        tmux kill-session -t alacritty 2>/dev/null
    end

    echo "Moved windows from alacritty to $target_session"
end
