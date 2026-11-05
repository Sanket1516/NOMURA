"""Financial Confidence Score, formula fcs-1 (D-011 amended by D-035). Deterministic: the LLM only explains it.

FCS = round_half_up(mean of six dimensions), each 0-100. Activity counts are capped so the score cannot be farmed,
and income level is never an input (MASTER_PLAN §14 principles).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from decimal import ROUND_HALF_UP, Decimal

FORMULA_VERSION = "fcs-1"
CORE_MODULES = ("emergency-fund", "smart-budgeting", "digital-safety", "sip-basics", "insurance-101", "credit-score")
SCAM_CHECK_CAP = 5

LABELS = {
    "literacy": ("Financial literacy", "60% quiz accuracy on money lessons, 40% core lessons completed"),
    "safety": ("Scam awareness", "50% Digital Safety quiz accuracy, 30% Digital Safety lesson, 20% scam checks (up to 5)"),
    "goal_planning": ("Goal progress", "50% having a priority goal with a plan, 50% share of goals on track"),
    "scheme_awareness": ("Scheme awareness", "Share of your likely-eligible schemes you reviewed, +10 if you started an application"),
    "savings_discipline": ("Savings behaviour", "Months you met your saving plan, out of the last three"),
    "debt_awareness": ("Debt awareness", "50% Loans and Credit lesson, 30% a loan-cost check, 20% EMIs under 40% of income"),
}


@dataclass
class ScoreInputs:
    quiz_correct: int = 0            # money-lesson quizzes, excluding Digital Safety
    quiz_total: int = 0
    modules_completed: set[str] = field(default_factory=set)
    safety_quiz_correct: int = 0
    safety_quiz_total: int = 0
    scam_checks: int = 0
    has_priority_goal_with_plan: bool = False
    goals_total: int = 0
    goals_on_track: int = 0
    schemes_likely_eligible: int = 0
    schemes_reviewed: int = 0
    scheme_application_started: bool = False
    saving_months_met_last3: int = 0
    saving_months_known: int = 0     # how many of the last three months have a plan to compare against
    loan_cost_checked: bool = False
    emi_to_income_pct: float | None = None   # None when unknown


def _r(x: Decimal) -> int:
    return int(x.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def _ratio(a: int, b: int) -> Decimal:
    return Decimal(min(a, b)) / Decimal(b) if b > 0 else Decimal(0)


def dimensions(i: ScoreInputs) -> dict[str, int]:
    core_done = len(i.modules_completed & set(CORE_MODULES))
    lit = Decimal("0.6") * _ratio(i.quiz_correct, i.quiz_total) + Decimal("0.4") * _ratio(core_done, len(CORE_MODULES))
    safe = (Decimal("0.5") * _ratio(i.safety_quiz_correct, i.safety_quiz_total)
            + Decimal("0.3") * (1 if "digital-safety" in i.modules_completed else 0)
            + Decimal("0.2") * _ratio(i.scam_checks, SCAM_CHECK_CAP))
    goal = Decimal("0.5") * (1 if i.has_priority_goal_with_plan else 0) + Decimal("0.5") * _ratio(i.goals_on_track, i.goals_total)
    scheme = _ratio(i.schemes_reviewed, i.schemes_likely_eligible) + (Decimal("0.1") if i.scheme_application_started else 0)
    saving = _ratio(i.saving_months_met_last3, 3) if i.saving_months_known else Decimal(0)
    debt = (Decimal("0.5") * (1 if "credit-score" in i.modules_completed else 0) + Decimal("0.3") * (1 if i.loan_cost_checked else 0)
            + Decimal("0.2") * (1 if i.emi_to_income_pct is not None and i.emi_to_income_pct < 40 else 0))
    raw = {"literacy": lit, "safety": safe, "goal_planning": goal, "scheme_awareness": min(scheme, Decimal(1)),
           "savings_discipline": saving, "debt_awareness": debt}
    return {k: _r(v * 100) for k, v in raw.items()}


def overall(dims: dict[str, int]) -> int:
    return _r(Decimal(sum(dims.values())) / Decimal(len(dims)))


def band(score: int) -> str:
    return "Excellent" if score >= 85 else "Good" if score >= 70 else "Fair" if score >= 50 else "Building"


ACTION_HINTS = {
    "literacy": ("Finish a core lesson and its quiz", "/learn", 3),
    "safety": ("Do the Digital Safety lesson", "/learn", 4),
    "goal_planning": ("Create a goal and build its plan", "/goals", 4),
    "scheme_awareness": ("Review a scheme you may be eligible for", "/schemes", 3),
    "savings_discipline": ("Save your planned amount this month", "/planning", 5),
    "debt_awareness": ("Check the real cost of a loan", "/planning", 2),
}


def actions(dims: dict[str, int]) -> list[dict]:
    """Next-best actions for the three weakest dimensions, with the approximate point gain on the overall score."""
    weakest = sorted(dims, key=lambda k: dims[k])[:3]
    return [{"text": ACTION_HINTS[k][0], "href": ACTION_HINTS[k][1], "estimated_points": ACTION_HINTS[k][2], "dimension": k} for k in weakest]
