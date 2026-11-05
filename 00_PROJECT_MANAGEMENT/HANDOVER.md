# Handover

**Last updated:** 2026-11-05 (session stopped by the owner; read `08_HANDOVER/WORK_SUMMARY.md` first)
**For:** any person or AI model continuing VAAKYA.
**Start with `08_HANDOVER/HANDOFF_STATUS.md`** (done / in flight / remaining / paste-ready prompt).
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
| 1 Frontend | DONE (preview mode on sample data and live mode on the API) | `05_TESTING/frontend/STEP1_FRONTEND_RESULTS.md` |
| 2 Backend | DONE | `05_TESTING/backend/STEP2_BACKEND_RESULTS.md` |
| 3 Data layer | DONE | `05_TESTING/data/STEP3_DATA_RESULTS.md` |
| 4 AI infrastructure | DONE (no model has run; downloads blocked) | `05_TESTING/ai/STEP4_AI_INFRA_RESULTS.md` |
| 5 Four agents | DONE (deterministic paths; `llm_used: false`) | `05_TESTING/agents/STEP5_AGENTS_RESULTS.md` |
| 6 Integration | DONE: full stack, live wiring, UI polish, 7 live journeys | `05_TESTING/integration/STEP6_INTEGRATION_RESULTS.md` |

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

Last full results: API 138 passed + 4 inference-integration passed; inference service 10 passed; web 26 unit + 29 preview E2E passed (cloud run); the live E2E and DB-backed API tests last ran before the nonce CSP and the later code-only items, see `08_HANDOVER/OWNER_LOCAL_TASKS.md`.

## Run the whole stack

```bash
cd 04_APPLICATION/infra && ./init-secrets.sh            # prints the demo password
docker compose up -d --build                             # or build images by hand (see results doc) if Docker Hub rate-limits
docker compose exec api python -m vaakya.seed all        # schemes + four demo users
# http://localhost:3000 — sign in as demo-priya@vaakya.invalid
cd ../web && LIVE_E2E=1 E2E_BASE_URL=http://localhost:3000 DEMO_PASSWORD=... npx playwright test e2e/live.spec.ts
```

If Docker Hub refuses `ubuntu:24.04`, build a base with `debootstrap --variant=minbase noble <dir> http://archive.ubuntu.com/ubuntu`, `docker import`, and pass `--build-arg BASE=<that image>` to the inference build.

## Next steps

**First:** the open items in `KNOWN_ISSUES.md`. Item 21 (page translations) is done as drafts; adding a screen means adding keys to `web/lib/i18n/pages.ts` for all four languages (the unit tests check scripts and mixing). Audit reports: `05_TESTING/audit/`. Row Level Security is verified on the full stack. The API connects as `vaakya_api` (restricted) and uses `VAAKYA_ADMIN_DATABASE_URL` for migrations, seed and worker.


Work through `REMAINING_WORK.md` items 16-21 in order: proactive nudges, monthly review, document upload and extraction review, production profile (Caddy TLS, monitoring, backups), PostgreSQL RLS, page translations. Keep the test suites green and update trackers with `tools_update_tracker.py`.

## Windows notes

- Container files need LF endings; `.gitattributes` enforces it. If Postgres says "required file not found" for `10-init.sh`, strip CRs and `down -v`.
- Always read data files as UTF-8 (`read_text(encoding="utf-8")`).
- In Git Bash, prefix `docker run` with `MSYS_NO_PATHCONV=1` when passing container paths like `/data`.
- Export `VAAKYA_DOMAIN=localhost` for every `docker compose` call with the prod overlay, including `ps`.
- Live E2E over the self-signed certificate: set `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- Inference tests: run inside a throwaway container from the `vaakya-inference` image with the folder mounted (needs Tesseract and eSpeak).

## Known facts about this environment (cloud container)

- Hugging Face and the Ollama model registry are blocked, so no LLM, Whisper, IndicTrans2 or e5 model can be downloaded. Everything model-based is behind adapters and labelled.
- Docker Hub works but rate-limits (429 seen). `ghcr.io`, `quay.io` and Debian's mirror are blocked; Ubuntu's mirror works over plain HTTP from `--network host` builds and from the host.
- Start Docker with `dockerd &` if `docker ps` fails.
- Docker builds behind the proxy need `--network host --build-arg HTTPS_PROXY=$HTTPS_PROXY --secret id=ca,src=/root/.ccr/ca-bundle.crt`.

## Owner decisions still open

D-029 (Phase 0 start), D-031 (copyleft components), D-035 (sixth score dimension), the model choice (T0.03), scheme fact verification (T0.12), lesson review (FR-EDU-07), legal scoping (T0.14), hardware for a public service.
