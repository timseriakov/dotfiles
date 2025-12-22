# Documentation:
#   qute://help/configuring.html
#   qute://help/settings.html

from time import localtime, strftime
import os

# Reassign to avoid lsp errors
config = config  # type: ignore[name-defined]  # noqa: F821
c = c  # type: ignore[name-defined]  # noqa: F821

config.load_autoconfig()

# User agent (default for all sites)
config.set(
    "content.headers.user_agent",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/143.0.0.0 Safari/537.36",
)
# Google-specific UA override
config.set(
    "content.headers.user_agent",
    "Mozilla/5.0 ({os_info}) AppleWebKit/{webkit_version} (KHTML, like Gecko) Chrome/133.0.0.0 Safari/{webkit_version} Edg/131.0.2903.86",
    "https://accounts.google.com/*",
)
# Standard headers for all sites (навигационный профиль)
config.set("content.headers.accept_language", "en-US,en;q=0.9")
config.set(
    "content.headers.custom",
    {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
    },
)

# Variables
leader = " "
ss_dir = "~/Documents/screenshots"
# updates on every config-source
timestamp = strftime("%Y-%m-%d-%H-%M-%S", localtime())
terminal = "/opt/homebrew/bin/alacritty"
editor = "/opt/homebrew/bin/nvim"
username = "timseriakov"
homepage = "http://localhost:1931"
# c.content.user_stylesheets = ['~/.qutebrowser/styles/tooltip.css']

config.set("content.autoplay", False)

# Note: userscripts directory is ~/.qutebrowser/userscripts (symlinked to repo)

# Short helper for English layout switching
def en(cmd):
    return f"spawn -u switch-to-english ;; {cmd}"

# Enable mouse back/forward buttons
c.input.mouse.back_forward_buttons = True

# General
c.editor.command = ["/usr/local/bin/fish", "-lc", f"{terminal} -e {editor} {{}}"]
c.auto_save.session = True
c.session.lazy_restore = True
c.zoom.default = "100%"
c.window.hide_decoration = True

# Note: cmd+q override is handled by Karabiner-Elements at system level
# See karabiner/karabiner.json for the rule that maps cmd+q to cmd+shift+w in qutebrowser

# Layout
c.scrolling.bar = "when-searching"
c.statusbar.show = "in-mode"
c.tabs.show = "always" # multiple # never
c.tabs.last_close = "close"
c.tabs.position = "top"
# c.tabs.new_position.related = "last"
# Open new tabs in background (e.g., middle-click on links)
c.tabs.background = True

# Downloads
c.downloads.location.directory = "~/Downloads"
c.downloads.remove_finished = 5000
c.downloads.position = "bottom"
c.downloads.location.suggestion = "both"

# Dark mode
c.colors.webpage.darkmode.enabled = True
c.colors.webpage.preferred_color_scheme = "dark"

# File handling
# c.fileselect.handler = "external"
# c.fileselect.single_file.command = [terminal, "-e", "ranger", "--choosefile", "{}"]
# c.fileselect.multiple_files.command = [terminal, "-e", "ranger", "--choosefiles", "{}"]

# Nord Palette
nord0  = "#2e3440"
nord1  = "#3b4252"
nord2  = "#434c5e"
nord3  = "#4c566a"
nord4  = "#d8dee9"
nord5  = "#e5e9f0"
nord6  = "#eceff4"
nord7  = "#8fbcbb"
nord8  = "#88c0d0"
nord9  = "#81a1c1"
nord10 = "#5e81ac"
nord11 = "#bf616a"
nord12 = "#d08770"
nord13 = "#ebcb8b"
nord14 = "#a3be8c"
nord15 = "#b48ead"

# Colors
accent = nord8
black = nord0
white = nord6
red   = nord11
green = nord14
yellow = nord13
blue = nord10
purple = nord15

# Completion
c.colors.completion.category.bg = nord0
c.colors.completion.category.border.bottom = "transparent"
c.colors.completion.category.border.top = "transparent"
c.colors.completion.category.fg = nord5
c.colors.completion.even.bg = nord1
c.colors.completion.odd.bg = nord3
c.colors.completion.fg = nord5
c.colors.completion.item.selected.bg = "#5E81AC"
c.colors.completion.item.selected.fg = nord5
c.colors.completion.item.selected.border.top = "transparent"
c.colors.completion.item.selected.border.bottom = "transparent"
c.colors.completion.item.selected.match.fg = nord13
c.colors.completion.match.fg = nord13
c.colors.completion.scrollbar.bg = nord2
c.colors.completion.scrollbar.fg = nord8

# Prompts
c.colors.prompts.bg = nord1
c.colors.prompts.fg = nord6
c.colors.prompts.selected.bg = nord3

# Downloads
c.colors.downloads.bar.bg = black
c.colors.downloads.error.bg = red
c.colors.downloads.error.fg = white
c.colors.downloads.start.bg = blue
c.colors.downloads.stop.bg = green

# Hints
c.colors.hints.bg = nord3  # darker grey for better contrast
c.colors.hints.fg = nord6  # bright white text
c.colors.hints.match.fg = accent
c.hints.border = f"1px solid {accent}"
c.hints.chars = "asdfghjklwertyuio"
c.hints.min_chars = 1

# Messages
c.messages.timeout = 2500  # auto-hide messages after 2.5s
c.colors.messages.info.bg = black
c.colors.messages.info.fg = white
c.colors.messages.error.bg = red
c.colors.messages.error.fg = white
c.colors.messages.warning.bg = yellow
c.colors.messages.warning.fg = black

# Statusbar
c.colors.statusbar.normal.bg = nord0
c.colors.statusbar.normal.fg = "#6C7086"
c.colors.statusbar.command.bg = nord0
c.colors.statusbar.command.fg = white
c.colors.statusbar.insert.bg = "#5E81AC" # "#A3BE8C" #  "#00BAC7" # "#3D6164" # "#00754a"
c.colors.statusbar.insert.fg = black
c.colors.statusbar.passthrough.bg = nord3  # темно-серый вместо фиолетового для лучшей видимости URL
c.colors.statusbar.passthrough.fg = white
c.colors.statusbar.private.bg = nord3
c.colors.statusbar.private.fg = white
c.colors.statusbar.url.fg = white
c.colors.statusbar.url.error.fg = red
c.colors.statusbar.url.hover.fg = blue
c.colors.statusbar.url.success.http.fg = nord8
c.colors.statusbar.url.success.https.fg = nord8
c.colors.statusbar.url.warn.fg = yellow

# Tabs
c.colors.tabs.bar.bg = black
c.tabs.padding = {"top": 4, "bottom": 4, "left": 3, "right": 3}
c.statusbar.padding = {"top": 4, "bottom": 4, "left": 3, "right": 3}

# Tabs
c.colors.tabs.even.bg = nord0
c.colors.tabs.odd.bg = nord0
c.colors.tabs.even.fg = nord5
c.colors.tabs.odd.fg = nord5
c.colors.tabs.selected.even.bg = nord8
c.colors.tabs.selected.even.fg = nord1
c.colors.tabs.selected.odd.bg = nord8
c.colors.tabs.selected.odd.fg = nord1
c.colors.tabs.pinned.even.bg = nord9
c.colors.tabs.pinned.even.fg = nord1
c.colors.tabs.pinned.odd.bg = nord9
c.colors.tabs.pinned.odd.fg = nord1
c.colors.tabs.pinned.selected.even.bg = nord8
c.colors.tabs.pinned.selected.even.fg = nord1
c.colors.tabs.pinned.selected.odd.bg = nord8
c.colors.tabs.pinned.selected.odd.fg = nord1

# Tab loading indicator
c.tabs.indicator.width = 7  # width in pixels (0 to disable)
c.colors.tabs.indicator.start = "#F90"     # bright orange - loading in progress
c.colors.tabs.indicator.stop = "#00A86E"   # bright green - loaded successfully
c.colors.tabs.indicator.error = "#FF2B3A"  # bright red - loading error
c.colors.tabs.indicator.system = 'none'    # no gradient, instant color change

# Font
font_size = "18pt"
font_family = "Share Tech Mono"
c.fonts.default_size = font_size
c.fonts.default_family = font_family
c.fonts.completion.entry = f"{font_size} {font_family}"
c.fonts.hints = f"15pt {font_family}"
c.fonts.debug_console = f"{font_size} {font_family}"
c.fonts.prompts = f"{font_size} {font_family}"
c.fonts.statusbar = f"{font_size} {font_family}"

# Webpage BG
c.colors.webpage.bg = black

# Home page
c.url.default_page = homepage
c.url.start_pages = homepage

# Search engines
c.url.searchengines = {
    "DEFAULT": "https://google.com/search?q={}",
    "dd": "https://duckduckgo.com/?q={}",
    "gh": "https://github.com/search?q={}",
    "gg": "https://google.com/search?q={}",
    "gho": "https://github.com/{}",
    "ghr": "https://github.com/" + username + "/{}",
    "yt": "https://youtube.com/results?search_query={}",
}

# Aliases
c.aliases = {
    "o": "open",
    "Q": "close",
    "w": "session-save",
    "x": "quit --save",
    "ms": "messages",
    "qq": "quit --save",  # Safe quit alias for intentional app exit
}

# Reload
config.bind("e", "reload")
config.bind("у", "reload")

# Tab navigation
config.bind("w", "tab-prev")
config.bind("ц", "tab-prev")
config.bind("r", "tab-next")
config.bind("к", "tab-next")
config.bind("K", "tab-prev")
config.bind("Л", "tab-prev")
config.bind("J", "tab-next")
config.bind("О", "tab-next")
config.bind("<Cmd-k>", "tab-prev")
config.bind("<Cmd-л>", "tab-prev")
config.bind("<Cmd-j>", "tab-next")
config.bind("<Cmd-о>", "tab-next")

# Restore closed tab
config.bind("q", "undo")
config.bind("й", "undo")

config.bind('d', 'scroll-page 0 0.5')
config.bind('в', 'scroll-page 0 0.5')
config.bind('u', 'scroll-page 0 -0.5')
config.bind('г', 'scroll-page 0 -0.5')

# Insert mode bindings moved to automatic layout switching section

config.bind("v", "mode-enter caret")

# Passthrough mode toggle (Ctrl+V and Ctrl+A)
config.bind("<Ctrl-v>", "mode-enter passthrough", mode="normal")
config.bind("<Ctrl-v>", "mode-leave", mode="passthrough")
config.bind("<Ctrl-a>", "mode-enter passthrough", mode="normal")
config.bind("<Ctrl-a>", "mode-leave", mode="passthrough")

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
config.bind("<Cmd-Shift-w>", "tab-close")  # For Karabiner cmd+q -> cmd+shift+w mapping
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
config.bind("gu", "navigate up") # go up one level in URL

# Open link in mpv
config.bind(leader + "m", "spawn /opt/homebrew/bin/mpv {url}")
config.bind(leader + "i", "spawn open -a IINA {url}")

# ActivityWatch heartbeat bridge controls
config.bind(leader + 'aw', 'spawn -u aw-heartbeat-bridge start')
config.bind(leader + 'aW', 'spawn -u aw-heartbeat-bridge stop')
config.bind(leader + 'as', 'spawn -u aw-heartbeat-bridge status')

# ActivityWatch tracking toggle (opt-out system: enabled by default)
# Disable: sets flag in both localStorage (persistent) and sessionStorage (session-only for private windows)
config.bind(leader + 'ad', 'jseval -q (localStorage.setItem("__qute_aw_tracking_disabled__", "1"), sessionStorage.setItem("__qute_aw_tracking_disabled__", "1"), alert("AW tracking DISABLED (reload pages)"))')
# Enable: removes flag from both storages
config.bind(leader + 'ae', 'jseval -q (localStorage.removeItem("__qute_aw_tracking_disabled__"), sessionStorage.removeItem("__qute_aw_tracking_disabled__"), alert("AW tracking ENABLED (reload pages)"))')

# Insert mode binding moved to automatic layout switching section
config.bind(leader + 'al', f"spawn --detach {terminal} --config-file /Users/tim/dev/dotfiles/qutebrowser/alacritty-popup.toml -e /bin/bash -c 'exec tail -f /tmp/aw-heartbeat-bridge.log'")

config.bind(leader + 'h', 'spawn -u fzfhistory-userscript')
config.bind(leader + 'H', 'spawn -u fzfhistory-userscript closed-tabs')

# Braindrop (TUI) in Alacritty
config.bind(leader + 'b', 'spawn -u braindrop')

# Save link to Raindrop
config.bind(leader + 'r', "spawn -u raindrop {url} {title}")

# Tor aliases for cleaner bindings
c.aliases.update({
    'tor-start': 'spawn -u tor-toggle start',
    'tor-stop': 'spawn -u tor-toggle stop',
    'tor-status': 'spawn -u tor-toggle status',
    'tor-toggle': 'spawn -u tor-toggle toggle',
})

# Tor controls - Manage Tor service and proxy for .onion sites
config.bind(leader + 'os', 'tor-start')    # Start Tor
config.bind(leader + 'ox', 'tor-stop')     # Stop Tor
config.bind(leader + 'oi', 'tor-status')   # Tor Info/Status
config.bind(leader + 'oo', 'tor-toggle')   # Toggle Tor

c.input.mode_override = None

# Apple Passwords autofill (keychain-login)
config.bind('<Ctrl-Shift-k>', 'spawn -u keychain-login')
config.bind('<Ctrl-Shift-k>', 'spawn -u keychain-login', mode='insert')
config.bind(leader + 'p', 'spawn -u keychain-login')
config.bind(leader + 'P', 'spawn -u keychain-login --pick')

# Autofill password (qpw, WIP)
config.bind(leader + 'l', 'spawn --userscript qpw')
config.bind(leader + 'L', 'spawn --userscript qpw --pick')


# ActivityWatch heartbeat bridge controls
config.bind(leader + 'aw', 'spawn -u aw-heartbeat-bridge start')
config.bind(leader + 'aW', 'spawn -u aw-heartbeat-bridge stop')
config.bind(leader + 'as', 'spawn -u aw-heartbeat-bridge status')

# ActivityWatch tracking toggle (opt-out system: enabled by default)
# Disable: sets flag in both localStorage (persistent) and sessionStorage (session-only for private windows)
config.bind(leader + 'ad', 'jseval -q (localStorage.setItem("__qute_aw_tracking_disabled__", "1"), sessionStorage.setItem("__qute_aw_tracking_disabled__", "1"), alert("AW tracking DISABLED (reload pages)"))')
# Enable: removes flag from both storages
config.bind(leader + 'ae', 'jseval -q (localStorage.removeItem("__qute_aw_tracking_disabled__"), sessionStorage.removeItem("__qute_aw_tracking_disabled__"), alert("AW tracking ENABLED (reload pages)"))')

# Insert mode binding moved to automatic layout switching section
config.bind(leader + 'al', f"spawn --detach {terminal} --config-file /Users/tim/dev/dotfiles/qutebrowser/alacritty-popup.toml -e /bin/bash -c 'exec tail -f /tmp/aw-heartbeat-bridge.log'")

# Translation
config.bind(leader + 'tR', 'jseval --quiet document.dispatchEvent(new KeyboardEvent("keydown", {key: "F2", keyCode: 113}))') # tooltip translation
config.bind(leader + 'tr', 'jseval -q (function(){const t="translate.google.com";if(window.location.hostname.includes(t)){const e=new URLSearchParams(window.location.search).get("u");e&&(window.location.href=e)}else{const e="ru",o=`https://translate.google.com/translate?sl=auto&tl=${e}&u=${encodeURIComponent(window.location.href)}`;window.location.href=o}})();') # full page translation toggle

# Tab selection - moved to keyboard layout switching section

config.bind(leader + "ce", "config-edit")
config.bind(leader + "ch", "help")
config.bind(leader + "cc", "config-source ;; message-info 'Config reloaded'") # reload config
config.bind(leader + "сс", "config-source ;; message-info 'Config reloaded'") # reload config
# Settings prompt - moved to keyboard layout switching section

# ui
config.bind(leader + "uu", "config-cycle tabs.show multiple never")
config.bind(leader + "гг", "config-cycle tabs.show multiple never")

config.bind(leader + "us", "config-cycle statusbar.show always in-mode")
config.bind(leader + "uy", "config-cycle statusbar.show always in-mode")
config.bind(leader + "гн", "config-cycle statusbar.show always in-mode")

config.bind(leader + "ua", ":set content.autoplay true ;; message-info 'Autoplay enabled'")
config.bind(leader + "uf", ":set content.autoplay false ;; message-info 'Autoplay disabled'")

# Dark mode controls
# - Built-in Qt darkmode toggle on Space u n
config.bind(leader + 'un', "config-cycle -p colors.webpage.darkmode.enabled true false")

# dev tools
config.bind(leader + "dd", "devtools")
config.bind(leader + "de", "edit-text")
config.bind(leader + "dc", "cmd-edit")
config.bind(leader + "df", "devtools-focus")
config.bind(leader + "dp", "screenshot " + ss_dir + "qute-" + timestamp + ".png")
config.bind(leader + "ds", "view-source --edit")
config.bind(leader + "dz", "view-source")

config.bind(leader + "fc", "hint links yank --rapid") # Yank link rapidly
config.bind(leader + "ff", "hint links tab --rapid") # Open link in new tab (foreground)
config.bind(leader + "fb", "hint links tab-bg --rapid") # Open link in new tab (foreground)
config.bind(leader + "fi", "hint inputs") # Open link in new tab (foreground)
config.bind(leader + "fo", "hint links window") # Open link in new tab (foreground)
config.bind(leader + "fp", "hint links run :open -p {hint-url}") # Open link in new tab (foreground)
config.bind(leader + "fv", "hint links spawn mpv {hint-url}") # Open link in new tab (foreground)
config.bind(leader + "fI", "hint links spawn open -a IINA {hint-url}") # Open link in IINA (hint)
config.bind(leader + "fy", "hint links yank") # Open link in new tab (foreground)
config.bind(leader + "fx", "hint links spawn --detach /usr/bin/open -a 'Helium' {hint-url}") # Open link in Helium (hint)

# quitting actions
config.bind(leader + "qd", "tab-close")
config.bind(leader + "qq", "close")
config.bind(leader + "qr", "restart")
config.bind(leader + "qt", "tab-only") # close all tabs except current
config.bind(leader + "qw", "window-only") # close all windows except current
config.bind(leader + "x", "quit --save")

# cmd+q will be remapped to cmd+shift+w by Karabiner-Elements for qutebrowser
# This provides consistent "close" behavior (cmd+q) in both tmux and qutebrowser
# without accidental app quit

# tabs
config.bind(leader + "ts", "bookmark-add")
config.bind(leader + "tq", "bookmark-list")
config.bind(leader + "tc", "tab-clone")
config.bind(leader + "td", "tab-clone -w")
config.bind(leader + "tn", "tab-give") # move tab to new window
config.bind(leader + "th", "history")
config.bind(leader + "tp", "tab-pin")
config.bind(leader + "n", en(f"open -w {homepage}"))  # New window (leader+n) with EN layout
config.bind(leader + "т", en(f"open -w {homepage}"))  # New window (leader+n, Russian layout) with EN layout
config.bind("<Cmd-n>", en(f"open -w {homepage}"))  # New window (Cmd+N) with EN layout
config.bind("<Cmd-т>", en(f"open -w {homepage}"))  # New window (Cmd+N, Russian layout) with EN layout
# Tab prompts with text input - moved to keyboard layout switching section
config.bind(leader + "tx", "spawn --detach /usr/bin/open -a 'Helium' {url}") # Open current URL in Helium
config.bind(leader + "ti", "open -p") # Open new private window
config.bind("<Cmd-Shift-N>", "open -p")  # macOS standard incognito shortcut (Cmd+Shift+N)

# sessions
# Interactive prompts leverage completion for existing session names.
# Session prompts with text input - moved to keyboard layout switching section
config.bind(leader + "sc", "session-clean ;; message-info 'Sessions cleaned'")
config.bind(leader + "sz", "config-cycle -p session.lazy_restore true false")

# Autostart ActivityWatch bridge
userscript = os.path.expanduser('~/dev/dotfiles/qutebrowser/userscripts/aw-heartbeat-bridge')
if os.path.exists(userscript):
    os.system(f'{userscript} start &')

# Tor commands (aliases defined above in c.aliases dict)

# ========================================
# Automatic English Keyboard Layout Switching
# ========================================
# Similar to Neovim's InsertLeave behavior but for qutebrowser:
# - Switch to English on window focus (when not in insert mode)
# - Switch to English when leaving insert mode
# - Keep current layout when in insert mode for multilingual typing

# Configure automatic insert mode behavior
c.input.insert_mode.auto_enter = True   # Enter insert mode when clicking input fields
c.input.insert_mode.auto_leave = True   # Leave insert mode when clicking outside

# Override mode-enter and mode-leave commands to include layout switching
def en_mode_enter(mode):
    """Enter mode without switching layout (preserve current for typing)"""
    return f"mode-enter {mode}"

def en_mode_leave():
    """Leave mode and switch to English layout"""
    return "spawn -u switch-to-english ;; mode-leave"

# Override insert mode bindings to preserve layout when entering, switch when leaving
config.bind("i", en_mode_enter("insert"))
config.bind("ш", en_mode_enter("insert"))  # Russian layout
config.bind("a", en_mode_enter("insert"))
config.bind("ф", en_mode_enter("insert"))  # Russian layout
config.bind(leader + 'aa', en_mode_enter("insert"))

# Override Escape to switch to English when leaving insert mode
config.bind("<Escape>", en_mode_leave(), mode="insert")

# Note: Window focus monitoring removed - keeping only reliable mode-based switching

# Auto-switch to English for command modes (keep existing functionality)
config.bind(":", en("cmd-set-text :"))
config.bind("t", en("cmd-set-text -s :open -t"))
config.bind("е", en("cmd-set-text -s :open -t"))
config.bind("<Cmd-t>", en("cmd-set-text -s :open -t"))
config.bind("<Cmd-е>", en("cmd-set-text -s :open -t"))
config.bind(leader + leader, en("cmd-set-text -s :tab-select"))
config.bind("ge", en("cmd-set-text -s :open {url}"))
config.bind(leader + "ss", en("cmd-set-text -s :session-save "))
config.bind(leader + "sl", en("cmd-set-text -s :session-load "))
config.bind(leader + "sd", en("cmd-set-text -s :session-delete "))
config.bind(leader + "sr", en("cmd-set-text -s :session-rename "))
config.bind(leader + "tm", en("cmd-set-text -s :tab-move"))
config.bind(leader + "tw", en("cmd-set-text -s :tab-take"))
config.bind(leader + "tt", en("cmd-set-text -s :tab-select"))
config.bind(leader + "cS", en("cmd-set-text -s :set -t"))
