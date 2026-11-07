"""Endpoints served by the agents and speech services. They delegate to subsystems registered in Steps 4 to 6;
until a subsystem exists the endpoint returns 503 with the reason (never a fabricated answer)."""
import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import schemas as s
from ..auth import User_
from ..db import get_db, session_factory
from ..features import Features, features, need
from ..models import Conversation, Message
from ..ratelimit import limit
from ..services.common import get_owned, require_consent
from .documents import read_capped

router = APIRouter(prefix="/v1", tags=["assistant", "sentinel", "schemes", "voice"])
DB = Annotated[Session, Depends(get_db, scope="function")]
F = Annotated[Features, Depends(features)]


@router.post("/chat", dependencies=[limit("chat")], summary="Ask VAAKYA. Streams Server-Sent Events: queued, agent, token, citation, final, error")
def chat(body: s.ChatIn, request: Request, user: User_, db: DB, f: F):
    orch = need(f.orchestrator, "The AI assistant")
    require_consent(db, user.id, "ai_processing")
    request_id = getattr(request.state, "request_id", "")

    def stream():
        # Own session: the request-scoped one closes when the handler returns.
        with session_factory()() as sdb:
            from ..db import scope_to_user
            scope_to_user(sdb, user.id)
            try:
                for event, data in orch.run(sdb, user.id, body, request_id=request_id):
                    yield f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"
                sdb.commit()
            except Exception as e:  # noqa: BLE001 - report as an SSE error, never a fake answer
                sdb.rollback()
                yield f"event: error\ndata: {json.dumps({'type': 'about:blank', 'title': 'The answer failed', 'status': 500, 'detail': type(e).__name__})}\n\n"

    if "text/event-stream" in request.headers.get("accept", ""):
        return StreamingResponse(stream(), media_type="text/event-stream", headers={"cache-control": "no-store", "x-accel-buffering": "no"})
    final = None
    for chunk in stream():
        if chunk.startswith("event: final") or chunk.startswith("event: error"):
            final = json.loads(chunk.split("data: ", 1)[1])
    return final


@router.get("/conversations")
def conversations(user: User_, db: DB) -> list[dict]:
    rows = db.scalars(select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.created_at.desc()).limit(50))
    return [{"id": str(c.id), "title": c.title, "created_at": c.created_at.isoformat()} for c in rows]


@router.get("/conversations/{conv_id}")
def conversation(conv_id: uuid.UUID, user: User_, db: DB) -> dict:
    c = get_owned(db, Conversation, conv_id, user.id)
    msgs = db.scalars(select(Message).where(Message.conversation_id == c.id).order_by(Message.created_at))
    return {"id": str(c.id), "title": c.title, "messages": [{"id": str(m.id), "role": m.role, "text": m.content_redacted, "agents": m.agents,
                                                              "citations": m.citations, "at": m.created_at.isoformat()} for m in msgs]}


@router.post("/sentinel/checks", dependencies=[limit("sentinel")], summary="Check text, a link or a screenshot for scam signs")
async def sentinel_check(request: Request, user: User_, db: DB, f: F) -> dict:
    sentinel = need(f.sentinel, "Sentinel scam checking")
    ctype = request.headers.get("content-type", "")
    if ctype.startswith("multipart/form-data"):
        form = await request.form()
        upload = form.get("image")
        if not isinstance(upload, UploadFile) and not hasattr(upload, "read"):
            from ..core.errors import DomainValidationError
            raise DomainValidationError("Send an 'image' file or JSON text")
        data = await read_capped(upload)  # type: ignore[arg-type]
        return sentinel.check_image(db, user.id, data)
    from pydantic import ValidationError

    from ..core.errors import DomainValidationError
    try:
        body = s.SentinelTextIn.model_validate(await request.json())
    except (ValidationError, ValueError) as e:
        raise DomainValidationError("Send JSON with 'text' (1 to 5000 characters) or an 'image' file.") from e
    return sentinel.check_text(db, user.id, body.text, body.kind)


@router.get("/sentinel/checks")
def sentinel_history(user: User_, db: DB) -> list[dict]:
    from ..models import SentinelCheck
    rows = db.scalars(select(SentinelCheck).where(SentinelCheck.user_id == user.id).order_by(SentinelCheck.created_at.desc()).limit(50))
    return [{"id": str(c.id), "at": c.created_at.isoformat(), "level": c.risk_level, "risk_indicator": c.risk_indicator, "summary": c.summary} for c in rows]


@router.get("/schemes", summary="Scheme catalogue with your likely status")
def schemes(user: User_, db: DB, f: F, category: str | None = None, q: str | None = None) -> list[dict]:
    return need(f.connector, "Scheme discovery").list_schemes(db, user.id, category=category, q=q)


@router.get("/schemes/{scheme_id}/eligibility", summary="Per-criterion eligibility, documents and steps")
def eligibility(scheme_id: str, user: User_, db: DB, f: F) -> dict:
    return need(f.connector, "Scheme eligibility").eligibility(db, user.id, scheme_id)


@router.post("/voice/transcribe", dependencies=[limit("voice")])
async def transcribe(user: User_, db: DB, f: F, audio: UploadFile = File(...), lang: str = Form("en")) -> dict:
    speech = need(f.speech, "Speech recognition")
    require_consent(db, user.id, "voice_processing")
    data = await read_capped(audio, 5 * 1024 * 1024)
    return await run_in_threadpool(speech.transcribe, data, lang)  # blocking HTTP to the inference service: keep it off the event loop


@router.post("/voice/speak", dependencies=[limit("voice")], summary="Text to speech for page summaries (Voice Summary)")
def speak(body: dict, user: User_, f: F) -> dict:
    from ..core.errors import DomainValidationError
    text, lang = str(body.get("text", ""))[:1500], str(body.get("lang", "en"))
    if not text.strip():
        raise DomainValidationError("text is required")
    return need(f.speech, "Speech output").speak(user.id, text, lang)


@router.get("/voice/audio/{audio_id}", summary="Fetch a generated answer's audio (5-minute lifetime, owner only)")
def audio(audio_id: str, user: User_, f: F):
    from fastapi.responses import Response
    return Response(need(f.speech, "Speech output").get_audio(user.id, audio_id), media_type="audio/wav", headers={"cache-control": "no-store"})


@router.post("/voice/query", dependencies=[limit("voice")], summary="Audio question → transcript, answer, spoken audio")
async def voice_query(request: Request, user: User_, db: DB, f: F, audio: UploadFile = File(...), lang: str = Form("en")) -> dict:
    speech = need(f.speech, "Voice")
    orch = need(f.orchestrator, "The AI assistant")
    require_consent(db, user.id, "voice_processing")
    require_consent(db, user.id, "ai_processing")
    data = await read_capped(audio, 5 * 1024 * 1024)
    return await run_in_threadpool(speech.query, db, user.id, orch, data, lang, getattr(request.state, "request_id", ""))
