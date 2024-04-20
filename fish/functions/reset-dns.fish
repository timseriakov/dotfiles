function reset-dns --wraps='sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder' --description 'alias reset-dns sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder'
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder $argv
        
end
