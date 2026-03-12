#!/usr/bin/env fish
# Plugins

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
set -gx FZF_DEFAULT_OPTS \
    --height=85% \
    --layout=reverse \
    --border=none \
    --preview-window=right:60%:wrap:border-left \
    --bind=ctrl-d:preview-down,ctrl-u:preview-up,ctrl-f:preview-page-down,ctrl-b:preview-page-up \
    --color=fg:#D8DEE9,bg:#2E3440,hl:#BF616A,fg+:#E5E9F0,bg+:#3B4252,hl+:#BF616A \
    --color=info:#81A1C1,prompt:#81A1C1,pointer:#BF616A,marker:#EBCB8B,spinner:#5E81AC,header:#5E81AC,border:#81A1C1 \
    --marker='*'

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
    set -gx _ZO_FZF_OPTS "--exact --no-sort --bind=ctrl-z:ignore,btab:up,tab:down --cycle --keep-right --height=45% --info=inline --layout=reverse --tabstop=1 --exit-0 --preview='eza --icons --group-directories-first --color=always -- {2..}' --preview-window=down,30%,sharp --border=none --color=fg:#D8DEE9,bg:#2E3440,hl:#BF616A,fg+:#E5E9F0,bg+:#3B4252,hl+:#BF616A --color=info:#81A1C1,prompt:#81A1C1,pointer:#BF616A,marker:#EBCB8B,spinner:#5E81AC,header:#5E81AC,border:#81A1C1"
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
    --git_status=\ed \
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
