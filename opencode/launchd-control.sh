#!/bin/bash
# opencode launchd service control script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PLIST_NAME="com.opencode.serve.plist"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

LOG_DIR="$HOME/tmp/opencode"

USER_UID=$(id -u)
DOMAIN="gui/$USER_UID"
SERVICE="${DOMAIN}/com.opencode.serve"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
    install)
        echo -e "${GREEN}Installing opencode launchd service...${NC}"

        mkdir -p "$LOG_DIR"
        echo "Created log directory: $LOG_DIR"

        cp "$PLIST_SRC" "$PLIST_DEST"
        echo "Copied plist to:"
        echo "  $PLIST_DEST"

        launchctl bootout "$SERVICE" 2>/dev/null || true
        launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
        launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        echo -e "${GREEN}Service installed and started!${NC}"

        sleep 1
        launchctl list | grep com.opencode.serve || true
        ;;

    uninstall)
        echo -e "${YELLOW}Uninstalling opencode launchd service...${NC}"

        launchctl bootout "$SERVICE" 2>/dev/null || true
        rm -f "$PLIST_DEST"

        echo -e "${GREEN}Service uninstalled!${NC}"
        ;;

    start)
        echo -e "${GREEN}Starting opencode service...${NC}"

        if [ ! -f "$PLIST_DEST" ]; then
            echo -e "${YELLOW}Plist not installed. Run: $0 install${NC}"
            exit 1
        fi

        if ! launchctl kickstart -k "$SERVICE" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep com.opencode.serve || true
        ;;

    stop)
        echo -e "${YELLOW}Stopping opencode service...${NC}"
        launchctl stop "$SERVICE" 2>/dev/null || launchctl bootout "$SERVICE" 2>/dev/null || true
        pkill -f "opencode serve" 2>/dev/null || true
        ;;

    restart)
        echo -e "${YELLOW}Restarting opencode service...${NC}"
        launchctl stop "$SERVICE" 2>/dev/null || launchctl bootout "$SERVICE" 2>/dev/null || true
        pkill -f "opencode serve" 2>/dev/null || true
        sleep 1

        if ! launchctl kickstart -k "$SERVICE" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep com.opencode.serve || true
        ;;

    status)
        echo -e "${GREEN}opencode service status:${NC}"

        SERVICE_PID=$(launchctl list | awk '$3=="com.opencode.serve" {print $1}')
        if [ "$SERVICE_PID" != "-" ] && [ -n "$SERVICE_PID" ]; then
            echo -e "${GREEN}✓ launchd job running (PID: $SERVICE_PID)${NC}"
        else
            echo -e "${RED}✗ launchd job not running${NC}"
            if launchctl list | grep -q com.opencode.serve; then
                echo "  (Job loaded but not running)"
            fi
        fi

        OPCODE_PIDS=$(pgrep -f "opencode serve" 2>/dev/null || true)
        if [ -n "$OPCODE_PIDS" ]; then
            COUNT=$(echo "$OPCODE_PIDS" | wc -l | tr -d ' ')
            echo -e "${GREEN}✓ opencode serve process running ($COUNT process(es))${NC}"
            echo "  PIDs: $(echo "$OPCODE_PIDS" | tr '\n' ' ')"
        else
            echo -e "${RED}✗ opencode serve process not running${NC}"
        fi

        if command -v curl >/dev/null 2>&1; then
            if curl -fsS "http://127.0.0.1:4096" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ HTTP endpoint responds on 127.0.0.1:4096${NC}"
            else
                echo -e "${YELLOW}• HTTP endpoint not responding on 127.0.0.1:4096${NC}"
            fi
        fi
        ;;

    logs)
        echo -e "${GREEN}Recent logs (stdout):${NC}"
        tail -50 "$LOG_DIR/serve-stdout.log" 2>/dev/null || echo "No stdout logs yet"

        echo -e "\n${GREEN}Recent errors (stderr):${NC}"
        tail -50 "$LOG_DIR/serve-stderr.log" 2>/dev/null || echo "No stderr logs yet"
        ;;

    follow)
        echo -e "${GREEN}Following logs (Ctrl+C to stop)...${NC}"
        tail -f "$LOG_DIR/serve-stdout.log" "$LOG_DIR/serve-stderr.log"
        ;;

    *)
        echo "opencode launchd service control"
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
