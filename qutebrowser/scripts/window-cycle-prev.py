from qutebrowser.mainwindow import mainwindow
from qutebrowser.utils import message, objreg

ids = sorted(objreg.window_registry)
if len(ids) < 2:
    message.info("Only one qutebrowser window")
else:
    current = objreg.last_focused_window().win_id
    target = ids[(ids.index(current) - 1) % len(ids)]
    mainwindow.raise_window(objreg.window_registry[target])
