#!/usr/bin/env python3
import importlib.machinery
import importlib.util
import subprocess
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("qutebrowser-agent")
loader = importlib.machinery.SourceFileLoader("qutebrowser_agent", str(SCRIPT))
spec = importlib.util.spec_from_loader(loader.name, loader)
agent = importlib.util.module_from_spec(spec)
loader.exec_module(agent)


class LauncherTest(unittest.TestCase):
    def test_missing_marker_uses_active_runtime_and_serializes_callers(self):
        marker = threading.Event()
        launches = []
        active = 0
        max_active = 0
        state_lock = threading.Lock()

        class Child:
            returncode = 0

            def wait(self, timeout):
                nonlocal active, max_active
                with state_lock:
                    active += 1
                    max_active = max(max_active, active)
                time.sleep(0.15)
                launches.append(self.env["TMPDIR"])
                marker.set()
                with state_lock:
                    active -= 1

        def popen(_argv, env):
            child = Child()
            child.env = env
            return child

        with tempfile.TemporaryDirectory() as home, mock.patch.object(
            agent.Path, "home", return_value=Path(home)
        ), mock.patch.object(agent, "active_runtime", return_value="/active/runtime"), mock.patch.object(
            agent, "has_marker", side_effect=marker.is_set
        ), mock.patch.object(agent.subprocess, "Popen", side_effect=popen), mock.patch.object(
            agent.sys, "argv", [str(SCRIPT)]
        ):
            errors = []

            def run():
                try:
                    agent.main()
                except Exception as error:
                    errors.append(error)

            threads = [threading.Thread(target=run) for _ in range(3)]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()

        self.assertEqual(errors, [])
        self.assertEqual(launches, ["/active/runtime"])
        self.assertEqual(max_active, 1)

    def test_timeout_terminates_only_spawned_child(self):
        class Child:
            returncode = None
            terminated = False
            killed = False
            waits = 0

            def wait(self, timeout=None):
                self.waits += 1
                if self.waits == 1:
                    raise subprocess.TimeoutExpired("qutebrowser", timeout)
                self.returncode = -15

            def terminate(self):
                self.terminated = True

            def kill(self):
                self.killed = True

        child = Child()
        with tempfile.TemporaryDirectory() as home, mock.patch.object(
            agent.Path, "home", return_value=Path(home)
        ), mock.patch.object(agent, "active_runtime", return_value="/active/runtime"), mock.patch.object(
            agent, "has_marker", return_value=False
        ), mock.patch.object(agent.subprocess, "Popen", return_value=child), mock.patch.object(
            agent.sys, "argv", [str(SCRIPT)]
        ):
            with self.assertRaisesRegex(RuntimeError, "terminated only the spawned process"):
                agent.main()

        self.assertTrue(child.terminated)
        self.assertFalse(child.killed)

    def test_token_argument_uses_hashed_marker_and_bootstrap_url(self):
        token = "abcDEF_123456"
        self.assertEqual(agent.parse_token([str(SCRIPT), "--token", token]), token)
        self.assertEqual(agent.token_marker(token), f"{agent.MARKER}_TOKEN_{token}")
        self.assertEqual(agent.bootstrap_url(token), f"about:blank#{agent.MARKER}_BOOTSTRAP_{token}")

        pages = [
            {"type": "page", "title": agent.MARKER},
            {"type": "page", "title": f"prefix{agent.MARKER}_TOKEN_{token}"},
            {"type": "page", "title": f"{agent.MARKER}_TOKEN_{token}x"},
        ]
        with mock.patch.object(agent, "get_json", return_value=pages):
            self.assertFalse(agent.has_marker(token))

        pages.append({"type": "page", "title": f"{agent.MARKER} {agent.MARKER}_TOKEN_{token}"})
        with mock.patch.object(agent, "get_json", return_value=pages):
            self.assertTrue(agent.has_marker(token))
            self.assertFalse(agent.has_marker("missing12"))

    def test_base_marker_matching_is_exact_and_string_only(self):
        pages = [
            {"type": "page", "title": f"prefix{agent.MARKER}"},
            {"type": "page", "title": None},
            {"type": "page", "title": 123},
        ]
        with mock.patch.object(agent, "get_json", return_value=pages):
            self.assertFalse(agent.has_marker())

        pages.append({"type": "page", "title": f"{agent.MARKER} real"})
        with mock.patch.object(agent, "get_json", return_value=pages):
            self.assertTrue(agent.has_marker())

    def test_invalid_token_is_rejected_fail_closed(self):
        for token in ["short", "raw/session/id", "has space", "semi;colon"]:
            with self.subTest(token=token):
                with self.assertRaisesRegex(RuntimeError, "usage: qutebrowser-agent"):
                    agent.parse_token([str(SCRIPT), "--token", token])


if __name__ == "__main__":
    unittest.main()
