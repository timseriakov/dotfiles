function nn --wraps='neovide --neovim-bin lvim' --wraps='neovide --neovim-bin lvim &' --wraps='neovide --neovim-bin lvim disown' --wraps='nohup neovide --neovim-bin lvim .' --wraps='nohup neovide --neovim-bin lvim . &' --wraps='nohup neovide --neovim-bin lvim . & disown' --wraps='neovide --neovim-bin lvim . & disown' --wraps='nohup neovide --frame none --neovim-bin lvim . & disown' --wraps='nohup neovide --frame=none --multigrid --neovim-bin=lvim . & disown' --wraps='nohup neovide --frame=none --neovim-bin=lvim . & disown' --description 'alias nn nohup neovide --frame=none --neovim-bin=lvim . & disown'
  nohup neovide --frame=none --neovim-bin=lvim . & disown $argv
        
end
