"""Dynamic questionnaire (FR-ASM-01..03). Asks only what is still missing; answers become financial items."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from .. import schemas as s
from ..core.errors import ConflictError, DomainValidationError
from ..models import FinancialItem, Profile, QuestionnaireResponse, User
from .common import emit, today_ist

BASE = [
    ("monthly_income", "money_range", "How much money comes in a month? For changing income, give a lean and a good month.", "Needed for every plan"),
    ("monthly_expenses", "money", "Roughly how much does your household spend in a month?", "Sizes your emergency fund"),
    ("loan_emi", "money", "How much do you pay in loan EMIs each month? Enter 0 if none.", "Checks for debt stress"),
    ("savings", "money", "How much savings can you reach within a day or two?", "Your starting emergency fund"),
    ("risk_preference", "choice", "If an investment fell 10% in a month, what would you do?", "Explains which options suit you"),
    ("primary_goal", "choice", "What is your most important money goal right now?", "Your first plan"),
]
SEASONAL_EXTRA = ("harvest", "money_range", "How much did your last harvest bring, and how many months until the next one?", "Plans around your season")
CHOICES = {
    "risk_preference": [{"value": "low", "label": "Worry and want my money back"}, {"value": "medium", "label": "Wait and see"},
                        {"value": "high", "label": "Stay calm, it is long-term"}],
    "primary_goal": [{"value": v, "label": lab} for v, lab in [("emergency_fund", "Emergency fund"), ("education", "Children's education"),
                     ("home", "Home"), ("equipment", "Equipment or vehicle"), ("retirement", "Retirement"), ("other", "Other")]],
}
REQUIRED = {"monthly_income", "monthly_expenses", "loan_emi", "savings", "risk_preference", "primary_goal"}


def _questions(profile: Profile | None) -> list[tuple[str, str, str, str]]:
    qs = list(BASE)
    if profile and profile.income_type == "seasonal":
        qs.append(SEASONAL_EXTRA)
    return qs


def answered(db: Session, user_id: uuid.UUID) -> dict[str, dict | str | list]:
    rows = db.scalars(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id)).all()
    return {r.question_id: r.answer["v"] for r in rows}


def next_question(db: Session, user_id: uuid.UUID) -> s.NextQuestion:
    qs = _questions(db.get(Profile, user_id))
    done = answered(db, user_id)
    for i, (qid, typ, prompt, why) in enumerate(qs):
        if qid not in done:
            return s.NextQuestion(step=i + 1, total_steps=len(qs), done=False,
                                  question=s.Question(id=qid, type=typ, prompt=prompt, why=why, options=CHOICES.get(qid)))
    return s.NextQuestion(step=len(qs), total_steps=len(qs), question=None, done=True)


def _validate(a: s.Answer) -> None:
    v = a.value
    if a.question_id == "monthly_income":
        if not (isinstance(v, dict) and v.get("min_paise", -1) > 0 and v.get("max_paise", -1) >= v["min_paise"]):
            raise DomainValidationError("monthly_income needs min_paise > 0 and max_paise ≥ min_paise")
    elif a.question_id in {"monthly_expenses", "loan_emi", "savings"}:
        if not (isinstance(v, dict) and v.get("paise", -1) >= 0):
            raise DomainValidationError(f"{a.question_id} needs paise ≥ 0")
    elif a.question_id in CHOICES:
        if v not in {c["value"] for c in CHOICES[a.question_id]}:
            raise DomainValidationError(f"{a.question_id} must be one of the listed options")
    elif a.question_id == "harvest":
        if not (isinstance(v, dict) and v.get("paise", 0) > 0 and 1 <= v.get("months_to_next", 0) <= 12):
            raise DomainValidationError("harvest needs paise > 0 and months_to_next between 1 and 12")


def save_answers(db: Session, user_id: uuid.UUID, body: s.AnswersIn) -> s.NextQuestion:
    for a in body.answers:
        _validate(a)
        row = db.scalar(select(QuestionnaireResponse).where(QuestionnaireResponse.user_id == user_id,
                                                            QuestionnaireResponse.question_id == a.question_id))
        if row:
            row.answer, row.source = {"v": a.value}, a.source
        else:
            db.add(QuestionnaireResponse(user_id=user_id, question_id=a.question_id, answer={"v": a.value}, source=a.source))
    db.flush()
    return next_question(db, user_id)


def monthly_figures(db: Session, user_id: uuid.UUID) -> dict[str, int]:
    """Monthly income (average of lean and good month), expenses, EMI and liquid savings from the questionnaire."""
    a = answered(db, user_id)
    inc = a.get("monthly_income") or {}
    return {
        "income_min": int(inc.get("min_paise", 0)), "income_max": int(inc.get("max_paise", 0)),
        "income": (int(inc.get("min_paise", 0)) + int(inc.get("max_paise", 0))) // 2,
        "expenses": int((a.get("monthly_expenses") or {}).get("paise", 0)),
        "emi": int((a.get("loan_emi") or {}).get("paise", 0)),
        "savings": int((a.get("savings") or {}).get("paise", 0)),
    }


def complete(db: Session, user_id: uuid.UUID) -> dict:
    from .score import recompute
    if db.get(Profile, user_id) is None:
        raise ConflictError("Complete your profile first.")
    missing = REQUIRED - set(answered(db, user_id))
    if missing:
        raise ConflictError(f"Answer these first: {', '.join(sorted(missing))}", extra={"missing": sorted(missing)})
    f = monthly_figures(db, user_id)
    # Replace standing items from a previous assessment, keep everything the user typed.
    db.execute(delete(FinancialItem).where(FinancialItem.user_id == user_id, FinancialItem.source == "assessment"))
    today = today_ist()
    for kind, label, cat, amt in [("income", "Monthly income (assessment)", "income", f["income"]),
                                  ("expense", "Monthly spending (assessment)", "household", f["expenses"]),
                                  ("loan", "Loan EMIs (assessment)", "emi", f["emi"])]:
        if amt > 0:
            db.add(FinancialItem(user_id=user_id, kind=kind, label=label, category=cat, amount_paise=amt, frequency="monthly",
                                 on_date=today, source="assessment"))
    if f["savings"] > 0:
        db.add(FinancialItem(user_id=user_id, kind="asset", label="Liquid savings (assessment)", category="liquid",
                             amount_paise=f["savings"], frequency="once", on_date=today, source="assessment"))
    user = db.get(User, user_id)
    assert user
    user.assessment_completed_at = datetime.now(timezone.utc)
    emit(db, user_id, "AssessmentCompleted", {"income_band": _band(f["income"])})
    db.flush()
    snap = recompute(db, user_id, reason="assessment_completed")
    return {"twin": {"created": True}, "score": {"overall": snap.overall, "band": _band_name(snap.overall), "formula_version": snap.formula_version}}


def _band(paise: int) -> str:
    r = paise // 100
    return "<15k" if r < 15000 else "15-30k" if r < 30000 else "30-50k" if r < 50000 else "50k+"


def _band_name(x: int) -> str:
    from ..domain.score import band
    return band(x)
