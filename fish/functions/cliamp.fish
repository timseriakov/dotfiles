function cliamp --wraps=cliamp --description 'Start cliamp expanded in tmux'
    set -l inject 1

    if test (count $argv) -gt 0
        switch $argv[1]
            case -h --help -v --version help setup status play pause toggle stop next prev volume seek load queue shuffle repeat mono speed eq device visstream playlist search search-sc
                set inject 0
        end
    end

    if test $inject -eq 1; and set -q TMUX_PANE; and type -q tmux
        set -l pane $TMUX_PANE
        fish -c "sleep 0.25; command tmux send-keys -t '$pane' C-x >/dev/null 2>&1" &
    end

    command cliamp $argv
end
