#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Show Dock (autohide default delay)
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 🧼

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

defaults delete com.apple.dock autohide-delay 2>/dev/null
defaults write com.apple.dock autohide -bool true
killall Dock
