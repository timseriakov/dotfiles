if status is-interactive
  # Commands to run in interactive sessions can go here

  and not set -q TMUX
  exec tmux
end

test -e {$HOME}/.iterm2_shell_integration.fish ; and source {$HOME}/.iterm2_shell_integration.fish

set -g -x fish_greeting 'Welcome to fish'

fish_vi_key_bindings

starship init fish | source
thefuck --alias | source

set --universal --export fzf_preview_file_cmd 'bat --style changes --theme Nord --color=always'
set --universal --export fzf_fd_opts --hidden --exclude=.git
set --universal --export FZF_DEFAULT_OPTS --color fg:#5E81AC,bg:#2E3440,hl:#A3BE8C,fg+:#D8DEE9,bg+:#2E3440,hl+:#A3BE8C --color pointer:#BF616A,info:#4C566A,spinner:#4C566A,header:#4C566A,prompt:#81A1C1,marker:#EBCB8B --cycle --layout=reverse --border --height=90% --preview-window=wrap --marker='*'

# pnpm
set -gx PNPM_HOME "/Users/tim/Library/pnpm"
set -gx PATH "$PNPM_HOME" $PATH
# pnpm end
# Generated for envman. Do not edit.
test -s "$HOME/.config/envman/load.fish"; and source "$HOME/.config/envman/load.fish"

pyenv init - | source
