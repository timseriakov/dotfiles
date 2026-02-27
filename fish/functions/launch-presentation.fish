#!/usr/bin/env fish

set -gx TERM xterm-kitty
set -gx YAZI_CONFIG_HOME "$HOME/dev/dotfiles/yazi-presenterm"

cd "$HOME/vaults/default-vault/01 Projects/000. Slides"

yazi

# Закрыть текущее окно kitty после выхода из yazi
kitty @ close-window --self
