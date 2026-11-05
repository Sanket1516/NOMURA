"""Private Tier redaction (FR-DL-01, -03, D-025). Runs on the VAAKYA host before any Reasoning Tier call.

Rule-based recognisers for Indian identifiers, with checksums where the format has one (Aadhaar: Verhoeff, cards: Luhn)
to avoid redacting ordinary numbers. Each value is replaced by a stable token (<PHONE_1>) and kept in a per-request map
held only in memory, so the response can be restored. Only the CATEGORIES are audited (FR-DL-04).

Names: the user's own name and names they gave VAAKYA are redacted exactly; open-ended name detection needs an NER
model (Presidio with spaCy, T0.04) and is not claimed here.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

from .llm import RedactedText

_VERHOEFF_D = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 0, 6, 7, 8, 9, 5], [2, 3, 4, 0, 1, 7, 8, 9, 5, 6], [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
               [4, 0, 1, 2, 3, 9, 5, 6, 7, 8], [5, 9, 8, 7, 6, 0, 4, 3, 2, 1], [6, 5, 9, 8, 7, 1, 0, 4, 3, 2], [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
               [8, 7, 6, 5, 9, 3, 2, 1, 0, 4], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]]
_VERHOEFF_P = [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [1, 5, 7, 6, 2, 8, 3, 0, 9, 4], [5, 8, 0, 3, 7, 9, 6, 1, 4, 2], [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
               [9, 4, 5, 3, 1, 2, 6, 8, 7, 0], [4, 2, 8, 6, 5, 7, 3, 9, 0, 1], [2, 7, 9, 3, 8, 0, 6, 4, 1, 5], [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]]


def verhoeff_ok(num: str) -> bool:
    c = 0
    for i, ch in enumerate(reversed(num)):
        c = _VERHOEFF_D[c][_VERHOEFF_P[i % 8][int(ch)]]
    return c == 0


def luhn_ok(num: str) -> bool:
    total, alt = 0, False
    for ch in reversed(num):
        d = int(ch)
        if alt:
            d = d * 2 - 9 if d > 4 else d * 2
        total += d
        alt = not alt
    return total % 10 == 0


@dataclass
class Recogniser:
    category: str
    pattern: re.Pattern
    validate: callable = None  # type: ignore[valid-type]


DIGITS = lambda s: re.sub(r"\D", "", s)  # noqa: E731
RECOGNISERS = [
    Recogniser("EMAIL", re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+")),
    Recogniser("UPI", re.compile(r"\b[A-Za-z0-9._-]{2,}@(?:ok)?[a-z]{2,}\b")),
    Recogniser("PAN", re.compile(r"\b[A-Z]{3}[ABCFGHLJPT][A-Z]\d{4}[A-Z]\b")),
    Recogniser("IFSC", re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b")),
    Recogniser("CARD", re.compile(r"\b(?:\d[ -]?){12,18}\d\b"), lambda m: 13 <= len(DIGITS(m)) <= 19 and luhn_ok(DIGITS(m))),
    Recogniser("AADHAAR", re.compile(r"\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b"), lambda m: verhoeff_ok(DIGITS(m))),
    Recogniser("PHONE", re.compile(r"(?<![\d])(?:\+91[ -]?|0)?[6-9]\d{4}[ -]?\d{5}(?![\d])")),
    Recogniser("ACCOUNT", re.compile(r"(?i)(?:a/?c|account|acct|खाता|ಖಾತೆ)\D{0,12}(\d{9,18})")),
    Recogniser("OTP", re.compile(r"(?i)(?:otp|pin|one[- ]time)\D{0,10}(\d{4,8})")),
]


@dataclass
class Redaction:
    text: RedactedText
    mapping: dict[str, str] = field(default_factory=dict)  # token -> original; memory only, never logged or stored

    @property
    def categories(self) -> list[str]:
        return sorted({t.strip("<>").rsplit("_", 1)[0] for t in self.mapping})

    def restore(self, text: str) -> str:
        for tok, val in self.mapping.items():
            text = text.replace(tok, val)
        return text


def redact(text: str, known_names: list[str] | None = None) -> Redaction:
    mapping: dict[str, str] = {}
    counters: dict[str, int] = {}
    reverse: dict[tuple[str, str], str] = {}

    def token(cat: str, value: str) -> str:
        key = (cat, value)
        if key not in reverse:
            counters[cat] = counters.get(cat, 0) + 1
            reverse[key] = f"<{cat}_{counters[cat]}>"
            mapping[reverse[key]] = value
        return reverse[key]

    out = text
    for r in RECOGNISERS:
        def sub(m: re.Match, r=r) -> str:
            value = m.group(1) if m.groups() else m.group(0)
            if r.validate and not r.validate(value):
                return m.group(0)
            return m.group(0).replace(value, token(r.category, value))
        out = r.pattern.sub(sub, out)
    # Names last, so identifiers that contain a name (priya@okaxis) are recognised whole first.
    for name in sorted({n.strip() for n in (known_names or []) if n and len(n.strip()) >= 2}, key=len, reverse=True):
        out = re.sub(rf"\b{re.escape(name)}\b", lambda m: token("PERSON", m.group(0)), out, flags=re.IGNORECASE)
    return Redaction(RedactedText(out), mapping)
