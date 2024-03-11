function krc --wraps='lvim ~/.config/.kitty.conf' --wraps='lvim ~/.config/kitty/.kitty.conf' --wraps='lvim ~/.config/kitty/kitty.conf' --description 'alias krc lvim ~/.config/kitty/kitty.conf'
  lvim ~/.config/kitty/kitty.conf $argv
        
end
