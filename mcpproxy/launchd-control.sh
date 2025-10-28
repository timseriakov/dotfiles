#!/bin/bash
# mcpproxy launchd service control script

PLIST_NAME="com.mcpproxy.server.plist"
PLIST_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/Library/Logs/mcpproxy"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
    install)
        echo -e "${GREEN}Installing mcpproxy launchd service...${NC}"

        # Create log directory
        mkdir -p "$LOG_DIR"
        echo "Created log directory: $LOG_DIR"

        # Copy plist to LaunchAgents
        cp "$PLIST_SRC" "$PLIST_DEST"
        echo "Copied plist to: $PLIST_DEST"

        # Load service
        launchctl load "$PLIST_DEST"
        echo -e "${GREEN}Service installed and started!${NC}"

        # Show status
        sleep 2
        launchctl list | grep mcpproxy
        ;;

    uninstall)
        echo -e "${YELLOW}Uninstalling mcpproxy launchd service...${NC}"

        # Unload service
        launchctl unload "$PLIST_DEST" 2>/dev/null

        # Remove plist
        rm -f "$PLIST_DEST"

        echo -e "${GREEN}Service uninstalled!${NC}"
        ;;

    start)
        echo -e "${GREEN}Starting mcpproxy service...${NC}"
        launchctl load "$PLIST_DEST"
        sleep 1
        launchctl list | grep mcpproxy
        ;;

    stop)
        echo -e "${YELLOW}Stopping mcpproxy service...${NC}"
        launchctl unload "$PLIST_DEST"
        ;;

    restart)
        echo -e "${YELLOW}Restarting mcpproxy service...${NC}"
        launchctl unload "$PLIST_DEST" 2>/dev/null
        sleep 1
        launchctl load "$PLIST_DEST"
        sleep 1
        launchctl list | grep mcpproxy
        ;;

    status)
        echo -e "${GREEN}mcpproxy service status:${NC}"
        if launchctl list | grep -q mcpproxy; then
            echo -e "${GREEN}✓ Running${NC}"
            launchctl list | grep mcpproxy
        else
            echo -e "${RED}✗ Not running${NC}"
        fi

        echo -e "\n${GREEN}Process status:${NC}"
        ps aux | grep mcpproxy | grep -v grep

        echo -e "\n${GREEN}Socket status:${NC}"
        if [ -e "/Users/tim/dev/dotfiles/mcpproxy/mcpproxy.sock" ]; then
            echo -e "${GREEN}✓ Socket exists${NC}"
            ls -la /Users/tim/dev/dotfiles/mcpproxy/mcpproxy.sock
        else
            echo -e "${RED}✗ Socket not found${NC}"
        fi
        ;;

    logs)
        echo -e "${GREEN}Recent logs (stdout):${NC}"
        tail -50 "$LOG_DIR/stdout.log" 2>/dev/null || echo "No stdout logs yet"

        echo -e "\n${GREEN}Recent errors (stderr):${NC}"
        tail -50 "$LOG_DIR/stderr.log" 2>/dev/null || echo "No stderr logs yet"
        ;;

    follow)
        echo -e "${GREEN}Following logs (Ctrl+C to stop)...${NC}"
        tail -f "$LOG_DIR/stdout.log" "$LOG_DIR/stderr.log"
        ;;

    *)
        echo "mcpproxy launchd service control"
        echo ""
        echo "Usage: $0 {install|uninstall|start|stop|restart|status|logs|follow}"
        echo ""
        echo "Commands:"
        echo "  install    - Install and start the service"
        echo "  uninstall  - Stop and remove the service"
        echo "  start      - Start the service"
        echo "  stop       - Stop the service"
        echo "  restart    - Restart the service"
        echo "  status     - Show service status"
        echo "  logs       - Show recent logs"
        echo "  follow     - Follow logs in real-time"
        exit 1
        ;;
esac
