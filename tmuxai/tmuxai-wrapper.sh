#!/usr/bin/env fish

# Load the Omniroute secret used by config.yaml.
if not set -q OMNIROUTE_TMUX_AI_API_KEY
    if test -f ~/dev/dotfiles/fish/secrets.fish
        source ~/dev/dotfiles/fish/secrets.fish
    end
end

exec /opt/homebrew/bin/tmuxai $argv
