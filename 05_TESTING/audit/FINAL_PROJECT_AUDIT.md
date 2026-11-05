# Final Project Audit

**Date:** 2026-11-05 | **Auditor:** Claude (AI) | **Evidence:** `TEST_REPORT.md`, `SECURITY_AUDIT.md`, `PERFORMANCE_REPORT.md`, `00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md`.
This audit was done on the running stack and the code, not on the documents alone. The per-requirement tracker (`FEATURE_TRACKER.md`, 208 rows) is unchanged except FR-LNG-01; the table below groups it by module and uses the six classes requested. **No feature is VERIFIED.**

## 1. Overall health

The software runs end to end on a fresh machine: 10 containers up, 8 live journeys pass through real sign-in over https, and 156 API, 10 inference, 23 web unit and 27 preview E2E tests pass. Dependency audits are clean and RLS is enforced. The product is a working, honest **rule-based** financial guardian. It is **not** yet the AI product described in the plan: no language, speech-to-text, translation or embedding model has ever run. It is not ready for real users until scheme facts and lessons are verified, models are chosen and tested, native speakers review the translations, legal scoping is done and an independent security test is complete.

## 2. Feature classification by module

| Module | Class | What is true |
|---|---|---|
| Sign-in, registration (Keycloak OIDC through BFF) | FULLY FUNCTIONAL | Live journeys 1 and 7. Email verification and password reset flows were not tested |
| Onboarding, consents, profile persistence | FULLY FUNCTIONAL | Live journey 7; PostgreSQL with RLS |
| Dashboard, goals, notifications | FULLY FUNCTIONAL | Real data from the API in live mode |
| Planning and calculators (budget, SIP, EMI, emergency fund) | FULLY FUNCTIONAL | Code, tested; figures never come from a model |
| Financial Confidence Score | FULLY FUNCTIONAL | Rule-based, tested. The sixth dimension (debt awareness) awaits owner decision D-035 |
| Financial Life Graph | FULLY FUNCTIONAL | Real Neo4j projection from PostgreSQL; amounts shown as ranges |
| Documents: upload, OCR, user confirmation | FULLY FUNCTIONAL (English salary slip tested) | Tesseract; Hindi, Marathi, Kannada OCR installed but accuracy untested |
| Nudges and monthly review | FULLY FUNCTIONAL | Daily worker job; live E2E covers review |
| Encrypted backup and restore | FULLY FUNCTIONAL | Restore rehearsal passed once; not scheduled or monitored |
| Strategy Builder agent | FULLY FUNCTIONAL for numbers; PARTIAL for explanation | Deterministic; no model explains the plan |
| Educator agent | PARTIALLY FUNCTIONAL | Cited answers from lexical retrieval and templates; `llm_used: false`; abstains when sources are missing |
| Sentinel agent | PARTIALLY FUNCTIONAL | Real OCR and rule engine; accuracy measured only on the set the rules were tuned on |
| Connector agent (schemes) | PARTIALLY FUNCTIONAL | Real eligibility engine over 10 schemes whose facts are unverified drafts |
| Orchestrator (LangGraph routing, handoff, safety review) | PARTIALLY FUNCTIONAL | Works with the deterministic agents; routing quality with a real model unknown |
| Learning Academy | PARTIALLY FUNCTIONAL | 6 draft lessons and quizzes, unreviewed |
| Voice: text-to-speech | PARTIALLY FUNCTIONAL | eSpeak NG works; quality is robotic |
| UI localisation (hi, mr, kn) | PARTIALLY FUNCTIONAL | All interface text is in draft translations (about 630 strings) with a draft notice; text from the API (scheme criteria, lessons, answers) stays English; none reviewed by a native speaker |
| Accessibility | PARTIALLY FUNCTIONAL | axe-core clean on 15 screens, keyboard tests, 360 and 768 px; no screen-reader testing |
| PWA and offline | PARTIALLY FUNCTIONAL | Manifest and service worker served; only an offline screen, no offline data |
| Preview mode (sample data) | MOCK IMPLEMENTATION (by design, labelled) | Synthetic personas; AI actions return 503 in preview; off in production |
| Monitoring (Prometheus, Grafana, Loki) | PLACEHOLDER | Configured, never run |
| Voice: speech-to-text | BLOCKED | Needs faster-whisper weights (T0.08); UI says so honestly |
| Translation of AI answers | BLOCKED | Needs IndicTrans2 weights (T0.09); answers are English, `translated: false` |
| Semantic (dense) retrieval | BLOCKED | Needs embeddings (T0.10); lexical works |
| Private and Reasoning model tiers | BLOCKED | Needs model choice and GPU run (T0.03) |
| CI pipeline, threat model, load testing | NOT IMPLEMENTED | |
| Push, SMS or email notification delivery | NOT IMPLEMENTED | In-app notifications only; not exhaustively searched in the code |

## 3. Fake or hard-coded content search

A search of the API, web and inference code for TODO, mock, placeholder and hard-coded markers found none outside intentional places: `web/lib/demo.ts` and `twin-sample.ts` (preview data, labelled in the UI), `features.py` (documents that missing subsystems return 503), and HTML input placeholders. No endpoint returns canned AI output in live mode. Agents are deterministic specialists with distinct logic (calculators, signal engine, eligibility rules, retrieval), not one generic chatbot under four names. Without a model, their wording is template-based.

## 4. Bugs

Found and fixed in this audit: CRLF line endings broke Postgres init on Windows (HIGH); default text encoding garbled the rupee sign (HIGH); no CSP (MEDIUM); CSRF relied on SameSite alone (MEDIUM); API docs on in production (LOW). Earlier in the build: a document double-count bug, fixed with a test. Remaining issues are in `KNOWN_ISSUES.md`.

## 5. Recommendations

1. Owner: run T0.03 and T0.07 to T0.10 on the RTX 3050, then re-run this audit's AI section with real answers (groundedness, abstention, Indian-language quality).
2. Have a person verify the 10 schemes against official sources (T0.12) before any user relies on them.
3. Native-speaker review of every string in `web/lib/i18n/`.
4. Build an independent labelled scam set and re-measure Sentinel (T6.05).
5. Add CI (tests, `npm audit`, `pip-audit`, image scan), a nonce-based CSP, rate-limit tests behind the proxy, and a load test.
6. Test with TalkBack, NVDA and VoiceOver users, and on real phones and other browsers.
7. Get DPDP and SEBI advice (T0.14) before real data or any investment-related wording goes live.
