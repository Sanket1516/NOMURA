# VAAKYA – Work Summary

**Date:** 2026-11-05 | **Owner:** Sanket Mali | **Branch:** `main` | **Prepared when the owner asked to stop.**
One document that says what exists, what was tested, what is mocked or limited, and what remains.

## 1. What VAAKYA is now

A working, self-hosted, free-and-open-source financial guardian for the four personas (Priya, Rajesh, Kisan, Divya):

| Layer | Built | Where |
|---|---|---|
| Web app | Next.js 16 PWA, 22 screens, design system, light/dark/high-contrast, text scaling, reduced motion, animated charts | `04_APPLICATION/web` |
| Sign-in | Keycloak 26 (OIDC + PKCE through a server-side BFF), registration, brute-force protection | `04_APPLICATION/infra/keycloak` |
| API | FastAPI, ~50 endpoints, RFC 9457 errors, rate limits, structured logs, Prometheus metrics | `04_APPLICATION/api` |
| Data | PostgreSQL (system of record, Row Level Security), Neo4j Financial Life Graph, SeaweedFS encrypted documents, Qdrant knowledge base | `api/vaakya/stores`, migrations |
| Agents | LangGraph orchestrator + Educator (cited answers), Strategy Builder (calculators), Sentinel (scam signals, OCR), Connector (eligibility for 10 schemes) | `api/vaakya/agents` |
| Privacy | Redaction of 10 Indian identifier types before any reasoning model; audit of categories; consent checks | `api/vaakya/ai/redaction.py` |
| OCR and speech | Tesseract (eng/hin/mar/kan), eSpeak NG (4 languages) | `04_APPLICATION/inference` |
| Operations | Docker Compose dev + production overlay (Caddy TLS), encrypted backups with restore rehearsal | `04_APPLICATION/infra`, `06_DOCUMENTATION/OPERATIONS.md` |

## 2. Screens

Landing, login, registration, onboarding (consent → persona → profile → money), dashboard, Ask VAAKYA, planning, goals, Scam Shield, schemes, learning, lesson + quiz, Confidence Score, Life Graph, monthly review, documents, voice, notifications, profile with data controls, accessibility settings, about AI, offline.

## 3. Tested (all passing at the time of stopping)

| Suite | Result |
|---|---|
| API unit + integration (real PostgreSQL, Neo4j, SeaweedFS, Qdrant) | 156 passed, 4 skipped (host-OCR tests); same with RLS enforced (re-run 2026-11-05) |
| Inference service (real Tesseract and eSpeak NG) | 10 passed |
| Web unit | 26 passed (cloud run, 2026-11-05 later) |
| Web preview E2E (axe WCAG 2.2 AA: 0 serious/critical; 360 and 768 px no overflow; keyboard; CSP; CSRF; translated Scam Shield) | 29 passed with the nonce CSP and the install button (cloud run; the 27 earlier ran before the CSP change) |
| Live E2E through real Keycloak on the full Docker stack | 8 journeys passed over https behind Caddy, with the restricted RLS role (2026-11-05) |
| Backup → restore rehearsal | Row counts identical; backup files contain no plaintext |

Evidence: `05_TESTING/*/STEP*_RESULTS.md`, `05_TESTING/integration/STEP6_INTEGRATION_RESULTS.md`, screenshots in `07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/` (68 + live set).

## 4. Mocked, limited or not yet working (honest list)

| Item | State | Why / what unblocks it |
|---|---|---|
| Language models (Private and Reasoning tiers) | **None has run.** Agents answer with deterministic rules, labelled `llm_used: false` | Model downloads blocked here; choose and run models on the RTX 3050 (T0.03) |
| Speech-to-text | Returns an honest "not installed" message | Needs faster-whisper weights (T0.08) |
| Page-content translation | All interface text in hi/mr/kn is unreviewed drafts (about 630 strings); API text such as scheme criteria, lessons and answers stays English | Native review; translation model (T0.09) |
| Translation of AI answers | Answers are English (`translated: false`); nav labels translated as drafts | IndicTrans2 weights (T0.09); native review |
| Semantic retrieval | Keyword (sparse) retrieval in Qdrant; 15/15 on a small labelled set | e5 embeddings (T0.10) |
| Text-to-speech quality | eSpeak NG works but sounds robotic | Indic Parler-TTS (T0.07) |
| Scheme facts | 10 schemes, **unverified drafts** | Human verification against official sources (T0.12) |
| Lessons and scam patterns | Drafts | Content review (FR-EDU-07) |
| Sentinel accuracy | 12/12 scams, 0/7 false alarms on a set the rules were tuned on | Independent labelled set (T6.05) |
| Monitoring stack | Prometheus/Grafana configured, not run | Docker Hub rate limit in this environment |
| Row Level Security in Compose | Verified 2026-11-05: 8 live journeys pass with the restricted role | None |
| Legal | No real user data yet | DPDP and SEBI advice (T0.14) |

Audit (2026-11-05): `05_TESTING/audit/TEST_REPORT.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `FINAL_PROJECT_AUDIT.md`; issues in `00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md`. Performance has not been benchmarked.

## 5. Remaining work (in order)

1. Native-speaker review of everything in `04_APPLICATION/web/lib/i18n/` (and legal review of the consent wording). Then the KNOWN_ISSUES items.
3. Owner tasks on the GPU machine: models (T0.03), speech (T0.07, T0.08), translation (T0.09), embeddings (T0.10), OCR comparison (T0.13).
4. Human tasks: scheme verification (T0.12), content review, legal scoping (T0.14), screen-reader testing with real users.
5. Before a public launch: CI pipeline, threat model and security testing (T10.08), hardware for an always-on host.

Live checklist: `00_PROJECT_MANAGEMENT/REMAINING_WORK.md`. Feature status: `00_PROJECT_MANAGEMENT/FEATURE_TRACKER.md` (76 tested, 5 implemented, 50 partial, 64 planned, 9 backlog, 0 verified).

## 6. Decisions waiting for the owner

D-029 (Phase 0 start), D-031 (copyleft components: psycopg LGPL, Neo4j GPLv3, Grafana/Loki AGPLv3), D-035 (sixth score dimension: debt awareness), model choice, hardware for a public service.
