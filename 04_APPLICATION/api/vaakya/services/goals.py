"""Goal Studio, plans and contributions (FR-STR-01, -03, -05, -08). Figures come only from domain.calculators."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import schemas as s
from ..core.errors import ConflictError, DomainValidationError
from ..core.money import format_inr, money
from ..domain import calculators as calc
from ..models import FinancialItem, Goal, GoalContribution, Plan
from .assessment import monthly_figures
from .common import emit, get_owned, today_ist


def latest_plan(db: Session, goal_id: uuid.UUID) -> Plan | None:
    return db.scalar(select(Plan).where(Plan.goal_id == goal_id).order_by(Plan.created_at.desc()).limit(1))


def _expected_saved(plan: Plan, today: date) -> int:
    """Where the plan said savings would be by now."""
    start = date.fromisoformat(plan.inputs["today"])
    elapsed = calc.months_between(start, today)
    return min(plan.inputs["saved_paise"] + plan.outputs["monthly_needed_paise"] * elapsed, plan.inputs["target_paise"])


def goal_out(db: Session, g: Goal, today: date | None = None) -> s.GoalOut:
    today = today or today_ist()
    plan = latest_plan(db, g.id)
    monthly = plan.outputs["monthly_needed_paise"] if plan else 0
    on_track = bool(plan) and plan.feasibility in {"achievable", "stretch", "achieved"} and g.saved_paise >= _expected_saved(plan, today)  # type: ignore[arg-type]
    return s.GoalOut(id=g.id, type=g.type, title=g.title, target=money(g.target_paise), saved=money(g.saved_paise),  # type: ignore[arg-type]
                     target_date=g.target_date, monthly_plan=money(monthly), on_track=on_track,  # type: ignore[arg-type]
                     progress_pct=min(round(g.saved_paise * 100 / g.target_paise), 100), status=g.status, priority=g.priority)


def list_goals(db: Session, user_id: uuid.UUID) -> list[s.GoalOut]:
    rows = db.scalars(select(Goal).where(Goal.user_id == user_id, Goal.status != "deleted").order_by(Goal.priority, Goal.created_at)).all()
    return [goal_out(db, g) for g in rows]


def create_goal(db: Session, user_id: uuid.UUID, body: s.GoalIn, idem: str | None) -> tuple[s.GoalOut, bool]:
    if idem:
        prior = db.scalar(select(Goal).where(Goal.user_id == user_id, Goal.idempotency_key == idem))
        if prior:
            return goal_out(db, prior), False
    if body.target_date <= today_ist():
        raise DomainValidationError("target_date must be in the future")
    saved = body.saved.paise if body.saved else 0
    if saved > body.target.paise:
        raise DomainValidationError("saved cannot exceed the target")
    g = Goal(user_id=user_id, type=body.type, title=body.title, target_paise=body.target.paise, saved_paise=saved,
             target_date=body.target_date, priority=body.priority, idempotency_key=idem)
    db.add(g)
    try:
        db.flush()
    except IntegrityError as e:  # concurrent duplicate with the same idempotency key
        raise ConflictError("Duplicate request") from e
    emit(db, user_id, "GoalCreated", {"goal_id": str(g.id), "type": g.type, "agent": "strategy"})
    build_plan(db, user_id, g.id)
    return goal_out(db, g), True


def update_goal(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID, body: s.GoalPatch) -> s.GoalOut:
    g = get_owned(db, Goal, goal_id, user_id)
    data = body.model_dump(exclude_none=True)
    if "target" in data:
        g.target_paise = body.target.paise  # type: ignore[union-attr]
        data.pop("target")
    if "target_date" in data and data["target_date"] <= today_ist():
        raise DomainValidationError("target_date must be in the future")
    for k, v in data.items():
        setattr(g, k, v)
    db.flush()
    if {"target", "target_date"} & body.model_fields_set:
        build_plan(db, user_id, g.id)
    return goal_out(db, g)


def delete_goal(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> None:
    g = get_owned(db, Goal, goal_id, user_id)
    db.delete(g)
    emit(db, user_id, "GoalDeleted", {"goal_id": str(goal_id)})


def build_plan(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> s.PlanOut:
    g = get_owned(db, Goal, goal_id, user_id)
    f = monthly_figures(db, user_id)
    if f["income"] == 0:
        raise ConflictError("Complete the money questions first, so the plan uses your real income and spending.")
    today = today_ist()
    r = calc.goal_plan(g.target_paise, g.saved_paise, today, g.target_date, f["income"], f["expenses"], f["emi"])
    plan = Plan(user_id=user_id, goal_id=g.id, calc_version=r.version, inputs=r.inputs, outputs=r.figures, feasibility=str(r.figures["feasibility"]))
    db.add(plan)
    db.flush()
    emit(db, user_id, "PlanBuilt", {"goal_id": str(g.id), "feasibility": plan.feasibility, "agent": "strategy"})
    return plan_out(plan, r.formula, r.assumptions, r.limitations)


def plan_out(plan: Plan, formula: str | None = None, assumptions: list[str] | None = None, limitations: list[str] | None = None) -> s.PlanOut:
    o = plan.outputs
    steps = []
    if o["feasibility"] in {"achievable", "stretch"}:
        steps.append(f"Move {format_inr(round(o['monthly_needed_paise'] / 100))} to this goal on payday each month")
    elif o["feasibility"] == "not_feasible_by_date":
        steps.append(f"Move the date to {o['suggested_date'][:7]}, or raise the monthly amount")
    elif o["feasibility"] == "no_surplus":
        steps.append("Spending is at or above income: start with the Smart Budgeting lesson to find room to save")
    if o["feasibility"] == "stretch":
        steps.append("This uses more than half of your monthly surplus; keep an emergency fund first")
    return s.PlanOut(plan_id=plan.id, goal_id=plan.goal_id, feasibility=plan.feasibility, calc_version=plan.calc_version,
                     figures=o, inputs=plan.inputs, formula=formula or "see calculators.goal_plan",
                     assumptions=assumptions or [], limitations=limitations or [], next_steps=steps)


def get_plan(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> s.PlanOut:
    get_owned(db, Goal, goal_id, user_id)
    p = latest_plan(db, goal_id)
    if not p:
        return build_plan(db, user_id, goal_id)
    return plan_out(p, "monthly needed = (target − saved) ÷ months left, rounded up; surplus = income − expenses − EMIs",
                    ["No interest or investment returns are counted", "Income and expenses stay at today's level"],
                    ["Does not predict emergencies, job changes or inflation", "'Achievable' keeps half of the surplus free"])


def contribute(db: Session, user_id: uuid.UUID, goal_id: uuid.UUID, body: s.ContributionIn) -> s.GoalOut:
    g = get_owned(db, Goal, goal_id, user_id)
    if body.amount.paise <= 0:
        raise DomainValidationError("amount must be positive")
    if body.on_date > today_ist():
        raise DomainValidationError("on_date cannot be in the future")
    db.add(GoalContribution(user_id=user_id, goal_id=g.id, amount_paise=body.amount.paise, on_date=body.on_date))
    db.add(FinancialItem(user_id=user_id, kind="saving", label=f"Saved to {g.title}", category="goal", amount_paise=body.amount.paise,
                         on_date=body.on_date, source="typed", attributes={"goal_id": str(g.id)}))
    g.saved_paise = min(g.saved_paise + body.amount.paise, g.target_paise)
    if g.saved_paise >= g.target_paise:
        g.status = "done"
    db.flush()
    emit(db, user_id, "GoalContribution", {"goal_id": str(g.id), "agent": "strategy"})
    return goal_out(db, g)
