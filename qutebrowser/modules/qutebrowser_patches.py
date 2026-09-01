# qutebrowser loads config.py before its browser modules, then removes modules
# imported by config.py. Patch the preloaded JavaScript resource instead.
from qutebrowser.utils import resources

_webelem_js = resources._cache["javascript/webelem.js"]
_unsafe = """        elem.selectionStart = elem.value.length;
        elem.selectionEnd = elem.value.length;"""
_safe = """        if (elem.selectionStart !== null) {
            elem.selectionStart = elem.value.length;
            elem.selectionEnd = elem.value.length;
        }"""
assert _unsafe in _webelem_js or _safe in _webelem_js
resources._cache["javascript/webelem.js"] = _webelem_js.replace(_unsafe, _safe)

# qutebrowser's default completion columns are 30/70/0; session names are the
# only useful column, so give it the whole popup width.
from qutebrowser.completion.models import completionmodel, listcategory, miscmodels
from qutebrowser.utils import log, utils


def _wide_session_completion(*, info=None):
    from qutebrowser.misc import sessions
    utils.unused(info)
    model = completionmodel.CompletionModel(column_widths=(100, 0, 0))
    try:
        sess = (
            (name,)
            for name in sessions.session_manager.list_sessions()
            if not name.startswith("_")
        )
        model.add_category(listcategory.ListCategory("Sessions", sess))
    except OSError:
        log.completion.exception("Failed to list sessions!")
    return model


miscmodels.session = _wide_session_completion


# Clicking the statusbar URL edits the current URL, like focusing the address bar
# in a conventional browser. Use an event filter because PyQt/SIP does not
# reliably redispatch C++ virtual mouse events after monkey-patching a method.
from qutebrowser.commands import runners
from qutebrowser.mainwindow import mainwindow
from qutebrowser.qt.core import QEvent, QObject, Qt


_orig_mainwindow_init = getattr(
    mainwindow.MainWindow,
    "_dotfiles_orig_init",
    mainwindow.MainWindow.__init__,
)
mainwindow.MainWindow._dotfiles_orig_init = _orig_mainwindow_init


class _StatusUrlClickFilter(QObject):
    def __init__(self, win_id, parent=None):
        super().__init__(parent)
        self._win_id = win_id

    def eventFilter(self, watched, event):
        if (
            event.type() == QEvent.Type.MouseButtonPress
            and event.button() == Qt.MouseButton.LeftButton
        ):
            runners.CommandRunner(self._win_id).run_safely(
                "cmd-set-text -s :open {url}"
            )
            event.accept()
            return True
        return False


def _mainwindow_init_with_url_click(self, *args, **kwargs):
    _orig_mainwindow_init(self, *args, **kwargs)
    for widget in (self.status, self.status.url):
        old_filter = getattr(widget, "_dotfiles_click_filter", None)
        if old_filter is not None:
            widget.removeEventFilter(old_filter)
        click_filter = _StatusUrlClickFilter(self.win_id, widget)
        widget.installEventFilter(click_filter)
        widget._dotfiles_click_filter = click_filter


mainwindow.MainWindow.__init__ = _mainwindow_init_with_url_click
