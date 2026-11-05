# Handover

**Last updated:** 2026-11-05 (session stopped at the owner's request in the middle of Step 6)
**For:** any person or AI model continuing VAAKYA.
**Read next:** `REMAINING_WORK.md` (live checklist), `CURRENT_STATUS.md`, `08_HANDOVER/NEXT_AI_PROMPT.md`.

## What VAAKYA is

VAAKYA - AI Financial Guardian: a multi-agent financial companion for four personas (Priya, Rajesh, Kisan, Divya) with four agents (Educator, Strategy Builder, Sentinel, Connector), a Financial Life Graph and a Financial Confidence Score. Owner: Sanket Mali. The Nomura KakushIN 2026 hackathon is over; this is an independent product.

## Hard rules

1. **Free and open source only (D-026).** No Firebase, AWS, Gemini or paid APIs. The owner's prompts sometimes name that hackathon stack; the owner confirmed twice to keep the open-source plan ("just go with the plan you have created"). Record the substitution and move on.
2. Money figures, eligibility and the score are code. LLMs only explain (D-013).
3. Never fake AI output. If a subsystem is missing, the API returns 503 with the reason and the UI says "not connected".
4. Say "processed on VAAKYA's own server", never "on-device".
5. Never mark a feature VERIFIED without the Definition of Done. Update `FEATURE_TRACKER.md` with `00_PROJECT_MANAGEMENT/tools_update_tracker.py` (it refuses VERIFIED and recounts the summary).
6. Keep `REMAINING_WORK.md` up to date continuously (owner's request).
7. Commit to `main` as `sanket1516 <sanketmali0909@gmail.com>`, with the Co-Authored-By line, when the owner asks for commits (he did for this build).
8. Do not create a `Nomura/` folder (collides with `NOMURA/` on Windows, D-001).

## Build sequence (D-032) and status

| Step | Status | Evidence |
|---|---|---|
| 1 Frontend | DONE (runs on sample data in preview mode; not yet wired to the live API) | `05_TESTING/frontend/STEP1_FRONTEND_RESULTS.md` |
| 2 Backend | DONE | `05_TESTING/backend/STEP2_BACKEND_RESULTS.md` |
| 3 Data layer | DONE | `05_TESTING/data/STEP3_DATA_RESULTS.md` |
| 4 AI infrastructure | DONE (no model has run; downloads blocked) | `05_TESTING/ai/STEP4_AI_INFRA_RESULTS.md` |
| 5 Four agents | DONE (deterministic paths; `llm_used: false`) | `05_TESTING/agents/STEP5_AGENTS_RESULTS.md` |
| 6 Integration | IN PROGRESS: inference service done; Keycloak realm and Compose written; live wiring, UI polish, E2E not done | this file |

## Where the code is

| Path | What |
|---|---|
| `04_APPLICATION/web` | Next.js 16 PWA. `lib/server/*` OIDC BFF + API proxy; `lib/demo.ts` sample data; `app/(app)/*` 12 signed-in screens; `e2e/` Playwright |
| `04_APPLICATION/api` | FastAPI. `vaakya/domain` (calculators, score, sentinel_signals, eligibility), `services/*`, `agents/*`, `ai/*` (llm, redaction, knowledge, inference client), `stores/*` (graph, vault), `seed.py`, `worker.py`, `bootstrap.py` |
| `04_APPLICATION/inference` | OCR (Tesseract) and TTS (eSpeak NG) service; STT needs a mounted faster-whisper model |
| `04_APPLICATION/infra` | `compose.yaml`, `init-secrets.sh`, `keycloak/vaakya-realm.json`, `postgres/init.*` |
| `02_ARCHITECTURE` | Architecture set v1.0 + generated coverage review |
| `06_DOCUMENTATION` | `LICENCE_REGISTER.md`, `DATABASE_SCHEMA.md` (generated), `CONFIDENCE_SCORE.md` |

## How to run the tests (as done in this session)

```bash
# Services (ports used by the tests)
docker run -d --name vaakya-pg-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=vaakya -p 55432:5432 postgres:18
docker run -d --name vaakya-neo4j-test -e NEO4J_AUTH=neo4j/test-pass-123 -p 57687:7687 neo4j:5.26-community
docker run -d --name vaakya-sw-test -p 58333:8333 chrislusf/seaweedfs:4.50 server -s3 -dir=/data
docker run -d --name vaakya-qdrant-test -p 56333:6333 qdrant/qdrant:v1.20.0
# Inference on an Ubuntu host: apt install tesseract-ocr tesseract-ocr-{hin,mar,kan} espeak-ng
cd 04_APPLICATION/inference && INFERENCE_TOKEN=test-token uvicorn app:app --port 8100
cd 04_APPLICATION/api && uv run pytest          # 142 tests; service-dependent tests skip if a service is down
cd 04_APPLICATION/web && npm test && PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers npx playwright test   # 19 unit + 12 E2E
```

Last full results: API 138 passed + 4 inference-integration passed; inference service 10 passed; web 19 unit + 12 E2E passed.

## Next steps, in order (Step 6 remainder)

1. **Run the whole stack:** `cd 04_APPLICATION/infra && ./init-secrets.sh && docker compose up --build`. Fix what breaks. Then `docker compose exec api python -m vaakya.seed all` (catalogue + four demo users whose ids match the realm). The demo password is printed by `init-secrets.sh`. Not yet done: web and inference images were never built (Docker Hub returned 429 for `ubuntu:24.04` in this environment).
2. **Wire the web app to the live API** (live mode is coded but untested):
   - `app/(app)/layout.tsx`: when `/v1/dashboard` returns 409 with `next: /onboarding`, redirect to `/onboarding` instead of showing an error.
   - `app/(app)/schemes/page.tsx`: in live mode load `/v1/schemes` (the dashboard only has `{id, status}`).
   - Onboarding sends `persona` in the profile body; the API accepts it. Verify the full consent → profile → answers → complete flow.
   - Score page `VoiceSummary`: in live mode call `POST /v1/voice/speak` (real eSpeak audio) and play `/api/proxy/v1/voice/audio/{id}`; keep the on-device fallback.
   - Add `/learn/[moduleId]` (lesson sections + quiz → `POST /v1/learning/modules/{id}/quiz-attempts`) and `/life-graph` (`GET /v1/twin`: accessible outline first, then an SVG radial graph). Add both to navigation.
   - Planning page: show `GET /v1/budget` and the plan from `GET /v1/goals/{id}/plan` (formula, assumptions, limitations).
3. **UI polish (owner asked for "as beautiful and dynamic as possible"):** animated count-up numbers and score ring from 0 on mount, staggered card entry, card hover lift, animated progress bars, a richer dashboard header; all disabled under reduced motion. Keep axe at 0 serious/critical and the 360 px no-overflow test passing.
4. **End-to-end through real sign-in:** Playwright logs in at Keycloak as `demo-priya@vaakya.invalid`, checks live dashboard, asks the assistant (Educator answer with citations), runs a scam check (paste text and screenshot with real OCR), opens a scheme's eligibility, and registers a new user through the Keycloak registration page then onboards. Capture new screenshots into `07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/live/`.
5. **Final documentation:** update FEATURE_TRACKER, TASK_TRACKER, CHANGELOG, CURRENT_STATUS, this file, `REMAINING_WORK.md`, regenerate `08_HANDOVER/NEXT_AI_PROMPT.md`, re-run `python3 02_ARCHITECTURE/tools/coverage.py` and `PYTHONPATH=. uv run python tools/schema_doc.py` (in `api/`).

Also open (smaller): proactive nudges job (goal drift, newly eligible schemes), PostgreSQL Row Level Security, independent Sentinel evaluation set (T6.05), monthly report screen, risk-profile card, page-content translations (only nav labels exist, as drafts).

## Known facts about this environment (cloud container)

- Hugging Face and the Ollama model registry are blocked, so no LLM, Whisper, IndicTrans2 or e5 model can be downloaded. Everything model-based is behind adapters and labelled.
- Docker Hub works but rate-limits (429 seen). `ghcr.io`, `quay.io` and Debian's mirror are blocked; Ubuntu's mirror works over plain HTTP from `--network host` builds and from the host.
- Start Docker with `dockerd &` if `docker ps` fails.
- Docker builds behind the proxy need `--network host --build-arg HTTPS_PROXY=$HTTPS_PROXY --secret id=ca,src=/root/.ccr/ca-bundle.crt`.

## Owner decisions still open

D-029 (Phase 0 start), D-031 (copyleft components), D-035 (sixth score dimension), the model choice (T0.03), scheme fact verification (T0.12), lesson review (FR-EDU-07), legal scoping (T0.14), hardware for a public service.
