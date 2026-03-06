function tmux
  if status is-interactive; and not set -q TMUX; and type -q tmux-monitor
    if test (count $argv) -eq 0
      tmux-monitor --no-attach >/dev/null 2>&1
    else
      switch $argv[1]
        case new new-session attach attach-session a
          tmux-monitor --no-attach >/dev/null 2>&1
      end
    end
  end

  command tmux -2 $argv
end
