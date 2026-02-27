#!/bin/bash

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"

/opt/homebrew/bin/tmux new-window -t dotfiles -n qrc "nvim ~/dev/dotfiles/qutebrowser/config.py"

open -a kitty
