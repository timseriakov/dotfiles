set -gx PATH /opt/local/bin /opt/local/sbin /Users/tim/.qutebrowser/bin $PATH

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

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

# oracle instance client
#set -x DYLD_LIBRARY_PATH "/opt/homebrew/Cellar/instantclient-basic/19.8.0.0.0dbru/lib"
#set -x ORACLE_HOME "/opt/homebrew/Cellar/instantclient-basic/19.8.0.0.0dbru"

# volta
set -gx VOLTA_HOME "$HOME/.volta"
set -gx PATH "$VOLTA_HOME/bin" $PATH

set -gx XDG_CONFIG_HOME $HOME/.config

# rustup shell setup
if not contains "{cargo_bin}" $PATH
    # Prepending path in case a system-installed rustc needs to be overridden
    set -x PATH "{cargo_bin}" $PATH
end

source "$HOME/.cargo/env.fish"
# source "$HOME/.swiftly/env.fish"

set -gx ESLINT_USE_FLAT_CONFIG true
set -gx COMPOSE_BAKE true

# OrbStack tools
source ~/.orbstack/shell/init2.fish 2>/dev/null || :
set -Ux fish_user_paths $HOME/.orbstack/bin $fish_user_paths

# vapi
set --export VAPI_INSTALL "$HOME/.vapi"
set --export PATH $VAPI_INSTALL/bin $PATH
set --export MANPATH "$HOME/.vapi"/share/man $MANPATH

# QtWebEngine paths for qutebrowser (Homebrew on macOS ARM)
set -gx QTWEBENGINE_RESOURCES_PATH (brew --prefix qt@6)/lib/QtWebEngineCore.framework/Resources
set -gx QTWEBENGINE_LOCALES_PATH $QTWEBENGINE_RESOURCES_PATH/qtwebengine_locales
set -gx QT_PLUGIN_PATH (brew --prefix qt@6)/plugins
