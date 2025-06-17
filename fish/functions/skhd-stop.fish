function skhd-stop --description 'Stop skhd via launchctl'
    echo "[skhd] Stopping service..."
    launchctl bootout gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.skhd.plist 2>/dev/null
    and echo "[skhd] Service stopped."
end
