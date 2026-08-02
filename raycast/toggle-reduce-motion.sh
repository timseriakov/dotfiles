#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Toggle Reduce Motion
# @raycast.mode compact

# Optional parameters:
# @raycast.packageName macOS Tweaks

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

modern="com.apple.Accessibility"
legacy="com.apple.universalaccess"

current="$(defaults read "$modern" ReduceMotionEnabled 2>/dev/null || defaults read "$legacy" reduceMotion 2>/dev/null || echo 0)"

if [ "$current" = "1" ]; then
  value=false
  label=off
else
  value=true
  label=on
fi

defaults write "$modern" ReduceMotionEnabled -bool "$value"
defaults write "$legacy" reduceMotion -bool "$value"

killall cfprefsd 2>/dev/null || true
killall Dock 2>/dev/null || true
killall SystemUIServer 2>/dev/null || true

echo "Reduce Motion: $label"
