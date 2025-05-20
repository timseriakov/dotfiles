function krc --wraps='nvim ~/.config/.kitty.conf' --wraps='nvim ~/.config/kitty/.kitty.conf' --wraps='nvim ~/.config/kitty/kitty.conf' --description 'alias krc nvim ~/.config/kitty/kitty.conf'
    nvim ~/.config/kitty/kitty.conf $argv
end
