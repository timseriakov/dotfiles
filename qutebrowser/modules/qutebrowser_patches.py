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
from qutebrowser.config import config
from qutebrowser.mainwindow import mainwindow, tabwidget
from qutebrowser.mainwindow.statusbar import bar
from qutebrowser.qt.core import QEvent, QObject, QPoint, QRect, Qt, QTimer
from qutebrowser.qt.widgets import QApplication, QSizePolicy, QStyle, QTabWidget
from qutebrowser.utils import qtutils


_orig_mainwindow_init = getattr(
    mainwindow.MainWindow,
    "_dotfiles_orig_init",
    mainwindow.MainWindow.__init__,
)
mainwindow.MainWindow._dotfiles_orig_init = _orig_mainwindow_init


class _StatusUrlClickFilter(QObject):
    def __init__(self, win_id, url_widget, parent=None):
        super().__init__(parent)
        self._win_id = win_id
        self._url_widget = url_widget

    def eventFilter(self, watched, event):
        if not (
            event.type() == QEvent.Type.MouseButtonPress
            and event.button() == Qt.MouseButton.LeftButton
        ):
            return False

        url_widget = self._url_widget
        if not url_widget.isVisible():
            return False

        pos = event.globalPosition().toPoint()
        if not url_widget.rect().contains(url_widget.mapFromGlobal(pos)):
            return False

        runners.CommandRunner(self._win_id).run_safely("cmd-set-text -s :open {url}")
        event.accept()
        return True


def _align_status_url(status):
    status.url.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
    status.url.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
    hbox = getattr(status, "_hbox", None)
    if hbox is not None:
        url_index = hbox.indexOf(status.url)
        for i in range(hbox.count()):
            hbox.setStretch(i, 1 if i == url_index else 0)
        hbox.invalidate()
        hbox.activate()
    status.url.updateGeometry()
    status.updateGeometry()


_orig_statusbar_draw_widgets = getattr(
    bar.StatusBar,
    "_dotfiles_orig_draw_widgets",
    bar.StatusBar._draw_widgets,
)
bar.StatusBar._dotfiles_orig_draw_widgets = _orig_statusbar_draw_widgets


def _draw_widgets_with_right_aligned_url(self):
    _orig_statusbar_draw_widgets(self)
    _align_status_url(self)


bar.StatusBar._draw_widgets = _draw_widgets_with_right_aligned_url

def _mainwindow_init_with_url_click(self, *args, **kwargs):
    _orig_mainwindow_init(self, *args, **kwargs)
    app = QApplication.instance()
    old_filter = getattr(self.status.url, "_dotfiles_click_filter", None)
    if old_filter is not None and app is not None:
        app.removeEventFilter(old_filter)
    click_filter = _StatusUrlClickFilter(self.win_id, self.status.url, self.status.url)
    if app is not None:
        app.installEventFilter(click_filter)
    self.status.url._dotfiles_click_filter = click_filter
    _align_status_url(self.status)


def _below_tab_status_enabled(window):
    return (
        config.val.statusbar.position == "top"
        and window.tabbed_browser.widget.tabPosition() == QTabWidget.TabPosition.North
    )


class _BelowTabStatusStyle(tabwidget.TabBarStyle):
    def subElementRect(self, element, option, widget=None):
        rect = super().subElementRect(element, option, widget)
        if widget is not getattr(self, "_dotfiles_tabwidget", None) or element not in (
            QStyle.SubElement.SE_TabWidgetTabPane,
            QStyle.SubElement.SE_TabWidgetTabContents,
        ):
            return rect

        status = getattr(widget, "_dotfiles_below_tab_status", None)
        if status is None or status.parent() is not widget or not status.isVisible():
            return rect

        tabbar = widget.tabBar()
        tab_bottom = tabbar.geometry().bottom() + 1 if tabbar.isVisible() else 0
        wanted_top = tab_bottom + status.sizeHint().height()
        if rect.top() < wanted_top:
            rect.setTop(wanted_top)
        return rect


def _ensure_below_tab_style(tabwidget_):
    if not isinstance(tabwidget_.style(), _BelowTabStatusStyle):
        style = _BelowTabStatusStyle()
        style._dotfiles_tabwidget = tabwidget_
        tabwidget_._dotfiles_below_tab_style = style
        tabwidget_.setStyle(style)


def _place_status_below_tabs(window):
    tabwidget = window.tabbed_browser.widget
    if not _below_tab_status_enabled(window) or window.status.parent() is not tabwidget:
        return

    tabbar = tabwidget.tabBar()
    y = tabbar.geometry().bottom() + 1 if tabbar.isVisible() else 0
    window.status.setGeometry(0, y, tabwidget.width(), window.status.sizeHint().height())
    window.status.raise_()
    tabwidget.setDocumentMode(tabwidget.documentMode())


class _BelowTabStatusRelayoutFilter(QObject):
    def __init__(self, window, parent=None):
        super().__init__(parent)
        self._window = window
        self._pending = False

    def eventFilter(self, watched, event):
        if event.type() in (QEvent.Type.Resize, QEvent.Type.Show, QEvent.Type.Hide):
            if not self._pending:
                self._pending = True
                QTimer.singleShot(0, self._relayout)
        return False

    def _relayout(self):
        self._pending = False
        _place_status_below_tabs(self._window)


def _install_below_tab_relayout_filter(window):
    tabwidget = window.tabbed_browser.widget
    old_filter = getattr(tabwidget, "_dotfiles_below_tab_filter", None)
    if old_filter is not None:
        tabwidget.removeEventFilter(old_filter)
        tabwidget.tabBar().removeEventFilter(old_filter)

    relayout_filter = _BelowTabStatusRelayoutFilter(window, tabwidget)
    tabwidget.installEventFilter(relayout_filter)
    tabwidget.tabBar().installEventFilter(relayout_filter)
    tabwidget._dotfiles_below_tab_filter = relayout_filter


_orig_add_widgets = getattr(
    mainwindow.MainWindow,
    "_dotfiles_orig_add_widgets",
    mainwindow.MainWindow._add_widgets,
)
mainwindow.MainWindow._dotfiles_orig_add_widgets = _orig_add_widgets


def _add_widgets_with_below_tab_status(self):
    if not _below_tab_status_enabled(self):
        if self.status.parent() is not self:
            self.status.setParent(self)
        _orig_add_widgets(self)
        return

    _orig_add_widgets(self)
    self._vbox.removeWidget(self.status)
    tabwidget = self.tabbed_browser.widget
    self.status.setParent(tabwidget)
    tabwidget._dotfiles_below_tab_status = self.status
    _ensure_below_tab_style(tabwidget)
    self.status.show()
    _install_below_tab_relayout_filter(self)
    _place_status_below_tabs(self)


mainwindow.MainWindow._add_widgets = _add_widgets_with_below_tab_status


_orig_update_overlay_geometry = getattr(
    mainwindow.MainWindow,
    "_dotfiles_orig_update_overlay_geometry",
    mainwindow.MainWindow._update_overlay_geometry,
)
mainwindow.MainWindow._dotfiles_orig_update_overlay_geometry = _orig_update_overlay_geometry


def _update_overlay_geometry_with_reparented_status(self, widget, centered, padding):
    if not (
        config.val.statusbar.position == "top"
        and self.status.parent() is self.tabbed_browser.widget
        and self.tabbed_browser.widget.tabPosition() == QTabWidget.TabPosition.North
    ):
        _orig_update_overlay_geometry(self, widget, centered, padding)
        return

    if not widget.isVisible():
        return

    if widget.sizePolicy().horizontalPolicy() == QSizePolicy.Policy.Expanding:
        width = self.width() - 2 * padding
        height = widget.heightForWidth(width) if widget.hasHeightForWidth() else widget.sizeHint().height()
        left = padding
    else:
        size_hint = widget.sizeHint()
        width = min(size_hint.width(), self.width() - 2 * padding)
        height = size_hint.height()
        left = (self.width() - width) // 2 if centered else 0

    top = self.status.mapTo(self, self.status.rect().bottomLeft()).y() + 1
    bottom = qtutils.check_overflow(top + height, "int", fatal=False)
    rect = QRect(
        QPoint(left, top),
        QPoint(left + width, min(self.height() - 20, bottom)),
    )
    if rect.isValid():
        widget.setGeometry(rect)


mainwindow.MainWindow._update_overlay_geometry = _update_overlay_geometry_with_reparented_status


mainwindow.MainWindow.__init__ = _mainwindow_init_with_url_click


def _align_existing_status_urls():
    app = QApplication.instance()
    if app is None:
        return
    for widget in app.allWidgets():
        if getattr(widget, "url", None) is not None and getattr(widget, "_hbox", None) is not None:
            _align_status_url(widget)


_align_existing_status_urls()
QTimer.singleShot(0, _align_existing_status_urls)
