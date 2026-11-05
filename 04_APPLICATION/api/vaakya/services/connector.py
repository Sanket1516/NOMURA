"""Scheme discovery and eligibility (FR-CON-01..06, -08, -09, -11, -12). Facts come from the catalogue; decisions from the engine."""
from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.errors import NotFoundError
from ..domain.eligibility import evaluate, facts_from_profile
from ..models import Profile, Scheme
from .common import emit, today_ist


class ConnectorService:
    def _catalogue(self, db: Session) -> list[Scheme]:
        return list(db.scalars(select(Scheme).order_by(Scheme.id)))

    def _facts(self, db: Session, user_id: uuid.UUID) -> dict:
        return facts_from_profile(db.get(Profile, user_id), today_ist())

    @staticmethod
    def _summary(row: Scheme, status: str) -> dict:
        d = row.data
        stale = bool(row.review_due_at and row.review_due_at < date.today())
        return {"id": row.id, "name": d["name"], "category": d["category"], "authority": d["authority"], "summary": d["summary"],
                "status": status, "verification": row.verification, "last_verified_at": row.last_verified_at.isoformat() if row.last_verified_at else None,
                "stale": stale, "source_url": d["source_url"]}

    def evaluate_all(self, db: Session, user_id: uuid.UUID, record: bool = True) -> list[tuple[Scheme, dict]]:
        facts = self._facts(db, user_id)
        out = []
        for row in self._catalogue(db):
            r = evaluate(row.data, facts)
            out.append((row, r))
            if record:
                emit(db, user_id, "SchemeEvaluated", {"scheme_id": row.id, "status": r["status"], "rules_version": r["rules_version"],
                                                      "name": row.data["name"], "category": row.data["category"], "agent": "connector"})
        return out

    def list_schemes(self, db: Session, user_id: uuid.UUID, category: str | None = None, q: str | None = None) -> list[dict]:
        order = {"likely_eligible": 0, "needs_info": 1, "not_eligible": 2}
        items = [self._summary(row, r["status"]) for row, r in self.evaluate_all(db, user_id)]
        if category:
            items = [i for i in items if i["category"] == category]
        if q:
            ql = q.lower()
            items = [i for i in items if ql in f"{i['name']} {i['summary']} {i['category']}".lower()]
        return sorted(items, key=lambda i: (order[i["status"]], i["name"]))

    def eligibility(self, db: Session, user_id: uuid.UUID, scheme_id: str) -> dict:
        row = db.get(Scheme, scheme_id)
        if row is None:
            raise NotFoundError("No such scheme in the catalogue")
        r = evaluate(row.data, self._facts(db, user_id))
        emit(db, user_id, "SchemeEvaluated", {"scheme_id": row.id, "status": r["status"], "rules_version": r["rules_version"],
                                              "name": row.data["name"], "category": row.data["category"], "agent": "connector"})
        emit(db, user_id, "SchemeViewed", {"scheme_id": row.id})
        d = row.data
        benefit = {"text": d["benefit"]["text"]}
        if d["benefit"].get("amount_paise_per_year"):
            from ..core.money import money
            benefit["estimate"] = money(d["benefit"]["amount_paise_per_year"])
            benefit["basis"] = "Fixed scheme amount per year, as published"
        return {**self._summary(row, r["status"]), **r, "benefit": benefit, "documents": d["documents"], "steps": d["steps"],
                "source": {"url": d["source_url"], "authority": d["authority"], "verification": row.verification},
                "disclaimer": "The scheme authority makes the final decision. Details are awaiting human verification." if row.verification != "verified"
                else "The scheme authority makes the final decision."}
