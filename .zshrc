#
# Tmux
#

if [ -z "$TMUX" ] # When zsh is started attach to current tmux session or create a new one
then
    tmux attach -t TMUX || tmux new -s TMUX
fi

#
# Neovim
#

export EDITOR="lvim"
alias vim="nvim"

#
# Oh-my-zsh
#

export ZSH="$HOME/.oh-my-zsh"

SPACESHIP_PROMPT_FIRST_PREFIX_SHOW=true # Show prefix before first line in prompt
ZSH_THEME="spaceship" # Set theme

plugins=(
  git # https://github.com/robbyrussell/oh-my-zsh/wiki/Plugin:git
  history-substring-search # ZSH port of Fish history search. Begin typing command, use up arrow to select previous use
  zsh-autosuggestions # Suggests commands based on your history
  zsh-completions # More completions
  zsh-syntax-highlighting # Fish shell like syntax highlighting for Zsh
  colored-man-pages # Self-explanatory
  thefuck
  )
autoload -U compinit && compinit # reload completions for zsh-completions

source $ZSH/oh-my-zsh.sh # required

# Colorize autosuggest
export ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=5'

#
# Spaceship-prompt
#

# Spaceship-prompt customization
SPACESHIP_PROMPT_ORDER=(
dir             # Current directory section
user            # Username section
host            # Hostname section
git             # Git section (git_branch + git_status)
time          # Time stampts section
# hg            # Mercurial section (hg_branch  + hg_status)
# package       # Package version
node          # Node.js section
# ruby          # Ruby section
# elixir        # Elixir section
# xcode         # Xcode section
# swift         # Swift section
# golang        # Go section
# php           # PHP section
# rust          # Rust section
# haskell       # Haskell Stack section
# julia         # Julia section
docker        # Docker section
# aws           # Amazon Web Services section
# venv          # virtualenv section
# conda         # conda virtualenv section
# pyenv         # Pyenv section
# dotnet        # .NET section
# ember         # Ember.js section
# kubecontext   # Kubectl context section
battery         # Battery level and status
exec_time       # Execution time
line_sep        # Line break
# vi_mode         # Vi-mode indicator
jobs            # Background jobs indicator
# exit_code     # Exit code section
char            # Prompt character
)

SPACESHIP_DIR_PREFIX="%{$fg[blue]%}┌─[%b "
SPACESHIP_DIR_SUFFIX="%{$fg[blue]%} ] "
SPACESHIP_CHAR_SYMBOL="%{$fg[blue]%}└─▪%b "

#
# Other
#

# This speeds up pasting w/ autosuggest
# https://github.com/zsh-users/zsh-autosuggestions/issues/238
pasteinit() {
  OLD_SELF_INSERT=${${(s.:.)widgets[self-insert]}[2,3]}
  zle -N self-insert url-quote-magic # I wonder if you'd need `.url-quote-magic`?
}

pastefinish() {
  zle -N self-insert $OLD_SELF_INSERT
}
zstyle :bracketed-paste-magic paste-init pasteinit
zstyle :bracketed-paste-magic paste-finish pastefinish

alias oh="source ~/.zshrc"
alias rc="lvim ~/.zshrc"
alias trc="lvim ~/.tmux.conf"
alias rr="ranger"
alias v="vim"
alias lv="lvim"
alias l.="lvim ."

eval "$(thefuck --alias)"

# HSTR configuration - add this to ~/.zshrc
alias hh=hstr                    # hh to be alias for hstr
setopt histignorespace           # skip cmds w/ leading space from history
export HSTR_CONFIG=hicolor       # get more colors
bindkey -s "\C-r" "\C-a hstr -- \C-j"     # bind hstr to Ctrl-r (for Vi mode check doc)

# Enable vi mode
bindkey -v
bindkey -M viins 'jj' vi-cmd-mode

export PATH="$PATH:$HOME/.local/bin:./node_modules/.bin:/home/tim/.npm-global/bin"
