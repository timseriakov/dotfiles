#!/bin/bash

# Alacritty launcher with configurable vertical offset
# Usage: ./raycast/alacritty-launcher.sh [offset_percentage]
# Example: ./raycast/alacritty-launcher.sh 30  (moves window 30% down from top)

set -e

# Default offset if none provided (10% down from top)
DEFAULT_OFFSET=10
OFFSET=${1:-$DEFAULT_OFFSET}

# Validate offset is a number between 0 and 100
if ! [[ "$OFFSET" =~ ^[0-9]+$ ]] || [ "$OFFSET" -lt 0 ] || [ "$OFFSET" -gt 100 ]; then
    echo "Error: Offset must be a number between 0 and 100"
    echo "Usage: $0 [offset_percentage]"
    exit 1
fi

echo "Launching Alacritty with ${OFFSET}% vertical offset..."

# Open Alacritty
open -a Alacritty

# Wait a moment for Alacritty to launch
sleep 0.5

# Calculate pixel offset (assuming typical screen height, will be adjusted by AppleScript)
# AppleScript will handle the actual positioning based on screen size
osascript << EOF
tell application "System Events"
    set alacrittyProcess to first application process whose name is "Alacritty"
    set alacrittyWindow to first window of alacrittyProcess
    
    -- Get screen dimensions
    set screenSize to bounds of screen of alacrittyWindow
    set screenWidth to item 3 of screenSize
    set screenHeight to item 4 of screenSize
    
    -- Calculate offset from top
    set yOffset to (screenHeight * $OFFSET / 100)
    
    -- Set window position (x=0, y=calculated offset from top)
    set position of alacrittyWindow to {0, yOffset}
    
    -- Set window size to full width, half height
    set size of alacrittyWindow to {screenWidth, screenHeight / 2}
    
    activate alacrittyProcess
end tell
EOF

echo "Alacritty positioned at ${OFFSET}% from top"