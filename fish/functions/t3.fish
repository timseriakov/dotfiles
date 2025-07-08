function t3 --description 'tree --gitignore + copy to clipboard'
    tree --gitignore $argv | tee /dev/tty | cb cp
end
