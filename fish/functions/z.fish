function z --wraps=__zoxide_z --description 'z with smart eza listing'
    set -g __prev_dir (pwd)
    __zoxide_z $argv; or return

    set lines (eza --all --long --icons --group-directories-first --color=always | wc -l)
    set height (tput lines)

    if test $lines -gt $height
        eza --all --icons --group-directories-first
    else
        eza --all --long --icons --group-directories-first
    end
end
