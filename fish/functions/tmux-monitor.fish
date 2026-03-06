function tmux-monitor --description "Create/refresh monitor tmux session and optionally attach"
    set -l session monitor
    set -l no_attach 0

    if test (count $argv) -gt 0
        switch $argv[1]
            case --no-attach
                set no_attach 1
        end
    end

    set -l asitop_cmd "if command -q asitop; and command -q sudo; sudo asitop --color 4; else; echo 'asitop or sudo not found'; while true; sleep 300; end; end"

    if not command tmux has-session -t $session 2>/dev/null
        command tmux new-session -d -s $session -n btop "btop"
        command tmux new-window -t $session:2 -n battery "jolt"
        command tmux new-window -t $session:3 -n network "snitch -t -l -e"
        command tmux new-window -t $session:4 -n disk "duf"
        command tmux new-window -t $session:5 -n asitop "$asitop_cmd"
    else
        set -l existing (command tmux list-windows -t $session -F '#{window_name}')

        if not contains -- btop $existing
            command tmux new-window -t $session -n btop "btop"
        end

        if not contains -- network $existing
            command tmux new-window -t $session -n network "snitch -t -l -e"
        end

        if not contains -- battery $existing
            command tmux new-window -t $session -n battery "jolt"
        end

        if not contains -- disk $existing
            command tmux new-window -t $session -n disk "duf"
        end

        if not contains -- asitop $existing
            command tmux new-window -t $session -n asitop "$asitop_cmd"
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
