#!/bin/bash

# Ensure Homebrew binaries are visible
export PATH="/opt/homebrew/bin:$PATH"

# Qt plugins (platforms, etc.)
export QT_PLUGIN_PATH="$(brew --prefix qt@6)/plugins"

# QtWebEngine resources (needed for qutebrowser)
# export QTWEBENGINE_RESOURCES_PATH="$(brew --prefix qt@6)/resources"

if pgrep -x "qutebrowser" >/dev/null; then
  osascript -e 'tell application "qutebrowser" to activate'
else
  exec /opt/homebrew/bin/qutebrowser "$@"
fi
