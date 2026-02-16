# Documentation:
#   qute://help/configuring.html
#   qute://help/settings.html

config = config
c = c

config.load_autoconfig()

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
