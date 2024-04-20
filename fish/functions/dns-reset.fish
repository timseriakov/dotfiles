function dns-reset --wraps='sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder' --description 'alias dns-reset sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder'
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder $argv
        
end
