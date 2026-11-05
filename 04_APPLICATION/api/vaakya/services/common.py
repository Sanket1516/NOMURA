"""Shared service helpers: events + outbox, consent checks, user-scoped fetches."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.errors import ConsentRequiredError, NotFoundError
from ..models import Consent, Event, Outbox

def today_ist() -> date:
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo("Asia/Kolkata")).date()


def emit(db: Session, user_id: uuid.UUID, type_: str, payload: dict | None = None, *, project: bool = True) -> Event:
    """Append a behaviour event and, in the same transaction, an outbox row for the graph projection (D-010)."""
    ev = Event(user_id=user_id, type=type_, payload=payload or {}, occurred_at=datetime.now(timezone.utc))
    db.add(ev)
    if project:
        db.add(Outbox(user_id=user_id, topic=type_, payload=payload or {}))
    return ev


def get_owned[M](db: Session, model: type[M], obj_id: uuid.UUID, user_id: uuid.UUID) -> M:
    """Fetch a row only if it belongs to the user. Other users' ids return 404, not 403 (no probing)."""
    row = db.scalar(select(model).where(model.id == obj_id, model.user_id == user_id))  # type: ignore[attr-defined]
    if row is None:
        raise NotFoundError()
    return row


def consents(db: Session, user_id: uuid.UUID) -> dict[str, Consent]:
    rows = db.scalars(select(Consent).where(Consent.user_id == user_id).order_by(Consent.at)).all()
    latest: dict[str, Consent] = {}
    for r in rows:
        latest[r.purpose] = r
    return latest


def require_consent(db: Session, user_id: uuid.UUID, purpose: str) -> None:
    c = consents(db, user_id).get(purpose)
    if not c or not c.granted:
        raise ConsentRequiredError(f"This needs your '{purpose.replace('_', ' ')}' consent. You can give it in Profile.",
                                   extra={"purpose": purpose})
