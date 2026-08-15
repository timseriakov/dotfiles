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

# qutebrowser's default completion columns are 30/70/0; session names are the
# only useful column, so give it the whole popup width.
from qutebrowser.completion.models import completionmodel, listcategory, miscmodels
from qutebrowser.utils import log, utils


def _wide_session_completion(*, info=None):
    from qutebrowser.misc import sessions
    utils.unused(info)
    model = completionmodel.CompletionModel(column_widths=(100, 0, 0))
    try:
        sess = (
            (name,)
            for name in sessions.session_manager.list_sessions()
            if not name.startswith("_")
        )
        model.add_category(listcategory.ListCategory("Sessions", sess))
    except OSError:
        log.completion.exception("Failed to list sessions!")
    return model


miscmodels.session = _wide_session_completion
