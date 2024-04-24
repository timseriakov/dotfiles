function ls --wraps='eza --icons' --description 'alias ls eza --icons'
  exa -s name  --group-directories-first --icons $argv; 
end

