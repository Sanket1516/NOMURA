"""Sentinel pipeline (FR-SEN-01..09, -11, AGENT_ARCHITECTURE §7): input → OCR → redact → signals + links + known patterns
(+ optional Reasoning Tier labels) → indicator and level → reasons with quoted evidence → actions → record."""
from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

from ..ai.redaction import redact
from ..core.errors import DomainValidationError, ServiceUnavailable
from ..domain import sentinel_signals as ss
from ..models import SentinelCheck
from .common import emit
from .documents import sanitise

INDICATOR_LABEL = "Risk indicator (weighted warning signs), not a probability"


class SentinelService:
    def __init__(self, knowledge=None, ocr=None, llm=None):
        self.knowledge, self.ocr, self.llm = knowledge, ocr, llm

    def analyse(self, text: str) -> dict:
        r = ss.analyse(text)
        patterns = []
        if self.knowledge is not None and r["findings"]:
            try:
                patterns = [{"id": h.chunk_id.split(":", 1)[1], "title": h.title, "url": h.url}
                            for h in self.knowledge.search(text, categories=["scam_pattern"], limit=3) if h.score >= 3]
            except Exception:  # noqa: BLE001 - pattern match is an extra; the deterministic verdict stands
                patterns = []
        reasons = [{"signal": f.signal, "severity": f.severity, "evidence": f.evidence, "explanation": f.explanation} for f in r["findings"]]
        assert all(x["evidence"] in text for x in reasons)  # evidence must be a quote, never invented
        return {"risk_level": r["risk_level"], "risk_indicator": r["risk_indicator"], "indicator_label": INDICATOR_LABEL,
                "reasons": reasons, "actions": ss.actions_for(r["findings"], r["risk_level"]), "similar_patterns": patterns,
                "weights_version": r["weights_version"]}

    def _record(self, db: Session, user_id: uuid.UUID, kind: str, v: dict) -> dict:
        top = v["reasons"][0]["explanation"] if v["reasons"] else "No known warning signs"
        row = SentinelCheck(user_id=user_id, input_kind=kind, risk_level=v["risk_level"], risk_indicator=v["risk_indicator"],
                            signals=[r["signal"] for r in v["reasons"]], summary=top[:200], weights_version=v["weights_version"])
        db.add(row)
        db.flush()
        emit(db, user_id, "ScamChecked", {"level": v["risk_level"], "agent": "sentinel"})
        from .score import recompute
        recompute(db, user_id, reason="scam_checked")
        cites = [{"id": f"scam:{p['id']}", "title": p["title"], "publisher": "VAAKYA scam awareness (draft)", "url": p["url"], "effective_date": None}
                 for p in v["similar_patterns"]]
        return {"id": str(row.id), **v, "ai": {"agents": ["sentinel"], "notice": "Automated check of warning signs. It can miss new tricks; if in doubt, do not pay or share.",
                                                "citations": cites, "llm_used": False}}

    def check_text(self, db: Session, user_id: uuid.UUID, text: str, kind: str = "other") -> dict:
        if not text.strip():
            raise DomainValidationError("Paste the message text")
        # The user's own identifiers are removed before anything is stored or sent further; signals run on the redacted text
        # except OTP-like numbers, which are signals themselves, so analysis uses the original in memory only.
        v = self.analyse(text)
        for r in v["reasons"]:
            r["evidence"] = str(redact(r["evidence"]).text)
        return self._record(db, user_id, kind, v)

    def check_image(self, db: Session, user_id: uuid.UUID, data: bytes) -> dict:
        clean, mime = sanitise(data, allow_pdf=False)
        if self.ocr is None:
            raise ServiceUnavailable("Reading text from screenshots needs the OCR service, which is not running on this server. Paste the text instead.")
        text = self.ocr(clean, mime)
        if not text.strip():
            raise DomainValidationError("No readable text was found in the image. Try a clearer screenshot or paste the text.")
        out = self.check_text(db, user_id, text, "screenshot")
        out["ocr_text_redacted"] = str(redact(text).text)[:2000]
        return out
