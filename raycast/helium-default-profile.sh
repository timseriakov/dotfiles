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
  # Helium running — check if debugging port is open
  if curl -sf http://localhost:9222/json/version >/dev/null 2>&1; then
    osascript -e "tell application \"System Events\" to set frontmost of (first process whose unix id is $PID) to true"
  else
    osascript -e 'tell application "Helium" to quit' 2>/dev/null
    sleep 1
    open -na "Helium" --args --profile-directory="Default" --remote-debugging-port=9222
  fi
else
  open -na "Helium" --args --profile-directory="Default" --remote-debugging-port=9222
fi
