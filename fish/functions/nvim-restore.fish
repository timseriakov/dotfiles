function nvim-restore --wraps='rm -rf nvim && cp -r nvim.bak nvim' --description 'alias nvim-restore rm -rf nvim && cp -r nvim.bak nvim'
  rm -rf nvim && cp -r nvim.bak nvim $argv; 
end
