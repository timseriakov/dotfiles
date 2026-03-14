config = config
c = c

from modules.base import en, homepage, leader, ss_dir, terminal, timestamp
from modules.keymap import BindingSpec, run_generator

BINDING_SPECS: list[BindingSpec] = [
    BindingSpec("e", "reload"),
    BindingSpec("w", "tab-prev"),
    BindingSpec("r", "tab-next"),
    BindingSpec("K", "tab-next"),
    BindingSpec("J", "tab-prev"),
    BindingSpec("<Cmd-k>", "tab-next"),
    BindingSpec("<Cmd-j>", "tab-prev"),
    BindingSpec("z", "undo"),
    BindingSpec("q", "undo"),
    BindingSpec("d", "scroll-page 0 0.5"),
    BindingSpec("u", "scroll-page 0 -0.5"),
    BindingSpec("v", "mode-enter caret"),
    BindingSpec("<Ctrl-v>", "mode-enter passthrough", mode="normal"),
    BindingSpec("<Ctrl-v>", "mode-leave", mode="passthrough"),
    BindingSpec("<Ctrl-a>", "mode-enter passthrough", mode="normal"),
    BindingSpec("<Ctrl-a>", "mode-leave", mode="passthrough"),
    BindingSpec("H", "back"),
    BindingSpec("L", "forward"),
    BindingSpec("<Cmd-Left>", "back"),
    BindingSpec("<Cmd-Right>", "forward"),
    BindingSpec("f", "hint links"),
    BindingSpec("F", "hint links tab-bg"),
    BindingSpec("yy", "yank"),
    BindingSpec("yl", "hint links yank"),
    BindingSpec("p", "open {clipboard}"),
    BindingSpec("P", "open --tab {clipboard}"),
    BindingSpec("x", "tab-close"),
    BindingSpec("<Cmd-Shift-w>", "tab-close"),
    BindingSpec("<Cmd-q>", "tab-close"),
    BindingSpec("<", "tab-move -"),
    BindingSpec(">", "tab-move +"),
    BindingSpec("/", "cmd-set-text /"),
    BindingSpec("?", "cmd-set-text ?"),
    BindingSpec("<Ctrl-b>", "bookmark-add"),
    BindingSpec("M", "quickmark-save"),
    BindingSpec("<Cmd-,>", "open qute://settings"),
    BindingSpec("gu", "navigate up"),
    BindingSpec(
        leader + "m",
        "spawn /opt/homebrew/bin/mpv {url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "i",
        "spawn open -a IINA {url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "h",
        "spawn -u fzfhistory-userscript",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "H",
        "spawn -u fzfhistory-userscript closed-tabs",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "b", "spawn -u braindrop", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "r",
        "spawn -u raindrop {url} {title}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "os", "tor-start", hide_ru_in_keyhint=True),
    BindingSpec(leader + "ox", "tor-stop", hide_ru_in_keyhint=True),
    BindingSpec(leader + "oi", "tor-status", hide_ru_in_keyhint=True),
    BindingSpec(leader + "oo", "tor-toggle", hide_ru_in_keyhint=True),
    BindingSpec("<Ctrl-Shift-k>", "spawn -u keychain-login", mode="normal"),
    BindingSpec("<Ctrl-Shift-k>", "spawn -u keychain-login", mode="insert"),
    BindingSpec(leader + "p", "spawn -u keychain-login", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "P",
        "spawn -u keychain-login --pick",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "l", "spawn --userscript qpw", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "L",
        "spawn --userscript qpw --pick",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "tR",
        'jseval --quiet document.dispatchEvent(new KeyboardEvent("keydown", {key: "F2", keyCode: 113}))',
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "tr",
        'jseval -q (function(){const t="translate.google.com";if(window.location.hostname.includes(t)){const e=new URLSearchParams(window.location.search).get("u");e&&(window.location.href=e)}else{const e="ru",o=`https://translate.google.com/translate?sl=auto&tl=${e}&u=${encodeURIComponent(window.location.href)}`;window.location.href=o}})();',
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "ty",
        'jseval -q (function(){const t="translate.yandex.ru";if(window.location.hostname.includes(t)){const u=new URLSearchParams(window.location.search).get("url");u&&(window.location.href=u)}else{const u=encodeURIComponent(window.location.href);window.location.href=`https://translate.yandex.ru/translate?url=${u}&lang=auto-ru`}})();',
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "te",
        'jseval -q (function(){const t="translate.yandex.ru";if(window.location.hostname.includes(t)){const u=new URLSearchParams(window.location.search).get("url");u&&(window.location.href=u)}else{const u=encodeURIComponent(window.location.href);window.location.href=`https://translate.yandex.ru/translate?url=${u}&lang=auto-ru`}})();',
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "ce", "config-edit", hide_ru_in_keyhint=True),
    BindingSpec(leader + "ch", "help", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "cc",
        "config-source ;; message-info 'Config reloaded'",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "uy",
        "config-cycle tabs.show multiple never",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "uu",
        "config-cycle statusbar.show always in-mode",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "ua",
        ":set content.autoplay true ;; message-info 'Autoplay enabled'",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "uf",
        ":set content.autoplay false ;; message-info 'Autoplay disabled'",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec("D", "spawn --userscript toggle-darkmode"),
    BindingSpec(
        leader + "un",
        "spawn --userscript toggle-darkmode",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "ui",
        "spawn --userscript toggle-darkmode",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "dd", "devtools", hide_ru_in_keyhint=True),
    BindingSpec(leader + "de", "edit-text", hide_ru_in_keyhint=True),
    BindingSpec(leader + "dc", "cmd-edit", hide_ru_in_keyhint=True),
    BindingSpec(leader + "df", "devtools-focus", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "dp",
        f"screenshot {ss_dir}qute-{timestamp}.png",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "dy",
        "screenshot --force /tmp/qute-clipboard.png ;; spawn --userscript copy-png-to-clipboard /tmp/qute-clipboard.png ;; message-info 'Screenshot copied to clipboard'",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "dY",
        "spawn --userscript fullpage-to-clipboard ;; message-info 'Full-page capture started'",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "ds", "view-source --edit", hide_ru_in_keyhint=True),
    BindingSpec(leader + "dz", "view-source", hide_ru_in_keyhint=True),
    BindingSpec(leader + "fc", "hint links yank --rapid", hide_ru_in_keyhint=True),
    BindingSpec(leader + "ff", "hint links tab --rapid", hide_ru_in_keyhint=True),
    BindingSpec(leader + "fb", "hint links tab-bg --rapid", hide_ru_in_keyhint=True),
    BindingSpec(leader + "fi", "hint inputs", hide_ru_in_keyhint=True),
    BindingSpec(leader + "fo", "hint links window", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "fp",
        "hint links run :open -p {hint-url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "fv",
        "hint links spawn mpv {hint-url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "fI",
        "hint links spawn open -a IINA {hint-url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "fy", "hint links yank", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "fx",
        "hint links spawn --detach /usr/bin/open -a 'Helium' {hint-url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "fd",
        "hint links userscript surge-add",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "fD", "spawn -u surge-add --force", hide_ru_in_keyhint=True),
    BindingSpec(leader + "qd", "tab-close", hide_ru_in_keyhint=True),
    BindingSpec(leader + "qq", "close", hide_ru_in_keyhint=True),
    BindingSpec(leader + "qr", "restart", hide_ru_in_keyhint=True),
    BindingSpec(leader + "qt", "tab-only", hide_ru_in_keyhint=True),
    BindingSpec(leader + "qw", "window-only", hide_ru_in_keyhint=True),
    BindingSpec(leader + "x", "quit --save", hide_ru_in_keyhint=True),
    BindingSpec(leader + "ts", "bookmark-add", hide_ru_in_keyhint=True),
    BindingSpec(leader + "tq", "bookmark-list", hide_ru_in_keyhint=True),
    BindingSpec(leader + "tc", "tab-clone", hide_ru_in_keyhint=True),
    BindingSpec(leader + "td", "tab-clone -w", hide_ru_in_keyhint=True),
    BindingSpec(leader + "tn", "tab-give", hide_ru_in_keyhint=True),
    BindingSpec(leader + "th", "history", hide_ru_in_keyhint=True),
    BindingSpec(leader + "tp", "tab-pin", hide_ru_in_keyhint=True),
    BindingSpec(leader + "tt", "tab-pin", hide_ru_in_keyhint=True),
    BindingSpec(
        leader + "n",
        en(f"open -w {homepage}"),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        "<Cmd-n>",
        en(f"open -w {homepage}"),
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "tg",
        "spawn --detach /usr/bin/open -a 'Helium' {url}",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(leader + "ti", "open -p", hide_ru_in_keyhint=True),
    BindingSpec("<Cmd-Shift-N>", "open -p"),
    BindingSpec(
        leader + "sc",
        "session-clean ;; message-info 'Sessions cleaned'",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec(
        leader + "sz",
        "config-cycle -p session.lazy_restore true false",
        hide_ru_in_keyhint=True,
    ),
    BindingSpec("gg", en("scroll-to-perc 0"), wrap_ru_with_en=False),
    BindingSpec("G", en("scroll-to-perc 100"), wrap_ru_with_en=False),
    BindingSpec(
        leader + leader,
        en("cmd-set-text -s :tab-select"),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec("ge", en("cmd-set-text -s :open {url}"), wrap_ru_with_en=False),
    BindingSpec(
        leader + "ss",
        en("cmd-set-text -s :session-save "),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "sw",
        en("cmd-set-text -s :session-save --only-active-window "),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "sl",
        en("spawn --userscript session-add"),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "sL",
        en("cmd-set-text -s :spawn --userscript session-add "),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "sd",
        en("cmd-set-text -s :session-delete "),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "sr",
        en("cmd-set-text -s :session-rename "),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "tm",
        en("cmd-set-text -s :tab-move"),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "tw",
        en("cmd-set-text -s :tab-take"),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
    BindingSpec(
        leader + "cS",
        en("cmd-set-text -s :set -t"),
        hide_ru_in_keyhint=True,
        wrap_ru_with_en=False,
    ),
]

run_generator(config, c, BINDING_SPECS)

# Special bindings and unbinds that are not in specs
config.unbind("ss")
config.unbind("sq")
config.unbind("sl")
config.unbind("m")
config.bind("ss", "spawn -u summarize-url {url}")
config.bind("sq", "spawn -u summarize-url --quality {url}")
config.bind("sw", "spawn -u summarize-url --analyze-quick {url}")
config.bind("sd", "spawn -u summarize-url --analyze-deep {url}")
config.bind("sS", "cmd-set-text -s :set")
config.bind("sL", "cmd-set-text -s :set -t")
