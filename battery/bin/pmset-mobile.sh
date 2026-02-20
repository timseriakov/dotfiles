#!/usr/bin/env bash
set -euo pipefail

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

REPO="$HOME/dev/dotfiles/battery"
BACKUP_FILE="$REPO/config/pmset.before-server.env"

KEYS=(
  sleep
  disksleep
  displaysleep
  standby
  autopoweroff
  hibernatemode
  tcpkeepalive
  powernap
  womp
)

log() {
  echo "[pmset-mobile] $*"
}

restore_from_backup() {
  if [[ ! -f "$BACKUP_FILE" ]]; then
    log "backup not found at $BACKUP_FILE"
    log "run pmset-server.sh first to capture current settings"
    exit 1
  fi

  # shellcheck disable=SC1090
  source "$BACKUP_FILE"

  for key in "${KEYS[@]}"; do
    b_var="B_${key}"
    c_var="C_${key}"
    b_value="${!b_var:-}"
    c_value="${!c_var:-}"

    if [[ -n "$b_value" ]]; then
      sudo pmset -b "$key" "$b_value"
    fi
    if [[ -n "$c_value" ]]; then
      sudo pmset -c "$key" "$c_value"
    fi
  done
}

main() {
  restore_from_backup
  log "restored pmset profile from $BACKUP_FILE"
  pmset -g custom
}

main "$@"
