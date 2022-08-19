function lrc --wraps='lvim ~/.config/lvim/' --wraps='lvim ~/.config/lvim/config.lua' --description 'alias lrc lvim ~/.config/lvim/config.lua'
  lvim ~/.config/lvim/config.lua $argv; 
end
