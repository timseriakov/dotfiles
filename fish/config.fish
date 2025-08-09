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
