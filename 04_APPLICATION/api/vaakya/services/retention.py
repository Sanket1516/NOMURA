"""Retention rules (DATABASE_ARCHITECTURE §2, NFR-PRIV-02). Each rule is explicit and tested."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import delete
from sqlalchemy.orm import Session

from ..models import DataflowAudit, Message, Notification, Outbox

RULES = {
    "messages": (Message, Message.created_at, timedelta(days=365)),               # redacted chat text: 12 months
    "notifications_read": (Notification, Notification.read_at, timedelta(days=90)),
    "outbox_processed": (Outbox, Outbox.processed_at, timedelta(days=7)),
    "dataflow_audit": (DataflowAudit, DataflowAudit.at, timedelta(days=365)),
}
# Not here because they are never stored: voice audio (deleted after transcription), scam screenshots
# (analysed in memory; only the verdict is kept). Documents are kept until the user deletes them.


def purge(db: Session, now: datetime | None = None) -> dict[str, int]:
    now = now or datetime.now(timezone.utc)
    out = {}
    for name, (model, col, age) in RULES.items():
        out[name] = db.execute(delete(model).where(col.is_not(None), col < now - age)).rowcount or 0
    return out
