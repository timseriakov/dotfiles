# qutebrowser 3.5.1 calls move_cursor_to_end after `gi`/`hint inputs --first`.
# Chromium forbids selectionStart/selectionEnd on input[type=email], so skip only
# those unsupported input types and keep the native fast `gi` behavior.
from qutebrowser.browser.webengine import webengineelem

_UNSUPPORTED_SELECTION_TYPES = {
    "button",
    "checkbox",
    "color",
    "date",
    "datetime-local",
    "email",
    "file",
    "hidden",
    "image",
    "month",
    "number",
    "radio",
    "range",
    "reset",
    "submit",
    "time",
    "url",
    "week",
}


def _safe_move_text_cursor(self):
    if not (self.is_text_input() and self.is_editable()):
        return
    if self.tag_name().lower() == "input" and self.get("type", "text").lower() in _UNSUPPORTED_SELECTION_TYPES:
        return
    self._js_call("move_cursor_to_end")


webengineelem.WebEngineElement._move_text_cursor = _safe_move_text_cursor


def _self_check():
    class Elem:
        def __init__(self, type_="email"):
            self.called = False
            self.type = type_
        def is_text_input(self): return True
        def is_editable(self): return True
        def tag_name(self): return "input"
        def get(self, key, default=None): return self.type if key == "type" else default
        def _js_call(self, name): self.called = name

    email = Elem("email")
    _safe_move_text_cursor(email)
    assert email.called is False

    text = Elem("text")
    _safe_move_text_cursor(text)
    assert text.called == "move_cursor_to_end"


if __name__ == "__main__":
    _self_check()
