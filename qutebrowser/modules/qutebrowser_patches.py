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
# in a conventional browser. Patch through MainWindow because modules imported
# only by config.py are removed after config load.
from qutebrowser.commands import runners
from qutebrowser.mainwindow import mainwindow
from qutebrowser.qt.core import Qt


_orig_mainwindow_init = getattr(
    mainwindow.MainWindow,
    "_dotfiles_orig_init",
    mainwindow.MainWindow.__init__,
)
mainwindow.MainWindow._dotfiles_orig_init = _orig_mainwindow_init


def _edit_url_on_click(self, event):
    if event.button() == Qt.MouseButton.LeftButton:
        statusbar = self.parent()
        runners.CommandRunner(statusbar._win_id).run_safely("cmd-set-text -s :open {url}")
        event.accept()
        return
    self.__class__._dotfiles_orig_mousePressEvent(self, event)


def _mainwindow_init_with_url_click(self, *args, **kwargs):
    _orig_mainwindow_init(self, *args, **kwargs)
    url_cls = self.status.url.__class__
    if not hasattr(url_cls, "_dotfiles_orig_mousePressEvent"):
        url_cls._dotfiles_orig_mousePressEvent = url_cls.mousePressEvent
        url_cls.mousePressEvent = _edit_url_on_click


mainwindow.MainWindow.__init__ = _mainwindow_init_with_url_click
