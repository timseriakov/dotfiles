# pi-vim OMP 16 fork prompt

Ты работаешь над форком `lajarre/pi-vim` для OMP / Oh My Pi 16.3.0.

## Цель

Сделать нативный OMP-16-compatible Vim/modal editor plugin без monkey-patching установленного npm-пакета в dotfiles.

## Контекст

- Текущий OMP: `omp/16.3.0`.
- Текущий установленный пакет: `pi-vim 0.12.1`.
- Upstream repo: `https://github.com/lajarre/pi-vim`.
- `pi-vim` сейчас рассчитан на старый Pi runtime:
  - `@earendil-works/pi-coding-agent`
  - `@earendil-works/pi-tui >=0.74.0`
- OMP 16.3.0 использует:
  - `@oh-my-pi/pi-coding-agent`
  - `@oh-my-pi/pi-tui`
- В OMP 16 встроенного Vim mode нет: legacy `edit.mode: "vim"` в settings мапится обратно в `"hashline"`.
- Публичный editor API в текущем `@oh-my-pi/pi-tui/src/components/editor.ts`:
  - `getText(): string`
  - `getLines(): string[]`
  - `getCursor(): { line: number; col: number }`
  - `setText(text: string): void`
- Внутренний editor state теперь private `#state`; нельзя писать в `editor.state`, `preferredVisualCol`, `historyIndex`, `lastAction`, etc.

## Что надо сделать

1. Форкнуть `lajarre/pi-vim`.
2. Переименовать пакет, например `@tim/pi-vim-omp`.
3. Убрать зависимости/импорты `@earendil-works/*`.
4. Перевести runtime imports на OMP 16:
   - `@oh-my-pi/pi-coding-agent`
   - `@oh-my-pi/pi-tui`

   Если OMP plugin resolver не видит эти package imports из plugin dir, решить это внутри форка нормальным способом:
   - documented OMP extension API;
   - host-provided API;
   - минимальный compatibility shim.

   Не оставлять абсолютные пути вида `/Users/tim/.bun/install/global/node_modules/...` как финальное решение.

5. Settings compatibility:
   - старый `settings.ts` вызывает `getGlobalSettings()` / `getProjectSettings()`;
   - в OMP 16 они отсутствуют;
   - для первого working version достаточно вернуть `{}` из disk/project settings path, то есть использовать стандартные настройки `pi-vim`.

   Не добавлять кастомные цвета, IME hooks или clipboard policy.

6. Переписать все обращения к legacy editor internals на публичный API.

   Известные сломанные места:
   - cursor movement;
   - absolute cursor movement;
   - text mutation / delete/change;
   - undo/redo snapshot restore;
   - synthetic edits;
   - vertical movement;
   - line-start movement.

7. Минимально рабочий подход уже проверен:

   ```ts
   private moveCursorToCol(col: number): void {
     const current = this.getCursor().col;
     const key = col < current ? ESC_LEFT : ESC_RIGHT;
     for (let step = Math.abs(col - current); step > 0; step--) {
       super.handleInput(key);
     }
   }
   ```

   `moveCursorToAbsoluteIndex(abs)`:
   - вычисляет `{ line, col }`;
   - уходит в конец через `CTRL_E`;
   - поднимается вверх через `ESC_UP`;
   - уходит в начало строки через `CTRL_A`;
   - двигается до `col`.

   `replaceTextInBuffer(text, cursorAbs)`:

   ```ts
   private replaceTextInBuffer(text: string, cursorAbs: number): void {
     this.setText(text);
     this.moveCursorToAbsoluteIndex(cursorAbs);
   }
   ```

   Минус: `setText()` сбрасывает undo stack. Это приемлемо для первого working fork, но отметить в коде как known limitation.

8. Добавить `jj` для insert → normal:
   - первый `j` задерживается;
   - второй `j` вызывает escape/normal;
   - если следующий символ не `j`, вставить отложенный `j` перед ним.

   Важно: terminal input может приходить пачкой, поэтому printable multi-char input надо разбирать посимвольно до modal dispatch.

9. Проверить функциональный минимум:
   - insert → normal:
     - `Esc`
     - `jj`
   - motions:
     - `0`
     - `w`
     - `b`
     - `e`
   - edits/actions:
     - `x`
     - `dw`
     - `cw`
     - `D`
     - `s`
     - yank/paste, минимум `yw$p` или эквивалент.

10. Проверка должна быть реальной:
    - direct regression на `ModalEditor` допустим как быстрый unit/smoke;
    - обязательно live PTY check через `omp --no-session`, где вводятся реальные bytes и проверяется rendered/editor behavior.

    Нельзя считать label `NORMAL` достаточным доказательством.

## Проверенные expected results из monkey-patch прототипа

- `Esc` и `jj` входят в normal mode.
- `one two three`, `jj`, `0`, `w`, `e`, `b` дают ожидаемые word motions.
- Direct action expectations:
  - `dw` on `one two three` at start → text `two three`, mode `normal`, cursor col `0`.
  - `cw` on `one two three` at start, then `X` → text `Xtwo three`, mode `insert`, cursor col `1`.
  - `x` on `abc` at start → text `bc`, mode `normal`, cursor col `0`.
  - `D` on line → text ``, mode `normal`, cursor col `0`.
  - `s` on `abc`, then `Z` → text `Zbc`, mode `insert`, cursor col `1`.
  - yank/paste path worked in prototype: `one two threeone ` after paste case.
- Live PTY checked sequence:
  - input: `one two three`, `jj`, `0`, `dw`, `cw`, `X`
  - rendered states showed:
    - `one two three`
    - `two three`
    - `three`
    - `Xthree`
  - no `Extension error`.

## Existing prototype reference

- `/Users/tim/dev/dotfiles/omp/apply-omp-monkey-patches.mjs`
- function: `patchPiVimIndex(content)`, around line ~1141.
- It currently monkey-patches installed runtime file:
  - `/Users/tim/.omp/plugins/node_modules/pi-vim/index.ts`

Use this only as migration reference, not as final architecture.

## Acceptance criteria

1. Fork installs in OMP 16.3.0 without dotfiles monkey-patching `node_modules/pi-vim`.
2. OMP startup has no extension error.
3. Prompt starts in INSERT mode.
4. `Esc` and `jj` enter NORMAL mode.
5. Motions `0`, `w`, `b`, `e` work on real prompt text.
6. Actions `x`, `dw`, `cw`, `D`, `s`, yank/paste work on real prompt text.
7. A small regression harness exists and is runnable.
8. Live PTY verification passes.
9. Dotfiles `apply-omp-monkey-patches.mjs` no longer needs the 300-line `pi-vim` runtime compatibility patch; at most it may install/enable the fork if that is how this machine manages OMP plugins.

## Keep it boring

- No new abstraction layer unless needed by two real callsites.
- No speculative full Vim implementation.
- Do not add colors, themes, clipboard policy changes, IME behavior, visual mode polish, or config surface unless required for the functional minimum.
- Fix root causes in the fork, not symptoms in dotfiles.
- If OMP lacks a public editor mutation API, use the smallest working public-API shim and leave a `ponytail:` comment naming the limitation and upgrade path.
