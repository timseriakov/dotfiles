config = config
c = c

import json
from pathlib import Path

from qutebrowser.qt.core import QTimer
from qutebrowser.qt.widgets import QApplication
from qutebrowser.misc import sessions
from qutebrowser.utils import log, standarddir

INTERVAL_MS = 5000
OUT_PATH = Path(standarddir.data()) / "glance-tabs.json"
_timer_attr = "_dotfiles_live_tabs_timer"
_retry_attr = "_dotfiles_live_tabs_retry_timer"


def _active_entry(tab):
    history = tab.get("history") or []
    return next((entry for entry in history if entry.get("active")), history[-1] if history else {})


def _write():
    manager = sessions.session_manager
    if manager is None:
        return

    try:
        data = manager._save_all(with_private=True, with_history=True)
        windows = []
        for index, window in enumerate(data.get("windows", []), 1):
            tabs = []
            for tab in window.get("tabs", []):
                entry = _active_entry(tab)
                url = entry.get("url") or ""
                if not url:
                    continue
                tabs.append({
                    "title": entry.get("title") or url,
                    "url": url,
                    "pinned": bool(entry.get("pinned")),
                })
            windows.append({
                "index": index,
                "active": bool(window.get("active")),
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

    if sessions.session_manager is None:
        retry = QTimer(app)
        retry.setSingleShot(True)
        retry.timeout.connect(_start)
        retry.start(1000)
        setattr(app, _retry_attr, retry)
        return

    timer = QTimer(app)
    timer.timeout.connect(_write)
    timer.start(INTERVAL_MS)
    setattr(app, _timer_attr, timer)
    _write()


_start()
