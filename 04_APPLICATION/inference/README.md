# VAAKYA inference service

OCR and speech on the VAAKYA host. Internal network only; every call needs `x-inference-token`.

| Endpoint | Engine | Status |
|---|---|---|
| `POST /ocr` | Tesseract 5 (eng, hin, mar, kan) | **Real**, tested on rendered screenshots |
| `POST /tts` | eSpeak NG (en, hi, mr, kn) | **Real**, tested in all four languages. Robotic voice quality; Indic Parler-TTS is the planned upgrade (T0.07) |
| `POST /stt` | faster-whisper | Returns **503** until `WHISPER_MODEL_DIR` points at downloaded weights (T0.08). Model downloads were blocked in the build environment |
| `GET /health` | - | Lists available engines and languages |

```bash
docker build -t vaakya-inference .        # Ubuntu 24.04 + tesseract-ocr-{eng,hin,mar,kan} + espeak-ng
docker run -e INFERENCE_TOKEN=change-me -p 8100:8100 vaakya-inference
# or on an Ubuntu host: apt install tesseract-ocr tesseract-ocr-{hin,mar,kan} espeak-ng; uvicorn app:app --port 8100
```

Tests: `python -m pytest tests` (10 tests, real engines).
