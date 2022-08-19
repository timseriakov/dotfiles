function lvim-restore --wraps='rm -rf lvim && cp -r lvim.bak lvim' --description 'alias lvim-restore rm -rf lvim && cp -r lvim.bak lvim'
  rm -rf lvim && cp -r lvim.bak lvim $argv; 
end
