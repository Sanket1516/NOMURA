# VAAKYA Feature Audit (2026-11-07)

Written for: the project owner and the engineer who picks this up next.
Evidence is limited to what was run in this session on the Windows host (RTX 3050 6 GB, Docker Desktop, Ollama on the host). Anything not listed under "Evidence" was **not tested here**.

## 1. Bugs found and fixed (one commit each)

| # | Symptom | Root cause | Fix | Regression test |
|---|---|---|---|---|
| 1 | Voice never worked; `/health` said speech recognition was available | The running inference image had no `faster_whisper`, weights folder was empty; `/health` only checked the folder existed and `/stt` crashed with a bare 500 | `/health` and `/stt` check `model.bin` and the package, answer 503 with the reason (2a4d775) | `inference/tests/test_inference.py::test_stt_is_unavailable_not_500_...` |
| 2 | Speech-to-text crashed after weights were installed | `faster-whisper 1.2.1` passes `metadata_errors` to `av.open`; PyAV 19 rejects it | Pinned `av==15.1.0` (2a4d775) | `e2e/voice.spec.ts` (real decode of browser webm) |
| 3 | First voice question took ~51 s (over the 45 s budget) | Whisper loaded lazily on first request | Background warm-up at service start; resident ~20 s after start (2a4d775) | `voice.spec.ts` (first call after restart ~1 to 9 s) |
| 4 | GPU image could not be built | Jammy CUDA base has Python 3.10 (cannot install `python-multipart==0.0.33`), and the apt-sources check overwrote jammy with noble repos | Ubuntu 24.04 CUDA base, correct check (36e6d2c) | image builds; `/health` OK |
| 5 | One voice request froze the whole API | `voice/query` and `voice/transcribe` ran blocking HTTP (STT, LLM, TTS) inside `async def` | `run_in_threadpool` (83d16d7) | API suite 169 passed |
| 6 | Hindi/Marathi/Kannada voice read an English answer with an Indic voice | Answers are English (`translated: false`) but TTS used the selected language | Speak English unless `translated` is true (83d16d7) | `voice.spec.ts` |
| 7 | Live test 6 asserted "model not installed" | Became false once STT worked | Test now asserts the honest "could not hear / You said" outcome | `live.spec.ts` test 6 |

## 2. Evidence (commands run today)

| Check | Result |
|---|---|
| Cold start after a full PC reboot, `compose up` | All 10 services healthy, no manual steps |
| API: `ruff check`, `pytest` (normal and `VAAKYA_TEST_RLS=1`, real Postgres, Neo4j, Qdrant, SeaweedFS) | clean; 169 passed, 5 skipped, both modes |
| Web: `tsc --noEmit`, vitest | clean; 28 passed |
| Web preview E2E (every screen in en/hi/mr/kn, axe) | 31 passed |
| Live E2E through real Keycloak (`live.spec.ts`) | 8 passed: sign-in, Educator with citations, Sentinel text + OCR screenshot, schemes eligibility, planning / Life Graph / quiz, voice page, registration + onboarding, salary-slip OCR |
| Live voice round trip (`voice.spec.ts`), Chromium MediaRecorder webm/opus, 4 languages | 4 passed: HTTP 200, `audio/wav` starting `RIFF`, no console or network errors |
| Inference unit tests | 4 passed, 7 skipped on the host (need Tesseract/eSpeak; they run in the image) |

## 3. Measured numbers

- **GPU memory:** Whisper medium (int8_float16) resident ~1.0 GB; with `qwen2:7b` loaded, 5,267 of 6,144 MiB used. No out-of-memory, STT stayed 0.5 s warm. Margin about 0.9 GB: nothing else may use the GPU.
- **STT warm:** 0.5 to 2 s for a short English clip. Cold load ~20 s at service start.
- **Voice round trip (browser stop to answer + audio URL):** 0.9 to 1.3 s English (rule-based agent, no LLM); 8.8 to 17.8 s for Hindi, Marathi, Kannada because Whisper spends longer on non-English.
- **Educator (Ask VAAKYA) with `qwen2:7b`:** 6.8 s warm, ~59 s the first request after the model was evicted (cold load). The 45 s budget is **not met on a cold model**.

## 4. Feature status

Legend: Working = passed a test above. Not verified = no test run today.

| Feature | Status | Notes |
|---|---|---|
| Landing, sign-in, registration, onboarding | Working | live tests 1, 7 |
| Dashboard / Home | Working | live test 1; axe via preview suite |
| Ask VAAKYA (Educator, citations) | Working, slow when cold | live test 2; cold 59 s. `qwen2:7b` often omits `[n]` markers (sources panel still lists them) |
| Scam Detection (text + screenshot OCR) | Working | live test 3. Prompt-injection resistance: not re-tested today |
| Government Schemes + eligibility | Working | live test 4. Scheme data is **not human-verified** (T0.12) |
| Planning / Goal Studio, Life Graph, Learning quiz | Working | live test 5 |
| Documents / OCR (Tesseract, eng+hin+mar+kan) | Working | live test 8; PaddleOCR is not implemented |
| Voice: mic, upload, STT, agent, TTS, playback | Working | `voice.spec.ts`, English transcript exact |
| Voice accuracy in Hindi / Marathi / Kannada | **Unproven, likely poor** | Tested only with robotic eSpeak clips: Hindi partly right, Marathi and Kannada gibberish. Needs real human recordings and probably a larger or Indic-tuned model |
| Spoken Indic answers | Not available | Translation (IndicTrans2) not installed; answers are English, `translated: false`; TTS speaks English |
| TTS quality | eSpeak NG only | Indic Parler-TTS not installed (T0.07); eSpeak is robotic |
| Confidence Score formula | Working | `test_overall_matches_the_spec_example` (82,90,75,68,76 gives 78) added today. The app computes **six** dimensions (D-035, still awaiting owner approval), so a real user's score is a mean of six, not five |
| Data export and erase, cross-user isolation | Working | `test_export_and_erase`, RLS suite, graph isolation test |
| Language switching, axe | Working | preview suite, 3 languages are draft translations, no native review |
| Notifications, Monthly Report, Opportunities, Score history screens | Working in preview and live smoke | not individually exercised end to end today |
| PWA install / offline | Not verified today | |
| Monitoring (Prometheus/Grafana) | Not verified today | |
| Keycloak brute-force lockout, token refresh edge cases | Not verified today | |

## 5. Gaps against the requested scope

- **Real recordings:** none exist. Fixtures in `05_TESTING/fixtures/voice/` are synthetic eSpeak clips and say so.
- **Not in this codebase** (the request names them; they were not faked): Indic Parler-TTS, IndicTrans2, PaddleOCR, two separate Ollama tiers (both tiers use `qwen2:7b`), a ffmpeg conversion step (PyAV inside faster-whisper decodes webm and mp4 directly; Safari mp4/aac not tested).
- **Not done:** mobile-viewport pass of every screen with network/console capture, keyboard-only persona journeys, load test, image scan, upload size limit tests in Caddy/Next.js, lakh/crore spoken-amount check, PWA offline test.
- **Human actions still needed:** native-speaker recordings and language review, scheme/lesson/legal verification, decision on a larger Whisper or Indic model, owner decision to keep or swap the LLM.

## 6. Recommendations

1. Keep `qwen2:7b` warm (`keep_alive`) so the Educator does not hit the 59 s cold path, or accept a visible "warming up" state in the UI.
2. Record 5 to 10 real clips per language and measure word error rate before promising voice in Hindi, Marathi or Kannada.
3. Install IndicTrans2 and an Indic TTS only when GPU memory allows; today the 6 GB card has about 0.9 GB spare.
