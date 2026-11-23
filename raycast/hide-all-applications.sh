#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Hide All Applications
# @raycast.mode silent

# Optional parameters:
# @raycast.packageName macOS Tweaks

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov

osascript <<'EOF'
tell application "System Events"
    repeat with proc in (application processes whose background only is false)
        try
            set visible of proc to false
        end try
    end repeat
end tell
EOF
