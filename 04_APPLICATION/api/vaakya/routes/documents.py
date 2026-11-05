import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.orm import Session

from ..auth import User_
from ..core.errors import PayloadTooLarge
from ..db import get_db
from ..features import Features, features
from ..models import Document
from ..ratelimit import limit
from ..services import documents
from ..services.common import get_owned

router = APIRouter(prefix="/v1/documents", tags=["documents"])
DB = Annotated[Session, Depends(get_db)]
F = Annotated[Features, Depends(features)]


async def read_capped(f: UploadFile, cap: int = documents.MAX_BYTES) -> bytes:
    data = await f.read(cap + 1)
    if len(data) > cap:
        raise PayloadTooLarge("Files must be 10 MB or smaller")
    return data


@router.post("", status_code=202, dependencies=[limit("upload")], summary="Upload a PDF, PNG or JPEG (≤ 10 MB)")
async def upload(user: User_, db: DB, f: F, file: UploadFile = File(...), kind: str = Form("other")) -> dict:
    data = await read_capped(file)
    doc = documents.upload(db, f.vault, user.id, data, kind)
    from ..services import extraction
    ocr = getattr(f.speech, "ocr", None)
    try:
        extraction.run(db, f.vault, ocr, user.id, doc)
    except Exception as e:  # noqa: BLE001 - the file is stored; extraction can be retried, the reason is shown
        doc.status = "extraction_failed"
        db.flush()
        return {**documents.out(db, doc), "extraction_error": getattr(e, "detail", None) or "Could not read this document."}
    return documents.out(db, doc)


@router.get("")
def list_docs(user: User_, db: DB) -> list[dict]:
    return documents.list_(db, user.id)


@router.get("/{doc_id}")
def get_doc(doc_id: uuid.UUID, user: User_, db: DB) -> dict:
    return documents.out(db, get_owned(db, Document, doc_id, user.id))


@router.post("/{doc_id}/confirm", summary="Confirm or correct extracted values; only then are they used")
def confirm(doc_id: uuid.UUID, body: dict, user: User_, db: DB) -> dict:
    from ..services import extraction
    fields = body.get("fields")
    if not isinstance(fields, list) or not fields:
        from ..core.errors import DomainValidationError
        raise DomainValidationError("Send fields: [{field, value}]")
    return extraction.confirm(db, user.id, doc_id, fields)


@router.delete("/{doc_id}", status_code=204)
def delete_doc(doc_id: uuid.UUID, user: User_, db: DB, f: F) -> None:
    documents.delete(db, f.vault, user.id, doc_id)
