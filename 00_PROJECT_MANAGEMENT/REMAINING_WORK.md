# Remaining Work

**Kept up to date continuously** (owner's request, 2026-11-05). Each row changes status as work lands; done rows stay, with their evidence.
Statuses: TODO · IN PROGRESS · DONE · BLOCKED (reason given).

## Build sequence (D-032)

| # | Item | Step | Status | Evidence / note |
|---|---|---|---|---|
| 0a | Frontend: design system, 17 screens, preview mode, accessibility, PWA, screenshots | 1 | DONE | `05_TESTING/frontend/STEP1_FRONTEND_RESULTS.md` |
| 0b | Backend: FastAPI, auth, PostgreSQL, calculators, score, learning, uploads, 46 tests | 2 | DONE | `05_TESTING/backend/STEP2_BACKEND_RESULTS.md` |
| 1 | Neo4j Financial Life Graph: gateway, projection from PostgreSQL, real queries, tests | 3 | DONE | `05_TESTING/data/STEP3_DATA_RESULTS.md` |
| 2 | Encrypted document vault on SeaweedFS (AES-256-GCM per file) | 3 | DONE | Tested against real SeaweedFS |
| 3 | Scheme catalogue with eligibility rules (unverified drafts until T0.12) | 3 | DONE | 10 schemes; engine that evaluates them is item 10 |
| 4 | Retention and purge rules; seeded demo accounts for the four personas; schema docs | 3 | DONE | `06_DOCUMENTATION/DATABASE_SCHEMA.md` |
| 5 | LLM adapter for Ollama: timeouts, retries, structured output, fallback | 4 | DONE | Contract-tested; no model has run here (T0.03) |
| 6 | Private Tier redaction of Indian identifiers, plus a data-flow audit | 4 | DONE | 10 identifier types; NER names need T0.04 |
| 7 | Knowledge base and retrieval in Qdrant, with citations and abstention | 4 | DONE | Lexical now; e5 dense pending T0.10 |
| 8 | LangGraph orchestrator: routing, shared state, handoff, safety review | 4 | DONE | `05_TESTING/ai/STEP4_AI_INFRA_RESULTS.md` |
| 9 | The four agents: Educator, Strategy Builder, Sentinel, Connector | 5 | DONE | `05_TESTING/agents/STEP5_AGENTS_RESULTS.md`; rule-based until a model runs |
| 10 | Scam signal engine and link heuristics; scheme eligibility engine | 5 | DONE | 23 + 14 tests |
| 11 | Inference service: Tesseract OCR, eSpeak NG speech | 6 | DONE | Real OCR and TTS tested (14 tests); Docker image build waits on a Docker Hub rate limit; STT needs a model (T0.08) |
| 12 | Keycloak realm, Docker Compose for the whole stack | 6 | DONE | All 9 services ran together; `05_TESTING/integration/STEP6_INTEGRATION_RESULTS.md` |
| 13 | Wire every screen to the live API; end-to-end journeys through real sign-in | 6 | DONE | 7/7 live journeys incl. registration; stable over 3 runs |
| 14 | UI polish: animated numbers and charts, staggered motion, richer visuals | 6 | DONE | Hero, count-ups, drawing charts, stagger, hover lift, Life Graph; reduced-motion safe; axe clean |
| 15 | Final trackers, handover, next-AI prompt | 6 | DONE | Updated 2026-11-05 after Step 6 |

## Next build items (after Step 6)

| # | Item | Status |
|---|---|---|
| 16 | Proactive nudges job: goal drift, newly eligible schemes → notifications | DONE (4 tests; daily in worker) |
| 17 | Monthly review generation and report screen (FR-COA-01/02) | DONE (API + screen; live E2E) |
| 18 | Document upload screen + extraction review (FR-DOC-01..05) using real OCR | DONE (live journey 8; double-count bug found and fixed) |
| 19 | Production profile: Caddy TLS, Prometheus/Loki/Grafana, encrypted backups | DONE except running Prometheus/Grafana (rate limit); 8 live journeys pass over HTTPS; `06_DOCUMENTATION/OPERATIONS.md` |
| 20 | PostgreSQL Row Level Security as second line of defence | IN PROGRESS: migration 0003 + restricted `vaakya_api` role written; 155 API tests pass with RLS enforced; **next: re-run the Compose stack from scratch (`VAAKYA_DOMAIN=localhost docker compose -f compose.yaml -f compose.prod.yaml down -v && ... up`), seed, and the 8 live journeys over https://localhost** |
| 21 | Page-content translations (hi, mr, kn) beyond navigation | TODO |

## Found along the way (to do)

| Item | Note |
|---|---|
| Disk space in the build container | Docker build cache filled the disk to 94% and broke SeaweedFS; run `docker builder prune` periodically |
| Independent labelled scam set (T6.05) | Sentinel rules were tuned on the developer set |

## Outside what software can close in this environment

| Item | Why | Who |
|---|---|---|
| Choose Private and Reasoning Tier models (T0.03) | Needs the RTX 3050; model downloads are blocked in the cloud container | Owner's machine |
| Speech-to-text model (faster-whisper) and Indian-language TTS quality (T0.07, T0.08) | Model weights cannot be downloaded here | Owner's machine |
| IndicTrans2 translation and e5 embeddings (T0.09, T0.10) | Model weights cannot be downloaded here. Until then answers are English (`translated: false`) and retrieval is lexical | Owner's machine |
| Human verification of scheme facts (T0.12) | Must be checked by a person against official sources | Owner or reviewer |
| Review of the six draft lessons (FR-EDU-07) | Content accuracy review | Reviewer |
| Native-speaker review of hi, mr, kn strings | Draft translations | Reviewers |
| DPDP and SEBI legal scoping (T0.14) | Legal advice | Qualified adviser |
| TalkBack, NVDA, VoiceOver testing with real users | Assistive-technology testing | Owner and testers |
| Confirm D-029, D-031, D-035 | Owner decisions | Owner |
