#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMUXAI_DIR="$SCRIPT_DIR"

CONFIG_SRC="$TMUXAI_DIR/config.yaml"
KB_SRC="$TMUXAI_DIR/kb"
CONFIG_DEST="$HOME/.config/tmuxai/config.yaml"
KB_DEST="$HOME/.config/tmuxai/kb"

bail_if_missing() {
  local path="$1"
  if [ ! -e "$path" ]; then
    echo "Error: expected source missing: $path" >&2
    exit 1
  fi
}

timestamp() {
  date "+%Y%m%d%H%M%S"
}

backup_existing() {
  local dest="$1"
  local ts
  ts=$(timestamp)
  local backup_path
  backup_path="${dest}.bak.${ts}"
  mv "$dest" "$backup_path"
  echo "$backup_path"
}

ensure_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
  fi
}

symlink_changes=()

ensure_symlink() {
  local src="$1"
  local dest="$2"

  bail_if_missing "$src"
  local action
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

main() {
  ensure_dir "$HOME/.config"
  ensure_dir "$(dirname "$CONFIG_DEST")"

  ensure_symlink "$CONFIG_SRC" "$CONFIG_DEST"
  ensure_symlink "$KB_SRC" "$KB_DEST"

  echo "Symlinks created or repaired:"
  if [ ${#symlink_changes[@]} -eq 0 ]; then
    echo " - none (already correct)"
  else
    for item in "${symlink_changes[@]}"; do
      echo " - $item"
    done
  fi
}

main "$@"
