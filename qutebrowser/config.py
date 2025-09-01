# Documentation:
#   qute://help/configuring.html
#   qute://help/settings.html

from time import localtime, strftime

# Reassign to avoid lsp(ruff_lsp) errors
config = config  # noqa: F821
c = c  # noqa: F821

config.load_autoconfig()

# User agent
config.set(
    "content.headers.user_agent",
    "Mozilla/5.0 (X11; Linux x86_64; rv:90.0) Gecko/20100101 Firefox/90.0",
    "https://accounts.google.com/*"
)

# Variables
leader = " "
ss_dir = "~/Documents/screenshots"
# updates on every config-source
timestamp = strftime("%Y-%m-%d-%H-%M-%S", localtime())
terminal = "/opt/homebrew/bin/kitty"
editor = "/opt/homebrew/bin/nvim"
username = "timseriakov"
homepage = "http://pmx:1931"

config.set("content.autoplay", False)

# Enable mouse back/forward buttons
c.input.mouse.back_forward_buttons = True

# General
c.editor.command = ["/usr/local/bin/fish", "-lc", f"{terminal} -e {editor} {{}}"]
c.auto_save.session = True
c.session.lazy_restore = True
c.zoom.default = "100%"
c.window.hide_decoration = True

# Layout
c.scrolling.bar = "when-searching"
c.statusbar.show = "in-mode"
c.tabs.show = "switching" # multiple
c.tabs.last_close = "close"
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
c.qt.args = ["force-dark-mode", "dark-mode-settings"]

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
c.colors.completion.category.bg = "#2E3440"
c.colors.completion.category.border.bottom = "transparent"
c.colors.completion.category.border.top = "transparent"
c.colors.completion.category.fg = nord5
c.colors.completion.even.bg = nord1
c.colors.completion.odd.bg = nord2
c.colors.completion.fg = nord4
c.colors.completion.item.selected.bg = "#5482B0"
c.colors.completion.item.selected.fg = white
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
c.hints.chars = "asdfghjkl"
c.hints.min_chars = 1

# Messages
c.colors.messages.info.bg = black
c.colors.messages.info.fg = white
c.colors.messages.error.bg = red
c.colors.messages.error.fg = white
c.colors.messages.warning.bg = yellow
c.colors.messages.warning.fg = black

# Statusbar
c.colors.statusbar.normal.bg = black
c.colors.statusbar.normal.fg = white
c.colors.statusbar.command.bg = nord1
c.colors.statusbar.command.fg = white
c.colors.statusbar.insert.bg = green
c.colors.statusbar.insert.fg = black
c.colors.statusbar.passthrough.bg = purple
c.colors.statusbar.passthrough.fg = black
c.colors.statusbar.private.bg = nord3
c.colors.statusbar.private.fg = white
c.colors.statusbar.url.fg = white
c.colors.statusbar.url.error.fg = red
c.colors.statusbar.url.hover.fg = blue
c.colors.statusbar.url.success.http.fg = green
c.colors.statusbar.url.success.https.fg = green
c.colors.statusbar.url.warn.fg = yellow

# Tabs
c.colors.tabs.bar.bg = black

# Tabs
c.colors.tabs.even.bg = nord1
c.colors.tabs.odd.bg = nord1
c.colors.tabs.even.fg = nord4
c.colors.tabs.odd.fg = nord4
c.colors.tabs.selected.even.bg = "#5482B0"
c.colors.tabs.selected.even.fg = white
c.colors.tabs.selected.odd.bg = "#5482B0"
c.colors.tabs.selected.odd.fg = white
c.colors.tabs.pinned.even.bg = nord8
c.colors.tabs.pinned.even.fg = black
c.colors.tabs.pinned.odd.bg = nord8
c.colors.tabs.pinned.odd.fg = black
c.colors.tabs.pinned.selected.even.bg = "#6fb3d3"
c.colors.tabs.pinned.selected.even.fg = black
c.colors.tabs.pinned.selected.odd.bg = "#6fb3d3"
c.colors.tabs.pinned.selected.odd.fg = black

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
# c.aliases = {
#     "o": "open",
#     "Q": "close",
#     "w": "session-save",
#     "x": "quit --save",
# }

# Reload
config.bind("e", "reload")

# Tab navigation
config.bind("w", "tab-prev")
config.bind("r", "tab-next")
config.bind("K", "tab-prev")
config.bind("J", "tab-next")

# Restore closed tab
config.bind("q", "undo")

config.bind('d', 'scroll-page 0 0.5')
config.bind('u', 'scroll-page 0 -0.5')

# Enter insert mode
config.bind("i", "mode-enter insert")
config.bind("v", "mode-enter caret")

# Navigation
config.bind("H", "back")
config.bind("L", "forward")
config.bind("<Cmd-Left>", "back")
config.bind("<Cmd-Right>", "forward")

config.bind("t", "cmd-set-text -s :open -t")
config.bind("<Cmd-t>", "cmd-set-text -s :open -t")

# Find mode
config.bind("/", "search")
config.bind("?", "search")

# Open link in new tab
config.bind("f", "hint links")
# Open link in new tab (background)
config.bind("F", "hint links tab-bg")

# Yank current URL or link
config.bind("yy", "yank")
config.bind("yl", "hint links yank")

# Open copied URL
config.bind("p", "open --clipboard")
config.bind("P", "open --clipboard --tab")

config.bind("x", "tab-close")
config.bind("<Cmd-w>", "tab-close")

# Move tab
config.bind("<<", "tab-move -")
config.bind(">>", "tab-move +")

config.bind("<Ctrl-=>", "zoom-in")
config.bind("<Ctrl-->", "zoom-out")


# Open link in mpv
config.bind(leader + "m", "spawn /opt/homebrew/bin/mpv {url}")

config.bind(leader + 'h', 'spawn -u fzfhistory-userscript')
config.bind(leader + 'H', 'spawn -u fzfhistory-userscript closed-tabs')

# Braindrop (TUI) in Alacritty
config.bind(leader + 'b', 'spawn -u braindrop')

# Save link to Raindrop
config.bind(leader + 'r', "spawn -u raindrop {url} {title}")

# Fill credentials from macOS Keychain
config.bind(leader + 'p', 'spawn -u keychain_fill')

config.bind(leader + leader, 'cmd-set-text -s :tab-select')

config.bind(leader + "ce", "config-edit")
config.bind(leader + "ch", "help")
config.bind(leader + "cc", "config-source ;; message-info 'Config reloaded'") # reload config
config.bind(leader + "cs", "cmd-set-text -s :set -t")

# ui
config.bind(leader + "ut", "config-cycle tabs.show multiple switching")
config.bind(leader + "us", "config-cycle statusbar.show always in-mode")
config.bind(leader + "ua", ":set content.autoplay true ;; message-info 'Autoplay enabled'")
config.bind(leader + "uf", ":set content.autoplay false ;; message-info 'Autoplay disabled'")

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
config.bind(leader + "fy", "hint links yank") # Open link in new tab (foreground)
config.bind(leader + "fx", "hint links spawn --detach /usr/bin/open -a 'Brave Browser' {hint-url}") # Open link in Brave (hint)

# Trigger custom FZF script (interactive launcher)
# Requires you to create a script at ~/.local/bin/qute-fzf.sh
# config.bind(leader + "fz", f"spawn --userscript ~/.local/bin/qute-fzf.sh")

# quitting actions
config.bind(leader + "qd", "tab-close")
config.bind(leader + "qq", "close")
config.bind(leader + "qr", "restart")
config.bind(leader + "qt", "tab-only") # close all tabs except current
config.bind(leader + "qw", "window-only") # close all windows except current
config.bind(leader + "x", "quit --save")


# tabs
config.bind(leader + "ta", "bookmark-add")
config.bind(leader + "tb", "bookmark-list")
config.bind(leader + "tc", "tab-clone")
config.bind(leader + "td", "tab-clone -w")
config.bind(leader + "tn", "tab-give") # move tab to new window
config.bind(leader + "tw", "cmd-set-text -s :tab-take") # move tab to selected window
config.bind(leader + "th", "history")
config.bind(leader + "tm", "cmd-set-text -s :tab-move")
config.bind(leader + "tp", "tab-pin")
config.bind(leader + "tt", "cmd-set-text -s :tab-select")
config.bind(leader + "tx", "spawn --detach /usr/bin/open -a 'Brave Browser' {url}") # Open current URL in Brave

# sessions
# Interactive prompts leverage completion for existing session names.
config.bind(leader + "ss", "cmd-set-text -s :session-save ")
config.bind(leader + "sl", "cmd-set-text -s :session-load ")
config.bind(leader + "sd", "cmd-set-text -s :session-delete ")
config.bind(leader + "sr", "cmd-set-text -s :session-rename ")
config.bind(leader + "sc", "session-clean ;; message-info 'Sessions cleaned'")
config.bind(leader + "sz", "config-cycle -p session.lazy_restore true false")
