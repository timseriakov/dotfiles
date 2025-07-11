function blw --wraps='backlog browser && backlog browser --port 8080 && backlog browser --no-open' --wraps='backlog browser && backlog browser --no-open' --wraps='backlog browser' --description 'alias blw backlog browser'
  backlog browser $argv
        
end
