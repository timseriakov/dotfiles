#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Qutebrowser
# @raycast.mode silent
# @raycast.package Browsers
# @raycast.icon 🚀
## @raycast.argument1 { "type": "text", "placeholder": "URL (optional)", "optional": true }

# Ensure Homebrew in PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"

# Set Qt plugins path so Cocoa/WebEngine work
export QT_PLUGIN_PATH="$(brew --prefix qt@6)/plugins"

#URL="$1"

#if [ -n "$URL" ]; then
#   exec /opt/homebrew/bin/qutebrowser "$URL"
# else
exec /opt/homebrew/bin/qutebrowser
# fi
