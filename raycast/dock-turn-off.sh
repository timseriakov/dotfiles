#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Hide Dock
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🙈
# @raycast.packageName Screencast Tools

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

osascript <<EOF
tell application "System Events"
	tell dock preferences to set autohide to true
end tell

do shell script "defaults write com.apple.dock autohide-delay -float 1000; killall Dock"
EOF
