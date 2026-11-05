"""Inference service with the REAL engines (Tesseract, eSpeak NG) installed on the test host or in the image."""
import io
import os
import shutil

import pytest
from PIL import Image, ImageDraw, ImageFont

os.environ["INFERENCE_TOKEN"] = "test-token"
import app as svc  # noqa: E402

svc.TOKEN = "test-token"
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(svc.app)
H = {"x-inference-token": "test-token"}
needs_engines = pytest.mark.skipif(not (shutil.which("tesseract") and shutil.which("espeak-ng")), reason="engines not installed")


def screenshot(lines: list[str]) -> bytes:
    font = None
    for path in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf"):
        if os.path.exists(path):
            font = ImageFont.truetype(path, 28)
    font = font or ImageFont.load_default(size=28)
    img = Image.new("RGB", (900, 60 + 44 * len(lines)), "white")
    d = ImageDraw.Draw(img)
    for i, line in enumerate(lines):
        d.text((24, 24 + 44 * i), line, fill="black", font=font)
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def test_token_required():
    assert client.post("/ocr", files={"image": ("a.png", b"x", "image/png")}).status_code == 401
    assert client.post("/tts", json={"text": "hi"}, headers={"x-inference-token": "wrong"}).status_code == 401


@needs_engines
def test_health_lists_real_engines():
    h = client.get("/health").json()
    assert h["ocr"]["languages"] == ["eng", "hin", "kan", "mar"] and h["tts"]["engine"] == "espeak-ng" and h["stt"]["engine"] is None


@needs_engines
def test_ocr_reads_a_scam_screenshot():
    png = screenshot(["Dear customer, your KYC expires today.", "Share the OTP to avoid account block.", "Visit http://sbi-kyc.xyz now"])
    r = client.post("/ocr", files={"image": ("s.png", png, "image/png")}, data={"lang": "eng"}, headers=H)
    assert r.status_code == 200, r.text
    text = r.json()["text"].lower()
    for word in ("kyc", "expires", "otp", "account", "block"):
        assert word in text, (word, text)


@needs_engines
def test_ocr_rejects_non_images():
    assert client.post("/ocr", files={"image": ("x.png", b"not an image", "image/png")}, headers=H).status_code == 415


@needs_engines
@pytest.mark.parametrize("lang", ["en", "hi", "mr", "kn"])
def test_tts_speaks_all_four_languages(lang):
    text = {"en": "Your score is sixty three.", "hi": "आपका स्कोर तिरसठ है।", "mr": "तुमचा स्कोअर त्रेसष्ट आहे.", "kn": "ನಿಮ್ಮ ಅಂಕ ಅರವತ್ಮೂರು."}[lang]
    r = client.post("/tts", json={"text": text, "lang": lang}, headers=H)
    assert r.status_code == 200 and r.content.startswith(b"RIFF") and len(r.content) > 8000
    assert r.headers["x-engine"] == "espeak-ng"


def test_tts_validation():
    assert client.post("/tts", json={"text": "", "lang": "en"}, headers=H).status_code == 422
    assert client.post("/tts", json={"text": "hi", "lang": "fr"}, headers=H).status_code == 422


def test_stt_without_model_is_honest_503():
    r = client.post("/stt", files={"audio": ("a.webm", b"1234", "audio/webm")}, headers=H)
    assert r.status_code == 503 and "T0.08" in r.json()["detail"]
