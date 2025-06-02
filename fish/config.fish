# if status is-interactive
#     if not set -q TMUX; and not set -q IN_NEOVIDE; and not set -q NO_TMUX
#         exec tmux
#     else if set -q TASKWARRIOR
#         exec /usr/local/bin/taskwarrior-tui
#         exec /opt/homebrew/bin/taskwarrior-tui
#     end
# end
#

if status is-interactive
    if not set -q TMUX; and not set -q IN_NEOVIDE; and not set -q NO_TMUX; and not set -q NVIM
        exec tmux
    end
end

if set -q NVIM
    set -gx TMPDIR /tmp
end

if type -q ngrok
    ngrok completion | source
end

set -g -x fish_greeting Welcome

starship init fish | source

fish_vi_key_bindings
set fish_key_bindings fish_user_key_bindings

set -gx ATUIN_NOBIND true
atuin init fish | source

# bind to ctrl-r in normal and insert mode, add any other bindings you want here too
bind \cr _atuin_search
bind -M insert \cr _atuin_search

pyenv init - | source

set -gx fish_command_timeout 8000

set -gx LANG en_US.UTF-8
set -gx LC_ALL en_US.UTF-8

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

# oracle instance client
#set -x DYLD_LIBRARY_PATH "/opt/homebrew/Cellar/instantclient-basic/19.8.0.0.0dbru/lib"
#set -x ORACLE_HOME "/opt/homebrew/Cellar/instantclient-basic/19.8.0.0.0dbru"

# volta
set -gx VOLTA_HOME "$HOME/.volta"
set -gx PATH "$VOLTA_HOME/bin" $PATH

# Added by OrbStack: command-line tools and integration
# This won't be added again if you remove it.
source ~/.orbstack/shell/init2.fish 2>/dev/null || :
set -Ux fish_user_paths $HOME/.orbstack/bin $fish_user_paths

# Added by LM Studio CLI (lms)
set -gx PATH $PATH /Users/tim/.lmstudio/bin

set -gx XDG_CONFIG_HOME $HOME/.config

zoxide init fish | source

# secrets.fish
if test -f ~/dev/dotfiles/fish/secrets.fish
    source ~/dev/dotfiles/fish/secrets.fish
end

# Load custom envs
if test -f ~/dev/dotfiles/fish/env.fish
    source ~/dev/dotfiles/fish/env.fish
end
