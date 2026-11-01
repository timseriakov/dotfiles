#!/usr/bin/env python3
import sys
import unittest
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(MODULE_DIR.parent))
if str(MODULE_DIR) in sys.path:
    sys.path.remove(str(MODULE_DIR))

from qutebrowser.config import configdata
from modules.base import en
from modules.keymap import run_default_generator


class FakeConfig:
    def __init__(self, defaults, commands=None):
        self.values = {
            "bindings.default": defaults,
            "bindings.commands": {"normal": dict(commands or {})},
        }
        self.bindings = self.values["bindings.commands"]

    def get(self, name):
        return self.values[name]

    def bind(self, key, command, mode="normal"):
        self.bindings.setdefault(mode, {})[key] = command


class DefaultBindingGeneratorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        configdata.init()
        cls.defaults = configdata.DATA["bindings.default"].default
        cls.normal = cls.defaults["normal"]

    def test_generates_actual_default_layout_twins(self):
        config = FakeConfig(self.defaults)

        run_default_generator(config)

        self.assertEqual(config.bindings["normal"]["щ"], en(self.normal["o"]))
        self.assertEqual(config.bindings["normal"]["о"], en(self.normal["j"]))
        self.assertEqual(config.bindings["normal"]["пщ"], en(self.normal["go"]))

    def test_preserves_custom_source_and_target_bindings(self):
        custom = {
            "o": "custom open",
            "о": "custom Cyrillic",
            "щ": None,
            "пщ": "custom chain",
            "ш": "preserve input layout",
        }
        config = FakeConfig(self.defaults, custom)

        run_default_generator(config)

        for key, command in custom.items():
            self.assertEqual(config.bindings["normal"][key], command)

    def test_skips_special_tokens_and_default_key_conflicts(self):
        config = FakeConfig(self.defaults)

        run_default_generator(config)

        self.assertNotIn("<Ctrl-Е>", config.bindings["normal"])
        self.assertNotIn(".", config.bindings["normal"])
        self.assertEqual(self.normal["."], "cmd-repeat-last")
        self.assertEqual(self.normal["/"], "cmd-set-text /")


if __name__ == "__main__":
    unittest.main()
