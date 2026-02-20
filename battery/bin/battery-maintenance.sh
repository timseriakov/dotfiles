#!/usr/bin/env bash
set -euo pipefail

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

TARGET_PERCENT=60
MAINTAIN_PERCENT=75
POLL_INTERVAL=120
SAFETY_TIMEOUT=$((6 * 3600))
LOCK_TIMEOUT=60

LOCK_DIR="$HOME/dev/dotfiles/battery/config/.lockdir"
STATE_FILE="$HOME/dev/dotfiles/battery/config/state.env"

LOG_PREFIX="[maintenance]"
LOCK_ACQUIRED=0
CLEANUP_NEEDED=0
discharge_pid=""

log_info() {
  echo "${LOG_PREFIX} $*"
}

log_err() {
  echo "${LOG_PREFIX} $*" >&2
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

write_state() {
  local mode="$1"
  local expires="$2"
  local tmp

  tmp=$(mktemp "${STATE_FILE}.tmp.XXXX") || {
    log_err "failed to create temp file for state write"
    return 1
  }

  if ! printf "MODE=%s\nEXPIRES_AT=%s\n" "$mode" "$expires" >"$tmp"; then
    log_err "failed to write state content"
    rm -f "$tmp"
    return 1
  fi

  if ! mv "$tmp" "$STATE_FILE"; then
    log_err "failed to update state file"
    rm -f "$tmp"
    return 1
  fi

  return 0
}

get_battery_percent() {
  local output

  if output=$(battery status 2>/dev/null); then
    if [[ $output =~ ([0-9]+)% ]]; then
      echo "${BASH_REMATCH[1]}"
      return 0
    fi
  fi

  if output=$(pmset -g batt 2>/dev/null); then
    if [[ $output =~ ([0-9]+)% ]]; then
      echo "${BASH_REMATCH[1]}"
      return 0
    fi
  fi

  return 1
}

cleanup() {
  local prev_status="${1:-0}"
  set +e
  local status=0

  if [[ -n "$discharge_pid" ]] && kill -0 "$discharge_pid" 2>/dev/null; then
    log_info "stopping discharge process (pid=$discharge_pid)"
    kill "$discharge_pid" 2>/dev/null || true
    wait "$discharge_pid" 2>/dev/null || true
  fi

  if (( CLEANUP_NEEDED )); then
    log_info "applying server maintenance cap (${MAINTAIN_PERCENT}%)"
    if ! battery maintain "$MAINTAIN_PERCENT"; then
      log_err "failed to apply battery maintain ${MAINTAIN_PERCENT}"
      status=1
    fi

    if ! write_state "server" ""; then
      log_err "failed to update state file"
      status=1
    fi
  fi

  release_lock

  if (( status != 0 )); then
    exit "$status"
  fi

  exit "$prev_status"
}

trap 'cleanup "$?"' EXIT INT TERM

main() {
  require_battery
  acquire_lock
  CLEANUP_NEEDED=1

  log_info "starting weekly maintenance: discharging to ${TARGET_PERCENT}%"
  battery discharge "$TARGET_PERCENT" &
  discharge_pid=$!

  local start_time now elapsed percent
  start_time=$(date +%s)

  while true; do
    now=$(date +%s)
    elapsed=$((now - start_time))

    if (( elapsed >= SAFETY_TIMEOUT )); then
      log_err "safety timeout reached after ${SAFETY_TIMEOUT}s"
      break
    fi

    if percent=$(get_battery_percent); then
      log_info "battery at ${percent}% (target ${TARGET_PERCENT}%)"
      if (( percent <= TARGET_PERCENT )); then
        log_info "target reached (${percent}%), stopping discharge loop"
        break
      fi
    else
      log_err "unable to determine battery percent; continuing"
    fi

    sleep "$POLL_INTERVAL"
  done

  log_info "maintenance loop complete; converging to server mode"
}

main "$@"
