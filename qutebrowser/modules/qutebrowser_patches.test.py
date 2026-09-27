#!/usr/bin/env python3
import ast
import sys
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


if __name__ == "__main__":
    unittest.main()
