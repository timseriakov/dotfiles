# Автоматизация батареи (macOS)

Этот каталог содержит конфиг и документацию для управления батареей Mac через `battery` CLI.

## Что делает система

- Держит батарею в "домашнем" режиме на 75% (`server`).
- Переключает в "мобильный" режим на заданное время (`mobile`).
- Автоматически возвращает `mobile -> server` по таймеру (и опционально по домашнему Wi-Fi SSID).
- Раз в неделю выполняет обслуживание батареи (разряд до 60%, потом обратно в 75%).
- Позволяет одной командой переключать `pmset` профиль "дом/вне дома".

## Быстрый старт

```bash
cd ~/dev/dotfiles/battery
./install.sh
```

После установки основные команды:

- `mode-home`  
  Включает "домашний" профиль: `pmset-server.sh` + `battery server`.
- `mode-away [hours] [--charge]`  
  Включает "мобильный" профиль: `pmset-mobile.sh` + `battery mobile ...`.
- `battery-server`  
  Только батарея: держать 75%.
- `battery-mobile [hours] [--charge]`  
  Только батарея: мобильный режим на `hours` часов (по умолчанию 6).

## Что делает `--charge`

Флаг `--charge` для `battery-mobile`/`mode-away` включает принудительный заряд до 100%.

Примеры:

- `battery-mobile 8 --charge`  
  8 часов mobile + заряд до 100%.
- `mode-away 8 --charge`  
  То же самое, но ещё и с "мобильным" `pmset` профилем.

Если `--charge` не указан, система просто снимает cap `75%` (`battery maintain stop`) и не форсирует заряд до 100%.

## Рекомендуемый сценарий

- Уходишь с ноутом:
  - `mode-away` (или `mode-away 3`, `mode-away 8 --charge`)
- Вернулся домой:
  - `mode-home`

## PMSET-профили

- `~/.local/bin/pmset-server.sh`  
  Сохраняет текущие настройки питания в `config/pmset.before-server.env`, затем включает профиль "не засыпать".
- `~/.local/bin/pmset-mobile.sh`  
  Восстанавливает настройки из `config/pmset.before-server.env`.

Важно: `pmset-mobile.sh` сработает только если раньше запускался `pmset-server.sh` (чтобы был backup-файл).

## Где смотреть логи

- `/tmp/battery-servermode.out`
- `/tmp/battery-servermode.err`
- `/tmp/battery-autoreturn.out`
- `/tmp/battery-autoreturn.err`
- `/tmp/battery-maintenance.out`
- `/tmp/battery-maintenance.err`

Логи самого `battery`:

- `~/.battery/battery.log`
- `~/.battery/gui.log`

## Диагностика

Проверка текущего режима:

```bash
cat ~/dev/dotfiles/battery/config/state.env
```

Проверка текущих `pmset` значений:

```bash
pmset -g custom
```

Проверка launchd-агентов:

```bash
launchctl print "gui/$(id -u)/com.local.battery.servermode" | head
launchctl print "gui/$(id -u)/com.local.battery.autoreturn" | head
launchctl print "gui/$(id -u)/com.local.battery.maintenance" | head
```
