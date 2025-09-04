#!/usr/bin/env fish
# Plugins and keybindings

# Starship prompt (interactive shells only)
if status --is-interactive; and type -q starship
    starship init fish | source
end

# fzf options (colors/theme)
set -gx fzf_fd_opts --hidden --exclude=.git
set -gx fzf_preview_file_cmd 'bat --style=plain --color=always --theme Nord'
set -gx fzf_directory_opts --color=border:#81A1C1
set -gx fzf_git_log_opts --color=border:#81A1C1
set -gx fzf_git_status_opts --color=border:#81A1C1
set -gx fzf_history_opts --color=border:#81A1C1
set -gx fzf_processes_opts --color=border:#81A1C1
set -gx fzf_variables_opts --color=border:#81A1C1

# Atuin
if type -q atuin
    set -gx ATUIN_NOBIND true
    atuin init fish | source
    if test -f "$HOME/.atuin/bin/env.fish"
        source "$HOME/.atuin/bin/env.fish"
    end
    bind \cr _atuin_search
    bind -M insert \cr _atuin_search
end

# Zoxide
if type -q zoxide
    zoxide init fish | source
    # ensure `z` function override (compat)
    functions -e z 2>/dev/null
    if test -f ~/.config/fish/functions/z.fish
        source ~/.config/fish/functions/z.fish
    end
end

# fifc (fuzzy completions)
#
# [copied from previous conf.d/50-fifc.fish]
function __fifc_unique --description 'filter unique values preserving order'
    awk '!(x[$0]++)'
end

set -g __fifc_version 2
set -q FIFC_HISTORY || set -g FIFC_HISTORY ~/.cache/fifc
set -q FIFC_MAX  || set -g FIFC_MAX 10000
set -q FIFC_FZF_OPTS || set -g FIFC_FZF_OPTS "--height 40% --reverse --ansi"

function _fifc_hist_file; echo "$FIFC_HISTORY/$argv[1].txt"; end
function _fifc_hist_save
    set -l file (_fifc_hist_file $argv[1])
    mkdir -p (dirname $file)
    printf %s\n $argv[2..-1] | __fifc_unique | tail -n $FIFC_MAX >$file
end
function _fifc_hist_load
    set -l file (_fifc_hist_file $argv[1])
    test -f $file; and cat $file
end

function fifc --description 'Fuzzy select from candidates and insert'
    set -l name $argv[1]
    set -l prompt $argv[2]
    set -l src_fn $argv[3]
    set -l cmp_fn $argv[4]
    set -l cb_fn  $argv[5]

    set -l src (eval $src_fn)
    set -l hist (_fifc_hist_load $name)
    set -l list (printf %s\n $hist $src | __fifc_unique)
    if test (count $list) -eq 0
        commandline -f repaint
        return
    end

    set -l chosen (printf %s\n $list | fzf $FIFC_FZF_OPTS --prompt "$prompt> ")
    test -n "$chosen"; or return
    set -l result (eval $cb_fn "$chosen")
    if test -n "$result"
        commandline -it -- $result
        _fifc_hist_save $name $chosen $hist
    end
end

# fzf (keybindings and helpers)
if not status is-interactive && test "$CI" != true
    return
end
set --global _fzf_search_vars_command '_fzf_search_variables (set --show | psub) (set --names | psub)'
fzf_configure_bindings \
    --directory=\ef \
    --git_log=\el \
    --git_status=\es \
    --history=\er \
    --processes=\ep \
    --variables=\ev
function _fzf_uninstall --on-event fzf_uninstall
    _fzf_uninstall_bindings
    set --erase _fzf_search_vars_command
    functions --erase _fzf_uninstall _fzf_migration_message _fzf_uninstall_bindings fzf_configure_bindings
    complete --erase fzf_configure_bindings
    set_color cyan
    echo "fzf.fish uninstalled."
    echo "You may need to manually remove fzf_configure_bindings from your config.fish if you were using custom key bindings."
    set_color normal
end

# Oh My Fish
set -q XDG_DATA_HOME; and set -gx OMF_PATH "$XDG_DATA_HOME/omf"; or set -gx OMF_PATH "$HOME/.local/share/omf"
if test -f $OMF_PATH/init.fish
    source $OMF_PATH/init.fish
end

# Keybindings and cursor shapes
fish_vi_key_bindings
set fish_key_bindings fish_user_key_bindings
set -gx fish_cursor_default block
set -gx fish_cursor_visual block
set -gx fish_cursor_insert line
set -gx fish_cursor_replace underscore
set -gx fish_cursor_replace_one underscore
set -gx fish_cursor_external line
