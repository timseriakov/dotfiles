# Восстановление журнала закрытых вкладок qutebrowser

Если после обновления или переустановки qutebrowser перестал работать список закрытых вкладок (`space H`), нужно заново применить патч к системному файлу браузера.

## Что нужно сделать

Нужно найти файл `tabbedbrowser.py` в директории `site-packages` вашего Python (для Homebrew на macOS это обычно `/opt/homebrew/lib/python3.14/site-packages/qutebrowser/mainwindow/tabbedbrowser.py`) и добавить логику записи в файл `closed-tabs-history`.

### Шаг 1: Импорты

В начале файла добавьте `shutil`, `os`, `tempfile` и убедитесь, что `standarddir` импортирован из `qutebrowser.utils`.

### Шаг 2: Метод `_remove_tab`

Найдите метод `TabbedBrowser._remove_tab`. Внутри него, после блока `elif add_undo:`, вставьте следующий код:

```python
                if not self.is_private:
                    closed_history = os.path.join(
                        standarddir.data(), "closed-tabs-history"
                    )
                    tmp_history = os.path.join(
                        tempfile.gettempdir(), "qute_closed_history_tmp"
                    )
                    url_display = tab.url().toDisplayString()
                    now = datetime.datetime.now().strftime("%Y %B %d %H:%M:%S")
                    new_line = f"{now}|{tab.title()}|{url_display}\n"
                    target_suffix = f"|{url_display}"
                    existing_lines: list[str] = []
                    try:
                        with open(
                            closed_history, "r", encoding="utf-8"
                        ) as history_file:
                            existing_lines = history_file.readlines()
                    except FileNotFoundError:
                        pass
                    except OSError as exc:
                        log.webview.debug("Could not read closed tabs history: %s", exc)

                    filtered_lines: list[str] = []
                    for existing_line in existing_lines[-99:]:
                        if not existing_line.rstrip("\n").endswith(target_suffix):
                            filtered_lines.append(existing_line)
                    filtered_lines.append(new_line)
                    filtered_lines = filtered_lines[-99:]

                    parent_dir = os.path.dirname(closed_history)
                    try:
                        if parent_dir:
                            os.makedirs(parent_dir, exist_ok=True)
                        with open(tmp_history, "w", encoding="utf-8") as tmpf:
                            tmpf.writelines(filtered_lines)
                        shutil.copy(tmp_history, closed_history)
                    except OSError as exc:
                        log.webview.debug(
                            "Could not store closed tabs history: %s", exc
                        )
                    finally:
                        try:
                            os.remove(tmp_history)
                        except OSError:
                            pass
```

## Промт для ИИ (если лень делать руками)

Если вы используете AI-ассистента (например, этого же), просто скопируйте ему этот текст:

> "В qutebrowser (версия 3.x) пропала запись истории закрытых вкладок для юзерскрипта fzfhistory.
> Мне нужно пропатчить файл `/opt/homebrew/lib/python3.14/site-packages/qutebrowser/mainwindow/tabbedbrowser.py` (или актуальный путь к нему).
>
> В методе `TabbedBrowser._remove_tab` нужно добавить запись в `~/.local/share/qutebrowser/closed-tabs-history` (используя `standarddir.data()`).
> Логика:
>
> 1. Игнорировать приватные окна (`if not self.is_private`).
> 2. Формат строки: `YYYY Month DD HH:MM:SS|Заголовок|URL`.
> 3. Дедупликация: если URL уже есть в последних 100 записях, удалить старую запись.
> 4. Ограничение: хранить только последние 100 строк.
> 5. Безопасная запись через временный файл и `shutil.copy`.
> 6. Импортировать необходимые модули: `shutil`, `os`, `tempfile`, `standarddir`."

## Как проверить

После внесения изменений:

1. Перезапустите qutebrowser.
2. Закройте любую вкладку.
3. Проверьте файл: `tail -n 5 ~/Library/Application\ Support/qutebrowser/closed-tabs-history`
4. Нажмите `space H` в браузере.
