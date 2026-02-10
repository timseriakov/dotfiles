#!/usr/bin/env bash
#
# fix-mcpproxy.sh - Clean zombie MCP processes and restart mcpproxy
#
# This script uses launchd-control.sh for proper service management with
# graceful shutdown verification and health checks. Also resets web UI API key.
#
# Usage:
#   fix-mcpproxy.sh              # Clean and restart (full workflow + reset API keys)
#   fix-mcpproxy.sh --status     # Show current status
#   fix-mcpproxy.sh --logs       # View service logs
#   fix-mcpproxy.sh --remove-api-key     # Reset web UI API key + clear config keys
#   fix-mcpproxy.sh --disable-atlassian  # Disable Atlassian to stop OAuth spam
#   fix-mcpproxy.sh --enable-atlassian   # Re-enable Atlassian
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Resolve script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resolve launchd-control.sh path (relative to script directory)
LAUNCHD_SCRIPT="$SCRIPT_DIR/launchd-control.sh"

# Resolve config file path with precedence
# 1. MCPPROXY_CONFIG_FILE environment variable
# 2. ~/.mcpproxy/mcp_config.json (brew install location)
# 3. ./mcp_config.json (script directory, for local dev)
# 4. Default to ~/.mcpproxy/mcp_config.json
if [ -n "${MCPPROXY_CONFIG_FILE:-}" ]; then
    CONFIG_FILE="$MCPPROXY_CONFIG_FILE"
elif [ -f "$HOME/.mcpproxy/mcp_config.json" ]; then
    CONFIG_FILE="$HOME/.mcpproxy/mcp_config.json"
elif [ -f "$SCRIPT_DIR/mcp_config.json" ]; then
    CONFIG_FILE="$SCRIPT_DIR/mcp_config.json"
else
    CONFIG_FILE="$HOME/.mcpproxy/mcp_config.json"
fi

# Print colored message
msg() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}

# Count processes matching pattern, with optional exclusions
count_processes() {
    local pattern=$1
    local exclude=${2:-""}

    if [ -n "$exclude" ]; then
        ps aux | grep -E "$pattern" | grep -v grep | grep -v -E "$exclude" | wc -l | tr -d ' '
    else
        ps aux | grep -E "$pattern" | grep -v grep | wc -l | tr -d ' '
    fi
}

# Show current status
show_status() {
    msg "$BLUE" "\n=== MCPProxy Status ==="

    # Check launchd service status if available
    if [ -f "$LAUNCHD_SCRIPT" ]; then
        local service_status=$(launchctl list | grep mcpproxy || echo "")
        if [ -n "$service_status" ]; then
            msg "$GREEN" "✓ Launchd service registered"
            echo "  $service_status"
        else
            msg "$YELLOW" "⚠ Launchd service not registered"
            msg "$BLUE" "  (Install with: $LAUNCHD_SCRIPT install)"
        fi
        echo ""
    fi

    # Check if mcpproxy is running
    local mcpproxy_count=$(count_processes "mcpproxy")
    if [ "$mcpproxy_count" -gt 0 ]; then
        msg "$GREEN" "✓ MCPProxy running ($mcpproxy_count processes)"

        # Check health endpoint
        if curl -s http://localhost:8080/health | grep -q '"status":"ok"'; then
            msg "$GREEN" "✓ Health check: OK"
        else
            msg "$RED" "✗ Health check: FAILED"
        fi
    else
        msg "$RED" "✗ MCPProxy not running"
    fi

    # Count MCP server processes (only final processes, not parent shells)
    echo ""
    msg "$BLUE" "=== MCP Server Processes ==="

    local servers=(
        "node.*mcp-remote.*atlassian:Atlassian"
        "npm.*morph-fast-apply:Morphllm"
        "node.*sequential-thinking:Sequential"
        "python.*serena start-mcp:Serena"
        "perplexity-mcp:Perplexity"
        "node.*mcp-graphql:SQVR GraphQL"
        "node.*mcp-gitlab:GitLab"
    )

    for server in "${servers[@]}"; do
        IFS=: read -r pattern name <<< "$server"

        # Special case for perplexity: exclude fish wrapper processes
        if [ "$name" = "Perplexity" ]; then
            local count=$(count_processes "$pattern" "fish")
        else
            local count=$(count_processes "$pattern")
        fi

        if [ "$count" -gt 0 ]; then
            if [ "$count" -eq 1 ]; then
                msg "$GREEN" "✓ $name: $count process"
            elif [ "$count" -le 2 ]; then
                msg "$GREEN" "✓ $name: $count processes (normal)"
            else
                msg "$YELLOW" "⚠ $name: $count processes (duplicates detected!)"
            fi
        else
            msg "$YELLOW" "  $name: 0 processes"
        fi
    done
}

# Kill zombie processes (targets only final processes, not parent shells)
kill_zombies() {
    msg "$YELLOW" "\n=== Killing Zombie Processes ==="

    local patterns=(
        "mcp-remote.*atlassian"
        "morph-fast-apply"
        "sequential-thinking"
        "serena start-mcp"
        "perplexity-mcp"
        "mcp-graphql"
        "mcp-gitlab"
    )

    local total_killed=0

    for pattern in "${patterns[@]}"; do
        local pids=$(ps aux | grep -E "$pattern" | grep -v grep | awk '{print $2}')
        if [ -n "$pids" ]; then
            local count=$(echo "$pids" | wc -l | tr -d ' ')
            msg "$YELLOW" "Killing $count processes matching: $pattern"
            echo "$pids" | xargs kill -9 2>/dev/null || true
            total_killed=$((total_killed + count))
        fi
    done

    if [ "$total_killed" -gt 0 ]; then
        msg "$GREEN" "✓ Killed $total_killed zombie processes"

        # Wait and verify they're actually dead
        sleep 2

        local remaining=0
        for pattern in "${patterns[@]}"; do
            local count=$(count_processes "$pattern")
            remaining=$((remaining + count))
        done

        if [ "$remaining" -gt 0 ]; then
            msg "$YELLOW" "⚠ Warning: $remaining zombie processes still running"
            msg "$YELLOW" "  They may restart when MCPProxy starts"
        else
            msg "$GREEN" "✓ All zombie processes confirmed dead"
        fi
    else
        msg "$GREEN" "✓ No zombie processes found"
    fi
}

# Restart mcpproxy using launchd with verification
restart_mcpproxy() {
    msg "$YELLOW" "\n=== Restarting MCPProxy ==="

    # Check if launchd-control.sh exists
    if [ ! -f "$LAUNCHD_SCRIPT" ]; then
        msg "$RED" "✗ launchd-control.sh not found at: $LAUNCHD_SCRIPT"
        msg "$YELLOW" "  Falling back to direct restart..."

        # Fallback to direct control
        if pgrep -f "mcpproxy" > /dev/null; then
            msg "$YELLOW" "Stopping mcpproxy..."
            killall mcpproxy 2>/dev/null || true
            sleep 2
        fi

        msg "$YELLOW" "Starting mcpproxy..."
        open -a mcpproxy
        sleep 5
    else
        # Step 1: Stop the service
        msg "$YELLOW" "Stopping mcpproxy service..."
        "$LAUNCHD_SCRIPT" stop >/dev/null 2>&1

        # Step 2: Verify it actually stopped
        local max_attempts=10
        local attempt=0
        while pgrep -f "mcpproxy" > /dev/null && [ $attempt -lt $max_attempts ]; do
            attempt=$((attempt + 1))
            msg "$YELLOW" "  Waiting for mcpproxy to stop (attempt $attempt/$max_attempts)..."
            sleep 1
        done

        if pgrep -f "mcpproxy" > /dev/null; then
            msg "$RED" "✗ Failed to stop mcpproxy gracefully"
            msg "$YELLOW" "  Force killing remaining processes..."
            killall -9 mcpproxy 2>/dev/null || true
            sleep 2
        else
            msg "$GREEN" "✓ MCPProxy stopped successfully"
        fi

        # Step 3: Start the service
        msg "$YELLOW" "Starting mcpproxy service..."
        "$LAUNCHD_SCRIPT" start >/dev/null 2>&1

        # Wait for startup
        sleep 3
    fi

    # Step 4: Verify it's running and healthy
    local max_health_checks=5
    local check=0
    while [ $check -lt $max_health_checks ]; do
        check=$((check + 1))

        if curl -s http://localhost:8080/health | grep -q '"status":"ok"'; then
            msg "$GREEN" "✓ MCPProxy restarted successfully"
            return 0
        fi

        if [ $check -lt $max_health_checks ]; then
            msg "$YELLOW" "  Health check $check/$max_health_checks failed, retrying..."
            sleep 2
        fi
    done

    msg "$RED" "✗ MCPProxy failed to start properly"
    msg "$YELLOW" "  Try running: $LAUNCHD_SCRIPT logs"
    return 1
}

# Clear API key from config (for git commits)
remove_api_key() {
    if [ ! -f "$CONFIG_FILE" ]; then
        msg "$RED" "✗ Config file not found: $CONFIG_FILE"
        return 1
    fi

    # Check if api_key exists with non-empty value
    local current_key=$(grep '"api_key":' "$CONFIG_FILE" | grep -o '"api_key": *"[^"]*"' | sed 's/"api_key": *"\(.*\)"/\1/')

    if [ -z "$current_key" ]; then
        msg "$GREEN" "✓ API key is already empty (config clean)"
        return 0
    fi

    msg "$YELLOW" "Clearing API key from config..."

    # Create backup
    cp "$CONFIG_FILE" "$CONFIG_FILE.backup"

    # Replace api_key value with empty string (keep the field)
    sed -i '' 's/"api_key": *"[^"]*"/"api_key": ""/' "$CONFIG_FILE"

    msg "$GREEN" "✓ API key cleared from config (set to empty string)"
    msg "$BLUE" "  (Backup saved to: $CONFIG_FILE.backup)"
}

# Reset web UI API key by renaming config.db
reset_web_api_key() {
    local config_db="$HOME/.mcpproxy/config.db"

    if [ ! -f "$config_db" ]; then
        msg "$YELLOW" "⚠ config.db not found, skipping web API key reset"
        return 0
    fi

    msg "$YELLOW" "Resetting web UI API key..."

    # Create timestamped backup
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="${config_db}.backup_${timestamp}"

    mv "$config_db" "$backup_name"

    msg "$GREEN" "✓ Web API key will be regenerated on next start"
    msg "$BLUE" "  (Database backed up to: $backup_name)"
    msg "$BLUE" "  (New API key will appear in logs on startup)"
}

# Toggle Atlassian in config
toggle_atlassian() {
    local action=$1  # "enable" or "disable"

    if [ ! -f "$CONFIG_FILE" ]; then
        msg "$RED" "✗ Config file not found: $CONFIG_FILE"
        return 1
    fi

    local current_status=$(grep -A 8 '"name": "atlassian"' "$CONFIG_FILE" | grep '"enabled":' | grep -o 'true\|false')

    if [ "$action" = "enable" ]; then
        if [ "$current_status" = "true" ]; then
            msg "$YELLOW" "⚠ Atlassian is already enabled"
            return 0
        fi

        msg "$YELLOW" "Enabling Atlassian..."
        sed -i '' '/"name": "atlassian"/,/"enabled":/ s/"enabled": false/"enabled": true/' "$CONFIG_FILE"
        msg "$GREEN" "✓ Atlassian enabled in config"

    elif [ "$action" = "disable" ]; then
        if [ "$current_status" = "false" ]; then
            msg "$YELLOW" "⚠ Atlassian is already disabled"
            return 0
        fi

        msg "$YELLOW" "Disabling Atlassian to stop OAuth spam..."
        sed -i '' '/"name": "atlassian"/,/"enabled":/ s/"enabled": true/"enabled": false/' "$CONFIG_FILE"
        msg "$GREEN" "✓ Atlassian disabled in config"
    fi
}

# Main function
main() {
    local action="${1:-clean}"

    case "$action" in
        --status|-s)
            show_status
            ;;

        --remove-api-key)
            remove_api_key
            reset_web_api_key
            ;;

        --enable-atlassian)
            toggle_atlassian "enable"
            restart_mcpproxy
            show_status
            ;;

        --disable-atlassian)
            toggle_atlassian "disable"
            kill_zombies
            restart_mcpproxy
            show_status
            ;;

        --logs|-l)
            if [ -f "$LAUNCHD_SCRIPT" ]; then
                "$LAUNCHD_SCRIPT" logs
            else
                msg "$RED" "✗ launchd-control.sh not found at: $LAUNCHD_SCRIPT"
                msg "$YELLOW" "  Cannot access logs"
            fi
            ;;

        --help|-h)
            msg "$BLUE" "Usage: fix-mcpproxy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (no args)              Clean zombie processes, restart mcpproxy, reset all API keys"
            echo "  --status, -s           Show current status only"
            echo "  --logs, -l             Show mcpproxy service logs (via launchd)"
            echo "  --remove-api-key       Reset web UI API key + clear config API keys"
            echo "  --disable-atlassian    Disable Atlassian to stop OAuth spam"
            echo "  --enable-atlassian     Re-enable Atlassian"
            echo "  --help, -h             Show this help"
            echo ""
            echo "Note: This script uses launchd-control.sh for service management"
            echo "      Web UI API key is shown in logs after restart"
            ;;

        *)
            msg "$BLUE" "🔧 MCPProxy Cleanup & Restart"
            msg "$BLUE" "=============================="

            show_status

            # Stop MCPProxy FIRST, then kill zombies, then restart
            # This prevents MCPProxy from recreating zombie processes
            msg "$YELLOW" "\n=== Stopping MCPProxy Before Cleanup ==="
            if [ -f "$LAUNCHD_SCRIPT" ]; then
                "$LAUNCHD_SCRIPT" stop >/dev/null 2>&1
            else
                killall mcpproxy 2>/dev/null || true
            fi
            sleep 2

            kill_zombies

            # Reset web API key and clean config
            remove_api_key
            reset_web_api_key

            # Now restart with clean slate
            msg "$YELLOW" "\n=== Starting MCPProxy with Clean State ==="
            if [ -f "$LAUNCHD_SCRIPT" ]; then
                "$LAUNCHD_SCRIPT" start >/dev/null 2>&1
            else
                open -a mcpproxy
            fi
            sleep 5

            # Verify health
            if curl -s http://localhost:8080/health | grep -q '"status":"ok"'; then
                msg "$GREEN" "✓ MCPProxy started successfully"
            else
                msg "$RED" "✗ MCPProxy failed to start"
                msg "$YELLOW" "  Try running: $LAUNCHD_SCRIPT logs"
            fi

            msg "$GREEN" "\n✅ Done! MCPProxy cleaned, restarted, API keys reset"
            echo ""
            msg "$BLUE" "  📌 Web UI Access - extracting new API key from logs..."
            sleep 2

            # Extract new API key from logs
            local api_key=$(grep -A 1 "API key was auto-generated" ~/Library/Logs/mcpproxy/stderr.log 2>/dev/null | tail -2 | grep -o '"api_key": *"[^"]*"' | sed 's/"api_key": *"\(.*\)"/\1/')
            local web_url=$(grep -A 1 "API key was auto-generated" ~/Library/Logs/mcpproxy/stderr.log 2>/dev/null | tail -2 | grep -o '"web_ui_url": *"[^"]*"' | sed 's/"web_ui_url": *"\(.*\)"/\1/')

            if [ -n "$api_key" ]; then
                msg "$GREEN" "     ✓ New API Key: $api_key"
                if [ -n "$web_url" ]; then
                    msg "$BLUE" "     Direct URL: $web_url"
                fi
            else
                msg "$YELLOW" "     ⚠ Could not extract API key from logs"
                msg "$BLUE" "     Check logs manually: ./launchd-control.sh logs"
            fi
            msg "$BLUE" "\nWaiting 3 seconds for MCP servers to initialize..."
            sleep 3
            show_status
            ;;
    esac
}

main "$@"
