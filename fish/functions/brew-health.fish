#!/usr/bin/env fish

# Usage: brew-health [options]
# Options:
#   --help      Show help message
#   --force     Run maintenance regardless of last run time
#   --cleanup   Remove any stale lock file before running
#   --dry-run   Show what would be done without making changes
#   --status    Show when the script was last run
#
# This script performs Homebrew maintenance tasks including:
# - Updating Homebrew
# - Upgrading outdated packages
# - Cleaning up unused packages
# - Upgrading outdated casks (applications)
#
# The script will only run if it hasn't been run in the last 7 days,
# unless the --force option is used.

function brew-health -d "Perform Homebrew maintenance tasks"
    # Lock file to prevent concurrent runs
    set LOCKFILE /tmp/(basename (status current-command)).lock

    # Timestamp storage file
    set LAST_RUN_FILE $HOME/.last_brew_health_run

    # Current time in seconds since epoch
    set NOW (date +%s)

    # How many seconds in 7 days
    set SEVEN_DAYS (math "7 * 24 * 60 * 60")

    # Parse arguments
    argparse --ignore-unknown \
        'h/help' \
        'f/force' \
        'c/cleanup' \
        'd/dry-run' \
        's/status' \
        -- $argv
    or return 1

    # Show help
    if set -q _flag_help
        echo "Usage: brew-health [options]"
        echo ""
        echo "This script performs Homebrew maintenance tasks including:"
        echo "  - Updating Homebrew"
        echo "  - Upgrading outdated packages"
        echo "  - Cleaning up unused packages"
        echo "  - Upgrading outdated casks (applications)"
        echo ""
        echo "Options:"
        echo "  -h, --help     Show this help message"
        echo "  -f, --force    Run maintenance regardless of last run time"
        echo "  -c, --cleanup  Remove any stale lock file before running"
        echo "  -d, --dry-run  Show what would be done without making changes"
        echo "  -s, --status   Show when the script was last run"
        echo ""
        echo "The script will only run if it hasn't been run in the last 7 days,"
        echo "unless the --force option is used."
        return 0
    end

    # Check if Homebrew is installed
    if not command -q brew
        set_color red
        echo "Error: Homebrew is not installed."
        set_color normal
        echo "Please install Homebrew first: https://brew.sh/"
        return 1
    end

    # Show status
    if set -q _flag_status
        if test -f $LAST_RUN_FILE
            set LAST_RUN (cat $LAST_RUN_FILE)
            set TIME_DIFF (math "$NOW - $LAST_RUN")
            set DAYS_AGO (math "floor($TIME_DIFF / (24 * 60 * 60))")

            if test $DAYS_AGO -eq 0
                set_color green
                echo "The script was run today."
                set_color normal
            else if test $DAYS_AGO -eq 1
                set_color green
                echo "The script was run 1 day ago."
                set_color normal
            else
                set_color yellow
                echo "The script was run $DAYS_AGO days ago."
                set_color normal
            end
        else
            set_color yellow
            echo "The script has never been run."
            set_color normal
        end
        return 0
    end

    # If cleanup is requested, remove the lock file before proceeding
    if set -q _flag_cleanup
        set_color yellow
        echo "Cleaning up stale lock file (if exists)..."
        set_color normal
        rm -f $LOCKFILE
    end

    # Acquire lock
    if test -e $LOCKFILE
        set_color red
        echo "Script is already running. Exiting."
        set_color normal
        return 1
    else
        # Create lock file
        touch $LOCKFILE
        # Ensure cleanup on exit
        function cleanup_lock --on-event fish_exit
            rm -f $LOCKFILE
        end
    end

    # Function to run brew command with error handling
    function run_brew_command
        set is_dry_run $argv[1]
        set description $argv[2]
        set cmd $argv[3..-1]

        set_color yellow
        echo "$description..."
        set_color normal

        if test "$is_dry_run" = "true"
            echo "[DRY RUN] Would run: $cmd"
            return 0
        end

        if not $cmd
            set_color red
            echo "Error: Failed to $description"
            set_color normal
            return 1
        end
        return 0
    end

    # Function to update and clean Homebrew
    function run_brew_maintenance
        # Accept dry-run mode as first parameter
        set dry_run_mode $argv[1]

        # Default to false if not provided
        if test -z "$dry_run_mode"
            set dry_run_mode "false"
        end

        run_brew_command $dry_run_mode "Updating Homebrew" brew update
        or return 1

        run_brew_command $dry_run_mode "Upgrading outdated packages" brew upgrade
        or return 1

        run_brew_command $dry_run_mode "Cleaning up unused packages" brew cleanup
        or return 1

        run_brew_command $dry_run_mode "Upgrading outdated casks (applications)" brew upgrade --cask
        or return 1

        set_color green
        echo "Brew health check complete!"
        set_color normal
        return 0
    end

    # Main logic - set dry-run mode once
    set is_dry_run "false"
    if set -q _flag_dry_run
        set is_dry_run "true"
        set_color cyan
        echo "[DRY RUN MODE ENABLED]"
        set_color normal
    end

    if set -q _flag_force
        set_color yellow
        echo "Forced run triggered. Running maintenance..."
        set_color normal

        if run_brew_maintenance $is_dry_run
            echo $NOW >$LAST_RUN_FILE
        else
            set_color red
            echo "Maintenance failed. Please check the errors above."
            set_color normal
            rm -f $LOCKFILE
            return 1
        end
    else
        if test -f $LAST_RUN_FILE
            set LAST_RUN (cat $LAST_RUN_FILE)
            set TIME_DIFF (math "$NOW - $LAST_RUN")

            if test $TIME_DIFF -ge $SEVEN_DAYS
                set_color yellow
                echo "The script has NOT been run in the last 7 days. Running maintenance..."
                set_color normal

                if run_brew_maintenance $is_dry_run
                    echo $NOW >$LAST_RUN_FILE
                else
                    set_color red
                    echo "Maintenance failed. Please check the errors above."
                    set_color normal
                    rm -f $LOCKFILE
                    return 1
                end
            else
                set_color green
                echo "The script was run within the last 7 days. Skipping maintenance."
                set_color normal
            end
        else
            set_color yellow
            echo "The script has NEVER been run before. Running maintenance..."
            set_color normal

            if run_brew_maintenance $is_dry_run
                echo $NOW >$LAST_RUN_FILE
            else
                set_color red
                echo "Maintenance failed. Please check the errors above."
                set_color normal
                rm -f $LOCKFILE
                return 1
            end
        end
    end

    # Clean up lock file
    rm -f $LOCKFILE
end
