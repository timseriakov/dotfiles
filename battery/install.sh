#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

PATH="$HOME/.local/bin:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
REPO="$HOME/dev/dotfiles/battery"

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
agents_processed=()

ensure_symlink() {
  local src
  src="$1"
  local dest
  dest="$2"
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

reload_agent() {
  local label
  label="$1"
  local plist_path
  plist_path="$2"
  local kickstart_needed
  kickstart_needed="$3"

  launchctl bootout gui/"$UID"/"$label" >/dev/null 2>&1 || true
  launchctl bootstrap gui/"$UID" "$plist_path"
  launchctl enable gui/"$UID"/"$label"
  if [ "$kickstart_needed" = "yes" ]; then
    launchctl kickstart -p gui/"$UID"/"$label"
  fi

  agents_processed+=("$label")
}

main() {
  if ! command -v battery >/dev/null 2>&1; then
    echo "WARNING: 'battery' CLI not found in PATH; installer will continue." >&2
    echo "PATH used for detection: $PATH" >&2
  fi

  ensure_dir "$HOME/.local/bin"
  ensure_dir "$HOME/Library/LaunchAgents"
  ensure_dir "$HOME/.config"
  ensure_dir "$HOME/.config/fish/functions"

  ensure_symlink "$REPO/bin/battery-mode.sh" "$HOME/.local/bin/battery-mode.sh"
  ensure_symlink "$REPO/bin/battery-auto-return.sh" "$HOME/.local/bin/battery-auto-return.sh"
  ensure_symlink "$REPO/bin/battery-maintenance.sh" "$HOME/.local/bin/battery-maintenance.sh"
  ensure_symlink "$REPO/bin/pmset-server.sh" "$HOME/.local/bin/pmset-server.sh"
  ensure_symlink "$REPO/bin/pmset-mobile.sh" "$HOME/.local/bin/pmset-mobile.sh"
  ensure_symlink "$REPO/launchd/com.local.battery.servermode.plist" "$HOME/Library/LaunchAgents/com.local.battery.servermode.plist"
  ensure_symlink "$REPO/launchd/com.local.battery.autoreturn.plist" "$HOME/Library/LaunchAgents/com.local.battery.autoreturn.plist"
  ensure_symlink "$REPO/launchd/com.local.battery.maintenance.plist" "$HOME/Library/LaunchAgents/com.local.battery.maintenance.plist"
  ensure_symlink "$REPO/fish/battery-mobile.fish" "$HOME/.config/fish/functions/battery-mobile.fish"
  ensure_symlink "$REPO/fish/battery-server.fish" "$HOME/.config/fish/functions/battery-server.fish"
  ensure_symlink "$REPO/fish/mode-home.fish" "$HOME/.config/fish/functions/mode-home.fish"
  ensure_symlink "$REPO/fish/mode-away.fish" "$HOME/.config/fish/functions/mode-away.fish"
  ensure_symlink "$REPO/config" "$HOME/.config/battery-automation"

  for script in "$REPO"/bin/*.sh; do
    [ -e "$script" ] || continue
    chmod +x "$script"
  done

  reload_agent "com.local.battery.servermode" "$HOME/Library/LaunchAgents/com.local.battery.servermode.plist" "yes"
  reload_agent "com.local.battery.autoreturn" "$HOME/Library/LaunchAgents/com.local.battery.autoreturn.plist" "yes"
  reload_agent "com.local.battery.maintenance" "$HOME/Library/LaunchAgents/com.local.battery.maintenance.plist" "no"

  echo "Symlinks created or repaired:"
  if [ ${#symlink_changes[@]} -eq 0 ]; then
    echo " - none (already correct)"
  else
    for item in "${symlink_changes[@]}"; do
      echo " - $item"
    done
  fi

  echo "LaunchAgents processed:"
  for label in "${agents_processed[@]}"; do
    echo " - $label"
  done

  echo "Fish commands available: battery-mobile, battery-server, mode-home, mode-away"
}

main "$@"
