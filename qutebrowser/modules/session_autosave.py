config = config
c = c

import json
import os
import re
from datetime import datetime
from urllib.parse import urlparse

from qutebrowser.mainwindow import mainwindow, tabbedbrowser
from qutebrowser.misc import sessions
from qutebrowser.qt.core import QTimer
from qutebrowser.qt.widgets import QApplication
from qutebrowser.utils import log, objreg

# Configurable knobs.
INTERVAL_MINUTES = 40
DEBOUNCE_SECONDS = 30
MAX_SNAPSHOTS = 1000
MAX_NAME_CHARS = 180
MAX_TITLE_CHARS = 22
PREFIX = ""

_timer_attr = "_dotfiles_session_autosave_timer"
_retry_attr = "_dotfiles_session_autosave_retry_timer"
_debounce_attr = "_dotfiles_session_autosave_debounce_timer"
_connected_tabs_attr = "_dotfiles_session_autosave_connected_tabs"
_connected_browsers_attr = "_dotfiles_session_autosave_connected_browsers"
_last_signature = None

_orig_mainwindow_init = getattr(
    mainwindow.MainWindow,
    "_dotfiles_orig_session_autosave_init",
    mainwindow.MainWindow.__init__,
)
mainwindow.MainWindow._dotfiles_orig_session_autosave_init = _orig_mainwindow_init

_orig_remove_tab = getattr(
    tabbedbrowser.TabbedBrowser,
    "_dotfiles_orig_session_autosave_remove_tab",
    tabbedbrowser.TabbedBrowser._remove_tab,
)
tabbedbrowser.TabbedBrowser._dotfiles_orig_session_autosave_remove_tab = _orig_remove_tab


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

    timestamp = datetime.now().strftime("%Y-%m-%d %H-%M-%S")
    name = f"{PREFIX} {timestamp}".strip()
    if titles:
        name += " - " + " - ".join(titles)
    return _shorten(_safe_part(name), MAX_NAME_CHARS)


def _signature(data):
    return json.dumps(data.get("windows", []), ensure_ascii=False, sort_keys=True)


def _autosave_names(manager):
    return sorted(
        name
        for name in os.listdir(manager._base_path)
        if re.match(r"\d{4}-\d{2}-\d{2} \d{2}-\d{2}-\d{2}.*\.yml$", name)
        or re.match(r"\d{2}-\d{2} \d{2}-\d{2}.*\.yml$", name)
    )


def _prune(manager):
    for name in _autosave_names(manager)[:-MAX_SNAPSHOTS]:
        try:
            os.remove(os.path.join(manager._base_path, name))
        except OSError as exc:
            log.sessions.debug("Could not prune session autosave %s: %s", name, exc)


def _save(*_args):
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


def _save_later(*_args):
    app = QApplication.instance()
    if app is None:
        return

    timer = getattr(app, _debounce_attr, None)
    if timer is None:
        timer = QTimer(app)
        timer.setSingleShot(True)
        timer.timeout.connect(_save)
        setattr(app, _debounce_attr, timer)
    timer.start(DEBOUNCE_SECONDS * 1000)


def _connect_tab(tab):
    if getattr(tab, _connected_tabs_attr, False):
        return
    tab.url_changed.connect(_save_later)
    tab.load_finished.connect(_save_later)
    setattr(tab, _connected_tabs_attr, True)


def _connect_browser(tabbed_browser_):
    if tabbed_browser_.is_private or getattr(tabbed_browser_, _connected_browsers_attr, False):
        return
    for tab in tabbed_browser_.widgets():
        _connect_tab(tab)
    tabbed_browser_.new_tab.connect(lambda tab, _idx: (_connect_tab(tab), _save_later()))
    tabbed_browser_.current_tab_changed.connect(_save_later)
    tabbed_browser_.shutting_down.connect(_save)
    setattr(tabbed_browser_, _connected_browsers_attr, True)


def _connect_existing_browsers():
    for win_id in objreg.window_registry:
        try:
            _connect_browser(objreg.get("tabbed-browser", scope="window", window=win_id))
        except Exception as exc:
            log.sessions.debug("Could not hook session autosave for window %s: %s", win_id, exc)


def _mainwindow_init_with_session_autosave(self, *args, **kwargs):
    _orig_mainwindow_init(self, *args, **kwargs)
    _connect_browser(self.tabbed_browser)
    _save_later()


def _remove_tab_with_session_autosave(self, *args, **kwargs):
    ret = _orig_remove_tab(self, *args, **kwargs)
    _save_later()
    return ret


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

    _connect_existing_browsers()
    QTimer.singleShot(2000, _save)
    QTimer.singleShot(2000, _connect_existing_browsers)

    timer = QTimer(app)
    timer.timeout.connect(_save)
    timer.start(INTERVAL_MINUTES * 60 * 1000)
    setattr(app, _timer_attr, timer)


mainwindow.MainWindow.__init__ = _mainwindow_init_with_session_autosave
tabbedbrowser.TabbedBrowser._remove_tab = _remove_tab_with_session_autosave
_start()
