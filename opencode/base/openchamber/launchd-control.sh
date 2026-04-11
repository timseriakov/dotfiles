#!/bin/bash
# openchamber launchd service control script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PLIST_NAME="com.openchamber.web.plist"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"

LOG_DIR="$HOME/tmp/openchamber"

USER_UID=$(id -u)
DOMAIN="gui/$USER_UID"
SERVICE="${DOMAIN}/com.openchamber.web"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

kill_port_1911() {
    if command -v lsof >/dev/null 2>&1; then
        local pids
        pids=$(lsof -tiTCP:1911 -sTCP:LISTEN 2>/dev/null || true)
        if [ -n "$pids" ]; then
            echo "Killing existing listener(s) on port 1911: $pids"
            kill $pids 2>/dev/null || true
            sleep 1
            kill -9 $pids 2>/dev/null || true
        fi
    fi
}

case "$1" in
    install)
        echo -e "${GREEN}Installing openchamber launchd service...${NC}"

        mkdir -p "$LOG_DIR"
        echo "Created log directory: $LOG_DIR"

        cp "$PLIST_SRC" "$PLIST_DEST"
        echo "Copied plist to:"
        echo "  $PLIST_DEST"

        kill_port_1911

        launchctl bootout "$SERVICE" 2>/dev/null || true
        launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
        launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        echo -e "${GREEN}Service installed and started!${NC}"

        sleep 1
        launchctl list | grep com.openchamber.web || true
        ;;

    uninstall)
        echo -e "${YELLOW}Uninstalling openchamber launchd service...${NC}"

        launchctl bootout "$SERVICE" 2>/dev/null || true
        rm -f "$PLIST_DEST"
        kill_port_1911

        echo -e "${GREEN}Service uninstalled!${NC}"
        ;;

    start)
        echo -e "${GREEN}Starting openchamber service...${NC}"

        if [ ! -f "$PLIST_DEST" ]; then
            echo -e "${YELLOW}Plist not installed. Run: $0 install${NC}"
            exit 1
        fi

        kill_port_1911

        if ! launchctl kickstart -k "$SERVICE" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep com.openchamber.web || true
        ;;

    stop)
        echo -e "${YELLOW}Stopping openchamber service...${NC}"
        launchctl stop "$SERVICE" 2>/dev/null || launchctl bootout "$SERVICE" 2>/dev/null || true
        kill_port_1911
        ;;

    restart)
        echo -e "${YELLOW}Restarting openchamber service...${NC}"
        launchctl stop "$SERVICE" 2>/dev/null || launchctl bootout "$SERVICE" 2>/dev/null || true
        kill_port_1911
        sleep 1

        if ! launchctl kickstart -k "$SERVICE" 2>/dev/null; then
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST" 2>/dev/null || true
            launchctl kickstart -k "$SERVICE" 2>/dev/null || true
        fi

        sleep 1
        launchctl list | grep com.openchamber.web || true
        ;;

    status)
        echo -e "${GREEN}openchamber service status:${NC}"

        SERVICE_PID=$(launchctl list | awk '$3=="com.openchamber.web" {print $1}')
        if [ "$SERVICE_PID" != "-" ] && [ -n "$SERVICE_PID" ]; then
            echo -e "${GREEN}✓ launchd job running (PID: $SERVICE_PID)${NC}"
        else
            echo -e "${RED}✗ launchd job not running${NC}"
            if launchctl list | grep -q com.openchamber.web; then
                echo "  (Job loaded but not running)"
            fi
        fi

        if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:1911 -sTCP:LISTEN >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Port 1911 is listening${NC}"
            lsof -nP -iTCP:1911 -sTCP:LISTEN
        else
            echo -e "${RED}✗ Port 1911 is not listening${NC}"
        fi

        if command -v curl >/dev/null 2>&1; then
            if curl -fsS "http://127.0.0.1:1911" >/dev/null 2>&1; then
                echo -e "${GREEN}✓ HTTP endpoint responds on 127.0.0.1:1911${NC}"
            else
                echo -e "${YELLOW}• HTTP endpoint not responding on 127.0.0.1:1911${NC}"
            fi
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
        echo "openchamber launchd service control"
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
