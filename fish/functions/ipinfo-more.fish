function ipinfo-more --wraps='curl ipwho.is' --wraps='curl -s ipwho.is' --description 'alias ipinfo-more curl -s ipwho.is'
  curl -s ipwho.is $argv
        
end
