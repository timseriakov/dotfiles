function hosts-restart --wraps='sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder' --description 'alias hosts-restart sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder'
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder $argv
        
end
