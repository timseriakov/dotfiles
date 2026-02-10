#!/bin/bash
# mcpproxy launchd service control script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CORE_PLIST_NAME="com.mcpproxy.server.plist"
TRAY_PLIST_NAME="com.mcpproxy.tray.plist"

CORE_PLIST_SRC="$SCRIPT_DIR/$CORE_PLIST_NAME"
TRAY_PLIST_SRC="$SCRIPT_DIR/$TRAY_PLIST_NAME"

CORE_PLIST_DEST="$HOME/Library/LaunchAgents/$CORE_PLIST_NAME"
TRAY_PLIST_DEST="$HOME/Library/LaunchAgents/$TRAY_PLIST_NAME"

LOG_DIR="$HOME/Library/Logs/mcpproxy"

USER_UID=$(id -u)
DOMAIN="gui/$USER_UID"
SERVICE_CORE="${DOMAIN}/com.mcpproxy.server"
SERVICE_TRAY="${DOMAIN}/com.mcpproxy.tray"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

case "$1" in
    install)
        echo -e "${GREEN}Installing mcpproxy launchd services...${NC}"

        # Create log directory
        mkdir -p "$LOG_DIR"
        echo "Created log directory: $LOG_DIR"

        cp "$CORE_PLIST_SRC" "$CORE_PLIST_DEST"
        cp "$TRAY_PLIST_SRC" "$TRAY_PLIST_DEST"
        echo "Copied plists to:"
        echo "  $CORE_PLIST_DEST"
        echo "  $TRAY_PLIST_DEST"

        launchctl bootout "$SERVICE_TRAY" 2>/dev/null || true
        launchctl bootout "$SERVICE_CORE" 2>/dev/null || true
        launchctl bootstrap "$DOMAIN" "$TRAY_PLIST_DEST" 2>/dev/null || true
        launchctl kickstart -k "$SERVICE_TRAY" 2>/dev/null || true
        echo -e "${GREEN}Services installed and started!${NC}"

        # Show status
        sleep 2
        launchctl list | grep com.mcpproxy
        ;;

    uninstall)
        echo -e "${YELLOW}Uninstalling mcpproxy launchd services...${NC}"

        launchctl bootout "$SERVICE_TRAY" 2>/dev/null || true
        launchctl bootout "$SERVICE_CORE" 2>/dev/null || true

        rm -f "$TRAY_PLIST_DEST" "$CORE_PLIST_DEST"

        echo -e "${GREEN}Services uninstalled!${NC}"
        ;;

    start)
        echo -e "${GREEN}Starting mcpproxy services...${NC}"

        if [ ! -f "$TRAY_PLIST_DEST" ]; then
            echo -e "${YELLOW}Plists not installed. Run: $0 install${NC}"
            exit 1
        fi

        launchctl bootout "$SERVICE_CORE" 2>/dev/null || true

        if ! launchctl kickstart -k "$SERVICE_TRAY" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$TRAY_PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE_TRAY" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep com.mcpproxy
        ;;

    stop)
        echo -e "${YELLOW}Stopping mcpproxy services...${NC}"
        launchctl stop "$SERVICE_TRAY" 2>/dev/null || launchctl bootout "$SERVICE_TRAY" 2>/dev/null || true
        launchctl bootout "$SERVICE_CORE" 2>/dev/null || true
        killall mcpproxy 2>/dev/null || true
        ;;

    restart)
        echo -e "${YELLOW}Restarting mcpproxy services...${NC}"

        launchctl stop "$SERVICE_TRAY" 2>/dev/null || launchctl bootout "$SERVICE_TRAY" 2>/dev/null || true
        launchctl bootout "$SERVICE_CORE" 2>/dev/null || true
        killall mcpproxy 2>/dev/null || true
        sleep 1

        if ! launchctl kickstart -k "$SERVICE_TRAY" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$TRAY_PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE_TRAY" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep com.mcpproxy
        ;;

    status)
        echo -e "${GREEN}mcpproxy service status:${NC}"

        CORE_PIDS=$(pgrep -x mcpproxy 2>/dev/null || true)
        if [ -n "$CORE_PIDS" ]; then
            CORE_COUNT=$(echo "$CORE_PIDS" | wc -l | tr -d ' ')
            echo -e "${GREEN}✓ Core running ($CORE_COUNT process(es))${NC}"
            echo "  PIDs: $(echo "$CORE_PIDS" | tr '\n' ' ')"
            if curl -s http://localhost:8080/health 2>/dev/null | grep -q '"status":"ok"'; then
                echo -e "${GREEN}  Health: OK${NC}"
            else
                echo -e "${YELLOW}  Health: FAILED${NC}"
            fi
        else
            echo -e "${RED}✗ Core not running${NC}"
        fi

        TRAY_PID=$(launchctl list | awk '$3=="com.mcpproxy.tray" {print $1}')
        if [ "$TRAY_PID" != "-" ] && [ -n "$TRAY_PID" ]; then
            echo -e "${GREEN}✓ Tray running (PID: $TRAY_PID)${NC}"
            launchctl list | grep com.mcpproxy.tray
        else
            echo -e "${RED}✗ Tray not running${NC}"
            if launchctl list | grep -q com.mcpproxy.tray; then
                echo "  (Tray job loaded but not running)"
            fi
        fi

        echo -e "\n${GREEN}Process status:${NC}"
        ps aux | grep mcpproxy | grep -v grep

        echo -e "\n${GREEN}Socket status:${NC}"
        SOCKET_PATH="$HOME/.mcpproxy/mcpproxy.sock"
        if [ -e "$SOCKET_PATH" ]; then
            echo -e "${GREEN}✓ Socket exists${NC}"
            ls -la "$SOCKET_PATH"
        else
            echo -e "${RED}✗ Socket not found${NC}"
        fi
        ;;

    logs)
        echo -e "${GREEN}Recent logs (core stdout):${NC}"
        tail -50 "$LOG_DIR/stdout.log" 2>/dev/null || echo "No core stdout logs yet"

        echo -e "\n${GREEN}Recent errors (core stderr):${NC}"
        tail -50 "$LOG_DIR/stderr.log" 2>/dev/null || echo "No core stderr logs yet"

        echo -e "\n${GREEN}Recent logs (tray stdout):${NC}"
        tail -50 "$LOG_DIR/tray-stdout.log" 2>/dev/null || echo "No tray stdout logs yet"

        echo -e "\n${GREEN}Recent errors (tray stderr):${NC}"
        tail -50 "$LOG_DIR/tray-stderr.log" 2>/dev/null || echo "No tray stderr logs yet"
        ;;

    follow)
        echo -e "${GREEN}Following logs (Ctrl+C to stop)...${NC}"
        tail -f "$LOG_DIR/stdout.log" "$LOG_DIR/stderr.log" "$LOG_DIR/tray-stdout.log" "$LOG_DIR/tray-stderr.log"
        ;;

    *)
        echo "mcpproxy launchd services control"
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
