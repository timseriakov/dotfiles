# ~/.config/fish/conf.d/10-path.fish

# Clear old fish_user_paths to avoid duplicates (universal)
set -eU fish_user_paths

# Priority: rbenv → pyenv → rest
# rbenv (shims first, then bin)
fish_add_path -Ua ~/.rbenv/shims
fish_add_path -Ua ~/.rbenv/bin

# pyenv
fish_add_path -Ua ~/.pyenv/shims
fish_add_path -Ua ~/.pyenv/bin

# User/local tool bins
fish_add_path -Ua ~/.local/bin
fish_add_path -Ua ~/dev/dotfiles/qutebrowser/bin
fish_add_path -Ua ~/.vapi/bin
fish_add_path -Ua ~/.bun/bin
fish_add_path -Ua ~/.volta/bin
fish_add_path -Ua ~/.cargo/bin
fish_add_path -Ua ~/.nix-profile/bin
fish_add_path -Ua ~/.swiftly/bin
fish_add_path -Ua ~/.lmstudio/bin
fish_add_path -Ua ~/.orbstack/bin
#
# lazyshell
fish_add_path -Ua ~/.lazyshell/bin

# Go
fish_add_path -Ua ~/go/bin
set -gx GOPATH $HOME/go
set -gx GOBIN $HOME/.local/bin
fish_add_path -Ua $GOBIN

# Java SDKs (prefer 11 to match JAVA_HOME)
fish_add_path -Ua /opt/homebrew/opt/openjdk@11/bin
fish_add_path -Ua /opt/homebrew/opt/openjdk@17/bin

# Android SDK
fish_add_path -Ua ~/Library/Android/sdk/platform-tools
fish_add_path -Ua ~/Library/Android/sdk/emulator

# Oracle Instant Client
fish_add_path -Ua ~/oracle/instantclient_23_3

# Qt
fish_add_path -Ua ~/Qt/6.7.0-custom/bin
fish_add_path -Ua /opt/homebrew/opt/qt@5/bin

# System paths
fish_add_path -Ua /opt/homebrew/bin
fish_add_path -Ua /opt/homebrew/sbin
fish_add_path -Ua /opt/local/bin
fish_add_path -Ua /opt/local/sbin
fish_add_path -Ua /usr/local/bin
fish_add_path -Ua /usr/local/sbin
fish_add_path -Ua /usr/bin
fish_add_path -Ua /bin
fish_add_path -Ua /usr/sbin
fish_add_path -Ua /sbin
