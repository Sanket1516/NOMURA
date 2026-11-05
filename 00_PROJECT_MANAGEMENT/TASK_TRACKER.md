# Task Tracker

**Last updated:** 2026-11-05

Execution tasks for the phases in `IMPLEMENTATION_ROADMAP.md`. Task statuses: TODO, IN PROGRESS, DONE, BLOCKED, DROPPED.

Sanket Mali owns all tasks (D-005). Tasks marked R3 belong to Release 3.

**Phase 0 started on 2026-11-05 (D-029: approval taken from the owner's instruction to continue; owner to confirm). No PH1+ task may begin before the Phase 0 gate has passed.**

**Tasks needing the owner's machine (RTX 3050):** T0.03, T0.04, T0.07, T0.08, T0.09, T0.10, T0.11 (GPU part), T0.13. **Human tasks:** T0.12 verification, T0.14 legal advice.


## PH0: Decisions and spikes

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T0.01 | Confirm competition rules. Not needed: the hackathon is complete (Q1) | Sanket | - | - | DROPPED |
| T0.02 | Investigate KakushIN LLM. Not needed: it will not be used (Q2) | Sanket | - | - | DROPPED |
| T0.03 | LLM evaluation of open-licence models on the RTX 3050: reasoning, accuracy, Indian-language quality, speed, memory | Sanket | - | FR-ORC-07, FR-DL-02 | TODO |
| T0.04 | Private Tier spike: redaction in four languages and field extraction on the target hardware | Sanket | T0.03 | FR-DL-01 | TODO |
| T0.05 | Close naming, roles and language scope. Done through Q4, Q5 and Q6 | Sanket | - | - | DROPPED |
| T0.06 | Select current stable versions, build the API image and smoke-test imports; start the licence register | Sanket | - | NFR-MAINT-01, NFR-LIC-01 | DONE (2026-11-05, Linux; evidence `05_TESTING/evaluations/T0.06_RESULTS.md`. Inference packages excluded, see T0.03/07/08/13) |
| T0.07 | Open text-to-speech evaluation for English, Hindi, Marathi, Kannada, including licence check | Sanket | - | FR-VOI-02 | TODO |
| T0.08 | faster-whisper evaluation for English, Hindi, Marathi, Kannada on the RTX 3050 and on CPU | Sanket | - | FR-VOI-01 | TODO |
| T0.09 | Translation evaluation: IndicTrans2 versus native model output, with a financial glossary | Sanket | T0.03 | FR-LNG-02 | TODO |
| T0.10 | Retrieval evaluation: e5 quality for Hindi, Marathi, Kannada queries vs translate-first | Sanket | T0.09 | FR-KB-02 | TODO |
| T0.11 | Confirm the host for Neo4j, Qdrant, PostgreSQL and SeaweedFS, and test GPU memory sharing | Sanket | T0.06 | NFR-AVAIL-03 | TODO |
| T0.12 | Produce human-verified scheme fact sheet from official sources | Sanket | - | NFR-ACC-01 | TODO |
| T0.13 | OCR evaluation for Kannada and Devanagari: PaddleOCR versus Tesseract | Sanket | T0.06 | FR-DOC-03 | TODO |
| T0.14 | Scope DPDP and SEBI obligations with a qualified adviser before any real user data | Sanket | - | NFR-PRIV-03 | TODO |
| T0.15 | Architecture document set (10 documents + coverage review) in `02_ARCHITECTURE/` | Sanket | - | NFR-MAINT-05 | DONE (2026-11-05, design only; owner review pending) |

## PH1: Foundations

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T1.01 | Create monorepo under 04_APPLICATION with web, api, inference and infra folders | Sanket | PH0 gate | - | TODO |
| T1.02 | Next.js PWA shell with TypeScript, Tailwind, ShadCN, app layout | Sanket | T1.01 | FR-OFF-01 | TODO |
| T1.03 | FastAPI service skeleton with health route, config, structured logging | Sanket | T1.01 | NFR-SCAL-01, NFR-SEC-07 | TODO |
| T1.04 | Docker Compose for local development: web, api, inference, postgres, keycloak, seaweedfs, neo4j, qdrant, ollama | Sanket | T1.02,T1.03 | NFR-MAINT-01 | TODO |
| T1.05 | Keycloak, PostgreSQL, SeaweedFS and access policies | Sanket | T1.01 | FR-ONB-01, NFR-SEC-03 | TODO |
| T1.06 | OIDC token verification on all API routes | Sanket | T1.03,T1.05 | NFR-SEC-01 | TODO |
| T1.07 | LLM adapter with per-task model configuration, using Ollama | Sanket | T1.03 | FR-ORC-07 | TODO |
| T1.08 | Secrets handling, lockfiles, dependency audit, lint and test gate | Sanket | T1.04 | NFR-SEC-04, NFR-SEC-08, NFR-MAINT-01, NFR-MAINT-02, NFR-MAINT-03, NFR-OBS-02, NFR-LIC-01 | TODO |
| T1.09 | Scripted deployment to staging and production | Sanket | T1.08 | NFR-MAINT-04 | TODO |

## PH2: Data and knowledge

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T2.01 | Neo4j constraints, schema and graph gateway service | Sanket | PH1 | FR-FLG-01, FR-FLG-09, NFR-SEC-02 | TODO |
| T2.02 | PostgreSQL data model and PostgreSQL-to-Neo4j sync (D-010) | Sanket | PH1 | NFR-SEC-02 | TODO |
| T2.03 | Corpus manifest and collection of RBI, SEBI, scheme, literacy and scam sources | Sanket | T0.12 | FR-KB-01 | TODO |
| T2.04 | LlamaIndex ingestion with e5 embeddings into Qdrant | Sanket | T2.03 | FR-KB-02, FR-KB-03, FR-KB-04 | TODO |
| T2.05 | Scheme catalogue dataset from the verified fact sheet | Sanket | T0.12 | FR-CON-01, NFR-ACC-01 | TODO |
| T2.06 | Lesson content drafting and review workflow | Sanket | T2.03 | FR-EDU-07 | TODO |
| T2.07 | Seed test personas Priya, Rajesh, Kisan, Divya | Sanket | T2.01,T2.02 | - | TODO |

## PH3: Orchestrator, safety, Educator, voice core

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T3.01 | LangGraph state, router and agent stubs | Sanket | PH2 | FR-ORC-01, FR-ORC-02, FR-ORC-05 | TODO |
| T3.02 | Twin context loader into agent prompts | Sanket | T3.01 | FR-FLG-07 | TODO |
| T3.03 | Tier routing, redaction layer, data-flow audit and egress test | Sanket | T0.04,T3.01 | FR-DL-01, FR-DL-02, FR-DL-03, FR-DL-04, NFR-PRIV-01, FR-DL-05 | TODO |
| T3.04 | Safety layer: AI notice, educational framing, guardrails, citations, injection handling | Sanket | T3.01 | FR-SAF-01, FR-SAF-02, FR-SAF-03, FR-SAF-04, NFR-SEC-06, NFR-ACC-06 | TODO |
| T3.05 | Educator Agent: Q&A, simple language, role-based, product evaluation | Sanket | T3.02,T3.04 | FR-EDU-01, FR-EDU-02, FR-EDU-03, FR-EDU-09, NFR-ACC-03 | TODO |
| T3.06 | Ask VAAKYA chat UI, navigation, history | Sanket | T3.05 | FR-ASK-01, FR-ASK-03, FR-DSH-05 | TODO |
| T3.07 | Speech adapter, self-hosted speech-to-text and text-to-speech, voice pipeline | Sanket | T3.01,T0.07,T0.08 | FR-VOI-01, FR-VOI-02, FR-VOI-03, FR-VOI-09 | TODO |
| T3.08 | Translation service and culturally relevant prompts | Sanket | T3.01 | FR-LNG-02, FR-LNG-03 | TODO |
| T3.09 | Event log, trace IDs, token metering, rate limits, LLM failure handling | Sanket | T3.01 | FR-IMP-01, FR-ORC-04, NFR-OBS-01, NFR-COST-01, NFR-SEC-09, NFR-AVAIL-01, NFR-ACC-05, NFR-COST-02, NFR-SCAL-03 | TODO |

## PH4: Onboarding, documents, Life Graph

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T4.01 | Landing, profile, consent, onboarding path selection | Sanket | PH3 | FR-ONB-02, FR-ONB-03, FR-ONB-04, FR-ONB-05, FR-ONB-06 | TODO |
| T4.02 | Upload flow, storage, validation | Sanket | T4.01 | FR-DOC-01, FR-DOC-02, NFR-SEC-05 | TODO |
| T4.03 | OCR service and structured extraction for salary slip and bank statement | Sanket | T4.02 | FR-DOC-03, FR-DOC-04, FR-DOC-06, NFR-ACC-07 | TODO |
| T4.04 | Extraction review screen | Sanket | T4.03 | FR-DOC-05 | TODO |
| T4.05 | Assessment wizard and dynamic questionnaire | Sanket | T4.04 | FR-ASM-01, FR-ASM-02, FR-ASM-03 | TODO |
| T4.06 | Twin creation from confirmed data | Sanket | T4.05 | FR-FLG-02, FR-FLG-03 | TODO |
| T4.07 | R3: Additional document schemas | Sanket | T4.03 | FR-DOC-07 | TODO |

## PH5: Strategy Builder

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T5.01 | Calculator library with unit tests | Sanket | PH4 | FR-STR-04 | TODO |
| T5.02 | Goal model, Goal Studio UI, progress tracking | Sanket | T5.01 | FR-STR-01, FR-STR-08 | TODO |
| T5.03 | Feasibility and roadmap generation | Sanket | T5.01 | FR-STR-03, FR-STR-05, FR-STR-09, FR-ASK-02 | TODO |
| T5.04 | Irregular and seasonal income planning | Sanket | T5.03 | FR-STR-06, FR-STR-07 | TODO |
| T5.05 | Recommended goals, loan cost explainer, twin enrich and analyze | Sanket | T5.03 | FR-STR-02, FR-STR-12, FR-FLG-04, FR-FLG-06 | TODO |
| T5.06 | R3: retirement and trade-off guidance | Sanket | T5.03 | FR-STR-10, FR-STR-13 | TODO |

## PH6: Sentinel

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T6.01 | Scam capture UI and paste-text path | Sanket | PH4 | FR-SEN-01 | TODO |
| T6.02 | Sentinel pipeline: OCR, signals, classification, risk score | Sanket | T6.01 | FR-SEN-02, FR-SEN-03, FR-SEN-04, FR-SEN-08, FR-SEN-09 | TODO |
| T6.03 | Result UI with reasons and actions | Sanket | T6.02 | FR-SEN-05, FR-SEN-06 | TODO |
| T6.04 | Pattern matching, scam history, official reporting routes | Sanket | T6.02 | FR-SEN-07, FR-SEN-11, FR-SEN-16 | TODO |
| T6.05 | Labelled evaluation set and published results | Sanket | T6.02 | NFR-ACC-04 | TODO |
| T6.06 | R3: Scam Knowledge Center and link heuristics | Sanket | T6.03 | FR-SEN-10, FR-SEN-12 | TODO |

## PH7: Connector

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T7.01 | Eligibility rules engine with table-driven tests | Sanket | PH4 | FR-CON-02 | TODO |
| T7.02 | Scheme list, search, eligibility breakdown and application guide screens | Sanket | T7.01 | FR-CON-03, FR-CON-05, FR-CON-06 | TODO |
| T7.03 | Benefit estimate, freshness, disability scheme coverage | Sanket | T7.01 | FR-CON-04, FR-CON-08, FR-CON-12 | TODO |
| T7.04 | Kannada farmer flow | Sanket | T7.02 | FR-CON-09 | TODO |
| T7.05 | Proactive eligibility detection and multi-agent handoff | Sanket | T7.01 | FR-CON-11, FR-ORC-03 | TODO |
| T7.06 | Human-escalation routes | Sanket | T7.02 | FR-SAF-05 | TODO |
| T7.07 | R3: match ranking, employer benefits, farming context answers | Sanket | T7.02 | FR-CON-07, FR-CON-13, FR-STR-14 | TODO |

## PH8: Confidence Engine, dashboard, coach

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T8.01 | Confidence Engine and versioned formula | Sanket | PH5,PH6,PH7 | FR-FCS-02, FR-FCS-03, FR-FCS-04, FR-ASM-05 | TODO |
| T8.02 | Confidence Score screen, actions and history | Sanket | T8.01 | FR-FCS-01, FR-FCS-05, FR-FCS-06 | TODO |
| T8.03 | Home dashboard and risk profile | Sanket | T8.01 | FR-DSH-01, FR-DSH-02 | TODO |
| T8.04 | Life Graph screen and opportunities feed | Sanket | T8.01 | FR-FLG-10, FR-CON-10, FR-ORC-06 | TODO |
| T8.05 | Learning Academy, modules, quizzes, progress | Sanket | T8.01 | FR-EDU-04, FR-EDU-05, FR-EDU-08, FR-ENG-04 | TODO |
| T8.06 | Monthly review generation, report and proactive scheduler | Sanket | T8.01 | FR-COA-01, FR-COA-02, FR-STR-11 | TODO |
| T8.07 | Impact framework and literacy delta | Sanket | T8.01 | FR-IMP-02, FR-IMP-04 | TODO |
| T8.08 | Data controls, retention and deletion | Sanket | T8.01 | FR-SAF-06, NFR-PRIV-02 | TODO |
| T8.09 | R3: hub, email loop, reminders, gamification, verified rupee change, activity, spending, adaptive path, statements, tax education, twin evolve, impact view | Sanket | T8.05,T8.06 | FR-DOC-08, FR-COA-03, FR-COA-04, FR-COA-05, FR-ENG-01, FR-ENG-02, FR-ENG-03, FR-IMP-03, FR-IMP-05, FR-DSH-03, FR-DSH-04, FR-EDU-06, FR-EDU-10, FR-EDU-11, FR-FLG-08 | TODO |

## PH9: Accessibility, language, offline hardening

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T9.01 | Localise P0 screens in all four languages, with fonts, number formats and extensible language configuration | Sanket | PH8 | FR-LNG-01, NFR-I18N-01, NFR-I18N-02, FR-LNG-05 | TODO |
| T9.02 | Regional-language voice, voice assessment, Voice Companion, Voice Summary, voice navigation | Sanket | PH8 | FR-VOI-04, FR-VOI-05, FR-VOI-06, FR-VOI-07, FR-ASM-04 | TODO |
| T9.03 | Non-visual equivalents and screen-reader pass | Sanket | PH8 | FR-A11-02, FR-A11-03, FR-A11-04, NFR-A11Y-02 | TODO |
| T9.04 | Accessibility settings, target size, contrast, low-literacy mode | Sanket | PH8 | FR-A11-01, FR-LNG-04, NFR-A11Y-01, NFR-A11Y-03, NFR-A11Y-04 | TODO |
| T9.05 | R3: offline packs, offline shell, low bandwidth | Sanket | T9.01 | FR-OFF-02, FR-OFF-03, FR-OFF-04, NFR-COMP-02 | TODO |

## PH10: Validation, production deployment, release

| Task | Description | Owner | Depends on | Covers | Status |
|---|---|---|---|---|---|
| T10.01 | End-to-end persona tests and cross-screen reconciliation | Sanket | PH9 | NFR-ACC-02 | TODO |
| T10.02 | Performance measurements | Sanket | T10.01 | NFR-PERF-01, NFR-PERF-02, NFR-PERF-03, NFR-PERF-04 | TODO |
| T10.03 | Device and browser compatibility test | Sanket | T10.01 | NFR-COMP-01 | TODO |
| T10.04 | Production deployment on a Linux host, monitoring, backup and restore rehearsal | Sanket | T10.01 | NFR-AVAIL-03, NFR-OBS-02 | TODO |
| T10.05 | Staging promotion, rollback rehearsal and blocked-internet test | Sanket | T10.01 | NFR-AVAIL-02, NFR-LIC-02 | TODO |
| T10.06 | Scale path, privacy checklist and the maintained documentation set | Sanket | T10.04 | NFR-SCAL-02, NFR-PRIV-03, NFR-MAINT-05 | TODO |
| T10.07 | README, release checklist and truthfulness pass on all claims | Sanket | T10.05 | - | TODO |
| T10.08 | Threat model and security testing with open-source tools | Sanket | T10.04 | NFR-SEC-10 | TODO |
