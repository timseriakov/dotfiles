function glance-restart --wraps='set uid (id -u) && launchctl bootout gui/$uid ~/Library/LaunchAgents/app.glance.plist && launchctl bootstrap gui/$uid ~/Library/LaunchAgents/app.glance.plist' --description 'alias glance-restart set uid (id -u) && launchctl bootout gui/$uid ~/Library/LaunchAgents/app.glance.plist && launchctl bootstrap gui/$uid ~/Library/LaunchAgents/app.glance.plist'
  set uid (id -u) && launchctl bootout gui/$uid ~/Library/LaunchAgents/app.glance.plist && launchctl bootstrap gui/$uid ~/Library/LaunchAgents/app.glance.plist $argv
        
end
