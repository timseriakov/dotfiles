function fish-restore --wraps='rm -rf fish && cp -r fish.bak fish' --description 'alias fish-restore rm -rf fish && cp -r fish.bak fish'
  rm -rf fish && cp -r fish.bak fish $argv; 
end
