function fish_user_key_bindings
    fish_vi_key_bindings
    function _dotfiles_atuin_search
        functions -q _atuin_search; or atuin init fish | source
        _atuin_search
    end

    function _dotfiles_atuin_author_search
        set -l picked (atuin search --author $argv[1] --format '{command}' | fzf --height 60% --reverse)
        test -n "$picked"; and commandline -r "$picked"
        commandline -f repaint
    end

    function _dotfiles_preview_current_file
        set -l file (commandline -t | string collect)
        test -f "$file"; or return
        if command -q bat
            bat --paging=always --style=plain -- "$file"
        else
            less -- "$file"
        end
        commandline -f repaint
    end

    bind -M insert \cr _dotfiles_atuin_search
    bind -M default \cr _dotfiles_atuin_search
    bind -M insert \em '_dotfiles_atuin_author_search omp'
    bind -M default \em '_dotfiles_atuin_author_search omp'
    bind -M insert \ec '_dotfiles_atuin_author_search codex'
    bind -M insert \eo _dotfiles_preview_current_file
    bind -M default \eo _dotfiles_preview_current_file
    bind -M default \ec '_dotfiles_atuin_author_search codex'

    for mode in insert default visual
        bind -M $mode \ck 'history --merge; up-or-search'
        bind -M $mode \cj 'history --merge; down-or-search'
        bind -M $mode ctrl-enter accept-autosuggestion
        bind -M $mode \ch 'cd ..; commandline -f repaint'
        bind -M $mode \cb 'cd -; commandline -f repaint'
        bind -M $mode \cl accept-autosuggestion
        bind -M $mode \cf forward-word
        bind -M $mode alt-backspace backward-kill-word  # Option+Backspace to delete word
        bind -M $mode \ct try-rs-picker # Ctrl+T for try-rs-picker
        bind -M $mode \cg edit_command_buffer
        bind -M $mode \ep 'commandline -r "rip"; commandline -f execute'
    end

    # jj is left free for Jujutsu; use Escape directly.
    # bind -M insert -m default jj 'set -g fish_bind_mode default; commandline -f backward-char repaint'

    # In visual mode, yank to both fish killring and system clipboard.
    bind -M visual -m default y 'fish_vi_yank_selection; fish_clipboard_copy; commandline -f end-selection repaint-mode'



    # Execute 'f' immediately on space
    bind -M insert ' ' 'if commandline | string match -q -- "f"; commandline -f execute; else; commandline -f expand-abbr; commandline -i " "; end'

end
