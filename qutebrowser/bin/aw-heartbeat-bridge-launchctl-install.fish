#!/usr/bin/env fish
# Creates and loads a macOS LaunchAgent to run the ActivityWatch heartbeat bridge at login.
# Usage: bin/aw-heartbeat-bridge-launchctl-install.fish

set LABEL com.timhq.aw-heartbeat-bridge
set PLIST "$HOME/Library/LaunchAgents/$LABEL.plist"

# Resolve repo root (this file lives in bin/)
set THIS (status -f)
set BIN_DIR (dirname $THIS)
set REPO_ROOT (realpath (path normalize "$BIN_DIR/.."))
set PY_SCRIPT "$REPO_ROOT/bin/aw-heartbeat-bridge.py"
set LOGFILE "/tmp/aw-heartbeat-bridge.log"

# Pick a python3 path that's available to launchd
set PY_CANDIDATES \
  /opt/homebrew/bin/python3 \
  /usr/local/bin/python3 \
  /usr/bin/python3 \
  (command -s python3 2>/dev/null)

set PYTHON3 ""
for p in $PY_CANDIDATES
  if test -x "$p"
    set PYTHON3 "$p"
    break
  end
end

if test -z "$PYTHON3"
  echo "[aw-launchctl] python3 not found in known locations" >&2
  exit 1
end

if not test -f "$PY_SCRIPT"
  echo "[aw-launchctl] bridge script not found: $PY_SCRIPT" >&2
  exit 1
end

mkdir -p (dirname "$PLIST")

printf '%s\n' \
  '<?xml version="1.0" encoding="UTF-8"?>' \
  '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' \
  '<plist version="1.0">' \
  '<dict>' \
  '  <key>Label</key>' \
  '  <string>'$LABEL'</string>' \
  '  <key>ProgramArguments</key>' \
  '  <array>' \
  '    <string>'$PYTHON3'</string>' \
  '    <string>'$PY_SCRIPT'</string>' \
  '  </array>' \
  '  <key>RunAtLoad</key>' \
  '  <true/>' \
  '  <key>KeepAlive</key>' \
  '  <true/>' \
  '  <key>WorkingDirectory</key>' \
  '  <string>'$REPO_ROOT'</string>' \
  '  <key>StandardOutPath</key>' \
  '  <string>'$LOGFILE'</string>' \
  '  <key>StandardErrorPath</key>' \
  '  <string>'$LOGFILE'</string>' \
  '</dict>' \
  '</plist>' > "$PLIST"

echo "[aw-launchctl] Wrote $PLIST"

# Try to (re)load it
launchctl unload -w "$PLIST" ^/dev/null; or true
launchctl load -w "$PLIST"

echo "[aw-launchctl] Loaded $LABEL. Logs: $LOGFILE"
