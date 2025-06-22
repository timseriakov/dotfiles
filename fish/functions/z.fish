function z --wraps=__zoxide_z --description 'alias z with smart eza listing'
    __zoxide_z $argv; or return

    set lines (eza --all --long --icons --color=always | wc -l)
    set height (tput lines)

    if test $lines -gt $height
        eza --all --icons --group-directories-first
    else
        eza --all --long --icons
    end
end
