function cd
    if test "$argv" = -
        if set -q __prev_dir
            set temp "$__prev_dir"
            set __prev_dir (pwd)
            builtin cd $temp; or return
        else
            echo "No previous directory"
            return 1
        end
    else
        set -g __prev_dir (pwd)
        builtin cd $argv; or return
    end

    set lines (eza --all --long --icons --group-directories-first --color=always | wc -l)
    set height (tput lines)

    if test $lines -gt $height
        eza --all --icons --group-directories-first
    else
        eza --all --long --icons --group-directories-first
    end
end
