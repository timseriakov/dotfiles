function yabai-stop --description 'Stop yabai via launchctl'
    echo "[yabai] Stopping service..."
    launchctl bootout gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.yabai.plist 2>/dev/null
    and echo "[yabai] Service stopped."
end
