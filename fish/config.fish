if status is-interactive
    if not set -q TMUX; and not set -q IDE; and not set -q WEBSTORM_TERMINAL
        exec tmux
    else if set -q WEBSTORM_TERMINAL
        exec /usr/local/bin/taskwarrior-tui
        exec /opt/homebrew/bin/taskwarrior-tui
    end
end

if type -q ngrok
    ngrok completion | source
end

test -e {$HOME}/.iterm2_shell_integration.fish; and source {$HOME}/.iterm2_shell_integration.fish

set -g -x fish_greeting Welcome

starship init fish | source

fish_vi_key_bindings
set fish_key_bindings fish_user_key_bindings

function joshuto
    set outfile /tmp/joshuto_dir.txt

    /opt/homebrew/bin/joshuto --change-directory --output-file $outfile $argv

    if test -f $outfile
        cd (cat $outfile)
        rm $outfile
    end
end

set -gx ATUIN_NOBIND true
atuin init fish | source

# bind to ctrl-r in normal and insert mode, add any other bindings you want here too
bind \cr _atuin_search
bind -M insert \cr _atuin_search

set --universal --export fzf_preview_file_cmd 'bat --style changes --theme Nord --color=always'
set --universal --export fzf_fd_opts --hidden --exclude=.git
set --universal --export FZF_DEFAULT_OPTS --color fg:#5E81AC,bg:#2E3440,hl:#A3BE8C,fg+:#D8DEE9,bg+:#2E3440,hl+:#A3BE8C --color pointer:#BF616A,info:#4C566A,spinner:#4C566A,header:#4C566A,prompt:#81A1C1,marker:#EBCB8B --cycle --layout=reverse --border --height=90% --preview-window=wrap --marker='*'
set -gx BAT_THEME Nord

pyenv init - | source
thefuck --alias | source

set -gx fish_command_timeout 8000

set -gx LANG en_US.UTF-8
set -gx LC_ALL en_US.UTF-8

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

# pnpm
set -gx PNPM_HOME /Users/tim/Library/pnpm
if not string match -q -- $PNPM_HOME $PATH
    set -gx PATH "$PNPM_HOME" $PATH
end
# pnpm end

# oracle instance client
set -x DYLD_LIBRARY_PATH "/opt/homebrew/Cellar/instantclient-basic/19.8.0.0.0dbru/lib"
set -x ORACLE_HOME "/opt/homebrew/Cellar/instantclient-basic/19.8.0.0.0dbru"

# proto
set -gx PROTO_HOME "$HOME/.proto"
set -gx PATH "$PROTO_HOME/shims:$PROTO_HOME/bin" $PATH

# posting
set -gx POSTING_PAGER moar
set -gx POSTING_ANIMATION full
set -gx POSTING_THEME alpine
