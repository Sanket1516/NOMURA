"""Structured extraction from financial documents (FR-DOC-03..06), on the VAAKYA host.

Text comes from Tesseract OCR (images) or the PDF's own text layer (digital PDFs). Fields are found by rules with
labelled patterns; each has a confidence. A Private Tier model can be added for messy layouts (T0.04); until then the
rules are the whole extractor. Values reach the user's finances only after the user confirms them (FR-DOC-05).
Raw text is never stored; only the extracted fields.
"""
from __future__ import annotations

import io
import re
import uuid
from decimal import Decimal, InvalidOperation

from pypdf import PdfReader
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..core.errors import ConflictError, DomainValidationError, ServiceUnavailable
from ..core.money import money
from ..models import Document, ExtractedField, FinancialItem
from .common import emit, get_owned, today_ist

AMT = r"(?:₹|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)"
RULES: dict[str, list[tuple[str, str, float]]] = {
    "salary_slip": [
        ("net_monthly_income", rf"(?i)net\s*(?:pay|salary|amount|take[- ]home)\s*(?:payable)?\s*[:\-]?\s*{AMT}", 0.9),
        ("net_monthly_income", rf"(?i)(?:शुद्ध|निव्वळ)\s*(?:वेतन|पगार)\s*[:\-]?\s*{AMT}", 0.85),
        ("gross_monthly_income", rf"(?i)gross\s*(?:pay|salary|earnings|total)\s*[:\-]?\s*{AMT}", 0.9),
        ("total_deductions", rf"(?i)total\s*deductions?\s*[:\-]?\s*{AMT}", 0.85),
        ("pay_month", r"(?i)(?:pay\s*slip|salary\s*slip|pay\s*period|month)\s*(?:for|of)?\s*[:\-]?\s*([A-Za-z]{3,9}[ ,\-]+20\d{2})", 0.8),
    ],
    "bank_statement": [
        ("closing_balance", rf"(?i)closing\s*balance\s*[:\-]?\s*{AMT}", 0.9),
        ("opening_balance", rf"(?i)opening\s*balance\s*[:\-]?\s*{AMT}", 0.9),
        ("salary_credit", rf"(?i)(?:salary|sal)\s*(?:credit|cr)\b[^\n0-9]{{0,30}}{AMT}", 0.75),
    ],
}
MONEY_FIELDS = {"net_monthly_income", "gross_monthly_income", "total_deductions", "closing_balance", "opening_balance", "salary_credit"}


def _paise(s: str) -> int | None:
    try:
        v = Decimal(s.replace(",", ""))
    except InvalidOperation:
        return None
    return int(v * 100) if 0 < v < 10**9 else None


def text_of(data: bytes, mime: str, ocr) -> str:
    if mime == "application/pdf":
        text = "\n".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(data)).pages[:20])
        if text.strip():
            return text
        raise DomainValidationError("This PDF is a scanned image. Upload a photo or screenshot of the page instead.")
    if ocr is None:
        raise ServiceUnavailable("Reading documents needs the OCR service, which is not running on this server.")
    return ocr(data, mime)


def extract(kind: str, text: str) -> list[dict]:
    found: dict[str, dict] = {}
    for field, pattern, conf in RULES.get(kind, []):
        if field in found:
            continue
        m = re.search(pattern, text)
        if not m:
            continue
        raw = m.group(1).strip()
        if field in MONEY_FIELDS:
            p = _paise(raw)
            if p is None:
                continue
            found[field] = {"field": field, "value": money(p), "confidence": conf}
        else:
            found[field] = {"field": field, "value": raw, "confidence": conf}
    net, gross = found.get("net_monthly_income"), found.get("gross_monthly_income")
    if net and gross and net["value"]["paise"] > gross["value"]["paise"]:  # rule check: net cannot exceed gross
        net["confidence"] = gross["confidence"] = 0.4
        net["warning"] = "Net pay is higher than gross pay; please check both."
    return list(found.values())


def run(db: Session, vault, ocr, user_id: uuid.UUID, doc: Document) -> list[dict]:
    if doc.kind not in RULES:
        doc.status = "stored"
        return []
    fields = extract(doc.kind, text_of(vault.get(doc.object_key), doc.mime, ocr))
    db.execute(delete(ExtractedField).where(ExtractedField.document_id == doc.id))
    for f in fields:
        db.add(ExtractedField(user_id=user_id, document_id=doc.id, field=f["field"], value={"v": f["value"], **({"warning": f["warning"]} if "warning" in f else {})},
                              confidence=f["confidence"]))
    doc.status = "pending_review" if fields else "no_fields_found"
    db.flush()
    return fields


def confirm(db: Session, user_id: uuid.UUID, doc_id: uuid.UUID, edits: list[dict]) -> dict:
    """The user confirms or corrects each value. Only then do they become financial items (FR-DOC-05)."""
    doc = get_owned(db, Document, doc_id, user_id)
    if doc.status not in ("pending_review", "confirmed"):
        raise ConflictError("There is nothing to confirm for this document.")
    rows = {f.field: f for f in db.scalars(select(ExtractedField).where(ExtractedField.document_id == doc.id))}
    for e in edits:
        f = rows.get(e.get("field"))
        if f is None:
            raise DomainValidationError(f"Unknown field: {e.get('field')}")
        v = e.get("value")
        if f.field in MONEY_FIELDS:
            if not (isinstance(v, dict) and isinstance(v.get("paise"), int) and v["paise"] > 0):
                raise DomainValidationError(f"{f.field} needs a positive amount in paise")
            v = money(v["paise"])
        f.confirmed_value = {"v": v}
    unconfirmed = [k for k, f in rows.items() if f.confirmed_value is None]
    if unconfirmed:
        raise DomainValidationError(f"Confirm or correct every field: {', '.join(unconfirmed)}")
    net = rows.get("net_monthly_income")
    created = []
    if net is not None:
        # The latest confirmed slip replaces income taken from earlier slips, so monthly income is never counted twice.
        db.execute(delete(FinancialItem).where(FinancialItem.user_id == user_id, FinancialItem.source == "document",
                                               FinancialItem.kind == "income", FinancialItem.category == "salary"))
        db.add(FinancialItem(user_id=user_id, kind="income", label="Net salary (from salary slip)", category="salary",
                             amount_paise=net.confirmed_value["v"]["paise"], frequency="monthly", on_date=today_ist(), source="document",
                             attributes={"document_id": str(doc.id)}))
        created.append("income")
    doc.status = "confirmed"
    db.flush()
    emit(db, user_id, "DocumentConfirmed", {"document_id": str(doc.id), "kind": doc.kind, "fields": sorted(rows)})
    return {"status": "confirmed", "items_created": created}
