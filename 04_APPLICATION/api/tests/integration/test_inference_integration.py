"""API ↔ inference service with real Tesseract and eSpeak NG (skipped unless the service runs on localhost:8100)."""
import io
import os
import socket

import pytest
from PIL import Image, ImageDraw, ImageFont


def _up():
    try:
        socket.create_connection(("localhost", 8100), timeout=1).close()
        return True
    except OSError:
        return False


pytestmark = pytest.mark.skipif(not _up(), reason="inference service not running on :8100")


@pytest.fixture
def wired(app):
    from vaakya.ai.inference import InferenceClient
    from vaakya.bootstrap import build_agents
    from vaakya.db import session_factory
    from vaakya.seed import load_schemes
    with session_factory()() as db:
        load_schemes(db)
        db.commit()
    client = InferenceClient("http://localhost:8100", os.environ.get("TEST_INFERENCE_TOKEN", "test-token"))
    app.state.features.speech = client
    build_agents(app.state.features, ocr=client.ocr)
    yield app.state.features
    for k in ("speech", "orchestrator", "sentinel", "connector"):
        setattr(app.state.features, k, None)


def _png(lines):
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 28)
    img = Image.new("RGB", (900, 60 + 44 * len(lines)), "white")
    d = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        d.text((24, 24 + 44 * i), line, fill="black", font=font)
    b = io.BytesIO()
    img.save(b, "PNG")
    return b.getvalue()


def test_scam_screenshot_end_to_end_with_real_ocr(wired, onboarded):
    png = _png(["Congratulations! You have won Rs 25,00,000", "in KBC lucky draw. Pay processing fee", "of Rs 4,999 to claim your prize today."])
    r = onboarded.post("/v1/sentinel/checks", files={"image": ("s.png", png, "image/png")})
    assert r.status_code == 200, r.text
    v = r.json()
    assert v["risk_level"] in ("high", "critical") and any(x["signal"] == "prize_fee" for x in v["reasons"])
    assert "won" in v["ocr_text_redacted"].lower()


def test_blank_screenshot_says_no_text(wired, onboarded):
    b = io.BytesIO()
    Image.new("RGB", (400, 200), "white").save(b, "PNG")
    r = onboarded.post("/v1/sentinel/checks", files={"image": ("w.png", b.getvalue(), "image/png")})
    assert r.status_code == 422 and "No readable text" in r.json()["detail"]


def test_voice_summary_audio_is_owner_only_and_expires(wired, onboarded, bob):
    r = onboarded.post("/v1/voice/speak", json={"text": "Your score is 42, Building.", "lang": "en"})
    assert r.status_code == 200
    url = r.json()["url"]
    a = onboarded.get(url)
    assert a.status_code == 200 and a.content.startswith(b"RIFF") and a.headers["content-type"] == "audio/wav"
    assert bob.get(url).status_code == 404
    from vaakya.ai import inference
    for k in list(wired.speech._audio):
        exp, uid, wav = wired.speech._audio[k]
        wired.speech._audio[k] = (0, uid, wav)
    assert onboarded.get(url).status_code == 404
    _ = inference


def test_voice_query_reports_missing_stt_model(wired, onboarded):
    onboarded.put("/v1/me/consents", json={"grants": [{"purpose": "voice_processing", "version": "2026-11", "granted": True}]})
    r = onboarded.post("/v1/voice/query", files={"audio": ("q.webm", b"\x1aE\xdf\xa3fake", "audio/webm")}, data={"lang": "kn"})
    assert r.status_code == 503 and "T0.08" in r.json()["detail"]
