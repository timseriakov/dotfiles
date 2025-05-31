set -gx NEOVIDE_TITLE_HIDDEN 1
set -x HOMEBREW_NO_ENV_HINTS 1

set --universal --export fzf_preview_file_cmd 'bat --style changes --decorations never --theme Nord --color=always'
set --universal --export fzf_fd_opts --hidden --exclude=.git
set --universal --export FZF_DEFAULT_OPTS --color fg:#5E81AC,bg:#2E3440,hl:#A3BE8C,fg+:#D8DEE9,bg+:#2E3440,hl+:#A3BE8C --color pointer:#BF616A,info:#4C566A,spinner:#4C566A,header:#4C566A,prompt:#81A1C1,marker:#EBCB8B --cycle --layout=reverse --border --height=90% --preview-window=wrap --marker='*'
set -gx BAT_THEME Nord

# posting
set -gx POSTING_PAGER moar
set -gx POSTING_ANIMATION full
set -gx POSTING_THEME alpine
