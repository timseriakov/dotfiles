# Tailscale Privileges for OpenClaw

## Управление Tailscale

Используйте команду `ts-admin` для управления Tailscale:

```bash
ts-admin <subcommand>
```

## Безопасные подкоманды

OpenClaw может безопасно использовать следующие подкоманды:

- `ts-admin status` — показать статус соединения
- `ts-admin up` — подключиться к Tailscale
- `ts-admin down` — отключиться от Tailscale
- `ts-admin set` — изменить настройки
- `ts-admin ip` — показать IP-адреса
- `ts-admin ping` — проверить доступность хоста
- `ts-admin netcheck` — диагностика сети
- `ts-admin funnel` — управлять Funnel

## ВАЖНОЕ ПРЕДУПРЕЖДЕНИЕ

**НЕ запускайте произвольные команды `sudo`** — это может нарушить безопасность системы.

OpenClaw имеет ограниченные права только для Tailscale через специально настроенное sudoers-правило.

## Проверка прав

Чтобы убедиться, что права настроены правильно, выполните:

```bash
sudo -l
```

Вы должны увидеть что-то вроде:

```
User openclaw may run the following commands on hostname:
    User $(whoami) may run the following commands on this host:
    (root) NOPASSWD: /Applications/Tailscale.app/Contents/MacOS/Tailscale *
```

## Настройка sudoers

Sudoers-правило настроено через скрипт `setup-openclaw-tailscale-sudo.sh`.

Этот скрипт создаёт правило, которое разрешает пользователю `openclaw` запускать `ts-admin` без пароля.

Никогда не добавляйте другие команды в sudoers без явного разрешения администратора.

## Кратко: что уже сделано

- Скрипт `fish/scripts/setup-openclaw-tailscale-sudo.sh` добавляет sudoers-правило для Tailscale.
- Функция `fish/functions/ts-admin.fish` работает как CLI-обертка для команд `tailscale`.
- В этом файле собраны инструкции по использованию и проверке прав.
- Исправлен баг определения пользователя: используется `$SUDO_USER` вместо `$(whoami)`.
- Изменения зафиксированы в коммите: `feat(tailscale): add OpenClaw CLI access setup`.
