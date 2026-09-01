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

DEBUG_ARGS=(--profile-directory="Default" --restore-last-session)

activate_helium() {
  osascript -e 'tell application id "net.imput.helium" to activate' >/dev/null 2>&1
}

if pgrep -x "Helium" >/dev/null; then
  activate_helium
  exit 0
fi


open -a "Helium" --args "${DEBUG_ARGS[@]}"
