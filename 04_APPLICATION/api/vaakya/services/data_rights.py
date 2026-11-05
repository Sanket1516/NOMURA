"""View, export and delete (FR-SAF-06, NFR-PRIV-02)."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from .. import models as m

USER_TABLES = [m.DataflowAudit, m.Outbox, m.Event, m.Notification, m.ScoreSnapshot, m.QuizAttempt, m.LearningProgress, m.SentinelCheck,
               m.ExtractedField, m.Document, m.Message, m.Conversation, m.GoalContribution, m.Plan, m.Goal, m.FinancialItem,
               m.QuestionnaireResponse, m.Consent, m.Preferences, m.Profile]


def export(db: Session, user_id: uuid.UUID) -> dict:
    def rows(model) -> list[dict]:
        cols = [c.name for c in model.__table__.columns]
        return [{c: _json(getattr(r, c)) for c in cols} for r in db.scalars(select(model).where(model.user_id == user_id))]
    return {"exported_at": datetime.now(timezone.utc).isoformat(), "user_id": str(user_id), "format": "vaakya-export-1",
            "note": "Uploaded files are listed under documents; download them from the Document Hub.",
            "data": {model.__tablename__: rows(model) for model in reversed(USER_TABLES) if model is not m.Outbox}}


def _json(v):
    if isinstance(v, (datetime,)):
        return v.isoformat()
    if hasattr(v, "isoformat"):
        return v.isoformat()
    if isinstance(v, uuid.UUID):
        return str(v)
    return v


def erase(db: Session, user_id: uuid.UUID, vault=None, graph=None) -> dict:
    """Delete everything in PostgreSQL now; vault and graph through their interfaces (added in Step 3)."""
    keys = list(db.scalars(select(m.Document.object_key).where(m.Document.user_id == user_id)))
    report: dict[str, int | str] = {}
    if vault is not None:
        report["vault_objects_deleted"] = vault.delete_prefix(f"{user_id}/")
    elif keys:
        report["vault_objects_pending"] = len(keys)
    if graph is not None:
        report["graph_nodes_deleted"] = graph.erase_user(user_id)
    for model in USER_TABLES:
        report[model.__tablename__] = db.execute(delete(model).where(model.user_id == user_id)).rowcount or 0
    user = db.get(m.User, user_id)
    sub = user.keycloak_sub if user else None
    db.execute(delete(m.User).where(m.User.id == user_id))
    db.flush()
    remaining = sum(db.scalar(select(func.count()).select_from(t).where(t.user_id == user_id)) or 0 for t in USER_TABLES)
    report["remaining_rows"] = remaining
    report["identity_provider_account"] = "delete in Keycloak" if sub else "none"
    return {"status": "deleted" if remaining == 0 else "incomplete", "complete_by": (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat(),
            "report": report}
