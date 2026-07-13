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

DEBUG_URL="http://127.0.0.1:9222/json/version"
DEBUG_ARGS=(--profile-directory="Default" --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1 --restore-last-session)

activate_helium() {
  osascript -e 'tell application id "net.imput.helium" to activate' >/dev/null 2>&1
}

if pgrep -x "Helium" >/dev/null; then
  # Reuse an existing Helium when it already exposes the Chrome DevTools Protocol.
  if curl -sf "$DEBUG_URL" >/dev/null 2>&1; then
    activate_helium
    exit 0
  fi

  # CDP can only be enabled at process start, so restart once if Helium is open without it.
  osascript -e 'tell application id "net.imput.helium" to quit' >/dev/null 2>&1
  while pgrep -x "Helium" >/dev/null; do sleep 0.1; done
fi

open -a "Helium" --args "${DEBUG_ARGS[@]}"
