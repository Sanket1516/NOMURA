"""Confidence Engine: gathers recorded activity, runs domain.score, stores versioned snapshots (FR-FCS-02..06)."""
from __future__ import annotations

import uuid
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..domain import score as fcs
from ..models import Event, FinancialItem, Goal, LearningProgress, QuizAttempt, ScoreSnapshot, SentinelCheck
from .assessment import monthly_figures
from .common import today_ist
from .goals import goal_out


def _month_start(d: date, back: int) -> date:
    y, m = divmod(d.year * 12 + d.month - 1 - back, 12)
    return date(y, m + 1, 1)


def gather(db: Session, user_id: uuid.UUID, today: date | None = None) -> fcs.ScoreInputs:
    today = today or today_ist()
    i = fcs.ScoreInputs()
    for a in db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user_id)):
        if a.module_id == "digital-safety":
            i.safety_quiz_correct += a.correct
            i.safety_quiz_total += a.total
        else:
            i.quiz_correct += a.correct
            i.quiz_total += a.total
    i.modules_completed = set(db.scalars(select(LearningProgress.module_id).where(LearningProgress.user_id == user_id,
                                                                                    LearningProgress.progress_pct >= 100)))
    i.scam_checks = db.scalar(select(func.count()).select_from(SentinelCheck).where(SentinelCheck.user_id == user_id)) or 0
    goals = [goal_out(db, g, today) for g in db.scalars(select(Goal).where(Goal.user_id == user_id, Goal.status == "active"))]
    i.goals_total = len(goals)
    i.goals_on_track = sum(g.on_track for g in goals)
    i.has_priority_goal_with_plan = any(g.monthly_plan.paise > 0 or g.progress_pct >= 100 for g in goals)
    ev = db.execute(select(Event.type, Event.payload).where(Event.user_id == user_id,
                                                           Event.type.in_(["SchemeEvaluated", "SchemeViewed", "SchemeApplicationStarted",
                                                                           "LoanCostChecked"]))).all()
    eligible = {p["scheme_id"] for t, p in ev if t == "SchemeEvaluated" and p.get("status") == "likely_eligible"}
    viewed = {p["scheme_id"] for t, p in ev if t == "SchemeViewed"}
    i.schemes_likely_eligible = len(eligible)
    i.schemes_reviewed = len(eligible & viewed)
    i.scheme_application_started = any(t == "SchemeApplicationStarted" for t, _ in ev)
    i.loan_cost_checked = any(t == "LoanCostChecked" for t, _ in ev)
    f = monthly_figures(db, user_id)
    i.emi_to_income_pct = (f["emi"] * 100 / f["income"]) if f["income"] > 0 else None
    # Savings discipline: last three complete months against the monthly plan of active goals.
    planned = sum(g.monthly_plan.paise for g in goals)
    if planned > 0:
        for back in (1, 2, 3):
            start, end = _month_start(today, back), _month_start(today, back - 1)
            saved = db.scalar(select(func.coalesce(func.sum(FinancialItem.amount_paise), 0)).where(
                FinancialItem.user_id == user_id, FinancialItem.kind == "saving", FinancialItem.on_date >= start, FinancialItem.on_date < end)) or 0
            i.saving_months_known += 1
            i.saving_months_met_last3 += int(saved >= planned)
    return i


def recompute(db: Session, user_id: uuid.UUID, reason: str) -> ScoreSnapshot:
    dims = fcs.dimensions(gather(db, user_id))
    snap = ScoreSnapshot(user_id=user_id, formula_version=fcs.FORMULA_VERSION, overall=fcs.overall(dims), dimensions=dims, reason=reason)
    db.add(snap)
    db.flush()
    return snap


def latest(db: Session, user_id: uuid.UUID) -> ScoreSnapshot | None:
    return db.scalar(select(ScoreSnapshot).where(ScoreSnapshot.user_id == user_id).order_by(ScoreSnapshot.computed_at.desc()).limit(1))


def history(db: Session, user_id: uuid.UUID, months: int = 6) -> list[dict]:
    """Last snapshot of each month."""
    rows = db.scalars(select(ScoreSnapshot).where(ScoreSnapshot.user_id == user_id).order_by(ScoreSnapshot.computed_at)).all()
    by_month: dict[str, int] = {}
    for r in rows:
        by_month[r.computed_at.strftime("%Y-%m")] = r.overall
    return [{"month": k, "overall": v} for k, v in list(by_month.items())[-months:]]


def score_view(db: Session, user_id: uuid.UUID) -> dict | None:
    snap = latest(db, user_id)
    if snap is None:
        return None
    dims = snap.dimensions
    hist = history(db, user_id)
    month_ago = db.scalar(select(ScoreSnapshot.overall).where(ScoreSnapshot.user_id == user_id,
                                                             ScoreSnapshot.computed_at <= snap.computed_at - timedelta(days=30))
                          .order_by(ScoreSnapshot.computed_at.desc()).limit(1))
    first = db.scalar(select(ScoreSnapshot.overall).where(ScoreSnapshot.user_id == user_id).order_by(ScoreSnapshot.computed_at).limit(1))
    baseline = month_ago if month_ago is not None else first
    ordered = sorted(dims, key=lambda k: dims[k], reverse=True)
    lab = lambda k: fcs.LABELS[k][0]  # noqa: E731
    return {
        "overall": snap.overall, "band": fcs.band(snap.overall), "formula_version": snap.formula_version,
        "computed_at": snap.computed_at.isoformat(), "change_30d": snap.overall - (baseline if baseline is not None else snap.overall),
        "dimensions": [{"key": k, "label": fcs.LABELS[k][0], "score": v, "explanation": fcs.LABELS[k][1]} for k, v in dims.items()],
        "actions": fcs.actions(dims), "history": hist, "not_a_credit_score": True,
        "text_equivalent": f"Score {snap.overall} out of 100, {fcs.band(snap.overall)}. Strongest: {lab(ordered[0])} {dims[ordered[0]]}. "
                           f"Weakest: {lab(ordered[-1])} {dims[ordered[-1]]}.",
    }
