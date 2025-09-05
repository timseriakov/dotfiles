#!/usr/bin/env fish
# Unloads and removes the macOS LaunchAgent for the ActivityWatch heartbeat bridge.
# Usage: bin/aw-heartbeat-bridge-launchctl-uninstall.fish

set LABEL com.timhq.aw-heartbeat-bridge
set PLIST "$HOME/Library/LaunchAgents/$LABEL.plist"

if test -f "$PLIST"
  launchctl unload -w "$PLIST" ^/dev/null; or true
  rm -f "$PLIST"
  echo "[aw-launchctl] Unloaded and removed $PLIST"
else
  echo "[aw-launchctl] No plist to remove ($PLIST)"
end

# Best-effort stop of any running bridge process
pkill -f aw-heartbeat-bridge.py 2>/dev/null; or true
rm -f /tmp/aw-heartbeat-bridge.pid 2>/dev/null; or true
echo "[aw-launchctl] Bridge processes signaled (if any)."
