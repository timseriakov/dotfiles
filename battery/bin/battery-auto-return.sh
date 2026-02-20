#!/usr/bin/env bash
set -euo pipefail

PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

STATE_FILE="$HOME/dev/dotfiles/battery/config/state.env"
CONFIG_FILE="$HOME/dev/dotfiles/battery/config/config.env"
MODE_SCRIPT="$HOME/dev/dotfiles/battery/bin/battery-mode.sh"

LOG_PREFIX="[autoreturn]"
SLEEP_INTERVAL=120

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

find_wifi_device() {
  networksetup -listallhardwareports | awk '/^Hardware Port: (Wi-Fi|AirPort)$/ {getline; if ($1=="Device:") {print $2; exit}}'
}

get_current_ssid() {
  local device
  device=$(find_wifi_device) || true
  if [[ -z "$device" ]]; then
    return 1
  fi

  local output
  if ! output=$(networksetup -getairportnetwork "$device" 2>/dev/null); then
    return 1
  fi

  case "$output" in
    "Current Wi-Fi Network: "*)
      echo "${output#Current Wi-Fi Network: }"
      return 0
      ;;
    "You are not associated"*)
      echo ""
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

require_battery

HOME_WIFI_SSID=""
if [[ -f "$CONFIG_FILE" ]]; then
  # shellcheck disable=SC1090
  source "$CONFIG_FILE"
fi

SSID_TRIGGER_ENABLED=1
if [[ -z "${HOME_WIFI_SSID:-}" ]]; then
  SSID_TRIGGER_ENABLED=0
  log_info "SSID trigger disabled (HOME_WIFI_SSID missing or empty)"
fi

last_ssid=""
ssid_initialized=0

while true; do
  if (( SSID_TRIGGER_ENABLED )); then
    current_ssid=""
    if current_ssid=$(get_current_ssid); then
      if (( ssid_initialized )) && [[ "$current_ssid" != "$last_ssid" ]]; then
        log_info "SSID changed: ${last_ssid:-<none>} -> ${current_ssid:-<none>}"
      fi
      last_ssid="$current_ssid"
      ssid_initialized=1
    fi
  fi

  MODE=""
  EXPIRES_AT=""
  if [[ -f "$STATE_FILE" ]]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE"
  fi

  if [[ "${MODE:-}" != "mobile" ]]; then
    sleep "$SLEEP_INTERVAL"
    continue
  fi

  now=$(date +%s)
  expired=0
  if [[ -n "${EXPIRES_AT:-}" && "${EXPIRES_AT}" =~ ^[0-9]+$ ]]; then
    if (( now >= EXPIRES_AT )); then
      expired=1
    fi
  fi

  wifi_match=0
  if (( SSID_TRIGGER_ENABLED && ssid_initialized )) && [[ "$last_ssid" == "$HOME_WIFI_SSID" ]]; then
    wifi_match=1
  fi

  if (( expired || wifi_match )); then
    reason=""
    if (( expired && wifi_match )); then
      reason="timer+ssid"
    elif (( expired )); then
      reason="timer"
    else
      reason="ssid"
    fi

    log_info "triggering server mode (reason=${reason})"
    if ! "$MODE_SCRIPT" server; then
      status=$?
      log_err "server mode attempt failed (exit ${status})"
    fi
  fi

  sleep "$SLEEP_INTERVAL"

done
