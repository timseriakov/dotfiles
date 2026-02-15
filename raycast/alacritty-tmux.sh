#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Alacritty with tmux
# @raycast.mode silent
# @raycast.icon 💻
# @raycast.description Open Alacritty with hidden tmux status bar

# Launch Alacritty with tmux session (auto-attach to main)
# TMUX_AUTO=1 enables auto-attach to session named in TMUX_AUTO_SESSION
# NO_TMUX=0 bypasses auto-start logic to launch with tmux immediately
# NO_TMUX=0 bypasses auto-start logic to launch with tmux immediately
env NO_TMUX=0 TMUX_AUTO=1 TMUX_AUTO_SESSION=alacritty /opt/homebrew/bin/alacritty >/dev/null 2>&1 &

exit 0