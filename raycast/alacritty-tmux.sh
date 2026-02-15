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
# Set environment variables for tmux integration
# NO_TMUX=0: bypasses auto-start, launches directly with tmux
# TMUX_AUTO=1: enables tmux auto-start  
# TMUX_AUTO_SESSION=alacritty: specifies tmux session name
env NO_TMUX=0 TMUX_AUTO=1 TMUX_AUTO_SESSION=alacritty /opt/homebrew/bin/alacritty >/dev/null 2>&1 &

# Check if alacritty session exists, create or attach
if ! tmux has-session -t alacritty 2>/dev/null; then
  tmux new-session -d -s alacritty -c "env NO_TMUX=0 TMUX_AUTO=1 TMUX_AUTO_SESSION=alacritty /opt/homebrew/bin/alacritty" 2>&1
else
  echo "Alacritty tmux session already exists"
fi

exit 0

exit 0