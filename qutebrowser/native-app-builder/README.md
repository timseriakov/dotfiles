# qutebrowser macOS Native App Builder

Этот проект создает нативное macOS приложение для qutebrowser, которое:

- Отображается как "qutebrowser" в меню и Activity Monitor (не "Python")
- Содержит полную поддержку кодеков через Homebrew
- Включает все метаданные для правильной интеграции с macOS
- Использует встроенный Python интерпретатор для корректной идентификации процесса

## Быстрый старт

```bash
# Проверить системные требования
make check

# Установить qutebrowser.app
make install
```

## Системные требования

- macOS 10.15+
- Homebrew
- Python 3.13 (через Homebrew)
- qutebrowser (через Homebrew: `brew install qutebrowser`)
- Qt6 (устанавливается автоматически с qutebrowser)

## Использование

### Основные команды

```bash
make check      # Проверить системные требования
make install    # Собрать и установить приложение
make backup     # Создать резервную копию текущей установки
make uninstall  # Удалить qutebrowser.app
make clean      # Очистить артефакты сборки
make help       # Показать справку
```

### Тестирование

```bash
make test       # Протестировать wrapper без установки
```

## Структура файлов

- `qutebrowser-native.m` - Исходный код нативной обертки
- `Info.plist` - Метаданные приложения macOS
- `Makefile` - Система сборки
- `build/` - Папка для артефактов сборки (создается автоматически)

## Что делает нативная обертка

### Основные функции:

1. **Настройка процесса**: Устанавливает имя процесса как "qutebrowser"
2. **Переменные окружения**: Настраивает пути для Python, Qt и кодеков
3. **Интеграция с macOS**: Инициализирует NSApplication для правильной работы с системой
4. **Встроенный Python**: Использует embedded Python interpreter вместо внешнего процесса

### Переменные окружения:

- `PATH`: Включает Homebrew пути
- `QT_PLUGIN_PATH`: Путь к плагинам Qt6
- `QTWEBENGINE_RESOURCES_PATH`: Ресурсы QtWebEngine
- `QT_MAC_*`: Флаги для лучшей интеграции с macOS

## Особенности

### ✅ Что работает:

- Показывается как "qutebrowser" в меню macOS и Activity Monitor
- Полная поддержка кодеков (H.264, H.265, и т.д.)
- Все функции qutebrowser работают корректно
- Интеграция с Spotlight, Dock, и другими системными функциями macOS
- Поддержка различных типов файлов (HTML, изображения, PDF)
- URL schemes (http, https, file)

### ❌ Известные ограничения:

- **Raycast Pro window layouts могут не работать** - это ограничение Qt framework, не нашей реализации
- Qt приложения используют собственную систему управления окнами

### Обходные пути для управления окнами:

- Использовать встроенные горячие клавиши macOS
- Использовать альтернативы: Rectangle, Magnet, BetterSnapTool
- Настроить горячие клавиши в самом qutebrowser

## Установка на новой системе

1. Установить зависимости:

```bash
# Установить Homebrew (если не установлен)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установить qutebrowser с зависимостями
brew install qutebrowser
```

2. Склонировать конфигурацию:

```bash
git clone <your-dotfiles-repo>
cd dotfiles/qutebrowser/scripts
```

3. Собрать и установить:

```bash
make check
make install
```

## Обновление

При обновлении qutebrowser через Homebrew:

```bash
brew update && brew upgrade qutebrowser
make install  # Переустановить wrapper
```

## Отладка

### Проверить статус:

```bash
make check
```

### Тестировать без установки:

```bash
make test
```

### Восстановить из резервной копии:

```bash
make restore
```

### Посмотреть логи:

```bash
# Запустить из терминала для просмотра ошибок
/Applications/qutebrowser.app/Contents/MacOS/qutebrowser
```

## Сравнение с другими подходами

| Подход               | Отображение процесса | Кодеки | Raycast | Сложность |
| -------------------- | -------------------- | ------ | ------- | --------- |
| Homebrew qutebrowser | Python               | ❌     | ❓      | Простая   |
| Официальный .app     | qutebrowser          | ❌     | ❓      | Простая   |
| Наша реализация      | qutebrowser          | ✅     | ❌      | Средняя   |

## Лицензия

Этот проект использует те же лицензии, что и qutebrowser (GPL v3+).
