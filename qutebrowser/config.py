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
terminal = "kitty"
editor = "nvim"
username = "timseriakov"
homepage = "https://github.com"

# General
c.editor.command = [terminal, "-e", editor, "{}"]
c.auto_save.session = True
c.zoom.default = "100%"
c.window.hide_decoration = True

# Layout
c.scrolling.bar = "when-searching"
c.statusbar.show = "in-mode"
c.tabs.show = "switching" # multiple
c.tabs.last_close = "close"
# c.tabs.new_position.related = "last"

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
accent = "#88c0d0"  # nord8
black = "#2e3440"   # nord0
white = "#eceff4"   # nord6
red   = "#bf616a"   # nord11
green = "#a3be8c"   # nord14
yellow = "#ebcb8b"  # nord13
blue = "#5e81ac"    # nord10
purple = "#b48ead"  # nord15

# Completion
c.colors.completion.category.bg = (
    "qlineargradient(x1:0, y1:0, x2:0, y2:1, stop:0 #3b4252, stop:1 #434c5e)"
)
c.colors.completion.category.border.bottom = accent
c.colors.completion.category.border.top = accent
c.colors.completion.category.fg = white
c.colors.completion.even.bg = black
c.colors.completion.odd.bg = black
c.colors.completion.fg = white
c.colors.completion.item.selected.bg = accent
c.colors.completion.item.selected.fg = black
c.colors.completion.item.selected.match.fg = white
c.colors.completion.match.fg = accent
c.colors.completion.scrollbar.bg = black
c.colors.completion.scrollbar.fg = white

# Downloads
c.colors.downloads.bar.bg = black
c.colors.downloads.error.bg = red

# Hints
c.colors.hints.bg = nord10
c.colors.hints.fg = nord6
c.colors.hints.match.fg = nord8
c.hints.border = f"2px solid {nord8}"
# c.fonts.hints = "bold 10pt 'Share Tech Mono'"

# Messages
c.colors.messages.info.bg = black

# Statusbar
c.colors.statusbar.normal.bg = nord0
c.colors.statusbar.normal.fg = nord6
c.colors.statusbar.command.bg = nord1
c.colors.statusbar.command.fg = nord6
c.colors.statusbar.insert.bg = nord14
c.colors.statusbar.insert.fg = nord0
c.colors.statusbar.passthrough.bg = nord15
c.colors.statusbar.passthrough.fg = nord0
c.colors.statusbar.private.bg = nord3
c.colors.statusbar.private.fg = nord6
c.colors.statusbar.url.fg = nord6
c.colors.statusbar.url.error.fg = nord11
c.colors.statusbar.url.hover.fg = nord10
c.colors.statusbar.url.success.http.fg = nord14
c.colors.statusbar.url.success.https.fg = nord14
c.colors.statusbar.url.warn.fg = nord13

# Tabs
c.colors.tabs.bar.bg = black
c.colors.tabs.even.bg = black
c.colors.tabs.odd.bg = black
c.colors.tabs.selected.even.bg = blue
c.colors.tabs.selected.odd.bg = blue
c.colors.tabs.pinned.even.bg = accent
c.colors.tabs.pinned.odd.bg = accent
c.colors.tabs.pinned.selected.even.bg = accent
c.colors.tabs.pinned.selected.odd.bg = accent

# Font
font_size = "18pt"
font_family = "Share Tech Mono"
font = font_size + " " + font_family
c.fonts.default_size = font_size
c.fonts.default_family = font_family
c.fonts.completion.entry = font
c.fonts.hints = font
c.fonts.debug_console = font
c.fonts.prompts = font
c.fonts.statusbar = font

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

# Show help
config.bind(",", "help")

# Scrolling
config.bind("o", "scroll down")
config.bind("l", "scroll up")
config.bind(";", "scroll right")  # no direct left-scroll in Vimium
config.bind("d", "scroll right")
config.bind("v", "scroll-page 0 1")   # page down
config.bind("g", "scroll-page 0 -1")  # page up

# View page source
config.bind("z", "view-source")

# Enter insert mode
config.bind("i", "mode-enter insert")

# History navigation
config.bind("B", "back")
config.bind("F", "forward")

# Find mode
config.bind("t", "cmd-set-text -s :open -t")
config.bind("/", "search")
config.bind("?", "search-backward")

# Link hints
config.bind("f", "hint")
config.bind("F", "hint new-tab")
config.bind("<Alt-a>", "hint all")  # approximate to LinkHints.activateModeWithQueue

# Back/Forward (by buffer)
config.bind("hh", "back")
config.bind("ll", "forward")

# Yank current URL or link
config.bind("yy", "yank")
config.bind("yl", "hint links yank")

# Open copied URL
config.bind("p", "open --clipboard")
config.bind("P", "open --clipboard --tab")

# Tab management
config.bind("n", "tab-next")
config.bind("N", "tab-prev")
config.bind("0", "tab-focus 1")
config.bind("$", "tab-focus -1")

config.bind("C", "tab-detach")
config.bind("E", "tab-clone")
config.bind("x", "tab-close")

# Move tab
config.bind("<<", "tab-move -")
config.bind(">>", "tab-move +")

config.bind("v", "mode-enter caret")


# ---

# config.bind("H", "tab-prev")
# config.bind("J", "forward")
# config.bind("K", "back")
# config.bind("L", "tab-next")
# config.bind("O", "cmd-set-text -s :open -w")
# config.bind("P", "cmd-set-text -s :open -p")
# config.bind("Q", "close")
# config.bind("W", "tab-clone -w")
# config.bind("a", "mode-enter insert")
# config.bind("t", "cmd-set-text -s :open -t")

config.bind("<Ctrl-=>", "zoom-in")
config.bind("<Ctrl-->", "zoom-out")

config.bind(leader + "cb", "config-cycle statusbar.show always in-mode")
config.bind(leader + "cc", "config-edit")
config.bind(leader + "ch", "help")
config.bind(leader + "cr", "config-source")
config.bind(leader + "cs", "cmd-set-text -s :set -t")
config.bind(leader + "ct", "config-cycle tabs.show multiple switching")

config.bind(leader + "dd", "devtools")
config.bind(leader + "de", "edit-text")
config.bind(leader + "dc", "cmd-edit")
config.bind(leader + "df", "devtools-focus")
config.bind(leader + "dp", "screenshot " + ss_dir + "qute-" + timestamp + ".png")
config.bind(leader + "ds", "view-source --edit")

config.bind(leader + "fc", "hint links yank --rapid")
config.bind(leader + "fd", "hint links spawn " + terminal + "-e youtube-dl {hint-url}")
config.bind(leader + "ff", "hint links tab-bg --rapid")
config.bind(leader + "fi", "hint inputs")
config.bind(leader + "fo", "hint links window")
config.bind(leader + "fp", "hint links run :open -p {hint-url}")
config.bind(leader + "fv", "hint links spawn mpv {hint-url}")
config.bind(leader + "fy", "hint links yank")

config.bind(leader + "qd", "tab-close")
config.bind(leader + "qq", "close")
config.bind(leader + "qr", "restart")
config.bind(leader + "qt", "tab-only")
config.bind(leader + "qw", "window-only")

config.bind(leader + "ta", "bookmark-add")
config.bind(leader + "tb", "bookmark-list")
config.bind(leader + "tc", "tab-clone")
config.bind(leader + "td", "tab-clone -w")
config.bind(leader + "tg", "tab-give")
config.bind(leader + "th", "history")
config.bind(leader + "tm", "cmd-set-text -s :tab-move")
config.bind(leader + "tp", "tab-pin")
config.bind(leader + "tt", "cmd-set-text -s :tab-select")
config.bind(leader + "tw", "cmd-set-text -s :tab-take")

config.bind(leader + "x", "quit --save")

config.bind('<Alt-g>', 'hint links spawn --detach open {hint-url}')
