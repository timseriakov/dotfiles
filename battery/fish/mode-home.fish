function mode-home
    command ~/.local/bin/pmset-server.sh
    or return $status

    command ~/.local/bin/battery-mode.sh server
    return $status
end
