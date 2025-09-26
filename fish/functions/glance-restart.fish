function glance-restart --description 'Restart Glance launchd-agent'
    set uid (id -u)
    command launchctl bootout gui/$uid ~/Library/LaunchAgents/app.glance.plist >/dev/null 2>&1; or true
    launchctl bootstrap gui/$uid ~/Library/LaunchAgents/app.glance.plist $argv
end
