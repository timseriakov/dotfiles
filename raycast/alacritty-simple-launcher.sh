#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Alacritty Simple Launcher
# @raycast.mode compact

# Optional parameters:
# @raycast.icon 
# @raycast.arguments [{ "type": "text", "placeholder": "10" }]

# Documentation:
# @raycast.author timseriakov
# @raycast.authorURL https://raycast.com/timseriakov
# @raycast.description Simple Alacritty launcher (no positioning)

set -e

DEFAULT_OFFSET=10
OFFSET=${1:-$DEFAULT_OFFSET}

echo "Launching Alacritty with offset ${OFFSET}..."

# Just open Alacritty without positioning
open -a Alacritty

echo "Alacritty launched"