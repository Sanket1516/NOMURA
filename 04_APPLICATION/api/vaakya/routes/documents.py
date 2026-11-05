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
    return {**documents.out(db, doc), "poll": f"/v1/documents/{doc.id}"}


@router.get("")
def list_docs(user: User_, db: DB) -> list[dict]:
    return documents.list_(db, user.id)


@router.get("/{doc_id}")
def get_doc(doc_id: uuid.UUID, user: User_, db: DB) -> dict:
    return documents.out(db, get_owned(db, Document, doc_id, user.id))


@router.delete("/{doc_id}", status_code=204)
def delete_doc(doc_id: uuid.UUID, user: User_, db: DB, f: F) -> None:
    documents.delete(db, f.vault, user.id, doc_id)
