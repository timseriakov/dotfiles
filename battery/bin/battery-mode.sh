#!/usr/bin/env bash
set -euo pipefail

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

LOCK_DIR="$HOME/dev/dotfiles/battery/config/.lockdir"
STATE_FILE="$HOME/dev/dotfiles/battery/config/state.env"
DEFAULT_MOBILE_HOURS=6
LOCK_TIMEOUT=60

LOCK_ACQUIRED=0
LOG_PREFIX="[battery-mode]"

log_info() {
  echo "${LOG_PREFIX} $*"
}

log_err() {
  echo "${LOG_PREFIX} $*" >&2
}

usage() {
  echo "Usage: $(basename "$0") server | mobile [hours] [--charge]" >&2
  exit 1
}

require_battery() {
  if ! command -v battery >/dev/null 2>&1; then
    log_err "battery CLI not found in PATH"
    exit 1
  fi
}

acquire_lock() {
  local waited=0
  while ! mkdir "$LOCK_DIR" 2>/dev/null; do
    if (( waited >= LOCK_TIMEOUT )); then
      log_err "failed to acquire lock at $LOCK_DIR after ${LOCK_TIMEOUT}s"
      exit 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  LOCK_ACQUIRED=1
}

release_lock() {
  if (( LOCK_ACQUIRED )); then
    rmdir "$LOCK_DIR" 2>/dev/null || true
    LOCK_ACQUIRED=0
  fi
}

trap release_lock EXIT INT TERM

write_state() {
  local mode="$1"
  local expires="$2"
  local tmp

  tmp=$(mktemp "${STATE_FILE}.tmp.XXXX") || {
    log_err "failed to create temp file for state write"
    exit 1
  }

  printf "MODE=%s\nEXPIRES_AT=%s\n" "$mode" "$expires" >"$tmp"
  mv "$tmp" "$STATE_FILE"
}

do_server() {
  LOG_PREFIX="[servermode]"
  acquire_lock
  log_info "applying server mode (maintain 75%)"
  battery maintain 75
  write_state "server" ""
  log_info "state updated: MODE=server EXPIRES_AT="
}

do_mobile() {
  LOG_PREFIX="[mobile]"
  local hours="$DEFAULT_MOBILE_HOURS"
  local charge=0

  if [[ $# -gt 0 && "$1" != "--charge" ]]; then
    hours="$1"
    shift
  fi

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --charge)
        charge=1
        ;;
      *)
        usage
        ;;
    esac
    shift
  done

  if ! [[ "$hours" =~ ^[0-9]+$ ]]; then
    log_err "hours must be an integer (got: $hours)"
    exit 1
  fi

  acquire_lock
  log_info "switching to mobile mode (hours=$hours, charge=${charge})"
  battery maintain stop
  if (( charge )); then
    log_info "charging to 100%"
    battery charge 100
  fi

  local expires_at
  expires_at=$(( $(date +%s) + hours * 3600 ))
  write_state "mobile" "$expires_at"
  log_info "state updated: MODE=mobile EXPIRES_AT=${expires_at}"
}

main() {
  if [[ $# -lt 1 ]]; then
    usage
  fi

  case "$1" in
    server)
      shift
      require_battery
      do_server "$@"
      ;;
    mobile)
      shift
      require_battery
      do_mobile "$@"
      ;;
    *)
      usage
      ;;
  esac
}

main "$@"
