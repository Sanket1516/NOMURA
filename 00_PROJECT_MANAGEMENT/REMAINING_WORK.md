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
| 12 | Keycloak realm, Docker Compose for the whole stack | 6 | IN PROGRESS | Realm file imports cleanly into Keycloak 26.8.1 (verified). `infra/compose.yaml` passes `docker compose config`. NOT yet run with `docker compose up`; web and inference images not yet built (Docker Hub rate limit) |
| 13 | Wire every screen to the live API; end-to-end journeys through real sign-in | 6 | TODO | See HANDOVER "Next steps" for the exact list |
| 14 | UI polish: animated numbers and charts, staggered motion, richer visuals | 6 | TODO | Owner asked for the UI to be "as beautiful and dynamic as possible". Plan in HANDOVER |
| 15 | Final trackers, handover, next-AI prompt | 6 | PARTIAL | Handover and next-AI prompt refreshed at the owner's request to stop (2026-11-05); final pass after items 12-14 |

## Found along the way (to do)

| Item | Note |
|---|---|
| Independent labelled scam set (T6.05) | Sentinel rules were tuned on the developer set |
| Proactive nudges (goal drift, newly eligible schemes) | Scheduler job not written yet |
| PostgreSQL Row Level Security | Isolation is enforced and tested in code; RLS is the second line of defence |

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
