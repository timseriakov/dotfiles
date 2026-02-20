config = config
c = c

from modules.base import en, homepage, leader, ss_dir, terminal, timestamp

# Reload
config.bind("e", "reload")
config.bind("у", "reload")

# Tab navigation
config.bind("w", "tab-prev")
config.bind("ц", "tab-prev")
config.bind("r", "tab-next")
config.bind("к", "tab-next")
config.bind("K", "tab-next")
config.bind("Л", "tab-next")
config.bind("J", "tab-prev")
config.bind("О", "tab-prev")
config.bind("<Cmd-k>", "tab-next")
config.bind("<Cmd-л>", "tab-next")
config.bind("<Cmd-j>", "tab-prev")
config.bind("<Cmd-о>", "tab-prev")

# Restore closed tab
config.bind("z", "undo")
config.bind("я", "undo")
config.bind("q", "undo")
config.bind("й", "undo")

config.bind("d", "scroll-page 0 0.5")
config.bind("в", "scroll-page 0 0.5")
config.bind("u", "scroll-page 0 -0.5")
config.bind("г", "scroll-page 0 -0.5")

# Insert mode bindings moved to automatic layout switching section

config.bind("v", "mode-enter caret")

# Passthrough mode toggle (Ctrl+V and Ctrl+A)
config.bind("<Ctrl-v>", "mode-enter passthrough", mode="normal")
config.bind("<Ctrl-v>", "mode-leave", mode="passthrough")
config.bind("<Ctrl-a>", "mode-enter passthrough", mode="normal")
config.bind("<Ctrl-a>", "mode-leave", mode="passthrough")
config.bind("<Ctrl-ф>", "mode-enter passthrough", mode="normal")
config.bind("<Ctrl-ф>", "mode-leave", mode="passthrough")

# Navigation
config.bind("H", "back")
config.bind("Р", "back")
config.bind("L", "forward")
config.bind("Д", "forward")
config.bind("<Cmd-Left>", "back")
config.bind("<Cmd-Right>", "forward")

# Tab opening and search modes - moved to keyboard layout switching section

# Open link in new tab
config.bind("f", "hint links")
config.bind("а", en("hint links"))

# Open link in new tab (background)
config.bind("F", "hint links tab-bg")
config.bind("А", en("hint links tab-bg"))

# Yank current URL or link
config.bind("yy", "yank")
config.bind("нн", "yank")
config.bind("yl", "hint links yank")

# Open copied URL
config.bind("p", "open {clipboard}")
config.bind("з", "open {clipboard}")
config.bind("P", "open --tab {clipboard}")
config.bind("З", "open --tab {clipboard}")

config.bind("x", "tab-close")
config.bind("ч", "tab-close")

config.bind(
    "<Cmd-Shift-w>",
    "tab-close",
)  # For Karabiner cmd+q -> cmd+shift+w mapping
config.bind("<Cmd-q>", "tab-close")  # Direct cmd+q for Russian layout (cmd+й)

# Move tab
config.bind("<", "tab-move -")
config.bind(">", "tab-move +")

config.bind("/", "cmd-set-text /")
config.bind("?", "cmd-set-text ?")

# Swap m and M for bookmarks
# config.bind("m", "bookmark-add")  # Disabled to prevent accidental bookmarks
config.bind("<Ctrl-b>", "bookmark-add")  # Use Ctrl+B instead to prevent accidents
config.bind("M", "quickmark-save")
config.unbind("m")

# macOS-style Preferences: Cmd+,
config.bind("<Cmd-,>", "open qute://settings")

# URL editing - moved to keyboard layout switching section
config.bind("gu", "navigate up")  # go up one level in URL

# Open link in mpv
config.bind(leader + "m", "spawn /opt/homebrew/bin/mpv {url}")
config.bind(leader + "i", "spawn open -a IINA {url}")

# ActivityWatch heartbeat bridge controls
config.bind(leader + "aw", "spawn -u aw-heartbeat-bridge start")
config.bind(leader + "aW", "spawn -u aw-heartbeat-bridge stop")
config.bind(leader + "as", "spawn -u aw-heartbeat-bridge status")

# ActivityWatch tracking toggle (opt-out system: enabled by default)
# Disable: sets flag in both localStorage (persistent) and sessionStorage (session-only for private windows)
config.bind(
    leader + "ad",
    'jseval -q (localStorage.setItem("__qute_aw_tracking_disabled__", "1"), sessionStorage.setItem("__qute_aw_tracking_disabled__", "1"), alert("AW tracking DISABLED (reload pages)"))',
)
# Enable: removes flag from both storages
config.bind(
    leader + "ae",
    'jseval -q (localStorage.removeItem("__qute_aw_tracking_disabled__"), sessionStorage.removeItem("__qute_aw_tracking_disabled__"), alert("AW tracking ENABLED (reload pages)"))',
)

# Insert mode binding moved to automatic layout switching section
config.bind(
    leader + "al",
    f"spawn --detach {terminal} --config-file /Users/tim/dev/dotfiles/qutebrowser/alacritty-popup.toml -e /bin/bash -c 'exec tail -f /tmp/aw-heartbeat-bridge.log'",
)

config.bind(leader + "h", "spawn -u fzfhistory-userscript")
config.bind(leader + "H", "spawn -u fzfhistory-userscript closed-tabs")

# Braindrop (TUI) in Alacritty
config.bind(leader + "b", "spawn -u braindrop")

# Save link to Raindrop
config.bind(leader + "r", "spawn -u raindrop {url} {title}")

# Tor controls - Manage Tor service and proxy for .onion sites
config.bind(leader + "os", "tor-start")  # Start Tor
config.bind(leader + "ox", "tor-stop")  # Stop Tor
config.bind(leader + "oi", "tor-status")  # Tor Info/Status
config.bind(leader + "oo", "tor-toggle")  # Toggle Tor

# Apple Passwords autofill (keychain-login)
config.bind("<Ctrl-Shift-k>", "spawn -u keychain-login")
config.bind("<Ctrl-Shift-k>", "spawn -u keychain-login", mode="insert")
config.bind(leader + "p", "spawn -u keychain-login")
config.bind(leader + "P", "spawn -u keychain-login --pick")

# Autofill password (qpw, WIP)
config.bind(leader + "l", "spawn --userscript qpw")
config.bind(leader + "L", "spawn --userscript qpw --pick")

# Translation
config.bind(
    leader + "tR",
    'jseval --quiet document.dispatchEvent(new KeyboardEvent("keydown", {key: "F2", keyCode: 113}))',
)  # tooltip translation
config.bind(
    leader + "tr",
    'jseval -q (function(){const t="translate.google.com";if(window.location.hostname.includes(t)){const e=new URLSearchParams(window.location.search).get("u");e&&(window.location.href=e)}else{const e="ru",o=`https://translate.google.com/translate?sl=auto&tl=${e}&u=${encodeURIComponent(window.location.href)}`;window.location.href=o}})();',
)  # full page translation toggle
config.bind(
    leader + "ty",
    'jseval -q (function(){const t="translate.yandex.ru";if(window.location.hostname.includes(t)){const u=new URLSearchParams(window.location.search).get("url");u&&(window.location.href=u)}else{const u=encodeURIComponent(window.location.href);window.location.href=`https://translate.yandex.ru/translate?url=${u}&lang=auto-ru`}})();',
)  # yandex translation toggle

# Tab selection - moved to keyboard layout switching section

config.bind(leader + "ce", "config-edit")
config.bind(leader + "ch", "help")
config.bind(
    leader + "cc", "config-source ;; message-info 'Config reloaded'"
)  # reload config
config.bind(
    leader + "сс", "config-source ;; message-info 'Config reloaded'"
)  # reload config
# Settings prompt - moved to keyboard layout switching section

# ui
config.bind(leader + "uu", "config-cycle tabs.show multiple never")
config.bind(leader + "гг", "config-cycle tabs.show multiple never")

config.bind(leader + "us", "config-cycle statusbar.show always in-mode")
config.bind(leader + "uy", "config-cycle statusbar.show always in-mode")
config.bind(leader + "гн", "config-cycle statusbar.show always in-mode")

config.bind(
    leader + "ua", ":set content.autoplay true ;; message-info 'Autoplay enabled'"
)
config.bind(
    leader + "uf", ":set content.autoplay false ;; message-info 'Autoplay disabled'"
)

# Dark mode controls
# - Built-in Qt darkmode toggle on Space u n
config.bind(leader + "un", "config-cycle -p colors.webpage.darkmode.enabled true false")

# dev tools
config.bind(leader + "dd", "devtools")
config.bind(leader + "de", "edit-text")
config.bind(leader + "dc", "cmd-edit")
config.bind(leader + "df", "devtools-focus")
config.bind(leader + "dp", "screenshot " + ss_dir + "qute-" + timestamp + ".png")
config.bind(
    leader + "dy",
    "screenshot --force /tmp/qute-clipboard.png"
    " ;; spawn --userscript copy-png-to-clipboard /tmp/qute-clipboard.png"
    " ;; message-info 'Screenshot copied to clipboard'",
)
config.bind(
    leader + "dY",
    "spawn --userscript fullpage-to-clipboard"
    " ;; message-info 'Full-page capture started'",
)
config.bind(leader + "ds", "view-source --edit")
config.bind(leader + "dz", "view-source")

config.bind(leader + "fc", "hint links yank --rapid")  # Yank link rapidly
config.bind(
    leader + "ff", "hint links tab --rapid"
)  # Open link in new tab (foreground)
config.bind(
    leader + "fb", "hint links tab-bg --rapid"
)  # Open link in new tab (foreground)
config.bind(leader + "fi", "hint inputs")  # Open link in new tab (foreground)
config.bind(leader + "fo", "hint links window")  # Open link in new tab (foreground)
config.bind(
    leader + "fp",
    "hint links run :open -p {hint-url}",
)  # Open link in new tab (foreground)
config.bind(
    leader + "fv",
    "hint links spawn mpv {hint-url}",
)  # Open link in new tab (foreground)
config.bind(
    leader + "fI",
    "hint links spawn open -a IINA {hint-url}",
)  # Open link in IINA (hint)
config.bind(leader + "fy", "hint links yank")  # Open link in new tab (foreground)
config.bind(
    leader + "fx",
    "hint links spawn --detach /usr/bin/open -a 'Helium' {hint-url}",
)  # Open link in Helium (hint)
config.bind(
    leader + "fd",
    "hint links userscript surge-add",
)  # Queue link in Surge (hint)
config.bind(leader + "fD", "spawn -u surge-add --force")  # Queue current URL in Surge

# quitting actions
config.bind(leader + "qd", "tab-close")
config.bind(leader + "qq", "close")
config.bind(leader + "qr", "restart")
config.bind(leader + "qt", "tab-only")  # close all tabs except current
config.bind(leader + "qw", "window-only")  # close all windows except current
config.bind(leader + "x", "quit --save")

# cmd+q will be remapped to cmd+shift+w by Karabiner-Elements for qutebrowser
# This provides consistent "close" behavior (cmd+q) in both tmux and qutebrowser
# without accidental app quit

# tabs
config.bind(leader + "ts", "bookmark-add")
config.bind(leader + "tq", "bookmark-list")
config.bind(leader + "tc", "tab-clone")
config.bind(leader + "td", "tab-clone -w")
config.bind(leader + "tn", "tab-give")  # move tab to new window
config.bind(leader + "th", "history")
config.bind(leader + "tp", "tab-pin")
config.bind(leader + "tt", "tab-pin")
config.bind(leader + "ее", "tab-pin")  # ru

config.bind(
    leader + "n", en(f"open -w {homepage}")
)  # New window (leader+n) with EN layout
config.bind(
    leader + "т", en(f"open -w {homepage}")
)  # New window (leader+n, Russian layout) with EN layout
config.bind("<Cmd-n>", en(f"open -w {homepage}"))  # New window (Cmd+N) with EN layout
config.bind(
    "<Cmd-т>", en(f"open -w {homepage}")
)  # New window (Cmd+N, Russian layout) with EN layout
config.bind(
    leader + "tg",
    "spawn --detach /usr/bin/open -a 'Helium' {url}",
)  # Open current URL in Helium
config.bind(leader + "ti", "open -p")  # Open new private window
config.bind(
    "<Cmd-Shift-N>", "open -p"
)  # macOS standard incognito shortcut (Cmd+Shift+N)

# sessions
# Interactive prompts leverage completion for existing session names.
config.bind(leader + "sc", "session-clean ;; message-info 'Sessions cleaned'")
config.bind(leader + "sz", "config-cycle -p session.lazy_restore true false")
