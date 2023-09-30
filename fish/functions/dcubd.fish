function dcubd --wraps='docker-compose up --build -d' --description 'alias dcubd docker-compose up --build -d'
  docker-compose up --build -d $argv
        
end
