"""Temporary width controls for a vertical tab bar."""

import json
from pathlib import Path

MIN_PERCENT = 5
MAX_PERCENT = 50
DEFAULT_PERCENT = 15
STEP = 2
CONFIG_DIR = Path(__file__).resolve().parent.parent


def next_width(current: int | str, window_width: int, direction: int) -> str:
    """Return the next tabs.width, converting pixel widths via window width."""
    if direction == 0:
        percent = DEFAULT_PERCENT
    else:
        percent = _percent(current, window_width) + direction * STEP
    return f"{max(MIN_PERCENT, min(MAX_PERCENT, percent))}%"


def _percent(current: int | str, window_width: int) -> int:
    if isinstance(current, str):
        return round(float(current.removesuffix("%")))
    if window_width <= 0:
        return DEFAULT_PERCENT
    return round(current * 100 / window_width)


def is_vertical(position) -> bool:
    name = getattr(position, "name", position)
    return str(name).lower() in ("left", "west", "right", "east")


def resize(direction: int) -> None:
    """Apply a temporary width change; only for left/right tab bars."""
    from qutebrowser.config import config
    from qutebrowser.utils import message, objreg

    if not is_vertical(config.instance.get("tabs.position")):
        message.info("Tab bar is horizontal; use Space u l or Space u r first")
        return

    window = objreg.last_focused_window()
    width = next_width(
        config.instance.get("tabs.width"), window.width(), direction
    )
    config.instance.set_obj("tabs.width", width, save_yaml=False)
    message.info(f"Tab bar width: {width}")


def command(direction: int) -> str:
    """Build the debug-pyeval command for a binding."""
    code = (
        "import sys; "
        f"sys.path.insert(0, {str(CONFIG_DIR)!r}); "
        f"from modules.tabs_width import resize; resize({direction})"
    )
    return f'debug-pyeval --quiet exec({json.dumps(code)})'
