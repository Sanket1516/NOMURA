"""Document upload (FR-DOC-01, -02, NFR-SEC-05). Validation here; storage through the DocumentVault interface."""
from __future__ import annotations

import hashlib
import io
import uuid
from typing import Protocol

from PIL import Image, UnidentifiedImageError
from pypdf import PdfReader
from pypdf.errors import PdfReadError
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.errors import DomainValidationError, PayloadTooLarge, ServiceUnavailable, UnsupportedMedia
from ..models import Document, ExtractedField
from .common import emit, get_owned, require_consent, today_ist

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 40_000_000
MAX_PDF_PAGES = 20
KINDS = {"salary_slip", "bank_statement", "insurance_policy", "epf_statement", "land_record", "certificate", "scam_screenshot", "other"}


class DocumentVault(Protocol):
    def put(self, key: str, data: bytes, mime: str) -> None: ...
    def get(self, key: str) -> bytes: ...
    def delete(self, key: str) -> None: ...
    def delete_prefix(self, prefix: str) -> int: ...


def sniff(data: bytes) -> str:
    if data.startswith(b"%PDF-"):
        return "application/pdf"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    raise UnsupportedMedia("Only PDF, PNG and JPEG files are accepted. The file content did not match any of them.")


def sanitise(data: bytes, allow_pdf: bool = True) -> tuple[bytes, str]:
    """Check size and type by content, re-encode images without metadata (EXIF, GPS), reject risky PDFs."""
    if len(data) == 0:
        raise DomainValidationError("The file is empty")
    if len(data) > MAX_BYTES:
        raise PayloadTooLarge("Files must be 10 MB or smaller")
    mime = sniff(data)
    if mime == "application/pdf":
        if not allow_pdf:
            raise UnsupportedMedia("Screenshots must be PNG or JPEG")
        try:
            reader = PdfReader(io.BytesIO(data))
            if reader.is_encrypted:
                raise UnsupportedMedia("Password-protected PDFs are not accepted")
            if len(reader.pages) > MAX_PDF_PAGES:
                raise DomainValidationError(f"PDFs can have at most {MAX_PDF_PAGES} pages")
            root = reader.trailer["/Root"]
            names = root.get("/Names", {}) if hasattr(root, "get") else {}
            if "/OpenAction" in root or "/AA" in root or (hasattr(names, "get") and (names.get("/JavaScript") or names.get("/EmbeddedFiles"))):
                raise UnsupportedMedia("PDFs with scripts, automatic actions or embedded files are not accepted")
        except PdfReadError as e:
            raise UnsupportedMedia("The PDF could not be read") from e
        return data, mime
    Image.MAX_IMAGE_PIXELS = MAX_PIXELS
    try:
        img = Image.open(io.BytesIO(data))
        img.verify()
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as e:
        raise UnsupportedMedia("The image could not be read") from e
    # Re-encoding writes pixels only: Pillow does not copy EXIF (incl. GPS) or PNG text chunks unless asked to.
    out = io.BytesIO()
    if mime == "image/jpeg":
        img.convert("RGB").save(out, "JPEG", quality=92)
    else:
        img.convert("RGBA" if img.mode in ("RGBA", "LA", "P") else "RGB").save(out, "PNG")
    return out.getvalue(), mime


def upload(db: Session, vault: DocumentVault | None, user_id: uuid.UUID, data: bytes, kind: str) -> Document:
    if kind not in KINDS:
        raise DomainValidationError(f"kind must be one of {sorted(KINDS)}")
    require_consent(db, user_id, "document_storage")
    if vault is None:
        raise ServiceUnavailable("Document storage is not configured on this server.")
    clean, mime = sanitise(data)
    doc_id = uuid.uuid4()
    t = today_ist()
    key = f"{user_id}/{t:%Y}/{t:%m}/{doc_id}"
    vault.put(key, clean, mime)
    doc = Document(id=doc_id, user_id=user_id, kind=kind, object_key=key, sha256=hashlib.sha256(clean).hexdigest(), mime=mime, size=len(clean))
    db.add(doc)
    db.flush()
    emit(db, user_id, "DocumentUploaded", {"document_id": str(doc_id), "kind": kind}, project=False)
    return doc


def out(db: Session, d: Document) -> dict:
    fields = db.scalars(select(ExtractedField).where(ExtractedField.document_id == d.id)).all()
    return {"id": str(d.id), "kind": d.kind, "status": d.status, "mime": d.mime, "size": d.size, "created_at": d.created_at.isoformat(),
            "fields": [{"field": f.field, "value": (f.confirmed_value or f.value)["v"], "confidence": f.confidence,
                        "confirmed": f.confirmed_value is not None, "warning": f.value.get("warning")} for f in fields]}


def list_(db: Session, user_id: uuid.UUID) -> list[dict]:
    return [out(db, d) for d in db.scalars(select(Document).where(Document.user_id == user_id).order_by(Document.created_at.desc()))]


def delete(db: Session, vault: DocumentVault | None, user_id: uuid.UUID, doc_id: uuid.UUID) -> None:
    d = get_owned(db, Document, doc_id, user_id)
    if vault is not None:
        vault.delete(d.object_key)
    db.delete(d)
