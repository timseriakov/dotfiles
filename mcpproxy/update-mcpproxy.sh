#!/usr/bin/env bash
# update-mcpproxy.sh - Safely update mcpproxy via Homebrew

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTROL_SCRIPT="$SCRIPT_DIR/launchd-control.sh"

msg() {
    echo -e "${BLUE}==>${NC} ${1}"
}

if [[ ! -f "$CONTROL_SCRIPT" ]]; then
    echo -e "${YELLOW}Error: launchd-control.sh not found in $SCRIPT_DIR${NC}"
    exit 1
fi

msg "Stopping mcpproxy services..."
bash "$CONTROL_SCRIPT" stop

msg "Updating Homebrew and upgrading mcpproxy..."
brew update || msg "Warning: brew update failed for some taps, continuing..."
if brew upgrade smart-mcp-proxy/mcpproxy/mcpproxy; then
    echo -e "${GREEN}✓ mcpproxy upgraded successfully${NC}"
else
    echo -e "${YELLOW}! No updates available or upgrade failed${NC}"
fi

msg "Starting mcpproxy services..."
bash "$CONTROL_SCRIPT" start

msg "Current version:"
mcpproxy --version

echo -e "\n${GREEN}Update process complete!${NC}"
