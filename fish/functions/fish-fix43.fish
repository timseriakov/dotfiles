function fish-fix43 --description 'Fix Fish 4.3+ migration issues by clearing legacy universal variables'
    set -l legacy_vars (set --names --universal | string match -r '^fish_(pager_color_.*|key_bindings)$')

    if test -n "$legacy_vars"
        echo "Found legacy universal variables:"
        for var in $legacy_vars
            echo "  - $var"
        end

        echo "Cleaning up..."
        for var in $legacy_vars
            set -eU $var
        end
        echo "Done cleaning universal scope."
    else
        echo "No legacy universal variables found in current session."
    end

    set -l frozen_files (ls ~/.config/fish/conf.d/ 2>/dev/null | string match -r '^fish_frozen_.*\.fish$')
    if test -n "$frozen_files"
        echo "Found regenerated frozen files:"
        for f in $frozen_files
            echo "  - $f"
        end
        echo "Removing them..."
        rm -f $frozen_files
        echo "Removed."
    else
        echo "No frozen files found in conf.d/."
    end

    echo "Migration status: Clean."
    echo "Note: If you still see the migration message, restart all active Fish and Tmux sessions."
end
