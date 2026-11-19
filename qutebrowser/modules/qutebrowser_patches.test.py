#!/usr/bin/env python3
import ast
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
if sys.path and Path(sys.path[0]).resolve() == MODULE_DIR:
    sys.path.pop(0)
SOURCE = Path(__file__).with_name("qutebrowser_patches.py")
HELPERS = {
    "_current_site_search_url",
    "_duckduckgo_search_url",
    "_google_search_url",
    "_menu_action_text",
    "_connect_current_site_action",
    "_insert_current_site_action",
    "_augment_context_menu",
    "_google_context_menu",
    "_should_close_temp_window",
    "_install_temp_window_close_patch",
}




def load_helpers():
    tree = ast.parse(SOURCE.read_text())
    module = ast.Module(
        body=[node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in HELPERS],
        type_ignores=[],
    )
    ast.fix_missing_locations(module)
    namespace = {}
    exec(compile(module, str(SOURCE), "exec"), namespace)
    return namespace


class TempWindowCloseTest(unittest.TestCase):
    def test_closes_marked_single_tab_window(self):
        helper = load_helpers()["_should_close_temp_window"]
        browser = types.SimpleNamespace(
            _dotfiles_close_on_last_tab=True,
            widget=types.SimpleNamespace(count=lambda: 1),
        )
        self.assertTrue(helper(browser))
        self.assertFalse(helper(browser, transfer=True))

    def test_patch_closes_marked_window_once(self):
        class Recorder:
            def __init__(self):
                self.calls = []

            def __call__(self, *args, **kwargs):
                self.calls.append((args, kwargs))

        class Emitter:
            def __init__(self):
                self.emitted = False

            def emit(self):
                self.emitted = True

        class FakeBrowser:
            def __init__(self):
                self.delegated = Recorder()

            def close_tab(
                self, tab, *, add_undo=True, new_undo=True, transfer=False
            ):
                self.delegated(tab, add_undo, new_undo, transfer)

        fake_module = types.ModuleType(
            "qutebrowser.mainwindow.tabbedbrowser"
        )
        fake_module.TabbedBrowser = FakeBrowser
        installer = load_helpers()["_install_temp_window_close_patch"]
        previous = sys.modules.get("qutebrowser.mainwindow.tabbedbrowser")
        sys.modules["qutebrowser.mainwindow.tabbedbrowser"] = fake_module
        try:
            installer()
            installer()
        finally:
            if previous is None:
                del sys.modules["qutebrowser.mainwindow.tabbedbrowser"]
            else:
                sys.modules["qutebrowser.mainwindow.tabbedbrowser"] = previous

        marked = FakeBrowser()
        marked._dotfiles_close_on_last_tab = True
        marked.widget = types.SimpleNamespace(count=lambda: 1)
        marked._remove_tab = Recorder()
        marked.close_window = Emitter()
        marked.close_tab("tab")
        self.assertEqual(
            marked._remove_tab.calls,
            [(("tab",), {"add_undo": True, "new_undo": True})],
        )
        self.assertTrue(marked.close_window.emitted)
        self.assertEqual(marked.delegated.calls, [])

        normal = FakeBrowser()
        normal.widget = types.SimpleNamespace(count=lambda: 1)
        normal.close_tab("tab")
        self.assertEqual(
            normal.delegated.calls,
            [(("tab", True, True, False), {})],
        )

    def test_leaves_other_windows_and_tabs_alone(self):
        helper = load_helpers()["_should_close_temp_window"]
        marked_two_tabs = types.SimpleNamespace(
            _dotfiles_close_on_last_tab=True,
            widget=types.SimpleNamespace(count=lambda: 2),
        )
        unmarked_one_tab = types.SimpleNamespace(
            widget=types.SimpleNamespace(count=lambda: 1),
        )
        self.assertFalse(helper(marked_two_tabs))
        self.assertFalse(helper(unmarked_one_tab))

class SearchUrlTest(unittest.TestCase):
    def test_search_text_is_encoded_as_query(self):
        helpers = load_helpers()
        self.assertEqual(
            helpers["_current_site_search_url"]("cats & dogs", "www.example.com"),
            "https://www.google.com/search?q=site%3Aexample.com+cats+%26+dogs",
        )
        self.assertEqual(
            helpers["_duckduckgo_search_url"]("cats & dogs"),
            "https://duckduckgo.com/?q=cats+%26+dogs",
        )
        self.assertEqual(
            helpers["_google_search_url"]("cats & dogs"),
            "https://www.google.com/search?q=cats+%26+dogs",
        )


class _FakeRequest:
    def __init__(self, selected_text=""):
        self._selected_text = selected_text

    def selectedText(self):
        return self._selected_text

    def linkUrl(self):
        return ""

    def isContentEditable(self):
        return False

    def mediaType(self):
        return None


class _FakeUrl:
    def __init__(self, host):
        self._host = host

    def host(self):
        return self._host


class _FakeAction:
    def __init__(self):
        self.text = None
        self.connected = None
        self.triggered = self
        self.enabled = True

    def connect(self, fn):
        self.connected = fn

    def setEnabled(self, enabled):
        self.enabled = enabled


class _FakeMenu:
    def __init__(self, labels=("Back", "Forward", "Reload", "---", "Save page", "View page source")):
        self.entries = []
        for label in labels:
            if label == "---":
                self.addSeparator()
            else:
                self.addAction(label)
    def addSeparator(self):
        self.entries.append("---")

    def addAction(self, text):
        action = _FakeAction()
        action.text = text
        self.entries.append(action)
        return action

    def removeAction(self, action):
        self.entries.remove(action)

    def insertAction(self, before_action, action):
        self.entries.insert(self.entries.index(before_action), action)

    def insertSeparator(self, before_action):
        self.entries.insert(self.entries.index(before_action), "---")

    def actions(self):
        return [entry for entry in self.entries if entry != "---"]


class _FakeView:
    def __init__(self, request=None, win_id=7, labels=None):
        self._request = request
        self._win_id = win_id
        self._labels = labels

    def lastContextMenuRequest(self):
        return self._request

    def url(self):
        return _FakeUrl("www.example.com")

    def createStandardContextMenu(self):
        return _FakeMenu() if self._labels is None else _FakeMenu(self._labels)


class GoogleContextMenuTest(unittest.TestCase):
    def setUp(self):
        self.helpers = load_helpers()
        self.helpers["log"] = types.SimpleNamespace(
            misc=types.SimpleNamespace(debug=lambda *args, **kwargs: None)
        )
        self.opened = []
        self.helpers["_open_current_site_search"] = (
            lambda win_id, text, host: self.opened.append(("Current Site", win_id, text, host))
        )
        self.helpers["_open_duckduckgo_search"] = (
            lambda win_id, text: self.opened.append(("DuckDuckGo", win_id, text))
        )
        self.helpers["_open_google_search"] = (
            lambda win_id, text: self.opened.append(("Google", win_id, text))
        )
        self.helpers["config"] = types.SimpleNamespace(
            val=types.SimpleNamespace(
                input=types.SimpleNamespace(
                    mouse=types.SimpleNamespace(rocker_gestures=False)
                )
            )
        )

    def test_selected_text_gets_search_engines_in_order(self):
        menu = self.helpers["_google_context_menu"](_FakeView(_FakeRequest("  cats  ")))
        texts = [entry if isinstance(entry, str) else entry.text for entry in menu.entries]
        self.assertEqual(
            texts,
            [
                "Back", "Forward", "Reload", "---", "Save page", "View page source",
                "---", "Search Current Site", "Search DuckDuckGo", "Search Google",
            ],
        )
        menu.entries[-3].connected()
        menu.entries[-2].connected()
        menu.entries[-1].connected()
        self.assertEqual(
            self.opened,
            [
                ("Current Site", 7, "cats", "www.example.com"),
                ("DuckDuckGo", 7, "cats"),
                ("Google", 7, "cats"),
            ],
        )

    def test_no_selection_inserts_current_site_between_save_and_source(self):
        menu = self.helpers["_google_context_menu"](_FakeView(None))
        texts = [entry if isinstance(entry, str) else entry.text for entry in menu.entries]
        self.assertEqual(
            texts,
            [
                "Back", "Forward", "Reload", "---", "Save page", "---",
                "Search Current Site", "---", "View page source",
            ],
        )
        current_site_action = next(
            entry for entry in menu.entries
            if not isinstance(entry, str) and entry.text == "Search Current Site"
        )
        self.assertTrue(current_site_action.enabled)
        current_site_action.connected()
        self.assertEqual(self.opened, [("Current Site", 7, "", "www.example.com")])

    def test_empty_selection_keeps_ordinary_menu(self):
        for request in (_FakeRequest(""), _FakeRequest("   ")):
            with self.subTest(request=request):
                self.opened.clear()
                menu = self.helpers["_google_context_menu"](_FakeView(request))
                self.assertEqual(menu.entries[6].text, "Search Current Site")
                self.assertEqual(self.opened, [])

    def test_current_site_action_disables_without_host(self):
        view = _FakeView(None)
        view.url = lambda: _FakeUrl("")
        menu = self.helpers["_google_context_menu"](view)
        current_site_action = next(
            entry for entry in menu.entries
            if not isinstance(entry, str) and entry.text == "Search Current Site"
        )
        self.assertFalse(current_site_action.enabled)

    def test_rocker_gestures_disable_custom_menu(self):
        self.helpers["config"].val.input.mouse.rocker_gestures = True
        view = _FakeView(_FakeRequest("cats"))
        self.assertIsNone(self.helpers["_google_context_menu"](view))
        self.assertEqual(self.opened, [])



class CaretColorTest(unittest.TestCase):
    def test_modern_css_colors_have_safe_fallbacks(self):
        import subprocess
        from qutebrowser.utils import resources

        tree = ast.parse(SOURCE.read_text())
        assignments = ast.Module(body=[node for node in tree.body
            if isinstance(node, ast.Assign) and any(
                isinstance(target, ast.Name) and target.id in
                {"_caret_colors", "_safe_caret_colors"} for target in node.targets)],
            type_ignores=[])
        ns = {}
        exec(compile(assignments, str(SOURCE), "exec"), ns)
        original = resources.read_file("javascript/caret.js")
        patched = original.replace(ns["_caret_colors"], ns["_safe_caret_colors"])
        self.assertNotEqual(original, patched)
        colors = patched[patched.index("    axs.color.Color ="):patched.index("    /**\n     * A class to represent a cursor")]
        script = "const axs = {color: {}, utils: {}};\n" + colors
        script += "\nconst elem = {}; const style = {backgroundColor: 'oklch(0.2 0 0)', color: 'oklch(0.9 0 0)', opacity: 1};\n"
        script += ns["_safe_caret_colors"]
        script += "\nif (axs.color.colorToString(bg) !== '#ffffff' || axs.color.colorToString(fg) !== '#000000') throw Error('invalid fallback');"
        subprocess.run(["node", "-e", script], check=True)


class ModeOverlayTest(unittest.TestCase):
    def test_overlay_modes_clear_native_status_color(self):
        tree = ast.parse(SOURCE.read_text())
        names = {"_set_mode_active_with_current_stretch",
                 "_on_caret_selection_toggled_with_bottom_line"}
        module = ast.Module(body=[node for node in tree.body
            if isinstance(node, ast.FunctionDef) and node.name in names],
            type_ignores=[])
        calls = []
        modes = types.SimpleNamespace(insert="insert", caret="caret",
            passthrough="passthrough", command="command", prompt="prompt", yesno="yesno")
        ns = {
            "usertypes": types.SimpleNamespace(KeyMode=modes),
            "_orig_set_mode_active": lambda status, mode, active: calls.append((mode, active)),
            "_orig_caret_selection_toggled": lambda status, state: None,
            "_set_bottom_mode_line": lambda *args: None,
            "_stretch_status_url": lambda status: None,
        }
        exec(compile(module, str(SOURCE), "exec"), ns)
        status = types.SimpleNamespace(txt=types.SimpleNamespace(setText=lambda text: None))
        for mode in (modes.insert, modes.caret, modes.passthrough):
            for active in (True, False):
                ns["_set_mode_active_with_current_stretch"](status, mode, active)
                self.assertEqual(calls[-1], (mode, False))
        ns["_on_caret_selection_toggled_with_bottom_line"](status, "selection")
        self.assertEqual(calls[-1], (modes.caret, False))

    def test_compact_overlay_does_not_reserve_page_space(self):
        os.environ["QT_QPA_PLATFORM"] = "offscreen"
        from qutebrowser.qt.widgets import QApplication, QLabel, QVBoxLayout, QWidget

        app = QApplication.instance() or QApplication([])
        tree = ast.parse(SOURCE.read_text())
        module = ast.Module(body=[
            node for node in tree.body
            if isinstance(node, ast.FunctionDef)
            and node.name == "_place_bottom_mode_line"
        ], type_ignores=[])
        ns = {"_bottom_mode_line_height": lambda window: 24}
        exec(compile(module, str(SOURCE), "exec"), ns)
        window = QWidget()
        layout = QVBoxLayout(window)
        layout.setContentsMargins(0, 0, 0, 0)
        page = QWidget(window)
        layout.addWidget(page)
        label = QLabel(window)
        label.setStyleSheet("background: green; padding: 0 6px;")
        window._dotfiles_bottom_mode_line = label
        window.resize(800, 600)
        window.show()
        for text in ("-- INSERT MODE --", "-- CARET MODE --", "-- VISUAL MODE --",
                     "-- PASSTHROUGH MODE --"):
            with self.subTest(mode=text):
                label.setText(text)
                ns["_place_bottom_mode_line"](window)
                label.show()
                app.processEvents()
                self.assertEqual(label.width(), label.sizeHint().width())
                self.assertLess(label.width(), window.width())
                self.assertEqual(label.geometry().bottom(), window.rect().bottom())
                self.assertEqual(page.geometry().bottom(), window.rect().bottom())
                self.assertEqual(layout.count(), 1)
        window.close()


class TabPositionLayoutTest(unittest.TestCase):
    """Real offscreen Qt layout check for the below-tab status."""

    LAYOUT_HELPERS = {
        "_below_tab_status_enabled",
        "_BelowTabStatusStyle",
        "_ensure_below_tab_style",
        "_place_status_below_tabs",
        "_below_tab_status_height",
        "_BelowTabStatusRelayoutFilter",
        "_install_below_tab_relayout_filter",
        "_add_widgets_with_below_tab_status",
        "_TabPositionRelayout",
        "_align_existing_status_urls",
    }

    def test_page_and_status_geometry_across_tab_positions(self):
        try:
            from qutebrowser.qt.core import QEvent, QObject, QPoint, QRect, QTimer
            from qutebrowser.qt.widgets import (
                QApplication, QSizePolicy, QStyle, QTabWidget, QVBoxLayout,
                QWidget)
        except ImportError as exc:
            self.skipTest(f"qutebrowser Qt unavailable: {exc}")

        with tempfile.TemporaryDirectory() as tmp:
            os.environ.update(
                QT_QPA_PLATFORM="offscreen",
                XDG_CONFIG_HOME=f"{tmp}/config",
                XDG_DATA_HOME=f"{tmp}/data",
                XDG_CACHE_HOME=f"{tmp}/cache",
            )
            app = QApplication.instance() or QApplication([])
            from qutebrowser.config import (
                config, configcache, configdata, configfiles)
            from qutebrowser.mainwindow import tabwidget
            from qutebrowser.utils import standarddir

            standarddir.init(None)
            configdata.init()
            config.instance = config.Config(yaml_config=configfiles.YamlConfig())
            config.val = config.ConfigContainer(config.instance)
            config.key_instance = config.KeyConfig(config.instance)
            config.cache = configcache.ConfigCache()
            config.instance.set_obj("statusbar.position", "top")
            config.instance.set_obj("tabs.position", "top")

            tree = ast.parse(SOURCE.read_text())
            module = ast.Module(
                body=[
                    node for node in tree.body
                    if isinstance(node, (ast.FunctionDef, ast.ClassDef))
                    and node.name in self.LAYOUT_HELPERS
                ],
                type_ignores=[],
            )
            ast.fix_missing_locations(module)
            ns = {
                "config": config,
                "QApplication": QApplication,
                "QTabWidget": QTabWidget,
                "QStyle": QStyle,
                "QObject": QObject,
                "QEvent": QEvent,
                "QTimer": QTimer,
                "QSizePolicy": QSizePolicy,
                "tabwidget": tabwidget,
                "_install_bottom_mode_line": lambda window: None,
                "_place_bottom_mode_line": lambda window: None,
                "_disable_hover_url_status": lambda window: None,
                "_install_temp_window_close_patch": lambda: None,
            }
            exec(compile(module, str(SOURCE), "exec"), ns)

            def upstream_add_widgets(window):
                window._vbox.removeWidget(window.tabbed_browser.widget)
                window._vbox.removeWidget(window._downloadview)
                window._vbox.removeWidget(window.status)
                widgets = [window.tabbed_browser.widget, window._downloadview]
                if config.val.statusbar.position == "top":
                    widgets.insert(0, window.status)
                else:
                    widgets.append(window.status)
                for widget in widgets:
                    window._vbox.addWidget(widget)

            ns["_orig_add_widgets"] = upstream_add_widgets

            class Window(QWidget):
                def __init__(self):
                    super().__init__()
                    self._vbox = QVBoxLayout(self)
                    self._vbox.setContentsMargins(0, 0, 0, 0)
                    self._vbox.setSpacing(0)
                    self._downloadview = QWidget(self)
                    self._downloadview.hide()
                    self.status = QWidget(self)
                    self.status.setFixedHeight(20)
                    self.status.show()
                    self.tabbed_browser = types.SimpleNamespace(widget=QTabWidget())
                    self.tabbed_browser.widget.setParent(self)

            window = Window()
            tabwidget_ = window.tabbed_browser.widget
            for index in range(40):
                tabwidget_.addTab(QWidget(), f"tab {index}")
            page = tabwidget_.widget(0)

            def on_config_changed(option):
                if option == "tabs.position":
                    tabwidget_.setTabPosition(
                        QTabWidget.TabPosition(config.val.tabs.position))

            config.instance.changed.connect(on_config_changed)
            # The patch is sourced while the window already exists: its
            # __init__ slot cannot be replaced, only a new connection can react.
            ns["_add_widgets_with_below_tab_status"](window)
            window.resize(900, 600)
            window.show()
            app.processEvents()

            def switch(position):
                config.instance.set_obj("tabs.position", position)
                app.processEvents()
                app.processEvents()

            def assert_content_visible():
                self.assertGreater(page.width(), 100, "page has no width")
                self.assertGreater(page.height(), 100, "page has no height")
                self.assertTrue(window.status.isVisible(), "status hidden")

            # Horizontal tabs: status sits below the tab bar in the tab widget.
            self.assertIs(window.status.parent(), tabwidget_)
            self.assertGreater(page.height(), 100)
            self.assertEqual(
                window.status.geometry().y(),
                tabwidget_.tabBar().geometry().bottom() + 1,
            )
            self.assertGreaterEqual(
                page.mapTo(tabwidget_, page.rect().topLeft()).y(),
                window.status.geometry().bottom(),
            )

            def assert_status_row_flush():
                rect = QRect(
                    window.status.mapTo(window, QPoint(0, 0)),
                    window.status.size())
                self.assertEqual(rect.top(), 0, "status is not at y=0")
                self.assertEqual(rect.left(), 0)
                self.assertEqual(rect.width(), window.width(),
                                 "status is not full width")
                self.assertFalse(
                    rect.intersects(QRect(
                        tabwidget_.mapTo(window, QPoint(0, 0)),
                        tabwidget_.size())),
                    "status overlaps the sidebar/page",
                )
                for part in (tabwidget_.tabBar(), page):
                    self.assertLessEqual(
                        rect.bottom(),
                        part.mapTo(window, QPoint(0, 0)).y(),
                        "content starts inside the status row",
                    )

            for position in ("left", "right"):
                with self.subTest(position=position):
                    switch(position)
                    self.assertIs(window.status.parent(), window)
                    assert_content_visible()
                    # Status is a normal vbox row above the tab widget, not an
                    # overlay across the sidebar.
                    assert_status_row_flush()

            with self.subTest(position="top"):
                switch("top")
                self.assertIs(window.status.parent(), tabwidget_)
                assert_content_visible()
                self.assertEqual(
                    window.status.geometry().y(),
                    tabwidget_.tabBar().geometry().bottom() + 1,
                )
                self.assertGreaterEqual(
                    page.mapTo(tabwidget_, page.rect().topLeft()).y(),
                    window.status.geometry().bottom(),
                )

            with self.subTest(position="left", config_source=True):
                switch("left")
                # Pre-fix state: the config was sourced while the tabs were
                # already vertical, leaving the status a wide tab widget child
                # with no further signal to repair it.
                window._vbox.removeWidget(window.status)
                window.status.setParent(tabwidget_)
                window.status.setGeometry(0, 25, tabwidget_.width(), 20)
                window.status.show()
                app.processEvents()
                self.assertIs(window.status.parent(), tabwidget_)

                ns["_align_existing_status_urls"]()
                app.processEvents()
                window._vbox.activate()

                self.assertIs(window.status.parent(), window)
                assert_content_visible()
                assert_status_row_flush()

            config.instance.changed.disconnect(on_config_changed)
            window.close()


if __name__ == "__main__":
    unittest.main()
