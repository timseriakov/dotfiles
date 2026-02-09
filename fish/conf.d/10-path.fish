# ~/.config/fish/conf.d/10-path.fish

# Clear old fish_user_paths to avoid duplicates (universal)
set -eU fish_user_paths

# Note: rbenv and pyenv shims are managed by their init scripts in 20-tooling.fish
# Don't add them manually here to avoid duplicates

# Antigravity (high priority)
fish_add_path -Ua ~/.antigravity/antigravity/bin

# User/local tool bins
fish_add_path -Ua ~/.local/bin
fish_add_path -Ua ~/dev/dotfiles/qutebrowser/bin
fish_add_path -Ua ~/.vapi/bin
fish_add_path -Ua ~/.bun/bin
fish_add_path -Ua ~/.volta/bin

# Volta per-node "global npm bin" (npm -g sometimes lands here)
if set -q VOLTA_HOME; and test -d "$VOLTA_HOME/tools/image/node"
    for node_bin in (command ls -d "$VOLTA_HOME/tools/image/node"/*/bin 2>/dev/null)
        test -d $node_bin; and fish_add_path -Ua $node_bin
    end
end

fish_add_path -Ua ~/.cargo/bin
fish_add_path -Ua ~/.nix-profile/bin
fish_add_path -Ua ~/.swiftly/bin
fish_add_path -Ua ~/.lmstudio/bin
fish_add_path -Ua ~/.orbstack/bin
fish_add_path -Ua ~/.lazyshell/bin

# Go
fish_add_path -Ua ~/go/bin
set -gx GOPATH $HOME/go
set -gx GOBIN $HOME/.local/bin

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

# MacPorts (if installed)
if test -d /opt/local/bin
    fish_add_path -Ua /opt/local/bin
    fish_add_path -Ua /opt/local/sbin
end

# Note: System paths (/usr/bin, /bin, /usr/sbin, /sbin) and Homebrew paths
# (/opt/homebrew/bin, /opt/homebrew/sbin) are already in the default system PATH
# Don't add them to fish_user_paths to avoid duplicates

# IDEs
fish_add_path -Ua /Applications/GoLand.app/Contents/MacOS

# Zerobrew
set -gx ZEROBREW_ROOT $HOME/.zerobrew
set -gx ZEROBREW_PREFIX $HOME/.zerobrew
fish_add_path -Ua $HOME/.zerobrew/bin
