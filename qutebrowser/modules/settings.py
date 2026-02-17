config = config
c = c

from modules.base import editor, terminal

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
c.tabs.show = "always"  # multiple # never
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

c.input.mode_override = None

# Disable Yes/No prompt for JS clipboard access requests.
c.content.javascript.clipboard = "access"
