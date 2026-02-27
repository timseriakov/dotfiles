#!/bin/bash
# Pinchtab launchd service control script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PLIST_NAME="com.local.pinchtab.server.plist"
PLIST_SRC="$SCRIPT_DIR/launchd/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

LOG_DIR="$HOME/Library/Logs/pinchtab"

USER_UID=$(id -u)
DOMAIN="gui/$USER_UID"
LABEL="com.local.pinchtab.server"
SERVICE="$DOMAIN/$LABEL"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
    install)
        echo -e "${GREEN}Installing pinchtab launchd service...${NC}"

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
        launchctl list | grep "$LABEL" || true
        ;;

    uninstall)
        echo -e "${YELLOW}Uninstalling pinchtab launchd service...${NC}"

        launchctl bootout "$SERVICE" 2>/dev/null || true
        rm -f "$PLIST_DEST"

        echo -e "${GREEN}Service uninstalled!${NC}"
        ;;

    start)
        echo -e "${GREEN}Starting pinchtab service...${NC}"

        if [ ! -f "$PLIST_DEST" ]; then
            echo -e "${YELLOW}Plist not installed. Run: $0 install${NC}"
            exit 1
        fi

        if ! launchctl kickstart -k "$SERVICE" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep "$LABEL" || true
        ;;

    stop)
        echo -e "${YELLOW}Stopping pinchtab service...${NC}"
        launchctl stop "$SERVICE" 2>/dev/null || launchctl bootout "$SERVICE" 2>/dev/null || true
        ;;

    restart)
        echo -e "${YELLOW}Restarting pinchtab service...${NC}"
        launchctl stop "$SERVICE" 2>/dev/null || launchctl bootout "$SERVICE" 2>/dev/null || true
        sleep 1

        if ! launchctl kickstart -k "$SERVICE" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep "$LABEL" || true
        ;;

    status)
        echo -e "${GREEN}pinchtab service status:${NC}"

        SERVICE_PID=$(launchctl list | awk '$3=="com.local.pinchtab.server" {print $1}')
        if [ "$SERVICE_PID" != "-" ] && [ -n "$SERVICE_PID" ]; then
            echo -e "${GREEN}✓ launchd job running (PID: $SERVICE_PID)${NC}"
        else
            echo -e "${RED}✗ launchd job not running${NC}"
            if launchctl list | grep -q "com.local.pinchtab.server"; then
                echo "  (Job loaded but not running)"
            fi
        fi

        PINCHTAB_PIDS=$(pgrep -f "pinchtab" 2>/dev/null || true)
        if [ -n "$PINCHTAB_PIDS" ]; then
            COUNT=$(echo "$PINCHTAB_PIDS" | wc -l | tr -d ' ')
            echo -e "${GREEN}✓ pinchtab process running ($COUNT process(es))${NC}"
            echo "  PIDs: $(echo "$PINCHTAB_PIDS" | tr '\n' ' ')"
        else
            echo -e "${RED}✗ pinchtab process not running${NC}"
        fi

        if command -v curl >/dev/null 2>&1; then
            if curl -fsS "http://127.0.0.1:9867/health" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ HTTP health endpoint responds on 127.0.0.1:9867${NC}"
            else
                echo -e "${YELLOW}• HTTP health endpoint not responding on 127.0.0.1:9867${NC}"
            fi
        fi
        ;;

    logs)
        echo -e "${GREEN}Recent logs (stdout):${NC}"
        tail -50 "$LOG_DIR/stdout.log" 2>/dev/null || echo "No stdout logs yet"

        echo -e "\n${GREEN}Recent errors (stderr):${NC}"
        tail -50 "$LOG_DIR/stderr.log" 2>/dev/null || echo "No stderr logs yet"
        ;;

    dashboard)
        PORT=${2:-9867}
        MONITOR_URL="http://127.0.0.1:${PORT}/dashboard"
        echo -e "${GREEN}Starting pinchtab dashboard on ${PORT}${NC}"
        echo -e "${YELLOW}Monitor URL: ${MONITOR_URL}${NC}"

        BRIDGE_MODE=dashboard BRIDGE_PORT="$PORT" pinchtab dashboard &
        sleep 1

        if curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Dashboard started successfully${NC}"
            echo -e "${YELLOW}Open in browser: ${MONITOR_URL}${NC}"
        else
            echo -e "${RED}✗ Failed to start dashboard${NC}"
            echo "Check logs: $0 logs"
        fi
        ;;

    *)
        echo "pinchtab launchd service control"
        echo ""
        echo "Usage: $0 {install|uninstall|start|stop|restart|status|logs|follow|dashboard [port]}"
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
        echo "  dashboard  - Start dashboard on optional port (default: 9867)"
        exit 1
        ;;

esac
