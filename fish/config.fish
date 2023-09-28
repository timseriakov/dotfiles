if status is-interactive
  # If we're not inside of tmux and not running inside JetBrains IDE (like WebStorm)
  if not set -q TMUX; and not set -q IDE
    exec tmux
  end
end

if type -q ngrok
    ngrok completion | source
end

# set -x CLASSPATH ".:/usr/local/lib/antlr-4.7.2-complete.jar:$CLASSPATH"

# function antlr4
#     java -Xmx500M -cp "/usr/local/lib/antlr-4.7.2-complete.jar:$CLASSPATH" org.antlr.v4.Tool $argv
# end

# function grun
#     java -Xmx500M -cp "/usr/local/lib/antlr-4.7.2-complete.jar:$CLASSPATH" org.antlr.v4.gui.TestRig $argv
# end

test -e {$HOME}/.iterm2_shell_integration.fish ; and source {$HOME}/.iterm2_shell_integration.fish

set -g -x fish_greeting 'Welcome'

starship init fish | source

fish_vi_key_bindings
set fish_key_bindings fish_user_key_bindings

set --universal --export fzf_preview_file_cmd 'bat --style changes --theme Nord --color=always'
set --universal --export fzf_fd_opts --hidden --exclude=.git
set --universal --export FZF_DEFAULT_OPTS --color fg:#5E81AC,bg:#2E3440,hl:#A3BE8C,fg+:#D8DEE9,bg+:#2E3440,hl+:#A3BE8C --color pointer:#BF616A,info:#4C566A,spinner:#4C566A,header:#4C566A,prompt:#81A1C1,marker:#EBCB8B --cycle --layout=reverse --border --height=90% --preview-window=wrap --marker='*'
set -gx BAT_THEME "Nord"

pyenv init - | source
set -x PATH /platform-tools $PATH;
set -gx fish_command_timeout 8000

set -gx LANG en_US.UTF-8
set -gx LC_ALL en_US.UTF-8

set -gx VOLTA_HOME "$HOME/.volta"
set -gx PATH "$VOLTA_HOME/bin" $PATH


# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH

# https://github.com/ajeetdsouza/zoxide
# keep it in the end of file
zoxide init fish | source
