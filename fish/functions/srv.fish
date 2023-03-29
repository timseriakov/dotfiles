function srv --wraps='npx http-server .' --description 'alias srv npx http-server .'
  npx http-server . $argv
        
end
