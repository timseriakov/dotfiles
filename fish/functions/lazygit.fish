function lazygit --wraps=lazygit --description 'Expand the focused panel in Moshi or narrow terminals'
    set -l screen_args
    if test "$MOSHI_CLIENT" = 1; or test "$COLUMNS" -lt 80 2>/dev/null
        set screen_args --screen-mode full
    end
    command lazygit $screen_args $argv
end
