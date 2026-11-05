"""Home dashboard view model. Field names match the web client's Dashboard type (04_APPLICATION/web/lib/types.ts)."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.errors import ConflictError
from ..core.money import format_inr, money
from ..domain import score as fcs
from ..models import Event, FinancialItem, Goal, Profile, SentinelCheck
from . import learning, notifications
from .assessment import monthly_figures
from .common import today_ist
from .goals import goal_out
from .profile import profile_out
from .score import score_view

AGENT_FOR = {"literacy": "educator", "safety": "sentinel", "goal_planning": "strategy", "scheme_awareness": "connector",
             "savings_discipline": "strategy", "debt_awareness": "strategy"}
ACTIVITY_TEXT = {
    "GoalCreated": "Created a goal", "PlanBuilt": "Built a plan for your goal", "GoalContribution": "Recorded a saving towards your goal",
    "LessonCompleted": "Lesson read", "QuizAnswered": "Quiz completed", "ScamChecked": "Checked a message for scam signs",
    "SchemeEvaluated": "Checked a scheme's rules against your profile", "AnswerGiven": "Answered your question",
}
HREF = {"strategy": "/goals", "educator": "/learn", "sentinel": "/shield", "connector": "/schemes"}


def _month_start(d: date, back: int) -> date:
    y, m = divmod(d.year * 12 + d.month - 1 - back, 12)
    return date(y, m + 1, 1)


def build(db: Session, user_id: uuid.UUID) -> dict:
    prof = db.get(Profile, user_id)
    sv = score_view(db, user_id)
    if prof is None or sv is None:
        raise ConflictError("Finish onboarding first: profile and money questions.", extra={"next": "/onboarding"})
    today = today_ist()
    f = monthly_figures(db, user_id)
    goals = [goal_out(db, g, today) for g in db.scalars(select(Goal).where(Goal.user_id == user_id, Goal.status == "active")
                                                         .order_by(Goal.priority, Goal.created_at))]
    planned = sum(g.monthly_plan.paise for g in goals)
    trend = []
    for back in range(5, -1, -1):
        start, end = _month_start(today, back), _month_start(today, back - 1)
        saved = db.scalar(select(func.coalesce(func.sum(FinancialItem.amount_paise), 0)).where(
            FinancialItem.user_id == user_id, FinancialItem.kind == "saving", FinancialItem.on_date >= start, FinancialItem.on_date < end)) or 0
        trend.append({"month": start.strftime("%Y-%m"), "saved_paise": int(saved)})
    ef_saved = f["savings"] + sum(g.saved.paise for g in goals if g.type == "emergency_fund")
    entries = db.scalars(select(FinancialItem).where(FinancialItem.user_id == user_id, FinancialItem.kind.in_(["income", "expense", "saving", "loan"]))
                         .order_by(FinancialItem.on_date.desc(), FinancialItem.created_at.desc()).limit(8)).all()
    recent = db.scalars(select(Event).where(Event.user_id == user_id, Event.type.in_(list(ACTIVITY_TEXT)))
                        .order_by(Event.occurred_at.desc()).limit(60)).all()
    events, seen_kinds = [], set()
    for ev in recent:  # one line per kind of activity, newest first (a scheme scan emits one event per scheme)
        if (ev.type, ev.payload.get("agent")) not in seen_kinds:
            seen_kinds.add((ev.type, ev.payload.get("agent")))
            events.append(ev)
        if len(events) == 6:
            break
    checks = db.scalars(select(SentinelCheck).where(SentinelCheck.user_id == user_id).order_by(SentinelCheck.created_at.desc()).limit(3)).all()
    dims = {d["key"]: d["score"] for d in sv["dimensions"]}
    recs = [{"id": f"r-{a['dimension']}", "agent": AGENT_FOR[a["dimension"]], "title": a["text"], "href": a["href"],
             "why": f"Your {fcs.LABELS[a['dimension']][0].lower()} score is {dims[a['dimension']]}; this adds about {a['estimated_points']} points."}
            for a in sv["actions"]]
    for g in goals:
        if not g.on_track and g.monthly_plan.paise:
            recs.insert(0, {"id": f"r-goal-{g.id}", "agent": "strategy", "title": f"Catch up on “{g.title}”", "href": "/goals",
                            "why": f"The plan is {format_inr(round(g.monthly_plan.paise / 100))} a month and you are behind it."})
    from ..models import Event as Ev
    schemes = [{"id": p["scheme_id"], "status": p.get("status")} for p in db.scalars(
        select(Ev.payload).where(Ev.user_id == user_id, Ev.type == "SchemeEvaluated").order_by(Ev.occurred_at.desc()).limit(20))]
    seen, uniq = set(), []
    for x in schemes:
        if x["id"] not in seen:
            seen.add(x["id"])
            uniq.append(x)
    return {
        "profile": profile_out(prof).model_dump(mode="json"),
        "score": sv,
        "snapshot": {"monthly_income": money(f["income"]), "monthly_expenses": money(f["expenses"]),
                     "emergency_fund_months": round(ef_saved / f["expenses"], 1) if f["expenses"] else 0,
                     "savings_rate_pct": round(planned * 100 / f["income"]) if f["income"] else 0},
        "savings": {"saved_this_month": money(trend[-1]["saved_paise"]), "planned_this_month": money(planned), "trend": trend},
        "goals": [g.model_dump(mode="json") for g in goals],
        "entries": [{"id": str(e.id), "date": e.on_date.isoformat(), "label": e.label, "category": e.kind, "amount": money(e.amount_paise),
                     "source": e.source} for e in entries],
        "activity": [{"id": str(e.id), "agent": e.payload["agent"], "at": e.occurred_at.isoformat(), "text": ACTIVITY_TEXT[e.type],
                      "href": HREF[e.payload["agent"]]} for e in events if e.payload.get("agent") in HREF],
        "recommendations": recs[:4],
        "scam_alerts": [{"id": str(c.id), "at": c.created_at.isoformat(), "level": c.risk_level, "summary": c.summary} for c in checks],
        "learning": learning.list_modules(db, user_id),
        "notifications": notifications.list_(db, user_id, limit=20),
        "schemes": uniq,
    }
