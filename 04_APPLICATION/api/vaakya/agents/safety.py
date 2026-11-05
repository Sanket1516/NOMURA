"""Safety review (AGENT_ARCHITECTURE §8, FR-SAF-01..05). Deterministic checks on every agent output before it reaches the user."""
from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path

from .base import AgentOutput

BLOCKED = [r"guaranteed? (return|profit|income)", r"risk[- ]free", r"\bsure[- ]shot\b", r"you (must|should) (buy|invest in|purchase)",
           r"invest (all|everything)", r"double your money", r"act (now|fast) before", r"100% safe"]
_BLOCKED = [re.compile(p, re.IGNORECASE) for p in BLOCKED]
HIGH_STAKES = [r"lost (money|savings)", r"debt trap", r"can'?t (repay|pay)", r"harass", r"suicid", r"bereave", r"died", r"fraud.*(paid|sent)"]
_HIGH = [re.compile(p, re.IGNORECASE) for p in HIGH_STAKES]
NOTICE = "AI-generated, educational guidance from VAAKYA. You make the final decision."
HELP = ("If this is urgent or you have lost money, call the national cyber crime helpline 1930 or your bank's official number. "
        "For debt or legal trouble, a bank's grievance officer or a legal aid service can help.")
_NUM = re.compile(r"(?<![<\w])(?:₹\s?)?\d[\d,]*(?:\.\d+)?%?")


@lru_cache
def scheme_names() -> set[str]:
    data = json.loads((Path(__file__).resolve().parent.parent / "data" / "schemes.json").read_text())
    return {s["name"].lower() for s in data["schemes"]} | {s["id"] for s in data["schemes"]}


def allowed_numbers(out: AgentOutput, question: str) -> set[str]:
    nums: set[str] = set()

    def add(v):
        if isinstance(v, (int, float)):
            nums.add(str(v))
        elif isinstance(v, str):
            nums.update(_norm(x) for x in _NUM.findall(v))
        elif isinstance(v, dict):
            for x in v.values():
                add(x)
        elif isinstance(v, list):
            for x in v:
                add(x)
    add(out.figures)
    add(out.data)
    add(question)
    for c in out.citations:
        add(c.title)
    return nums


def _norm(s: str) -> str:
    return s.replace("₹", "").replace(",", "").replace("%", "").strip()


def review(out: AgentOutput, question: str, source_texts: list[str]) -> tuple[bool, list[str]]:
    """Returns (ok, problems). Numbers must come from tools, the question or cited sources; no blocked claims;
    grounded agents must cite or abstain."""
    problems = []
    for p in _BLOCKED:
        if p.search(out.text):
            problems.append(f"blocked phrase: {p.pattern}")
    ok_nums = allowed_numbers(out, question)
    for t in source_texts:
        ok_nums.update(_norm(x) for x in _NUM.findall(t))
    for raw in _NUM.findall(out.text):
        n = _norm(raw)
        if n and n not in ok_nums and not (n.isdigit() and int(n) <= 12):  # small counts like "3 steps" are fine
            problems.append(f"unsupported number: {raw.strip()}")
    if out.agent in ("educator", "connector") and not out.citations and not out.abstained:
        problems.append("missing citations")
    return (not problems), problems


def needs_escalation(question: str) -> bool:
    return any(p.search(question) for p in _HIGH)
