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

# fifc moved to conf.d/50-fifc.fish

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
