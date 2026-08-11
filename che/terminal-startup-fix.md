# Che/Yazi: задержка запуска в Kitty + tmux

## Симптом

В `che`, запущенном внутри tmux в Kitty, первый кадр мог долго оставаться пустым. В узкой панели `46x39` старый бинарник воспроизводил:

```text
Terminal response timeout: The request sent by Yazi didn't receive a correct response.
Please check your terminal environment as per: https://yazi-rs.github.io/docs/faq#trt
```

Проверенная среда:

```text
tmux 3.6a
TERM=xterm-kitty        # клиент Kitty
TERM_PROGRAM=tmux
Yazi 26.8.7 (968a5571 2026-08-11)
```

## Что было причиной

Запуск делал два лишних синхронных ожидания ответа терминала:

1. `yazi-adapter::init()` сначала выполнял `Emulator::detect()`, который уже получал DA1 и другие capabilities терминала.
2. После включения tmux passthrough он запускал второй `Emulator::detect()`. В этот момент tmux мог не пропустить DA1, поэтому появлялся terminal response timeout.
3. Дополнительно `Emulator::detect()` и `Term::start()` вызывали `Mux::tmux_drain()`. Эта функция отправляла DSR (`CSI 5 n`) и синхронно ждала `CSI 0 n` или `CSI 3 n` до 200 мс. Kitty через tmux 3.6a этот ответ не возвращал. В результате первый кадр блокировался даже после устранения второго probe.

## Исправление

Изменения сделаны в исходном checkout Che/Yazi `/tmp/che-fix-source`, commit `968a5571c684bc7f53fc7b6c0db6009bb274cc22`.

### 1. Не повторять probe

В `yazi-adapter/src/lib.rs` после `Mux::tmux_passthrough()` повторный `Emulator::detect()` заменён использованием уже полученного результата:

```rust
if let Some(brand) = Brand::from_env() {
    emulator.kind = emulator.kind.map_left(|_| brand);
}
```

### 2. Не блокироваться на DSR

В `yazi-emulator/src/mux.rs` `tmux_drain()` больше не ждёт ответ:

```rust
pub fn tmux_drain() -> Result<()> {
    Ok(())
}
```

Остальной tmux passthrough сохранён. `.tmux.conf` менять не потребовалось: Kitty passthrough уже был включён.

## Как воспроизвести старый баг

Сохраняется rollback-бинарник:

```sh
/Users/tim/.local/bin/che.pre-probe-fix
```

Запускать в отдельном tmux server, чтобы не затронуть рабочие сессии:

```sh
set -e

SOCK=che-repro
SESSION=repro
DIR="$HOME/dev/dotfiles/che"
tmux -L "$SOCK" kill-server 2>/dev/null || true
tmux -L "$SOCK" -f /dev/null new-session -d \
  -s "$SESSION" -x 46 -y 39 -c "$DIR" \
  "/bin/sh -c 'exec /Users/tim/.local/bin/che.pre-probe-fix .'"

sleep 0.8
tmux -L "$SOCK" capture-pane -p -J -t "$SESSION:0.0"
tmux -L "$SOCK" kill-server 2>/dev/null || true
```

Ожидаемый результат на проблемной конфигурации: timeout или заметный пустой интервал перед первым кадром.

Для сравнения использовать исправленный бинарник:

```sh
tmux -L che-repro-fixed kill-server 2>/dev/null || true
tmux -L che-repro-fixed -f /dev/null new-session -d \
  -s repro -x 46 -y 39 -c "$HOME/dev/dotfiles/che" \
  "/bin/sh -c 'exec /Users/tim/.local/bin/che .'"
sleep 0.6
tmux -L che-repro-fixed capture-pane -p -J -t repro:0.0
tmux -L che-repro-fixed send-keys -t repro:0.0 Down
sleep 0.15
tmux -L che-repro-fixed capture-pane -p -J -t repro:0.0 | sed -n '1,10p'
tmux -L che-repro-fixed send-keys -t repro:0.0 q
tmux -L che-repro-fixed kill-server 2>/dev/null || true
```

В исправленном варианте должен быть виден интерфейс, `Down` должен менять выделение, а `q` — завершать Che.

## Как пересобрать исправление

Нужны Rust/Cargo и исходники Che:

```sh
git clone https://github.com/aroum/che.git /tmp/che-fix-source
cd /tmp/che-fix-source
git checkout 968a5571c684bc7f53fc7b6c0db6009bb274cc22
```

Применить два изменения из раздела «Исправление», затем собрать locked release:

```sh
cargo build --release --locked
```

Установить бинарники. Сначала удалить старые файлы, а не копировать поверх них: это предотвращает проблемы с заменой исполняемого файла во время работающего процесса.

```sh
rm -f "$HOME/.local/bin/che" "$HOME/.local/bin/ch"
cp target/release/che target/release/ch "$HOME/.local/bin/"
chmod 755 "$HOME/.local/bin/che" "$HOME/.local/bin/ch"

command -v che
che --version
```

Ожидаемый бинарник:

```text
/Users/tim/.local/bin/che
Yazi 26.8.7 (968a5571 2026-08-11)
```

## Проверка лога

Лог Che находится здесь:

```sh
$HOME/.local/state/che/yazi.log
```

Проверить, что старые ошибки не появились снова:

```sh
grep -E 'Terminal response timeout|Terminal failed to respond to DSR|Terminal failed to respond to DA1' \
  "$HOME/.local/state/che/yazi.log"
```

После исправления новых таких сообщений быть не должно. Предупреждение о невозможности определить background color в некоторых tmux-запусках отдельно от этой проблемы и не мешает отрисовке.

## Rollback

Если понадобится сравнение со старой версией:

```sh
cp "$HOME/.local/bin/che" "$HOME/.local/bin/che.fixed"
cp "$HOME/.local/bin/che.pre-probe-fix" "$HOME/.local/bin/che"
```

После теста вернуть исправленный бинарник из `che.fixed` или пересобрать его по инструкции выше.
