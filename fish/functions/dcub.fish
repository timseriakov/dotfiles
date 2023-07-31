function dcub --wraps='docker compose up --build' --description 'alias dcub docker compose up --build'
  docker compose up --build $argv
        
end
