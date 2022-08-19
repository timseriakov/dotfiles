function lvim-backup --wraps='rm -rf lvim.bak && cp -r lvim lvim.bak' --description 'alias lvim-backup rm -rf lvim.bak && cp -r lvim lvim.bak'
  rm -rf lvim.bak && cp -r lvim lvim.bak $argv; 
end
