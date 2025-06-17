function skhd-start --description 'Start skhd via launchctl'
    echo "[skhd] Starting service..."
    launchctl bootstrap gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.skhd.plist
    and echo "[skhd] Service started."
end
