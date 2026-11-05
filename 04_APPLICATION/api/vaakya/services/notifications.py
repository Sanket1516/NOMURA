from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import Notification
from .common import get_owned


def out(n: Notification) -> dict:
    return {"id": str(n.id), "at": n.created_at.isoformat(), "kind": n.kind, "title": n.title, "body": n.body, "read": n.read_at is not None, "href": n.href}


def list_(db: Session, user_id: uuid.UUID, unread_only: bool = False, limit: int = 50) -> list[dict]:
    q = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        q = q.where(Notification.read_at.is_(None))
    return [out(n) for n in db.scalars(q.order_by(Notification.created_at.desc()).limit(limit))]


def notify(db: Session, user_id: uuid.UUID, kind: str, title: str, body: str, href: str | None = None) -> Notification:
    n = Notification(user_id=user_id, kind=kind, title=title[:120], body=body[:400], href=href)
    db.add(n)
    return n


def mark_read(db: Session, user_id: uuid.UUID, notif_id: uuid.UUID) -> dict:
    n = get_owned(db, Notification, notif_id, user_id)
    n.read_at = n.read_at or datetime.now(timezone.utc)
    return out(n)
