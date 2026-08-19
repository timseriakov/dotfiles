function tmux-weather --description "Create/refresh weather tmux session (Minsk) and optionally attach"
    set -l session weather
    set -l no_attach 0

    if test (count $argv) -gt 0
        switch $argv[1]
            case --no-attach
                set no_attach 1
        end
    end

    # Minsk fixed location; linecast live mode is default inside an interactive pane
    set -l loc "WEATHER_LOCATION=53.9002,27.5665"

    if not command tmux has-session -t $session 2>/dev/null
        command tmux new-session -d -s $session -n weather "$loc linecast weather --metric"
        command tmux new-window -t $session:2 -n sunshine "$loc linecast sunshine"
        command tmux new-window -t $session:3 -n moon "$loc linecast moon"
        command tmux new-window -t $session:4 -n radar "$loc linecast radar"
        command tmux select-window -t $session:1
    else
        set -l existing (command tmux list-windows -t $session -F '#{window_name}')

        if not contains -- weather $existing
            command tmux new-window -t $session -n weather "$loc linecast weather --metric"
        end

        if not contains -- sunshine $existing
            command tmux new-window -t $session -n sunshine "$loc linecast sunshine"
        end

        if not contains -- moon $existing
            command tmux new-window -t $session -n moon "$loc linecast moon"
        end

        if not contains -- radar $existing
            command tmux new-window -t $session -n radar "$loc linecast radar"
        end
    end

    if test $no_attach -eq 1
        return 0
    end

    if set -q TMUX
        command tmux switch-client -t $session
    else
        command tmux attach-session -t $session
    end
end
