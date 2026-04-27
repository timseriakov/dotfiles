#!/usr/bin/env bash

list_sesh() {
  sesh list "$@" --icons | awk '$2 !~ /^_/'
}


selected="$(
  list_sesh -t | fzf-tmux -p 100%,100% \
    --no-sort --ansi --cycle --layout=reverse --border=none \
    --prompt=' ' \
    --header='  ^a-all ^t-tmux ^g-cfgs ^s-find ^x-kill' \
    --bind='tab:down,btab:up' \
    --bind='ctrl-a:change-prompt( )+reload(list_sesh)' \
    --bind='ctrl-t:change-prompt( )+reload(list_sesh -t)' \
    --bind='ctrl-g:change-prompt( )+reload(list_sesh -c)' \
    --bind='ctrl-s:change-prompt( )+reload(fd -H -d 2 -t d -E .Trash . ~)' \
    --bind='ctrl-x:execute(tmux kill-session -t {2..})+change-prompt( )+reload(list_sesh -t)' \
    --preview-window='right:70%:nowrap:border-left' \
    --preview='sesh preview {}' \
    --color='fg:#D8DEE9,bg:#2E3440,hl:#BF616A,fg+:#E5E9F0,bg+:#3B4252,hl+:#BF616A' \
    --color='info:#81A1C1,prompt:#81A1C1,pointer:#BF616A,marker:#EBCB8B,spinner:#5E81AC,header:#5E81AC,border:#81A1C1'
)"

if [ -n "$selected" ]; then
  sesh connect "$selected"
fi
