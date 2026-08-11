#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_NAME="com.local.dayflow.omniroute.proxy.plist"
PLIST_SRC="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/Library/Logs/dayflow"

USER_UID=$(id -u)
DOMAIN="gui/$USER_UID"
LABEL="com.local.dayflow.omniroute.proxy"
SERVICE="$DOMAIN/$LABEL"

case "${1:-}" in
    install)
        mkdir -p "$LOG_DIR" "$HOME/Library/LaunchAgents"
        cp "$PLIST_SRC" "$PLIST_DEST"
        launchctl bootout "$SERVICE" 2>/dev/null || true
        launchctl bootstrap "$DOMAIN" "$PLIST_DEST"
        launchctl kickstart -k "$SERVICE"
        echo "Dayflow proxy installed and started"
        ;;

    uninstall)
        launchctl bootout "$SERVICE" 2>/dev/null || true
        rm -f "$PLIST_DEST"
        echo "Dayflow proxy uninstalled"
        ;;

    start)
        if [ ! -f "$PLIST_DEST" ]; then
            echo "Plist not installed. Run: $0 install" >&2
            exit 1
        fi
        launchctl kickstart -k "$SERVICE" 2>/dev/null || {
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST"
            launchctl kickstart -k "$SERVICE"
        }
        echo "Dayflow proxy started"
        ;;

    stop)
        launchctl bootout "$SERVICE" 2>/dev/null || true
        echo "Dayflow proxy stopped"
        ;;

    restart)
        launchctl kickstart -k "$SERVICE" 2>/dev/null || {
            launchctl bootstrap "$DOMAIN" "$PLIST_DEST"
            launchctl kickstart -k "$SERVICE"
        }
        echo "Dayflow proxy restarted"
        ;;

    status)
        launchctl print "$SERVICE" 2>/dev/null || {
            echo "Dayflow proxy is not loaded"
            exit 1
        }
        ;;

    logs)
        echo "--- stdout ---"
        tail -50 "$LOG_DIR/proxy-stdout.log" 2>/dev/null || true
        echo "--- stderr ---"
        tail -50 "$LOG_DIR/proxy-stderr.log" 2>/dev/null || true
        ;;

    *)
        echo "Usage: $0 {install|uninstall|start|stop|restart|status|logs}" >&2
        exit 1
        ;;
esac
