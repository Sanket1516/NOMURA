"""VAAKYA inference service: OCR and speech on the VAAKYA host (FR-DOC-03, FR-SEN-03, FR-VOI-01/02/09, BACKEND_ARCHITECTURE §11).

Engines (all open source, all local):
  OCR  Tesseract 5 with eng, hin, mar, kan language data (Apache-2.0). PaddleOCR is the planned primary engine (T0.13).
  TTS  eSpeak NG (GPLv3, run as a separate process).  Indic Parler-TTS is the planned higher-quality engine (T0.07).
  STT  faster-whisper, only when WHISPER_MODEL_DIR points at downloaded weights (T0.08). Otherwise /stt returns 503.
Internal network only; every request needs the shared token. Inputs are processed in memory or tmpfs and not kept.
"""
from __future__ import annotations

import importlib.util
import io
import os
import shutil
import subprocess
import tempfile
import threading

from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel, Field

TOKEN = os.environ.get("INFERENCE_TOKEN", "")
WHISPER_DIR = os.environ.get("WHISPER_MODEL_DIR", "")
MAX_IMAGE = 10 * 1024 * 1024
MAX_AUDIO = 5 * 1024 * 1024
OCR_LANGS = {"eng", "hin", "mar", "kan"}
VOICES = {"en": "en-gb", "hi": "hi", "mr": "mr", "kn": "kn"}

app = FastAPI(title="VAAKYA inference", version="0.1.0", docs_url=None, redoc_url=None)
_whisper = None


def _stt_ready() -> str | None:
    """None when speech recognition can run, otherwise the reason it cannot (so /health and /stt never overclaim)."""
    if not (WHISPER_DIR and os.path.isdir(WHISPER_DIR)):
        return "Speech recognition model is not installed on this server (faster-whisper weights, task T0.08)."
    if not os.path.isfile(os.path.join(WHISPER_DIR, "model.bin")):
        return "Speech recognition weights are missing: no model.bin in the model folder (task T0.08)."
    if importlib.util.find_spec("faster_whisper") is None:
        return "The faster-whisper package is not installed in this inference image."
    return None


def _load_whisper():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel  # imported lazily; only present in the full image
        try:
            _whisper = WhisperModel(WHISPER_DIR, device=os.environ.get("STT_DEVICE", "cpu"),
                                    compute_type=os.environ.get("STT_COMPUTE_TYPE", "int8"))
        except Exception as e:  # CUDA out of memory, missing cuDNN, corrupt weights: say so instead of a bare 500
            raise HTTPException(503, f"Speech recognition model could not be loaded: {type(e).__name__}") from e
    return _whisper


@app.on_event("startup")
def _warm_up() -> None:
    """Load Whisper in the background at start so the first voice question does not wait ~50 s for the model."""
    def go() -> None:
        try:
            _load_whisper()
        except Exception:
            pass  # /stt reports the load failure itself
    if _stt_ready() is None:
        threading.Thread(target=go, daemon=True).start()


def _auth(token: str | None) -> None:
    if not TOKEN or token != TOKEN:
        raise HTTPException(401, "invalid inference token")


@app.get("/health")
def health() -> dict:
    langs = subprocess.run(["tesseract", "--list-langs"], capture_output=True, text=True, timeout=10).stdout.split()[1:] if shutil.which("tesseract") else []
    return {"status": "ok", "ocr": {"engine": "tesseract", "languages": sorted(set(langs) & OCR_LANGS)},
            "tts": {"engine": "espeak-ng" if shutil.which("espeak-ng") else None, "languages": sorted(VOICES)},
            "stt": {"engine": "faster-whisper" if _stt_ready() is None else None, "reason": _stt_ready(), "loaded": _whisper is not None}}


@app.post("/ocr")
async def ocr(image: UploadFile = File(...), lang: str = Form("eng+hin+mar+kan"), x_inference_token: str | None = Header(None)) -> dict:
    _auth(x_inference_token)
    langs = [x for x in lang.split("+") if x in OCR_LANGS] or ["eng"]
    data = await image.read(MAX_IMAGE + 1)
    if len(data) > MAX_IMAGE:
        raise HTTPException(413, "image too large")
    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError) as e:
        raise HTTPException(415, "not a readable image") from e
    # Upscale small screenshots: Tesseract reads text best at ~30 px x-height.
    if img.width < 1200:
        f = 1200 / img.width
        img = img.resize((int(img.width * f), int(img.height * f)))
    with tempfile.NamedTemporaryFile(suffix=".png", dir="/tmp") as tmp:
        img.convert("L").save(tmp.name, "PNG")
        r = subprocess.run(["tesseract", tmp.name, "stdout", "-l", "+".join(langs), "--psm", "6"], capture_output=True, text=True, timeout=60)
    if r.returncode != 0:
        raise HTTPException(500, "ocr failed")
    text = "\n".join(line.strip() for line in r.stdout.splitlines() if line.strip())
    return {"text": text, "engine": "tesseract", "languages": langs}


class TtsIn(BaseModel):
    text: str = Field(min_length=1, max_length=1500)
    lang: str = "en"
    rate: int = Field(160, ge=80, le=260)


@app.post("/tts")
def tts(body: TtsIn, x_inference_token: str | None = Header(None)) -> Response:
    _auth(x_inference_token)
    voice = VOICES.get(body.lang)
    if voice is None:
        raise HTTPException(422, "unsupported language")
    r = subprocess.run(["espeak-ng", "-v", voice, "-s", str(body.rate), "--stdout"], input=body.text.encode(), capture_output=True, timeout=60)
    if r.returncode != 0 or not r.stdout.startswith(b"RIFF"):
        raise HTTPException(500, "speech synthesis failed")
    return Response(r.stdout, media_type="audio/wav", headers={"x-engine": "espeak-ng", "x-voice": voice})


@app.post("/stt")
async def stt(audio: UploadFile = File(...), lang: str = Form("en"), x_inference_token: str | None = Header(None)) -> dict:
    _auth(x_inference_token)
    reason = _stt_ready()
    if reason:
        raise HTTPException(503, reason)
    data = await audio.read(MAX_AUDIO + 1)
    if len(data) > MAX_AUDIO:
        raise HTTPException(413, "audio too large")
    model = _load_whisper()
    with tempfile.NamedTemporaryFile(suffix=".audio", dir="/tmp") as tmp:
        tmp.write(data)
        tmp.flush()
        segments, info = model.transcribe(tmp.name, language=lang if lang in VOICES else None, vad_filter=True)
        text = " ".join(s.text.strip() for s in segments)
    return {"text": text, "lang": info.language, "confidence": round(float(info.language_probability), 2)}
