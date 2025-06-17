function skhd-restart --description 'Restart skhd using launchctl'
    echo "[skhd] Unloading..."
    launchctl bootout gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.skhd.plist 2>/dev/null
    echo "[skhd] Loading..."
    launchctl bootstrap gui/(id -u) ~/Library/LaunchAgents/com.koekeishiya.skhd.plist
    echo "[skhd] Restart complete."
end
