function backup-fish --wraps='rm -rf fish.bak && cp -r fish fish.bak' --description 'alias backup-fish rm -rf fish.bak && cp -r fish fish.bak'
  rm -rf fish.bak && cp -r fish fish.bak $argv; 
end
