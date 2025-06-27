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

# Added by OrbStack: command-line tools and integration
# This won't be added again if you remove it.
source ~/.orbstack/shell/init2.fish 2>/dev/null || :
set -Ux fish_user_paths $HOME/.orbstack/bin $fish_user_paths

zoxide init fish | source
functions -e z
source ~/.config/fish/functions/z.fish

# secrets.fish
if test -f ~/dev/dotfiles/fish/secrets.fish
    source ~/dev/dotfiles/fish/secrets.fish
end

# Load custom envs
if test -f ~/dev/dotfiles/fish/env.fish
    source ~/dev/dotfiles/fish/env.fish
end
