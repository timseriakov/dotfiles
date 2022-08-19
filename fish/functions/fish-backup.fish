function fish-backup --wraps='rm -rf fish.bak && cp -r fish fish.bak' --description 'alias fish-backup rm -rf fish.bak && cp -r fish fish.bak'
  rm -rf fish.bak && cp -r fish fish.bak $argv; 
end
