function yabai-start --description 'Start yabai via launchctl'
    echo "[yabai] Starting service..."
    launchctl bootstrap gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.yabai.plist
    and echo "[yabai] Service started."
end
