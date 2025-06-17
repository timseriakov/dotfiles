function yabai-restart --description 'Restart yabai via launchctl'
    echo "[yabai] Restarting service..."
    launchctl bootout gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.yabai.plist 2>/dev/null
    sleep 0.3
    launchctl bootstrap gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.yabai.plist
    and echo "[yabai] Restart complete."
end
