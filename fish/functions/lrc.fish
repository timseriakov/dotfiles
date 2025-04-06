function lrc --wraps='lvim ~/.config/lvim/' --wraps='lvim ~/.config/lvim/config.lua' --wraps='cd ~/dev/dotfiles/nvim/lua && v .' --description 'alias lrc cd ~/dev/dotfiles/nvim/lua && v .'
  cd ~/dev/dotfiles/nvim/lua && v . $argv
        
end
