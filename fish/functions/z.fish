function z --wraps=__zoxide_z --description 'z with smart eza listing'
    set -g __prev_dir (pwd)
    __zoxide_z $argv; or return

    set lines (eza --all --long --icons --group-directories-first --color=always | wc -l)
    set -l height (tput lines 2>/dev/null)
    if test -z "$height"
        set height $LINES
    end
    if test -z "$height"
        set height 24
    end

    if test $lines -gt $height
        eza --all --icons --group-directories-first
    else
        eza --all --long --icons --group-directories-first
    end
end
