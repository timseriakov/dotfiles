config = config
c = c

import json
import hashlib
from pathlib import Path

from qutebrowser.qt.core import QTimer
from qutebrowser.qt.widgets import QApplication
from qutebrowser.utils import log, objreg, standarddir

INTERVAL_MS = 5000
OUT_PATH = Path(standarddir.data()) / "glance-tabs.json"
SHOT_DIR = Path(standarddir.data()) / "glance-tab-shots"
_timer_attr = "_dotfiles_live_tabs_timer"
_retry_attr = "_dotfiles_live_tabs_retry_timer"


def _tab_entry(tab):
    url = tab.url().toString()
    shot_id = hashlib.sha1(url.encode("utf-8")).hexdigest() + ".jpg"
    shot_path = SHOT_DIR / shot_id
    pixmap = tab.grab_pixmap()
    if pixmap is not None and not pixmap.isNull():
        pixmap.scaledToWidth(320).save(str(shot_path), "JPG", 60)
    return {"title": tab.title() or url, "url": url, "pinned": bool(tab.data.pinned), "screenshotId": shot_id}


def _write():
    try:
        SHOT_DIR.mkdir(exist_ok=True)
        windows = []
        for index, win_id in enumerate(sorted(objreg.window_registry), 1):
            tabbed_browser = objreg.get("tabbed-browser", scope="window", window=win_id)
            tabs = [_tab_entry(tab) for tab in tabbed_browser.widgets() if tab.url().isValid()]
            windows.append({
                "index": index,
                "active": QApplication.activeWindow() is objreg.get("main-window", scope="window", window=win_id),
                "count": len(tabs),
                "tabs": tabs,
            })

        OUT_PATH.write_text(json.dumps({"windows": windows}, ensure_ascii=False), encoding="utf-8")
    except Exception as exc:
        log.sessions.error("Failed to write live tabs for Glance: %s", exc)


def _start():
    app = QApplication.instance()
    if app is None:
        return

    old_timer = getattr(app, _timer_attr, None)
    if old_timer is not None:
        old_timer.stop()


    timer = QTimer(app)
    timer.timeout.connect(_write)
    timer.start(INTERVAL_MS)
    setattr(app, _timer_attr, timer)
    _write()


_start()
