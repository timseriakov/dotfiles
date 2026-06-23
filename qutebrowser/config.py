# Documentation:
#   qute://help/configuring.html
#   qute://help/settings.html

config = config
c = c

config.load_autoconfig()
# Upstream QtWebEngine HTTP/2 issue breaks Reddit media/CDN loads.
# Remove after Qt fixes QTBUG-137535 / qutebrowser#8599.
c.qt.args = [*c.qt.args, "disable-http2"]


import importlib
from modules import base as base

importlib.reload(base)

config.source("modules/headers.py")
config.source("modules/settings.py")
config.source("modules/theme.py")
config.source("modules/urls.py")
config.source("modules/aliases.py")
config.source("modules/bindings.py")
config.source("modules/locale.py")
