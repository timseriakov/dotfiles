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
    "_google_search_url",
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



class GoogleSearchUrlTest(unittest.TestCase):
    def test_search_text_is_encoded_as_query(self):
        helpers = load_helpers()
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
        from urllib.parse import urlparse
        return urlparse("")

    def isContentEditable(self):
        return False

    def mediaType(self):
        return None


class _FakeAction:
    def __init__(self):
        self.text = None
        self.connected = None
        self.triggered = self

    def connect(self, fn):
        self.connected = fn


class _FakeMenu:
    def __init__(self):
        self.entries = []

    def addSeparator(self):
        self.entries.append("---")

    def addAction(self, text):
        action = _FakeAction()
        action.text = text
        self.entries.append(action)
        return action


class _FakeView:
    def __init__(self, request=None, win_id=7):
        self._request = request
        self._win_id = win_id

    def lastContextMenuRequest(self):
        return self._request

    def createStandardContextMenu(self):
        return _FakeMenu()


class GoogleContextMenuTest(unittest.TestCase):
    def setUp(self):
        self.helpers = load_helpers()
        self.helpers["log"] = types.SimpleNamespace(
            misc=types.SimpleNamespace(debug=lambda *args, **kwargs: None)
        )
        self.opened = []
        self.helpers["_open_google_search"] = (
            lambda win_id, text: self.opened.append((win_id, text))
        )
        self.helpers["config"] = types.SimpleNamespace(
            val=types.SimpleNamespace(
                input=types.SimpleNamespace(
                    mouse=types.SimpleNamespace(rocker_gestures=False)
                )
            )
        )

    def test_selected_text_gets_search_google(self):
        menu = self.helpers["_google_context_menu"](_FakeView(_FakeRequest("  cats  ")))
        texts = [entry if isinstance(entry, str) else entry.text for entry in menu.entries]
        self.assertEqual(texts, ["---", "Search Google"])
        menu.entries[-1].connected()
        self.assertEqual(self.opened, [(7, "cats")])

    def test_no_selection_keeps_standard_menu_only(self):
        for request in (None, _FakeRequest(""), _FakeRequest("   ")):
            with self.subTest(request=request):
                self.opened.clear()
                menu = self.helpers["_google_context_menu"](_FakeView(request))
                self.assertEqual(menu.entries, [])
                self.assertEqual(self.opened, [])

    def test_rocker_gestures_disable_custom_menu(self):
        self.helpers["config"].val.input.mouse.rocker_gestures = True
        view = _FakeView(_FakeRequest("cats"))
        self.assertIsNone(self.helpers["_google_context_menu"](view))
        self.assertEqual(self.opened, [])

if __name__ == "__main__":
    unittest.main()
