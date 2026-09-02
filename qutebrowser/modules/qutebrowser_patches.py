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
from qutebrowser.mainwindow.statusbar import bar, keystring, searchmatch, url
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

_orig_set_hover_url = getattr(
    url.UrlText,
    "_dotfiles_orig_set_hover_url",
    url.UrlText.set_hover_url,
)
url.UrlText._dotfiles_orig_set_hover_url = _orig_set_hover_url


def _ignore_hover_url(self, link):
    self._hover_url = None
    self._update_url()


url.UrlText.set_hover_url = _ignore_hover_url


def _disable_hover_url_status(window):
    try:
        window.tabbed_browser.cur_link_hovered.disconnect()
    except TypeError:
        pass
    window.status.url._hover_url = None
    window.status.url._update_url()


_STATUS_URL_SIDE_PAD = 6

def _collapse_empty_status_prefix_widget(widget):
    empty = not bool(widget.text())
    widget.setVisible(not empty)
    widget.setMinimumWidth(0)
    widget.setMaximumWidth(0 if empty else 16777215)
    widget.updateGeometry()


def _collapse_empty_status_prefix(status):
    _collapse_empty_status_prefix_widget(status.keystring)
    _collapse_empty_status_prefix_widget(status.search_match)
    status._hbox.setContentsMargins(_STATUS_URL_SIDE_PAD, 0, _STATUS_URL_SIDE_PAD, 0)
    status._hbox.setSpacing(0)




_orig_keystring_updated = getattr(
    keystring.KeyString,
    "_dotfiles_orig_on_keystring_updated",
    keystring.KeyString.on_keystring_updated,
)
keystring.KeyString._dotfiles_orig_on_keystring_updated = _orig_keystring_updated


def _on_keystring_updated_with_collapsed_empty(self, mode, keystr):
    _orig_keystring_updated(self, mode, keystr)
    _collapse_empty_status_prefix_widget(self)


keystring.KeyString.on_keystring_updated = _on_keystring_updated_with_collapsed_empty

_orig_search_match_set_match = getattr(
    searchmatch.SearchMatch,
    "_dotfiles_orig_set_match",
    searchmatch.SearchMatch.set_match,
)
searchmatch.SearchMatch._dotfiles_orig_set_match = _orig_search_match_set_match


def _set_match_with_collapsed_empty(self, match):
    _orig_search_match_set_match(self, match)
    _collapse_empty_status_prefix_widget(self)


searchmatch.SearchMatch.set_match = _set_match_with_collapsed_empty

def _statusbar_stack_index(status, hbox):
    for i in range(hbox.count()):
        item = hbox.itemAt(i)
        if item is not None and item.layout() is status._stack:
            return i
    return -1


def _set_status_stretch(status, stretch_index):
    hbox = getattr(status, "_hbox", None)
    if hbox is None:
        return
    for i in range(hbox.count()):
        hbox.setStretch(i, 1 if i == stretch_index else 0)
    hbox.invalidate()
    hbox.activate()
    status.url.updateGeometry()
    status.cmd.updateGeometry()
    status.updateGeometry()


def _stretch_status_url(status):
    hbox = getattr(status, "_hbox", None)
    if hbox is None:
        return

    hbox.removeItem(status._stack)
    status.url.setAlignment(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter)
    status.url.setContentsMargins(0, 0, 0, 0)

    status.url.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)
    status.cmd.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Minimum)

    _set_status_stretch(status, hbox.indexOf(status.url))


def _stretch_status_command(status):
    hbox = getattr(status, "_hbox", None)
    if hbox is not None:
        if _statusbar_stack_index(status, hbox) == -1:
            hbox.insertLayout(0, status._stack)
        _set_status_stretch(status, _statusbar_stack_index(status, hbox))

def _stretch_status_current(status):
    if status._stack.currentWidget() is status.cmd:
        _stretch_status_command(status)
    else:
        _stretch_status_url(status)


def _install_status_stretch_hooks(status):
    if getattr(status, "_dotfiles_stretch_hooks_installed", False):
        return
    status.cmd.show_cmd.connect(lambda: QTimer.singleShot(0, lambda: _stretch_status_command(status)))
    status.cmd.hide_cmd.connect(lambda: QTimer.singleShot(0, lambda: _stretch_status_url(status)))
    status._dotfiles_stretch_hooks_installed = True


_orig_statusbar_draw_widgets = getattr(
    bar.StatusBar,
    "_dotfiles_orig_draw_widgets",
    bar.StatusBar._draw_widgets,
)
bar.StatusBar._dotfiles_orig_draw_widgets = _orig_statusbar_draw_widgets


def _draw_widgets_with_stretched_url(self):
    _orig_statusbar_draw_widgets(self)
    _install_status_stretch_hooks(self)
    _stretch_status_current(self)
    _collapse_empty_status_prefix(self)


bar.StatusBar._draw_widgets = _draw_widgets_with_stretched_url

_orig_show_cmd_widget = getattr(
    bar.StatusBar,
    "_dotfiles_orig_show_cmd_widget",
    bar.StatusBar._show_cmd_widget,
)
bar.StatusBar._dotfiles_orig_show_cmd_widget = _orig_show_cmd_widget


def _show_cmd_widget_with_stretched_command(self):
    _orig_show_cmd_widget(self)
    QTimer.singleShot(0, lambda: _stretch_status_command(self))


bar.StatusBar._show_cmd_widget = _show_cmd_widget_with_stretched_command

_orig_hide_cmd_widget = getattr(
    bar.StatusBar,
    "_dotfiles_orig_hide_cmd_widget",
    bar.StatusBar._hide_cmd_widget,
)
bar.StatusBar._dotfiles_orig_hide_cmd_widget = _orig_hide_cmd_widget


def _hide_cmd_widget_with_stretched_url(self):
    _orig_hide_cmd_widget(self)
    QTimer.singleShot(0, lambda: _stretch_status_url(self))


bar.StatusBar._hide_cmd_widget = _hide_cmd_widget_with_stretched_url

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
    _disable_hover_url_status(self)
    _install_status_stretch_hooks(self.status)
    _stretch_status_url(self.status)


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
        wanted_top = tab_bottom + _below_tab_status_height(widget, status)
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
    status_height = _below_tab_status_height(tabwidget, window.status)
    y = tabbar.geometry().bottom() + 1 if tabbar.isVisible() else 0
    window.status.setGeometry(0, y, tabwidget.width(), status_height)
    window.status.raise_()
    tabwidget.setDocumentMode(tabwidget.documentMode())


def _below_tab_status_height(tabwidget, status):
    tabbar = tabwidget.tabBar()
    return tabbar.height() if tabbar.isVisible() else status.sizeHint().height()


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
            _stretch_status_current(widget)
            _collapse_empty_status_prefix(widget)
        if getattr(widget, "status", None) is not None and getattr(widget, "tabbed_browser", None) is not None:
            _disable_hover_url_status(widget)


_align_existing_status_urls()
QTimer.singleShot(0, _align_existing_status_urls)
