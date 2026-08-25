#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

mkdir -p "$HOME/.fx" "$HOME/Library/LaunchAgents" "$HOME/Library/Logs"
rm -f "$HOME/.fx/settings.json"
install -m 600 settings.json "$HOME/.fx/settings.json"
ln -sfn "$PWD/com.local.fx.omniroute-proxy.plist" "$HOME/Library/LaunchAgents/com.local.fx.omniroute-proxy.plist"
launchctl bootout "gui/$(id -u)/com.local.fx.omniroute-proxy" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$HOME/Library/LaunchAgents/com.local.fx.omniroute-proxy.plist"
launchctl kickstart -k "gui/$(id -u)/com.local.fx.omniroute-proxy"

echo "fx config copied"
