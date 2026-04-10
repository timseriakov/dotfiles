# youtube-music-cli fish completion
# Save to: ~/.config/fish/completions/ymc.fish
#   ymc completions fish > ~/.config/fish/completions/ymc.fish

# Disable file completions by default
complete -c ymc -f

# Main commands
complete -c ymc -n '__fish_use_subcommand' -f -a 'play' -d 'Play a track by ID or YouTube URL'
complete -c ymc -n '__fish_use_subcommand' -f -a 'search' -d 'Search for tracks'
complete -c ymc -n '__fish_use_subcommand' -f -a 'playlist' -d 'Play a playlist by ID'
complete -c ymc -n '__fish_use_subcommand' -f -a 'suggestions' -d 'Show music suggestions'
complete -c ymc -n '__fish_use_subcommand' -f -a 'pause' -d 'Pause playback'
complete -c ymc -n '__fish_use_subcommand' -f -a 'resume' -d 'Resume playback'
complete -c ymc -n '__fish_use_subcommand' -f -a 'skip' -d 'Skip to next track'
complete -c ymc -n '__fish_use_subcommand' -f -a 'back' -d 'Go to previous track'
complete -c ymc -n '__fish_use_subcommand' -f -a 'plugins' -d 'Manage plugins'
complete -c ymc -n '__fish_use_subcommand' -f -a 'import' -d 'Import playlists from Spotify or YouTube'
complete -c ymc -n '__fish_use_subcommand' -f -a 'completions' -d 'Generate shell completion scripts'

# Plugins subcommands
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'list'
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'install'
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'remove'
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'uninstall'
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'update'
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'enable'
complete -c ymc -n '__fish_seen_subcommand_from plugins' -f -a 'disable'

# Import subcommands
complete -c ymc -n '__fish_seen_subcommand_from import' -f -a 'spotify'
complete -c ymc -n '__fish_seen_subcommand_from import' -f -a 'youtube'

# Completions subcommands
complete -c ymc -n '__fish_seen_subcommand_from completions' -f -a 'bash'
complete -c ymc -n '__fish_seen_subcommand_from completions' -f -a 'zsh'
complete -c ymc -n '__fish_seen_subcommand_from completions' -f -a 'powershell'
complete -c ymc -n '__fish_seen_subcommand_from completions' -f -a 'fish'

# Flags
complete -c ymc -l theme -s t -d 'Theme to use' -r -a 'dark light midnight matrix'
complete -c ymc -l volume -s v -d 'Initial volume (0-100)' -r
complete -c ymc -l shuffle -s s -d 'Enable shuffle mode'
complete -c ymc -l repeat -s r -d 'Repeat mode' -r -a 'off all one'
complete -c ymc -l headless -d 'Run without TUI'
complete -c ymc -l web -d 'Enable web UI server'
complete -c ymc -l web-host -d 'Web server host' -r
complete -c ymc -l web-port -d 'Web server port' -r
complete -c ymc -l web-only -d 'Run web server without CLI UI'
complete -c ymc -l web-auth -d 'Authentication token for web server' -r
complete -c ymc -l name -d 'Custom name for imported playlist' -r
complete -c ymc -l help -s h -d 'Show help'
complete -c ymc -l version -d 'Show version'

# Also register for youtube-music-cli
complete -c youtube-music-cli -w ymc

