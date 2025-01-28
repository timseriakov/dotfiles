function nrc --wraps='v ~/dev/dotfiles/nvim' --wraps='v ~/dev/dotfiles/nvim/lua/plugins' --wraps='v ~/dev/dotfiles/nvim/lua' --wraps='cd ~/dev/dotfiles/nvim/lua && v .' --description 'alias nrc cd ~/dev/dotfiles/nvim/lua && v .'
  cd ~/dev/dotfiles/nvim/lua && v . $argv
        
end
