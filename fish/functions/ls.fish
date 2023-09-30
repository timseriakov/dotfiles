function ls --wraps='exa --icons' --description 'alias ls exa --icons'
  exa -s name  --group-directories-first --icons $argv; 
end

