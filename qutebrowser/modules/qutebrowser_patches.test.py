#!/usr/bin/env python3
import ast
import sys
import types
import unittest
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
if sys.path and Path(sys.path[0]).resolve() == MODULE_DIR:
    sys.path.pop(0)
SOURCE = Path(__file__).with_name("qutebrowser_patches.py")
HELPERS = {
    "_safe_agent_token",
    "_agent_bootstrap_prefix",
    "_agent_token_from_url",
    "_is_agent_bootstrap_url",
    "_current_site_search_url",
    "_duckduckgo_search_url",
    "_google_search_url",
    "_menu_action_text",
    "_connect_current_site_action",
    "_insert_current_site_action",
    "_augment_context_menu",
    "_google_context_menu",
}


def load_helpers():
    tree = ast.parse(SOURCE.read_text())
    module = ast.Module(
        body=[
            ast.Assign(targets=[ast.Name("_AGENT_TITLE_MARKER", ast.Store())], value=ast.Constant("OMP_AGENT_WINDOW_9f2c")),
            ast.Assign(targets=[ast.Name("_AGENT_BOOTSTRAP_TOKEN", ast.Store())], value=ast.Constant("OMP_AGENT_WINDOW_9f2c_BOOTSTRAP")),
            *[node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in HELPERS],
        ],
        type_ignores=[],
    )
    ast.fix_missing_locations(module)
    namespace = {}
    exec(compile(module, str(SOURCE), "exec"), namespace)
    return namespace


class AgentHookHelpersTest(unittest.TestCase):
    def setUp(self):
        self.helpers = load_helpers()

    def test_agent_token_from_url_is_anchored_and_safe(self):
        token = "s" + "a" * 32
        extract = self.helpers["_agent_token_from_url"]
        self.assertEqual(extract(f"about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}"), token)
        self.assertIsNone(extract(f"https://example.test/#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}"))
        self.assertIsNone(extract(f"about:blank#xOMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}"))
        self.assertIsNone(extract("about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_short"))
        self.assertIsNone(extract("about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_raw/session"))
        self.assertIsNone(extract(f"about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}?x"))

    def test_agent_bootstrap_dispatch_rejects_malformed_prefixes(self):
        token = "s" + "b" * 32
        is_bootstrap = self.helpers["_is_agent_bootstrap_url"]
        self.assertTrue(is_bootstrap("about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP"))
        self.assertTrue(is_bootstrap(f"about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}"))
        self.assertFalse(is_bootstrap(f"https://example.test/#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}"))
        self.assertFalse(is_bootstrap("about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_short"))
        self.assertFalse(is_bootstrap("about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_raw/session"))
        self.assertFalse(is_bootstrap(f"about:blank#OMP_AGENT_WINDOW_9f2c_BOOTSTRAP_{token}?x"))


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


if __name__ == "__main__":
    unittest.main()
