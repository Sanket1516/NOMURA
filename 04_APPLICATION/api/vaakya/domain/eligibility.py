"""Deterministic eligibility engine (FR-CON-02, -03, D-013). The LLM never decides eligibility.

Each criterion compares one profile fact with the scheme's published rule. Missing facts give "unknown" with the
question to ask; they are never guessed. Overall: any not_met → not_eligible; all met → likely_eligible
("likely" because the scheme authority decides); otherwise needs_info.
"""
from __future__ import annotations

from datetime import date
from typing import Any

OPS = {
    "eq": lambda v, x: v == x,
    "ne": lambda v, x: v != x,
    "gte": lambda v, x: v >= x,
    "lte": lambda v, x: v <= x,
    "between": lambda v, x: x[0] <= v <= x[1],
    "in": lambda v, x: v in x,
}


def facts_from_profile(profile: Any | None, today: date) -> dict[str, Any]:
    """Profile → eligibility facts. Only what the user told VAAKYA; everything else stays absent (unknown)."""
    if profile is None:
        return {}
    f: dict[str, Any] = dict(profile.attributes or {})
    if profile.birth_year:
        f["age"] = today.year - profile.birth_year  # can be one year high before the birthday; boundary cases show the rule
    if profile.disability and "has_disability" not in f:
        f["has_disability"] = True
    return f


def evaluate(scheme: dict, facts: dict[str, Any]) -> dict:
    results = []
    for c in scheme["criteria"]:
        known = [facts[f] for f in (c["field"], c.get("or_field")) if f and facts.get(f) is not None]
        if any(OPS[c["op"]](v, c["value"]) for v in known):
            res = "met"
        elif c.get("or_field") and len(known) < 2:
            res = "unknown"      # one alternative failed, the other is not known yet
        elif not known:
            res = "unknown"
        else:
            res = "not_met"
        alt = facts.get(c["or_field"]) if c.get("or_field") else None
        shown = facts.get(c["field"], alt)
        results.append({"id": c["id"], "label": c["label"], "result": res,
                        "user_value": _show(shown) if shown is not None else None, "ask": c.get("ask") if res == "unknown" else None})
    statuses = {r["result"] for r in results}
    status = "not_eligible" if "not_met" in statuses else "likely_eligible" if statuses == {"met"} else "needs_info"
    return {"scheme_id": scheme["id"], "status": status, "rules_version": scheme["rules_version"], "criteria": results}


def _show(v: Any) -> str:
    if isinstance(v, bool):
        return "yes" if v else "no"
    return str(v)
