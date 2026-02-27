function dotfiles-pull --wraps=cd\ \~/dev/dotfiles\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ git\ pull\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ cd\ - --description alias\ dotfiles-pull=cd\ \~/dev/dotfiles\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ git\ pull\n\ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ \ cd\ -
  cd ~/dev/dotfiles
                    git pull
                    cd - $argv; 
end
