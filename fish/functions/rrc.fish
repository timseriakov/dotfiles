function rrc --wraps='lvim ~/.config/ranger/' --wraps='lvim ~/.config/ranger/rc.conf' --description 'alias rrc lvim ~/.config/ranger/rc.conf'
  lvim ~/.config/ranger/rc.conf $argv; 
end
