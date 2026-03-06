function try-rs
    # Pass flags/options directly to stdout without capturing
    for arg in $argv
        if string match -q -- '-*' $arg
            command try-rs $argv
            return
        end
    end

    # Captures the output of the binary (stdout) which is the "cd" command
    # The TUI is rendered on stderr, so it doesn't interfere.
    set command (command try-rs $argv | string collect)
    set command_status $status

    if test $command_status -eq 0; and test -n "$command"
        eval $command
    end
end

function try-rs-picker
    set -l picker_args --inline-picker

    if set -q TRY_RS_PICKER_HEIGHT
        if string match -qr '^[0-9]+$' -- "$TRY_RS_PICKER_HEIGHT"
            set picker_args $picker_args --inline-height $TRY_RS_PICKER_HEIGHT
        end
    end

    if status --is-interactive
        printf "\n"
    end

    set command (command try-rs $picker_args | string collect)
    set command_status $status

    if test $command_status -eq 0; and test -n "$command"
        eval $command
    end

    if status --is-interactive
        printf "\033[A"
        commandline -f repaint
    end
end


# try-rs tab completion for directory names
function __try_rs_get_tries_path
    # Check TRY_PATH environment variable first
    if set -q TRY_PATH
        echo $TRY_PATH
        return
    end
    
    # Try to read from config file
    set -l config_paths "$HOME/.config/try-rs/config.toml" "$HOME/.try-rs/config.toml"
    for config_path in $config_paths
        if test -f $config_path
            set -l tries_path (command grep -E '^\s*tries_path\s*=' $config_path 2>/dev/null | command sed 's/.*=\s*"\?\([^"]*\)"\?.*/\1/' | command sed "s|~|$HOME|" | string trim)
            if test -n "$tries_path"
                echo $tries_path
                return
            end
        end
    end
    
    # Default path
    echo "$HOME/work/tries"
end

function __try_rs_complete_directories
    set -l tries_path (__try_rs_get_tries_path)
    
    if test -d $tries_path
        # List directories in tries_path, filtering by current token
        command ls -1 $tries_path 2>/dev/null | while read -l dir
            if test -d "$tries_path/$dir"
                echo $dir
            end
        end
    end
end

complete -f -c try-rs -n '__fish_use_subcommand' -a '(__try_rs_complete_directories)' -d 'Try directory'
