#!/usr/bin/env bash
#
# fix-mcpproxy.sh - Clean zombie MCP processes and restart mcpproxy
#
# Usage:
#   fix-mcpproxy.sh              # Clean and restart
#   fix-mcpproxy.sh --disable-atlassian  # Also disable Atlassian to stop OAuth spam
#   fix-mcpproxy.sh --enable-atlassian   # Re-enable Atlassian
#   fix-mcpproxy.sh --status     # Just show current status
#

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONFIG_FILE="$HOME/dev/dotfiles/mcpproxy/mcp_config.json"

# Print colored message
msg() {
    local color=$1
    shift
    echo -e "${color}$*${NC}"
}

# Count processes matching pattern
count_processes() {
    ps aux | grep -E "$1" | grep -v grep | wc -l | tr -d ' '
}

# Show current status
show_status() {
    msg "$BLUE" "\n=== MCPProxy Status ==="

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

    # Count MCP server processes
    echo ""
    msg "$BLUE" "=== MCP Server Processes ==="

    local servers=(
        "mcp-remote.*atlassian:Atlassian"
        "morphllm|@morph-llm:Morphllm"
        "sequential-thinking:Sequential"
        "serena start-mcp:Serena"
        "perplexity-mcp:Perplexity"
        "sqvr-graphql|mcp-graphql:SQVR GraphQL"
        "mcp-gitlab:GitLab"
    )

    for server in "${servers[@]}"; do
        IFS=: read -r pattern name <<< "$server"
        local count=$(count_processes "$pattern")
        if [ "$count" -gt 0 ]; then
            if [ "$count" -eq 1 ]; then
                msg "$GREEN" "✓ $name: $count process"
            else
                msg "$YELLOW" "⚠ $name: $count processes (duplicates detected!)"
            fi
        else
            msg "$YELLOW" "  $name: 0 processes"
        fi
    done
}

# Kill zombie processes
kill_zombies() {
    msg "$YELLOW" "\n=== Killing Zombie Processes ==="

    local patterns=(
        "mcp-remote.*atlassian"
        "morphllm|@morph-llm"
        "sequential-thinking"
        "serena start-mcp"
        "perplexity-mcp"
        "sqvr-graphql|mcp-graphql"
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
    else
        msg "$GREEN" "✓ No zombie processes found"
    fi
}

# Restart mcpproxy
restart_mcpproxy() {
    msg "$YELLOW" "\n=== Restarting MCPProxy ==="

    # Kill existing mcpproxy
    if pgrep -f "mcpproxy" > /dev/null; then
        msg "$YELLOW" "Stopping mcpproxy..."
        killall mcpproxy 2>/dev/null || true
        sleep 2
    fi

    # Start mcpproxy
    msg "$YELLOW" "Starting mcpproxy..."
    open -a mcpproxy

    # Wait for startup
    sleep 5

    # Verify it's running
    if curl -s http://localhost:8080/health | grep -q '"status":"ok"'; then
        msg "$GREEN" "✓ MCPProxy restarted successfully"
    else
        msg "$RED" "✗ MCPProxy failed to start properly"
        return 1
    fi
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

        --help|-h)
            msg "$BLUE" "Usage: fix-mcpproxy.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  (no args)              Clean zombie processes, restart mcpproxy, remove API key"
            echo "  --status, -s           Show current status only"
            echo "  --remove-api-key       Remove API key from config (for git commits)"
            echo "  --disable-atlassian    Disable Atlassian to stop OAuth spam"
            echo "  --enable-atlassian     Re-enable Atlassian"
            echo "  --help, -h             Show this help"
            ;;

        *)
            msg "$BLUE" "🔧 MCPProxy Cleanup & Restart"
            msg "$BLUE" "=============================="

            show_status
            kill_zombies
            restart_mcpproxy
            remove_api_key

            msg "$GREEN" "\n✅ Done! MCPProxy cleaned, restarted, and API key removed"
            show_status
            ;;
    esac
}

main "$@"
