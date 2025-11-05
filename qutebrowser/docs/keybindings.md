> Leader is mapped to <kbd>Space</kbd> by default

## Bookmark Bindings

| Shortcut | Action |
|---|---|
| <kbd>Ctrl+b</kbd> | bookmark-add |
| <kbd>M</kbd> | quickmark-save |

## Clipboard Bindings

| Shortcut | Action |
|---|---|
| <kbd>p</kbd> | open --clipboard |
| <kbd>P</kbd> | open --clipboard --tab |

## Config Bindings

| Shortcut | Action |
|---|---|
| <kbd>e</kbd> | reload |
| <kbd>Leader</kbd> <kbd>ce</kbd> | config-edit |
| <kbd>Leader</kbd> <kbd>ch</kbd> | help |
| <kbd>Leader</kbd> <kbd>cc</kbd> | config-source (reload config) |
| <kbd>Leader</kbd> <kbd>cS</kbd> | cmd-set-text -s :set -t |

## Developer Bindings

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>dd</kbd> | devtools |
| <kbd>Leader</kbd> <kbd>de</kbd> | edit-text |
| <kbd>Leader</kbd> <kbd>dc</kbd> | cmd-edit |
| <kbd>Leader</kbd> <kbd>df</kbd> | devtools-focus |
| <kbd>Leader</kbd> <kbd>dp</kbd> | screenshot (timestamped) |
| <kbd>Leader</kbd> <kbd>ds</kbd> | view-source --edit |
| <kbd>Leader</kbd> <kbd>dz</kbd> | view-source |

## Find Bindings

| Shortcut | Action |
|---|---|
| <kbd>/</kbd> | cmd-set-text / |
| <kbd>?</kbd> | cmd-set-text ? |

## Generic Bindings

| Shortcut | Action |
|---|---|
| <kbd>d</kbd> | scroll-page 0 0.5 |
| <kbd>u</kbd> | scroll-page 0 -0.5 |
| <kbd>t</kbd> | cmd-set-text -s :open -t |
| <kbd>x</kbd> | tab-close |
| <kbd><</kbd> | tab-move - |
| <kbd>></kbd> | tab-move + |
| <kbd>H</kbd> | back |
| <kbd>L</kbd> | forward |
| <kbd>ge</kbd> | cmd-set-text -s :open {url} (edit url) |
| <kbd>gu</kbd> | navigate up |

## Hints Bindings

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>fc</kbd> | hint links yank --rapid |
| <kbd>Leader</kbd> <kbd>ff</kbd> | hint links tab --rapid |
| <kbd>Leader</kbd> <kbd>fb</kbd> | hint links tab-bg --rapid |
| <kbd>Leader</kbd> <kbd>fi</kbd> | hint inputs |
| <kbd>Leader</kbd> <kbd>fo</kbd> | hint links window |
| <kbd>Leader</kbd> <kbd>fp</kbd> | hint links run :open -p {hint-url} |
| <kbd>Leader</kbd> <kbd>fv</kbd> | hint links spawn mpv {hint-url} |
| <kbd>Leader</kbd> <kbd>fy</kbd> | hint links yank |
| <kbd>Leader</kbd> <kbd>fx</kbd> | hint links spawn --detach /usr/bin/open -a 'Helium' {hint-url} |

## Link Handling Bindings

| Shortcut | Action |
|---|---|
| <kbd>f</kbd> | hint links |
| <kbd>F</kbd> | hint links tab-bg |

## Mode Bindings

| Shortcut | Action |
|---|---|
| <kbd>i</kbd> | mode-enter insert |
| <kbd>a</kbd> | mode-enter insert |
| <kbd>v</kbd> | mode-enter caret |
| <kbd>Ctrl+v</kbd> | mode-enter passthrough (toggle) |
| <kbd>Ctrl+a</kbd> | mode-enter passthrough (toggle) |

## Quit Bindings

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>qd</kbd> | tab-close |
| <kbd>Leader</kbd> <kbd>qq</kbd> | close |
| <kbd>Leader</kbd> <kbd>qr</kbd> | restart |
| <kbd>Leader</kbd> <kbd>qt</kbd> | tab-only (close all tabs except current) |
| <kbd>Leader</kbd> <kbd>qw</kbd> | window-only (close all windows except current) |
| <kbd>Leader</kbd> <kbd>x</kbd> | quit --save |

## Tab Navigation Bindings

| Shortcut | Action |
|---|---|
| <kbd>w</kbd> | tab-prev |
| <kbd>r</kbd> | tab-next |
| <kbd>K</kbd> | tab-prev |
| <kbd>J</kbd> | tab-next |
| <kbd>q</kbd> | undo |

## Tabs Bindings

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>ta</kbd> | bookmark-add |
| <kbd>Leader</kbd> <kbd>tb</kbd> | bookmark-list |
| <kbd>Leader</kbd> <kbd>tc</kbd> | tab-clone |
| <kbd>Leader</kbd> <kbd>td</kbd> | tab-clone -w |
| <kbd>Leader</kbd> <kbd>tn</kbd> | tab-give (move tab to new window) |
| <kbd>Leader</kbd> <kbd>tw</kbd> | cmd-set-text -s :tab-take (move tab to selected window) |
| <kbd>Leader</kbd> <kbd>th</kbd> | history |
| <kbd>Leader</kbd> <kbd>tm</kbd> | cmd-set-text -s :tab-move |
| <kbd>Leader</kbd> <kbd>tp</kbd> | tab-pin |
| <kbd>Leader</kbd> <kbd>tt</kbd> | cmd-set-text -s :tab-select |
| <kbd>Leader</kbd> <kbd>tx</kbd> | spawn --detach /usr/bin/open -a 'Helium' {url} |
| <kbd>Leader</kbd> <kbd>ti</kbd> | open -p (new private window) |

## UI Bindings

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>uu</kbd> | config-cycle tabs.show multiple never |
| <kbd>Leader</kbd> <kbd>us</kbd> | config-cycle statusbar.show always in-mode |
| <kbd>Leader</kbd> <kbd>un</kbd> | config-cycle colors.webpage.darkmode.enabled true false |
| <kbd>Leader</kbd> <kbd>ua</kbd> | :set content.autoplay true ;; message-info 'Autoplay enabled' |
| <kbd>Leader</kbd> <kbd>uf</kbd> | :set content.autoplay false ;; message-info 'Autoplay disabled' |

## Yank Bindings

| Shortcut | Action |
|---|---|
| <kbd>yy</kbd> | yank |
| <kbd>yl</kbd> | hint links yank |

## Media & External Apps

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>m</kbd> | spawn /opt/homebrew/bin/mpv {url} |
| <kbd>Leader</kbd> <kbd>ad</kbd> | download {url} |
| <kbd>Leader</kbd> <kbd>aa</kbd> | download-cancel |
| <kbd>Leader</kbd> <kbd>b</kbd> | spawn -u braindrop |
| <kbd>Leader</kbd> <kbd>r</kbd> | spawn -u raindrop {url} {title} |

## Password Management (Login)

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>p</kbd> | keychain-login (Apple Passwords, быстрый) |
| <kbd>Leader</kbd> <kbd>P</kbd> | keychain-login --pick (выбор записи Apple Passwords) |
| <kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>K</kbd> | keychain-login (Apple Passwords, shortcut) |

> Примечание: `keychain-login` использует `apw` (Apple Passwords CLI). Перед использованием установите `brew install bendews/homebrew-tap/apw`, запустите `brew services start apw` и выполните `apw auth`.

## History & Sessions

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>h</kbd> | spawn -u fzfhistory-userscript |
| <kbd>Leader</kbd> <kbd>H</kbd> | spawn -u fzfhistory-userscript closed-tabs |
| <kbd>Leader</kbd> <kbd>ss</kbd> | cmd-set-text -s :session-save |
| <kbd>Leader</kbd> <kbd>sl</kbd> | cmd-set-text -s :session-load |
| <kbd>Leader</kbd> <kbd>sd</kbd> | cmd-set-text -s :session-delete |
| <kbd>Leader</kbd> <kbd>sr</kbd> | cmd-set-text -s :session-rename |
| <kbd>Leader</kbd> <kbd>sc</kbd> | session-clean |
| <kbd>Leader</kbd> <kbd>sz</kbd> | config-cycle -p session.lazy_restore true false |

## Translation

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>tR</kbd> | tooltip translation (F2 key dispatch) |
| <kbd>Leader</kbd> <kbd>tr</kbd> | full page translation toggle |

## ActivityWatch

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>aw</kbd> | spawn -u aw-heartbeat-bridge start |
| <kbd>Leader</kbd> <kbd>aW</kbd> | spawn -u aw-heartbeat-bridge stop |
| <kbd>Leader</kbd> <kbd>as</kbd> | spawn -u aw-heartbeat-bridge status |
| <kbd>Leader</kbd> <kbd>al</kbd> | spawn --detach kitty -e tail -f /tmp/aw-heartbeat-bridge.log |

## Zoom Bindings

| Shortcut | Action |
|---|---|
| <kbd>Ctrl+=</kbd> | zoom-in |
| <kbd>Ctrl+-</kbd> | zoom-out |

## Special Bindings

| Shortcut | Action |
|---|---|
| <kbd>Leader</kbd> <kbd>Leader</kbd> | cmd-set-text -s :tab-select |
| <kbd>Cmd+,</kbd> | open qute://settings |

## Search Engines

| Keybinding | Action |
|---|---|
| <kbd>DEFAULT</kbd> | [Google](https://google.com/search?q={...}) |
| <kbd>dd</kbd> | [Duckduckgo](https://duckduckgo.com/?q={...}) |
| <kbd>gh</kbd> | [Github](https://github.com/search?q={...}) |
| <kbd>gg</kbd> | [Google](https://google.com/search?q={...}) |
| <kbd>gho</kbd> | [Github](https://github.com/{...}) |
| <kbd>ghr</kbd> | [Github](https://github.com/timseriakov/{...}) |
| <kbd>yt</kbd> | [Youtube](https://youtube.com/results?search_query={...}) |

To edit keybindings visit: [config.py](./config.py)
