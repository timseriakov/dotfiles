config = config
c = c

import json
import os
import re
from datetime import datetime
from urllib.parse import urlparse

from qutebrowser.qt.core import QTimer
from qutebrowser.qt.widgets import QApplication
from qutebrowser.misc import sessions
from qutebrowser.utils import log

# Configurable knobs.
INTERVAL_MINUTES = 40
MAX_SNAPSHOTS = 72
MAX_NAME_CHARS = 180
MAX_TITLE_CHARS = 22
PREFIX = ""

_timer_attr = "_dotfiles_session_autosave_timer"
_retry_attr = "_dotfiles_session_autosave_retry_timer"
_last_signature = None


def _shorten(text, limit):
    text = re.sub(r"\s+", " ", text).strip()
    return text if len(text) <= limit else text[: max(1, limit - 1)].rstrip() + "…"


def _safe_part(text):
    return re.sub(r"[/\\:\0'\"`]+", " ", text).strip(" .-")


def _tab_title(tab_data):
    history = tab_data.get("history") or []
    item = next((entry for entry in history if entry.get("active")), history[-1] if history else {})
    title = item.get("title") or urlparse(item.get("url", "")).netloc or "tab"
    return _safe_part(_shorten(title, MAX_TITLE_CHARS))


def _session_name(data):
    titles = []
    for window in data.get("windows", []):
        for tab in window.get("tabs", []):
            titles.append(_tab_title(tab))

    timestamp = datetime.now().strftime("%d-%m %H-%M")
    name = f"{PREFIX} {timestamp}".strip()
    if titles:
        name += " - " + " - ".join(titles)
    return _shorten(_safe_part(name), MAX_NAME_CHARS)


def _signature(data):
    return json.dumps(data.get("windows", []), ensure_ascii=False, sort_keys=True)


def _prune(manager):
    base = manager._base_path
    names = sorted(
        name for name in os.listdir(base)
        if re.match(r"\d{2}-\d{2} \d{2}-\d{2}.*\.yml$", name)
    )
    for name in names[:-MAX_SNAPSHOTS]:
        try:
            os.remove(os.path.join(base, name))
        except OSError as exc:
            log.sessions.debug("Could not prune session autosave %s: %s", name, exc)


def _save():
    global _last_signature

    manager = sessions.session_manager
    if manager is None:
        return
    try:
        data = manager._save_all(with_private=False, with_history=False)
        signature = _signature(data)
        if signature == _last_signature:
            return
        manager.save(_session_name(data), with_private=False, with_history=True)
        _last_signature = signature
        _prune(manager)
    except Exception as exc:
        log.sessions.error("Failed to save named autosave session: %s", exc)


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
    timer.timeout.connect(_save)
    timer.start(INTERVAL_MINUTES * 60 * 1000)
    setattr(app, _timer_attr, timer)


_start()
