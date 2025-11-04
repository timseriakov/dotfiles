#!/bin/bash
# Tor Toggle Script for qutebrowser
# Toggles Tor service and proxy configuration
# Usage: tor-toggle.sh [on|off|status|toggle]

set -euo pipefail

# Configuration
QUTEBROWSER_CONFIG="$HOME/dev/dotfiles/qutebrowser/config.py"
TOR_PROXY_LINE='c.content.proxy = "socks://localhost:9050/;direct://"'
HOMEBREW_PREFIX="/opt/homebrew"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
  echo -e "${2:-$NC}[$(date '+%H:%M:%S')] $1${NC}" >&2
}

# Check if Tor is installed
check_tor_installed() {
  if ! command -v "$HOMEBREW_PREFIX/bin/brew" >/dev/null 2>&1; then
    log " Homebrew not found at $HOMEBREW_PREFIX" "$RED"
    exit 1
  fi

  if ! "$HOMEBREW_PREFIX/bin/brew" list tor >/dev/null 2>&1; then
    log " Tor not installed via Homebrew. Install with: brew install tor" "$RED"
    exit 1
  fi
}

# Check if Tor service is running
is_tor_running() {
  "$HOMEBREW_PREFIX/bin/brew" services list | grep -q "tor.*started"
}

# Check if proxy is enabled in qutebrowser config
is_proxy_enabled() {
  if [[ ! -f "$QUTEBROWSER_CONFIG" ]]; then
    log " Qutebrowser config not found: $QUTEBROWSER_CONFIG" "$RED"
    exit 1
  fi

  # Check if the proxy configuration exists and is not commented
  grep -q '^c\.content\.proxy = "socks://localhost:9050/;direct://"' "$QUTEBROWSER_CONFIG"
}

# Start Tor service
start_tor() {
  log "Starting Tor service..." "$BLUE"
  if "$HOMEBREW_PREFIX/bin/brew" services start tor; then
    # Wait a moment for Tor to start
    sleep 2
    if is_tor_running; then
      log "Tor service started successfully" "$GREEN"
      return 0
    else
      log "Tor service failed to start" "$RED"
      return 1
    fi
  else
    log "Failed to start Tor service" "$RED"
    return 1
  fi
}

# Stop Tor service
stop_tor() {
  log "Stopping Tor service..." "$BLUE"
  if "$HOMEBREW_PREFIX/bin/brew" services stop tor; then
    log "Tor service stopped successfully" "$GREEN"
    return 0
  else
    log "Failed to stop Tor service" "$RED"
    return 1
  fi
}

# Enable proxy in qutebrowser config
enable_proxy() {
  log "Enabling Tor proxy for .onion sites..." "$BLUE"

  # Create backup
  cp "$QUTEBROWSER_CONFIG" "$QUTEBROWSER_CONFIG.backup.$(date +%s)"

  # Remove any existing proxy configuration
  sed -i '' '/^c\.content\.proxy/d' "$QUTEBROWSER_CONFIG"
  sed -i '' '/^config\.set.*content\.proxy/d' "$QUTEBROWSER_CONFIG"
  sed -i '' '/^# Proxy configuration:/d' "$QUTEBROWSER_CONFIG"

  # Add selective proxy configuration at the end of file
  echo "" >> "$QUTEBROWSER_CONFIG"
  echo "# Proxy configuration: .onion through Tor, others direct" >> "$QUTEBROWSER_CONFIG"
  echo 'c.content.proxy = "socks://localhost:9050/;direct://"' >> "$QUTEBROWSER_CONFIG"

  log "Proxy enabled: .onion sites through Tor, others direct" "$GREEN"
  log "Proxy configuration enabled" "$GREEN"
}

# Disable proxy in qutebrowser config
disable_proxy() {
  log "Disabling Tor proxy configuration..." "$BLUE"

  # Create backup
  cp "$QUTEBROWSER_CONFIG" "$QUTEBROWSER_CONFIG.backup.$(date +%s)"

  # Remove all proxy configuration lines
  sed -i '' '/^c\.content\.proxy/d' "$QUTEBROWSER_CONFIG"
  sed -i '' '/^config\.set.*content\.proxy/d' "$QUTEBROWSER_CONFIG"
  sed -i '' '/^# Proxy configuration: All traffic through Tor/d' "$QUTEBROWSER_CONFIG"

  log "Proxy configuration disabled (direct connections for all sites)" "$GREEN"
}

# Get current status
get_status() {
  local tor_status=" Stopped"
  local proxy_status=" Disabled"

  if is_tor_running; then
    tor_status=" Running"
  fi

  if is_proxy_enabled; then
    proxy_status=" Enabled"
  fi

  echo "Tor Status:"
  echo "  Service: $tor_status"
  echo "  Proxy:   $proxy_status"

  # Return 0 if both are enabled, 1 otherwise
  if is_tor_running && is_proxy_enabled; then
    return 0
  else
    return 1
  fi
}

# Turn Tor on (start service and enable proxy)
turn_on() {
  log "Turning Tor ON..." "$BLUE"

  local success=true

  if ! start_tor; then
    success=false
  fi

  enable_proxy

  if $success && is_tor_running && is_proxy_enabled; then
    log "Tor is now ON and ready for .onion sites!" "$GREEN"
    return 0
  else
    log " Tor setup completed with some issues. Check the logs above." "$YELLOW"
    return 1
  fi
}

# Turn Tor off (stop service and disable proxy)
turn_off() {
  log "Turning Tor OFF..." "$BLUE"

  stop_tor
  disable_proxy

  if ! is_tor_running && ! is_proxy_enabled; then
    log "Tor is now OFF" "$GREEN"
    return 0
  else
    log "Tor shutdown completed with some issues. Check the logs above." "$YELLOW"
    return 1
  fi
}

# Toggle Tor state
toggle() {
  if get_status >/dev/null 2>&1; then
    # Both service and proxy are on, turn off
    turn_off
  else
    # Either service or proxy is off, turn on
    turn_on
  fi
}

# Main function
main() {
  check_tor_installed

  case "${1:-toggle}" in
  "on" | "start" | "enable")
    turn_on
    ;;
  "off" | "stop" | "disable")
    turn_off
    ;;
  "status" | "check")
    get_status
    ;;
  "toggle")
    toggle
    ;;
  *)
    echo "Usage: $0 [on|off|status|toggle]"
    echo ""
    echo "Commands:"
    echo "  on/start/enable  - Turn Tor on (start service + enable proxy)"
    echo "  off/stop/disable - Turn Tor off (stop service + disable proxy)"
    echo "  status/check     - Show current Tor status"
    echo "  toggle           - Toggle Tor state (default)"
    exit 1
    ;;
  esac
}

# Run main function with all arguments
main "$@"
