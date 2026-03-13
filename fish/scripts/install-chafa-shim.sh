#!/usr/bin/env bash
# Usage: bash ~/dev/dotfiles/fish/scripts/install-chafa-shim.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." >/dev/null 2>&1 && pwd)"
SHIM_SOURCE="$REPO_ROOT/bin/chafa"
DEST_DIR="$HOME/.local/bin"
DEST_PATH="$DEST_DIR/chafa"

timestamp() {
  date "+%Y%m%d%H%M%S"
}

ensure_dir() {
  local dir
  dir="$1"
  if [[ ! -d "$dir" ]]; then
    mkdir -p "$dir"
  fi
}

backup_existing() {
  local dest ts backup_path
  dest="$1"
  ts="$(timestamp)"
  backup_path="${dest}.bak.${ts}"
  mv "$dest" "$backup_path"
  echo "$backup_path"
}

ensure_symlink() {
  local src dest action
  src="$1"
  dest="$2"
  if [[ ! -e "$src" ]]; then
    echo "Error: expected shim missing: $src" >&2
    exit 1
  fi

  action=""
  if [[ -L "$dest" ]]; then
    local current
    current="$(readlink "$dest")"
    if [[ "$current" == "$src" ]]; then
      action="ok"
    else
      local bak
      bak="$(backup_existing "$dest")"
      ln -s "$src" "$dest"
      action="relinked (backed up to $bak)"
    fi
  elif [[ -e "$dest" ]]; then
    local bak
    bak="$(backup_existing "$dest")"
    ln -s "$src" "$dest"
    action="replaced non-symlink (backed up to $bak)"
  else
    ln -s "$src" "$dest"
    action="created"
  fi

  if [[ "$action" != "ok" ]]; then
    echo "$dest -> $src [$action]"
  fi
}

ensure_dir "$DEST_DIR"
ensure_symlink "$SHIM_SOURCE" "$DEST_PATH"
