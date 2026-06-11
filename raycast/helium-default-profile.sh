#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Helium Default Profile
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 💎

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

PID=$(pgrep -f "Helium.*--profile-directory=Default" | head -1)

if [ -n "$PID" ]; then
  osascript -e "tell application \"System Events\" to set frontmost of (first process whose unix id is $PID) to true"
else
  open -na "Helium" --args --profile-directory="Default"
fi
