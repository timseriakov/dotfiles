if status is-interactive
    if not set -q TMUX; and not set -q IN_NEOVIDE; and not set -q NO_TMUX; and not set -q NVIM
        exec tmux
    end
end

if set -q NVIM
    set -gx TMPDIR /tmp
end

starship init fish | source

# OrbStack tools
source ~/.orbstack/shell/init2.fish 2>/dev/null || :
set -Ux fish_user_paths $HOME/.orbstack/bin $fish_user_paths

if test -f ~/dev/dotfiles/fish/secrets.fish
    source ~/dev/dotfiles/fish/secrets.fish
end
