# Tmux pane title refresh hooks

# Refresh tmux pane title after command execution
function __tmux_refresh_pane_title --on-event fish_postexec
    if set -q TMUX
        tmux refresh-client -S 2>/dev/null || true
    end
end