config = config
c = c

# Nord Palette
nord0 = "#2e3440"
nord1 = "#3b4252"
nord2 = "#434c5e"
nord3 = "#4c566a"
nord4 = "#d8dee9"
nord5 = "#e5e9f0"
nord6 = "#eceff4"
nord7 = "#8fbcbb"
nord8 = "#88c0d0"
nord9 = "#81a1c1"
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
red = nord11
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
c.colors.statusbar.insert.bg = (
    "#5E81AC"  # "#A3BE8C" #  "#00BAC7" # "#3D6164" # "#00754a"
)
c.colors.statusbar.insert.fg = black
c.colors.statusbar.passthrough.bg = (
    nord3  # темно-серый вместо фиолетового для лучшей видимости URL
)
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
c.colors.tabs.indicator.start = "#F90"  # bright orange - loading in progress
c.colors.tabs.indicator.stop = "#00A86E"  # bright green - loaded successfully
c.colors.tabs.indicator.error = "#FF2B3A"  # bright red - loading error
c.colors.tabs.indicator.system = "none"  # no gradient, instant color change

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
c.colors.webpage.bg = nord0
