#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PINCHTAB_DIR="$SCRIPT_DIR"

CONFIG_SRC="$PINCHTAB_DIR/config.json"
PLIST_SRC="$PINCHTAB_DIR/launchd/com.local.pinchtab.server.plist"

CONFIG_DEST_DIR="$HOME/.pinchtab"
CONFIG_DEST="$CONFIG_DEST_DIR/config.json"

LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"
PLIST_DEST="$LAUNCH_AGENTS_DIR/com.local.pinchtab.server.plist"

LOG_DIR="$HOME/Library/Logs/pinchtab"

LABEL="com.local.pinchtab.server"
DOMAIN="gui/$UID"
SERVICE="$DOMAIN/$LABEL"

bail_if_missing() {
  local path
  path="$1"
  if [ ! -e "$path" ]; then
    echo "Error: expected source missing: $path" >&2
    exit 1
  fi
}

timestamp() {
  date "+%Y%m%d%H%M%S"
}

backup_existing() {
  local dest ts backup_path
  dest="$1"
  ts=$(timestamp)
  backup_path="${dest}.bak.${ts}"
  mv "$dest" "$backup_path"
  echo "$backup_path"
}

ensure_dir() {
  local dir
  dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
  fi
}

symlink_changes=()

ensure_symlink() {
  local src dest action
  src="$1"
  dest="$2"

  bail_if_missing "$src"

  action=""
  if [ -L "$dest" ]; then
    local current
    current=$(readlink "$dest")
    if [ "$current" = "$src" ]; then
      action="ok"
    else
      local bak
      bak=$(backup_existing "$dest")
      ln -s "$src" "$dest"
      action="relinked (backed up to $bak)"
    fi
  elif [ -e "$dest" ]; then
    local bak
    bak=$(backup_existing "$dest")
    ln -s "$src" "$dest"
    action="replaced non-symlink (backed up to $bak)"
  else
    ln -s "$src" "$dest"
    action="created"
  fi

  if [ "$action" != "ok" ]; then
    symlink_changes+=("$dest -> $src [$action]")
  fi
}

service_result=""

reload_service() {
  local plist_path
  plist_path="$1"

  launchctl bootout "$SERVICE" >/dev/null 2>&1 || true
  launchctl bootstrap "$DOMAIN" "$plist_path"
  launchctl enable "$SERVICE"
  launchctl kickstart -k "$SERVICE"

  service_result="reloaded ($LABEL)"
}

main() {
  ensure_dir "$CONFIG_DEST_DIR"
  ensure_dir "$LAUNCH_AGENTS_DIR"
  ensure_dir "$LOG_DIR"

  ensure_symlink "$CONFIG_SRC" "$CONFIG_DEST"
  ensure_symlink "$PLIST_SRC" "$PLIST_DEST"

  reload_service "$PLIST_DEST"

  echo "Symlinks created or repaired:"
  if [ ${#symlink_changes[@]} -eq 0 ]; then
    echo " - none (already correct)"
  else
    for item in "${symlink_changes[@]}"; do
      echo " - $item"
    done
  fi

  echo "Service reload:"
  echo " - $service_result"
}

main "$@"
