"""Client for the inference service (OCR, speech; FR-VOI-01..03, -09). Audio answers are cached in memory for 5 minutes,
then dropped: voice is never stored (DATABASE_ARCHITECTURE §2). Single-replica cache; a shared store is a scale step."""
from __future__ import annotations

import secrets
import threading
import time
import uuid

import httpx

from ..core.errors import NotFoundError, ServiceUnavailable

AUDIO_TTL_S = 300


class InferenceClient:
    def __init__(self, base_url: str, token: str | None, client: httpx.Client | None = None):
        self.c = client or httpx.Client(base_url=base_url, timeout=httpx.Timeout(120, connect=3))
        self.c.headers["x-inference-token"] = token or ""
        self._audio: dict[str, tuple[float, uuid.UUID, bytes]] = {}
        self._lock = threading.Lock()

    def _post(self, path: str, **kw) -> httpx.Response:
        try:
            r = self.c.post(path, **kw)
        except httpx.HTTPError as e:
            raise ServiceUnavailable("The speech and OCR service is not reachable.") from e
        if r.status_code == 503:
            raise ServiceUnavailable(r.json().get("detail", "Engine not available on this server."))
        if r.status_code in (413, 415, 422):
            from ..core.errors import DomainValidationError
            raise DomainValidationError(r.json().get("detail", "The file could not be processed."))
        r.raise_for_status()
        return r

    def ocr(self, data: bytes, mime: str, lang: str = "eng+hin+mar+kan") -> str:
        return self._post("/ocr", files={"image": ("img", data, mime)}, data={"lang": lang}).json()["text"]

    def transcribe(self, audio: bytes, lang: str) -> dict:
        return self._post("/stt", files={"audio": ("audio", audio, "application/octet-stream")}, data={"lang": lang}).json()

    def speak_bytes(self, text: str, lang: str) -> bytes:
        return self._post("/tts", json={"text": text[:1500], "lang": lang if lang in ("en", "hi", "mr", "kn") else "en"}).content

    def store_audio(self, user_id: uuid.UUID, wav: bytes) -> str:
        now = time.time()
        aid = secrets.token_urlsafe(16)
        with self._lock:
            for k in [k for k, v in self._audio.items() if v[0] < now]:
                del self._audio[k]
            self._audio[aid] = (now + AUDIO_TTL_S, user_id, wav)
        return aid

    def get_audio(self, user_id: uuid.UUID, aid: str) -> bytes:
        with self._lock:
            item = self._audio.get(aid)
        if not item or item[0] < time.time() or item[1] != user_id:
            raise NotFoundError("Audio expired or not found")
        return item[2]

    def speak(self, user_id: uuid.UUID, text: str, lang: str) -> dict:
        aid = self.store_audio(user_id, self.speak_bytes(text, lang))
        return {"url": f"/v1/voice/audio/{aid}", "mime": "audio/wav", "expires_in": AUDIO_TTL_S}

    def query(self, db, user_id: uuid.UUID, orch, audio: bytes, lang: str, request_id: str) -> dict:
        t = self.transcribe(audio, lang)
        if not t.get("text", "").strip():
            from ..core.errors import DomainValidationError
            raise DomainValidationError("I could not hear any words. Please try again closer to the microphone.")
        final = orch.answer(db, user_id, t["text"], lang=lang, channel="voice", request_id=request_id)
        from ..agents.safety import NOTICE
        spoken = final["text"].split("\n\nAssumptions:")[0]
        return {"transcript": t, "answer": {"text": final["text"], "ai": {"agents": final["agents"], "notice": NOTICE, "citations": final["citations"],
                                                                          "llm_used": final["llm_used"], "translated": final["translated"]}},
                "audio": self.speak(user_id, spoken, lang)}
