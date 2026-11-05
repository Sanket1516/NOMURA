"""Monthly review (FR-COA-01, -02). Built from recorded activity only; nothing is invented. Educational framing."""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.errors import DomainValidationError
from ..core.money import money
from ..domain.score import LABELS, actions
from ..models import Event, GoalContribution, LearningProgress, ScoreSnapshot, SentinelCheck
from .goals import list_goals
from .learning import catalogue


def _range(month: str) -> tuple[datetime, datetime, date, date]:
    try:
        y, m = (int(x) for x in month.split("-"))
        start_d = date(y, m, 1)
    except (ValueError, TypeError) as e:
        raise DomainValidationError("month must be YYYY-MM") from e
    end_d = date(y + (m == 12), 1 if m == 12 else m + 1, 1)
    return (datetime.combine(start_d, time.min, tzinfo=timezone.utc), datetime.combine(end_d, time.min, tzinfo=timezone.utc), start_d, end_d)


def months(db: Session, user_id: uuid.UUID) -> list[str]:
    rows = db.scalars(select(func.to_char(ScoreSnapshot.computed_at, "YYYY-MM")).where(ScoreSnapshot.user_id == user_id).distinct())
    return sorted(set(rows), reverse=True)


def build(db: Session, user_id: uuid.UUID, month: str) -> dict:
    start, end, start_d, end_d = _range(month)
    snaps = db.scalars(select(ScoreSnapshot).where(ScoreSnapshot.user_id == user_id, ScoreSnapshot.computed_at < end).order_by(ScoreSnapshot.computed_at)).all()
    before = [s for s in snaps if s.computed_at < start]
    during = [s for s in snaps if s.computed_at >= start]
    s_from = (before[-1] if before else (during[0] if during else None))
    s_to = during[-1] if during else s_from
    saved = db.scalar(select(func.coalesce(func.sum(GoalContribution.amount_paise), 0)).where(
        GoalContribution.user_id == user_id, GoalContribution.on_date >= start_d, GoalContribution.on_date < end_d)) or 0
    titles = {m["id"]: m["title"] for m in catalogue()["modules"]}
    lessons = [titles.get(x, x) for x in db.scalars(select(LearningProgress.module_id).where(
        LearningProgress.user_id == user_id, LearningProgress.completed_at >= start, LearningProgress.completed_at < end))]
    checks = db.scalars(select(SentinelCheck).where(SentinelCheck.user_id == user_id, SentinelCheck.created_at >= start, SentinelCheck.created_at < end)).all()
    eligible = sorted({p["name"] for p in db.scalars(select(Event.payload).where(Event.user_id == user_id, Event.type == "SchemeEvaluated",
                       Event.occurred_at >= start, Event.occurred_at < end)) if p.get("status") == "likely_eligible"})
    goals = [g.model_dump(mode="json") for g in list_goals(db, user_id)]
    achievements = []
    if saved:
        achievements.append(f"Saved {money(saved)['display']} towards your goals")
    if lessons:
        achievements.append(f"Completed {len(lessons)} lesson{'s' if len(lessons) > 1 else ''}: {', '.join(lessons)}")
    if checks:
        achievements.append(f"Checked {len(checks)} suspicious message{'s' if len(checks) > 1 else ''} before acting")
    alerts = [f"{c.risk_level.capitalize()} risk: {c.summary}" for c in checks if c.risk_level in ("high", "critical")][:3]
    alerts += [f"“{g['title']}” is behind plan" for g in goals if not g["on_track"] and g["status"] == "active"]
    dims = s_to.dimensions if s_to else {}
    return {
        "month": month,
        "score": {"from": s_from.overall if s_from else None, "to": s_to.overall if s_to else None,
                  "change": (s_to.overall - s_from.overall) if s_from and s_to else 0},
        "dimensions": [{"key": k, "label": LABELS[k][0], "score": v} for k, v in dims.items()],
        "saved": money(saved), "achievements": achievements, "alerts": alerts, "new_schemes": eligible,
        "focus": actions(dims) if dims else [], "goals": goals,
        "has_activity": bool(during or saved or lessons or checks),
        "notice": "Built from what you did in VAAKYA this month. Educational guidance; you decide.",
    }
