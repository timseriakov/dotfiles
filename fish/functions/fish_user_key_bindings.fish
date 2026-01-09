function fish_user_key_bindings
    fish_vi_key_bindings

    for mode in insert default visual
        bind -M $mode \ck 'history --merge; up-or-search'
        bind -M $mode \cj 'history --merge; down-or-search'
        bind -M $mode \"\r\" accept-autosuggestion execute
        bind -M $mode \ch 'cd ..; commandline -f repaint'
        bind -M $mode \cb 'cd -; commandline -f repaint'
        bind -M $mode \cl accept-autosuggestion
        bind -M $mode \cf forward-word
    end

    # jj to escape insert → normal with correct cursor mode
    bind -M insert -m default jj 'set -g fish_bind_mode default; commandline -f backward-char repaint'

    # Execute 'f' immediately on space
    bind -M insert ' ' 'if commandline | string match -q -- "f"; commandline -f execute; else; commandline -f expand-abbr; commandline -i " "; end'
end
