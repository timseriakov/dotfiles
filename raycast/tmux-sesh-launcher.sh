#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Tmux Sessions
# @raycast.mode silent
# @raycast.icon Terminal
# @raycast.description Focus Kitty and open the tmux/sesh picker
# @raycast.author tim
# @raycast.authorURL https://github.com/timseriakov

set -euo pipefail

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if command -v hs >/dev/null 2>&1; then
  hs_bin="hs"
else
  hs_bin="/Applications/Hammerspoon.app/Contents/Frameworks/hs/hs"
fi


"$hs_bin" -c 'require("tmux_sesh_launcher").launch()' >/dev/null

exit 0
