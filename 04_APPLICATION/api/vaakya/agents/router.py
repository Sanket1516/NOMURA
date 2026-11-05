"""Intent router (AGENT_ARCHITECTURE §2): rules first, then the Private Tier classifier, then a clarifying question."""
from __future__ import annotations

import re

from ..ai.llm import LLMAdapter, LLMUnavailable

RULES: dict[str, list[str]] = {
    "sentinel": [r"\botp\b", r"\bpin\b", r"\bkyc\b", r"scam", r"fraud", r"fake", r"lottery", r"prize", r"suspicious", r"\blink\b", r"http",
                 r"loan app", r"instant loan", r"digital arrest", r"customer care", r"is (this|it) (safe|real|genuine)", r"धोखा", r"फ्रॉड",
                 r"फसवणूक", r"ವಂಚನೆ", r"telegram", r"part[- ]time job", r"guaranteed"],
    "connector": [r"scheme", r"yojana", r"योजना", r"ಯೋಜನೆ", r"pm[- ]?kisan", r"pmfby", r"fasal", r"kisan credit", r"\bkcc\b", r"pmjjby",
                  r"pmsby", r"atal pension", r"\bapy\b", r"sukanya", r"mudra", r"udid", r"disability (pension|card|benefit)", r"eligib",
                  r"government (help|benefit)", r"subsidy", r"sarkari"],
    "strategy": [r"\bplan\b", r"budget", r"save\b", r"saving", r"emergency fund", r"goal", r"how much (should|can|do) i (save|keep)",
                 r"afford", r"\bemi\b", r"debt", r"repay", r"income (changes|varies)", r"harvest", r"season", r"बचत", r"ಉಳಿತಾಯ", r"retire"],
    "educator": [r"what is", r"explain", r"meaning", r"difference", r"how does", r"\bsip\b", r"mutual fund", r"ulip", r"insurance", r"credit score",
                 r"interest", r"inflation", r"tax", r"\bppf\b", r"\belss\b", r"term plan", r"क्या है", r"म्हणजे काय", r"ಎಂದರೇನು"],
}
_COMPILED = {k: [re.compile(p, re.IGNORECASE) for p in v] for k, v in RULES.items()}
PRIORITY = ["sentinel", "connector", "strategy", "educator"]  # protection first when signals overlap

SCHEMA = {"type": "object", "properties": {"intent": {"type": "string", "enum": PRIORITY + ["other"]},
                                           "confidence": {"type": "number"}}, "required": ["intent", "confidence"]}


def route(text: str, llm: LLMAdapter | None = None, image: bool = False) -> tuple[str, float, str]:
    """Returns (agent or 'clarify', confidence, method)."""
    if image:
        return "sentinel", 1.0, "rule:image"
    scores = {k: sum(bool(p.search(text)) for p in pats) for k, pats in _COMPILED.items()}
    best = max(PRIORITY, key=lambda k: (scores[k], -PRIORITY.index(k)))
    if scores[best] > 0:
        return best, min(0.6 + 0.15 * scores[best], 0.95), "rule"
    if llm is not None:
        try:
            r = llm.complete("route", "Classify the user's money question into one intent: sentinel (scams, fraud, suspicious messages), "
                             "connector (government schemes), strategy (saving, budgets, goals, loans to repay), educator (explain a concept), "
                             "or other. Reply as JSON.", text, schema=SCHEMA)
            if r.data["intent"] in PRIORITY and r.data["confidence"] >= 0.6:
                return r.data["intent"], float(r.data["confidence"]), "llm"
        except LLMUnavailable:
            pass
    return "clarify", 0.0, "none"
