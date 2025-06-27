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

set -gx PATH $HOME/Qt/6.7.0-custom/bin $PATH

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

source "$HOME/.swiftly/env.fish"
