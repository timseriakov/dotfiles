#!/usr/bin/env fish
# Конфигурация fifc (gazorby) в стиле Nord

# Основные инструменты
set -gx fifc_editor nvim
set -gx fifc_browser open

# Стиль fzf для fifc (без рамок, левый разделитель для превью)
# Подхватываем твои FZF_DEFAULT_OPTS из 40-plugins.fish, но уточняем для fifc
set -gx fifc_fzf_opts --border=none --preview-window='right:70%:nowrap:border-left'

# Хак для принудительного сдвига разделителя в fifc
function fzf --wraps fzf
    if set -q _fifc_launched_by_fzf
        command fzf --preview-window='right:70%:nowrap:border-left' $argv
    else
        command fzf $argv
    end
end

# Переназначаем клавиши:
# 1. Плагин gazorby/fifc по умолчанию занимает Tab (функция _fifc)
# 2. Переносим стандартное дополнение (complete) на Ctrl+X (\cx)
# (Биндинг Tab для _fifc настраивается через переменную fifc_keybinding в плагине,
# либо он сам встаёт на Tab если не задано иное).

if status is-interactive
    bind \cx complete
    bind -M insert \cx complete
end

# Опции инструментов
set -gx fifc_bat_opts --style=numbers --color=always --theme=Nord
set -gx fifc_fd_opts --hidden --exclude=.git
set -gx fifc_exa_opts --icons --group-directories-first --color=always
set -gx fifc_chafa_opts --animate off --work 1

