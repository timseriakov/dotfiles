function mode-away
    command ~/.local/bin/pmset-mobile.sh
    or return $status

    command ~/.local/bin/battery-mode.sh mobile $argv
    return $status
end
