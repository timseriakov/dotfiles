# Start tmux automatically only when allowed
if status is-interactive
    if not set -q TMUX; and test "$TMUX_AUTO" != 0; and not set -q NO_TMUX; and not set -q IN_NEOVIDE; and not set -q NVIM; and not set -q VSCODE_PID; and not set -q TERM_PROGRAM
        if test "$TMUX_AUTO_SESSION" = "alacritty"
            if not tmux has-session -t alacritty 2>/dev/null
                tmux new-session -d -s alacritty
            end

            tmux set-option -t alacritty status off
            exec tmux attach-session -t alacritty
        end

        if /bin/bash -c 'read -t 3 -n 1 -p "Starting tmux in 3 seconds... (n to skip) " key; echo; if [[ "$key" == "n" || "$key" == "N" ]]; then exit 1; fi'
            if tmux has-session 2>/dev/null
                exec tmux attach
            else
                exec tmux
            end
        else
            echo "Tmux launch aborted."
        end
    end
end

if set -q NVIM
    set -gx TMPDIR /tmp
end

# Prompt initialized from conf.d/40-plugins.fish (interactive only)

if test -f ~/dev/dotfiles/fish/secrets.fish
    source ~/dev/dotfiles/fish/secrets.fish
end

# Make API keys visible to GUI apps launched by macOS (SourceGit, etc.).
if status is-interactive
    if set -q OPENAI_API_KEY
        set -l launchd_openai_key (launchctl getenv OPENAI_API_KEY 2>/dev/null)
        if test "$launchd_openai_key" != "$OPENAI_API_KEY"
            launchctl setenv OPENAI_API_KEY "$OPENAI_API_KEY"
        end
    end
end


# Increase file descriptor limit for interactive shells (macOS)
status --is-interactive; and test (ulimit -n) -lt 65536; and ulimit -n 65536; or true

# Note: Antigravity PATH managed in conf.d/10-path.fish
# Note: Homebrew PATH managed in conf.d/10-path.fish


# Mole shell completion (load only if mole is installed)
if command -q mole
    set -l output (mole completion fish 2>/dev/null); and echo "$output" | source
end

# Use Tailscale.app CLI (matches running daemon from the app)
alias tailscale "/Applications/Tailscale.app/Contents/MacOS/Tailscale"
