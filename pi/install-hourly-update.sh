#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.local.pi.hourly-update.plist"
PLIST_SRC="$SCRIPT_DIR/launchd/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/Library/Logs/pi"
LABEL="com.local.pi.hourly-update"
DOMAIN="gui/$UID"
SERVICE="$DOMAIN/$LABEL"

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"

if [ -L "$PLIST_DEST" ] && [ "$(readlink "$PLIST_DEST")" = "$PLIST_SRC" ]; then
  echo "LaunchAgent symlink already correct: $PLIST_DEST"
else
  if [ -e "$PLIST_DEST" ] || [ -L "$PLIST_DEST" ]; then
    backup="$PLIST_DEST.bak.$(date +%Y%m%d%H%M%S)"
    mv "$PLIST_DEST" "$backup"
    echo "Backed up existing LaunchAgent to: $backup"
  fi
  ln -s "$PLIST_SRC" "$PLIST_DEST"
  echo "Linked LaunchAgent: $PLIST_DEST -> $PLIST_SRC"
fi

launchctl bootout "$SERVICE" >/dev/null 2>&1 || true
launchctl bootstrap "$DOMAIN" "$PLIST_DEST"
launchctl enable "$SERVICE"
launchctl kickstart -k "$SERVICE"

echo "Loaded hourly Pi updater: $SERVICE"
echo "Logs: $LOG_DIR/hourly-update.stdout.log and $LOG_DIR/hourly-update.stderr.log"
