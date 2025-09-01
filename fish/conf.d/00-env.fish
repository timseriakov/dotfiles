# Base dirs
set -Ua fish_user_paths /opt/local/bin /opt/local/sbin $HOME/dev/dotfiles/qutebrowser/bin

# Android SDK
set -gx ANDROID_HOME "$HOME/Library/Android/sdk"
set -Ua fish_user_paths $ANDROID_HOME/emulator $ANDROID_HOME/platform-tools

set -gx fish_command_timeout 8000
set -gx fish_greeting Welcome
set -gx NEOVIDE_TITLE_HIDDEN 1
set -gx HOMEBREW_NO_ENV_HINTS 1

# fzf
set -gx fzf_fd_opts --hidden --exclude=.git
set -gx fzf_preview_file_cmd 'bat --style=plain --color=always --theme Nord'
set -gx fzf_directory_opts --color=border:#81A1C1
set -gx fzf_git_log_opts --color=border:#81A1C1
set -gx fzf_git_status_opts --color=border:#81A1C1
set -gx fzf_history_opts --color=border:#81A1C1
set -gx fzf_processes_opts --color=border:#81A1C1
set -gx fzf_variables_opts --color=border:#81A1C1

# bat
set -gx BAT_THEME Nord

# posting
set -gx POSTING_PAGER moar
set -gx POSTING_ANIMATION full
set -gx POSTING_THEME alpine

set -gx LANG en_US.UTF-8
set -gx LC_ALL en_US.UTF-8

# bun (use fish_add_path to avoid duplicates and keep order)
if type -q fish_add_path
    fish_add_path --append $HOME/.bun/bin
else
    set --export PATH $HOME/.bun/bin $PATH
end

# Java
set -gx JAVA_HOME "/Library/Java/JavaVirtualMachines/zulu-11.jdk/Contents/Home"

# Volta
if type -q fish_add_path
    fish_add_path --append $HOME/.volta/bin
else
    set -gx PATH "$HOME/.volta/bin" $PATH
end
set -gx VOLTA_HOME "$HOME/.volta"

# XDG
set -gx XDG_CONFIG_HOME $HOME/.config

# Rust/Cargo (correct way; removes the broken {cargo_bin} placeholder)
if test -f "$HOME/.cargo/env.fish"
    source "$HOME/.cargo/env.fish"
end

# ESLint/Compose
set -gx ESLINT_USE_FLAT_CONFIG true
set -gx COMPOSE_BAKE true

# OrbStack (do not force to front; it will be deduped and kept after rbenv)
source ~/.orbstack/shell/init2.fish 2>/dev/null || :
if type -q fish_add_path
    fish_add_path --append $HOME/.orbstack/bin
else
    set -Ua fish_user_paths $HOME/.orbstack/bin
end

# vapi
if type -q fish_add_path
    fish_add_path --append $HOME/.vapi/bin
else
    set --export PATH $HOME/.vapi/bin $PATH
end
set --export MANPATH "$HOME/.vapi"/share/man $MANPATH

# QtWebEngine (Homebrew on macOS ARM)
set -gx QTWEBENGINE_RESOURCES_PATH (brew --prefix qt@6)/lib/QtWebEngineCore.framework/Resources
set -gx QTWEBENGINE_LOCALES_PATH $QTWEBENGINE_RESOURCES_PATH/qtwebengine_locales
set -gx QT_PLUGIN_PATH (brew --prefix qt@6)/plugins
