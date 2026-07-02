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
