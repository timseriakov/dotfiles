# Start tmux automatically only when allowed
if status is-interactive
    # Skip if already inside tmux or explicitly disabled
    if not set -q TMUX; and test "$TMUX_AUTO" != 0; and not set -q NO_TMUX; and not set -q IN_NEOVIDE; and not set -q NVIM
        exec tmux
    end
end

if set -q NVIM
    set -gx TMPDIR /tmp
end

starship init fish | source

if test -f ~/dev/dotfiles/fish/secrets.fish
    source ~/dev/dotfiles/fish/secrets.fish
end

# React Native Terminal Settings
set -gx REACT_TERMINAL kitty
set -gx RCT_METRO_PORT 8081

# Added by `rbenv init` on Mon Aug 25 15:17:59 +03 2025
status --is-interactive; and rbenv init - --no-rehash fish | source
# Increase file descriptor limit for interactive shells (macOS)
status --is-interactive; and test (ulimit -n) -lt 65536; and ulimit -n 65536
