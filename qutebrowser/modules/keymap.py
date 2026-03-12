import re
from collections import defaultdict
from collections.abc import MutableMapping
from dataclasses import dataclass
from typing import Callable, Protocol
from collections import defaultdict
from collections.abc import MutableMapping
from typing import Callable, Protocol

from modules.base import en


LETTER_MAP: dict[str, str] = {
    "q": "й",
    "w": "ц",
    "e": "у",
    "r": "к",
    "t": "е",
    "y": "н",
    "u": "г",
    "i": "ш",
    "o": "щ",
    "p": "з",
    "[": "х",
    "]": "ъ",
    "a": "ф",
    "s": "ы",
    "d": "в",
    "f": "а",
    "g": "п",
    "h": "р",
    "j": "о",
    "k": "л",
    "l": "д",
    ";": "ж",
    "'": "э",
    "z": "я",
    "x": "ч",
    "c": "с",
    "v": "м",
    "b": "и",
    "n": "т",
    "m": "ь",
    ",": "б",
    ".": "ю",
    "/": ".",
}


def _translate_char(ch: str) -> str:
    if not ch.isascii():
        return ch
    if ch.isalpha():
        lower = ch.lower()
        mapped = LETTER_MAP.get(lower)
        if mapped is None:
            return ch
        return mapped.upper() if ch.isupper() else mapped
    return LETTER_MAP.get(ch, ch)


def _translate_angle_token(token: str) -> str:
    content = token[1:-1]
    if not content.isascii():
        return token
    segments = content.split("-")
    if not segments:
        return token
    tail = segments[-1]
    if len(tail) == 1 and tail.isascii() and tail.isalpha():
        segments[-1] = _translate_char(tail)
        return "<" + "-".join(segments) + ">"
    return token


def translate_keychain(key: str) -> str:
    parts: list[str] = []
    last = 0
    for match in re.finditer(r"<[^>]+>", key):
        segment = key[last : match.start()]
        parts.append("".join(_translate_char(ch) for ch in segment))
        token = match.group()
        parts.append(_translate_angle_token(token))
        last = match.end()
    parts.append("".join(_translate_char(ch) for ch in key[last:]))
    return "".join(parts)


@dataclass
class BindingSpec:
    key: str
    command: str
    mode: str = "normal"
    duplicate_ru: bool = True
    wrap_ru_with_en: bool = True
    hide_ru_in_keyhint: bool = False


class BindingConfig(Protocol):
    def bind(self, key: str, command: str, mode: str = "normal") -> None: ...


def apply_binding(
    config: BindingConfig,
    c: object,
    *,
    key: str,
    command: str,
    mode: str = "normal",
    duplicate_ru: bool = True,
    wrap_ru_with_en: bool = True,
    hide_ru_in_keyhint: bool = False,
    en_wrapper: Callable[[str], str] = en,
    ru_registry: MutableMapping[str, set[str]] | None = None,
) -> dict[str, object]:
    _ = c
    registry: MutableMapping[str, set[str]] = (
        ru_registry if ru_registry is not None else defaultdict(set)
    )
    ru_keyhint: MutableMapping[str, set[str]] = defaultdict(set)

    config.bind(key, command, mode=mode)

    ru_key = translate_keychain(key)
    collision = False

    if duplicate_ru and ru_key != key:
        seen = registry.setdefault(mode, set())
        if ru_key in seen:
            collision = True
        else:
            seen.add(ru_key)
            ru_command = en_wrapper(command) if wrap_ru_with_en else command
            config.bind(ru_key, ru_command, mode=mode)
            if hide_ru_in_keyhint:
                ru_keyhint[mode].add(ru_key)

    return {
        "ru_key": ru_key if ru_key != key and not collision else None,
        "collision": collision,
        "keyhint_blacklist": {
            mode_key: sorted(keys) for mode_key, keys in ru_keyhint.items()
        },
        "registry": registry,
    }


def run_generator(config: BindingConfig, c: any, specs: list[BindingSpec]) -> None:
    ru_registry = {}
    full_blacklist = defaultdict(list)

    for spec in specs:
        res = apply_binding(
            config, c,
            key=spec.key,
            command=spec.command,
            mode=spec.mode,
            duplicate_ru=spec.duplicate_ru,
            wrap_ru_with_en=spec.wrap_ru_with_en,
            hide_ru_in_keyhint=spec.hide_ru_in_keyhint,
            ru_registry=ru_registry
        )
        for mode, keys in res["keyhint_blacklist"].items():
            full_blacklist[mode].extend(keys)

    for mode, keys in full_blacklist.items():
        c.keyhint.blacklist.extend(keys)
