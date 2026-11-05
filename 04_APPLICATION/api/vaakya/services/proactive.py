"""Proactive behaviour (FR-STR-11, FR-CON-11, AGENT_ARCHITECTURE §9). Deterministic triggers; at most one nudge per user per day.

Triggers:
  goal_drift       an active goal is at least one monthly instalment behind its plan     → Strategy Builder
  newly_eligible   a scheme became likely-eligible since the last scheme nudge            → Connector
Each nudge is recorded as an event so the same nudge is never sent twice.
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..core.money import format_inr
from ..models import Event, Goal, Notification, User
from .common import emit, today_ist
from .goals import _expected_saved, latest_plan
from .notifications import notify


def _sent_today(db: Session, user_id: uuid.UUID, today: date) -> bool:
    start = datetime.combine(today, time.min, tzinfo=timezone.utc)
    return (db.scalar(select(func.count()).select_from(Notification).where(Notification.user_id == user_id, Notification.created_at >= start)) or 0) > 0


def _already(db: Session, user_id: uuid.UUID, key: str) -> bool:
    return db.scalar(select(Event.id).where(Event.user_id == user_id, Event.type == "NudgeSent", Event.payload["key"].astext == key).limit(1)) is not None


def candidates(db: Session, user_id: uuid.UUID, today: date | None = None) -> list[dict]:
    today = today or today_ist()
    out = []
    for g in db.scalars(select(Goal).where(Goal.user_id == user_id, Goal.status == "active").order_by(Goal.priority)):
        plan = latest_plan(db, g.id)
        if not plan or plan.outputs["monthly_needed_paise"] <= 0:
            continue
        behind = _expected_saved(plan, today) - g.saved_paise
        if behind >= plan.outputs["monthly_needed_paise"]:
            out.append({"key": f"goal_drift:{g.id}:{today:%Y-%m}", "agent": "strategy", "kind": "goal", "href": "/goals",
                        "title": f"“{g.title}” is behind plan",
                        "body": f"You are {format_inr(round(behind / 100))} behind. Saving {format_inr(round(plan.outputs['monthly_needed_paise'] / 100))} this month keeps the date."})
    latest: dict[str, tuple[str, str]] = {}
    for p in db.scalars(select(Event.payload).where(Event.user_id == user_id, Event.type == "SchemeEvaluated").order_by(Event.occurred_at)):
        latest[p["scheme_id"]] = (p.get("status", ""), p.get("name", p["scheme_id"]))
    for sid, (st, name) in sorted(latest.items()):
        if st == "likely_eligible":
            out.append({"key": f"newly_eligible:{sid}", "agent": "connector", "kind": "scheme", "href": "/schemes",
                        "title": "A scheme may fit you", "body": f"Based on your profile you may be eligible for {name}. See the steps and documents."})
    return [c for c in out if not _already(db, user_id, c["key"])]


def run_for_user(db: Session, user_id: uuid.UUID, today: date | None = None) -> dict | None:
    today = today or today_ist()
    if _sent_today(db, user_id, today):
        return None
    c = candidates(db, user_id, today)
    if not c:
        return None
    n = c[0]  # goal drift first: money on track matters most
    notify(db, user_id, n["kind"], n["title"], n["body"], n["href"])
    emit(db, user_id, "NudgeSent", {"key": n["key"], "agent": n["agent"]}, project=False)
    return n


def run_all(db: Session, today: date | None = None) -> int:
    sent = 0
    for uid in db.scalars(select(User.id).where(User.status == "active", User.assessment_completed_at.is_not(None))):
        if run_for_user(db, uid, today):
            sent += 1
    return sent
