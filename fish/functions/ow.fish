function ow
    if not set -q TMUX
        echo "ow requires tmux"
        return 1
    end

    set -l pane (command tmux display-message -p '#{pane_id}')
    begin
        sleep 3
        command tmux send-keys -t $pane '/mb-warm-context' Enter
    end &

    omp
end
