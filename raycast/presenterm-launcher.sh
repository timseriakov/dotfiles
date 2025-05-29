#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Presenterm
# @raycast.mode silent
# @raycast.icon 🚀
# @raycast.description Choose and launch Presenterm in standalone Kitty
# @raycast.author tim
# @raycast.authorURL https://github.com/timseriakov

env NO_TMUX=1 /Applications/kitty.app/Contents/MacOS/kitty \
  --title "Presenterm" \
  --single-instance \
  -d "$HOME/vaults/default-vault/01 Projects/000. Slides" \
  fish -i -C "source $HOME/dev/dotfiles/fish/functions/launch-presentation.fish" >/dev/null 2>&1 &

exit 0
