function fcrc --wraps='lvim ~/.config/fish/conf.fish' --wraps='lvim ~/.config/fish/fish.conf' --wraps='lvim ~/.config/fish/config.fish' --description 'alias fcrc lvim ~/.config/fish/config.fish'
  lvim ~/.config/fish/config.fish $argv; 
end
