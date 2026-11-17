#!/usr/bin/env python3
import builtins
import sys
from pathlib import Path

MODULE_DIR = Path(__file__).resolve().parent
sys.path.append(str(MODULE_DIR.parent))
if str(MODULE_DIR) in sys.path:
    sys.path.remove(str(MODULE_DIR))

import unittest
from types import SimpleNamespace
from unittest import mock

from modules import tabs_width


class WidthTest(unittest.TestCase):
    def test_percentage_steps_clamp_and_reset(self):
        self.assertEqual(tabs_width.next_width("15%", 1000, 1), "20%")
        self.assertEqual(tabs_width.next_width("49%", 1000, 1), "50%")
        self.assertEqual(tabs_width.next_width("5%", 1000, -1), "5%")
        self.assertEqual(tabs_width.next_width("34%", 1000, 0), "20%")

    def test_pixel_width_uses_window_width(self):
        self.assertEqual(tabs_width.next_width(200, 1000, 1), "25%")
        self.assertEqual(tabs_width.next_width(200, 1000, -1), "15%")

    def test_horizontal_tab_bar_is_noop(self):
        for position in ("top", "bottom"):
            fake = SimpleNamespace(
                get=lambda name, position=position: position, set_obj=mock.Mock()
            )
            with mock.patch(
                "qutebrowser.config.config.instance", fake
            ), mock.patch("qutebrowser.utils.message.info"):
                tabs_width.resize(1)
            fake.set_obj.assert_not_called()

    def test_vertical_position_accepts_qt_enum(self):
        self.assertTrue(tabs_width.is_vertical(SimpleNamespace(name="West")))
        self.assertFalse(tabs_width.is_vertical(SimpleNamespace(name="North")))
        self.assertTrue(tabs_width.is_vertical("left"))

    def test_vertical_tab_bar_width_change_is_temporary(self):
        values = {
            "tabs.position": SimpleNamespace(name="West"),
            "tabs.width": "15%",
        }
        fake = SimpleNamespace(
            get=lambda name: values[name],
            set_obj=mock.Mock(
                side_effect=lambda name, value, **kwargs: values.update(
                    {name: value}
                )
            ),
        )
        window = SimpleNamespace(width=lambda: 1000)
        with mock.patch("qutebrowser.config.config.instance", fake), mock.patch(
            "qutebrowser.utils.objreg.last_focused_window", return_value=window
        ), mock.patch("qutebrowser.utils.message.info") as info:
            tabs_width.resize(1)

        fake.set_obj.assert_called_once_with(
            "tabs.width", "20%", save_yaml=False
        )
        info.assert_not_called()


class BindingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        class FakeConfig:
            def bind(self, key, command, mode="normal"):
                pass

            def unbind(self, key, mode="normal"):
                pass

        class FakeC:
            keyhint = SimpleNamespace(blacklist=[])

        builtins.config = FakeConfig()
        builtins.c = FakeC()
        try:
            from modules import bindings

            cls.bindings = bindings
            cls.specs = {spec.key: spec.command for spec in bindings.BINDING_SPECS}
        finally:
            del builtins.config
            del builtins.c

    def test_ctrl_x_closes_tab_in_every_mode(self):
        specs = [
            spec
            for spec in self.bindings.BINDING_SPECS
            if spec.key == "<Ctrl-x>"
        ]
        self.assertEqual(
            {spec.mode for spec in specs},
            {
                "normal",
                "insert",
                "hint",
                "passthrough",
                "command",
                "prompt",
                "yesno",
                "caret",
                "register",
            },
        )
        self.assertTrue(all(spec.command == "tab-close" for spec in specs))

    def test_vertical_tab_bindings(self):
        expected = {
            " ut": "set -t tabs.position top",
            " ul": "set -t tabs.position left ;; set -t tabs.width 20%",
            " ur": "set -t tabs.position right ;; set -t tabs.width 20%",
            " u+": tabs_width.command(1),
            " u-": tabs_width.command(-1),
            " u=": tabs_width.command(0),
        }
        for key, command in expected.items():
            self.assertEqual(self.specs.get(key), command)

    def test_binding_command_parses_and_runs_resize(self):
        from qutebrowser.commands import parser
        from qutebrowser.misc import utilcmds  # registers :debug-pyeval

        parsed = parser.CommandParser().parse_all(
            tabs_width.command(1), aliases=False
        )[0]
        self.assertEqual(parsed.args[0], "--quiet")
        self.assertTrue(parsed.args[1].startswith('exec("'))
        with mock.patch.object(tabs_width, "resize") as resize:
            eval(parsed.args[1], {})
        resize.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
