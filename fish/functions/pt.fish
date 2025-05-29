function pt
    set file $argv[1]
    if test -z "$file"
        echo "Укажи markdown-файл"
        return 1
    end

    open -na kitty --args fish -c "
        set -gx TERM xterm-kitty
        set -gx PATH $PATH
        cd $PWD
        echo '📄 Запуск presenterm на $file'
        presenterm --theme nord '$file'
        echo '🔚 Нажми Enter для выхода'
        read
    "
end
