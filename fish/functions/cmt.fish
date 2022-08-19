function cmt --wraps=cd\ \~/dev/dotfiles\n\ \ \ \ \ \ \ \ \ \ \ \ git\ add\ .\n\ \ \ \ \ \ \ \ \ \ \ \ git\ commit\ -m\ \"add\ something\"\n\ \ \ \ \ \ \ \ \ \ \ \ git\ push\n\ \ \ \ \ \ \ \ \ \ \ \ cd\ - --description alias\ cmt=cd\ \~/dev/dotfiles\n\ \ \ \ \ \ \ \ \ \ \ \ git\ add\ .\n\ \ \ \ \ \ \ \ \ \ \ \ git\ commit\ -m\ \"add\ something\"\n\ \ \ \ \ \ \ \ \ \ \ \ git\ push\n\ \ \ \ \ \ \ \ \ \ \ \ cd\ -
  cd ~/dev/dotfiles
            git add .
            git commit -m "add something"
            git push
            cd - $argv; 
end
