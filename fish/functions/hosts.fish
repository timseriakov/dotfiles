function hosts --wraps='sudo vim /etc/hosts' --description 'alias hosts sudo vim /etc/hosts'
  sudo vim /etc/hosts $argv
        
end
