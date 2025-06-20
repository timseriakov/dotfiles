function ipinfo --wraps='curl ipinfo.io' --wraps='curl -s ipinfo.io' --description 'alias ipinfo curl -s ipinfo.io'
  curl -s ipinfo.io $argv
        
end
