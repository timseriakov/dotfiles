function nvim-backup --wraps='rm -rf nvim.bak && cp -r nvim nvim.bak' --description 'alias nvim-backup rm -rf nvim.bak && cp -r nvim nvim.bak'
  rm -rf nvim.bak && cp -r nvim nvim.bak $argv; 
end
