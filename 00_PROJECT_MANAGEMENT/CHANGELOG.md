# Changelog

All notable changes to project plans, requirements and code. Newest first.

## 2026-11-05 (cloud session): code-only items, written without the live stack

- Full preview E2E with the nonce CSP: 28 passed; web unit 26 passed (run in the cloud container).
- `/metrics` optional bearer token (KI-13): `VAAKYA_METRICS_TOKEN`; Prometheus reads `secrets/metrics_token.txt`; `init-secrets.sh` adds it to an existing secrets folder. Guard checked directly (401, 401, 200); the DB-backed test was not run here.
- `.github/workflows/ci.yml` (KI-16, KI-12): never run on GitHub yet. `ruff` now skips applied migrations.
- Interface language set from the profile on first sign-in (KI-19): `lib/lang-from-profile.ts`, 3 unit tests; not tried through Keycloak.
- KI-18: `consents.lang` (migration 0004) stores the interface language shown with each consent; the consent form sends it. Tested on a real PostgreSQL 16 here: API 144 passed normal and with RLS; migration up/down/up on a database with old rows. (Project target is PostgreSQL 18; rerun on 18 locally.)
- KI-05: second labelled scam set (not independent) and evaluation script. Result: recall 10/28, false alarms 0/24 (the tuned set said 12/12). Rules deliberately not tuned to it; regression floor test added.
- PWA install button (shows only when the browser offers installation); preview E2E now 29 passed. Trackers and next-AI prompt updated.
- `08_HANDOVER/OWNER_LOCAL_TASKS.md`: everything that must run on the owner's machine.

## 2026-11-05 (late): hand-off written; nonce CSP and local Ollama model in progress

- `08_HANDOVER/HANDOFF_STATUS.md` and a new `NEXT_AI_PROMPT.md` say what is done, in flight and remaining.
- Nonce-based CSP coded (`web/proxy.ts`, `app/layout.tsx`); 3 targeted tests pass; full suite and image rebuild pending.
- Ollama benchmark through the project's adapter: `qwen2:7b` routing 12/12, grounded answers; `gemma:2b` 7/12. Not yet switched on. Scripts and outputs in `05_TESTING/ai/`. Gemini not added (no key; conflicts with D-026 and the privacy claim).
- Prometheus and Grafana containers started (targets unchecked). Compose: `extra_hosts` for the host Ollama.

## 2026-11-05: Quality, security and privacy audit; Scam Shield translations

- Audit reports in `05_TESTING/audit/`: TEST_REPORT, SECURITY_AUDIT, PERFORMANCE_REPORT, FINAL_PROJECT_AUDIT. Open issues in `00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md`.
- Security fixes: Content-Security-Policy on the web app; Origin check on proxy writes (CSRF second layer); API docs and OpenAPI schema off when `VAAKYA_ENV=production` (test added).
- Scam Shield page and form translated to hi, mr, kn as drafts; sign-out label translated; 3 translated-page E2E tests with axe.
- New tests: CSP header, 768 px tablet overflow, foreign-origin write refused, production docs disabled.
- Results: API 156 passed + 4 skipped (normal and RLS), inference 10, web unit 22, preview E2E 18, live E2E 8 (re-run after the CSP and Origin changes). `npm audit` and `pip-audit` clean.
- Goals and Schemes pages (headings, forms, verification warning, explorer controls) translated as drafts; 6 more translated-page E2E tests. Preview E2E now 24; live E2E re-run, 8 passed.
- Item 21 completed as drafts: every screen's interface text in hi, mr, kn (landing, sign-in, registration, onboarding including consent, dashboard, planning, goals, schemes, score, learn and quiz, shield, assistant, voice, documents, life graph, review, notifications, profile, accessibility, errors, offline), shared components (risk badge, goal card, score ring, charts, citations, origin badge) and the app shell. A draft notice shows on every translated screen.
- Honesty fixes found while translating: the Learn page claimed lessons were reviewed for accuracy (they are unreviewed drafts); the Simple words mode described features it does not have. Both corrected in English and the translations.
- Voice screen follows the interface language, not the persona's spoken language.
- Tests: unit 23 (script checks, no script mixing), preview E2E 27 (every screen in each language with axe), live E2E 8 re-run on a rebuilt image.
- Performance was not benchmarked; see PERFORMANCE_REPORT.

## 2026-11-05: Row Level Security verified on the full stack; page translations (REMAINING_WORK 20, 21)

- Fresh Docker build and run on a Windows machine with the production overlay. API connects as restricted `vaakya_api` (not superuser, no BYPASSRLS); 20 tables have RLS enabled and forced. Seed ran as the owner role.
- All 8 live journeys pass over https://localhost behind Caddy with the restricted role.
- Fix: shell scripts and config files had CRLF line endings on Windows checkouts, so Postgres init failed ("required file not found"). Added `.gitattributes` forcing LF for `*.sh`, `*.in`, `Caddyfile`, `*.yaml`, `*.yml`; normalised existing files.
- Fix: data files (`schemes.json`, `learning.json`, `scam_patterns.json`) were read with the platform default encoding, which garbled the rupee sign on Windows. All now read as UTF-8.
- Page translations: `lib/i18n/pages.ts` (hi, mr, kn drafts) for page headings and descriptions on 11 screens and the dashboard card titles; `PageHeader` takes a `tk` key and shows a draft notice in non-English. 3 new unit tests.
- Suites: API 155 passed + 4 skipped (normal and `VAAKYA_TEST_RLS=1`), inference 10, web unit 22, preview E2E 12, live E2E 8.

## 2026-11-05: Row Level Security (REMAINING_WORK 20, in progress); session stopped by the owner

- Migration 0003: RLS enabled and forced on 20 user-owned tables with `owner_only` policies keyed on a per-transaction `vaakya.user_id`.
- API connects as the restricted `vaakya_api` role (member of `vaakya_app`); migrations, seed, worker and backups use the owner connection (`VAAKYA_ADMIN_DATABASE_URL`).
- Tests: 3 RLS tests; the full API suite (155) passes both normally and with `VAAKYA_TEST_RLS=1` (restricted role).
- Not yet done: re-running the Compose stack and live journeys with the new role (the reset had just completed when the session stopped).

## 2026-11-05: Production profile (REMAINING_WORK 19)

- `compose.prod.yaml`: Caddy TLS as the only public entry, Keycloak in production mode at `/auth` with the admin console blocked, no other ports, preview off; optional Prometheus/Grafana profile.
- Prometheus metrics in the API; encrypted backups (`backup.sh`) and a restore rehearsal (`restore.sh`) that passed.
- Preview UI fully hidden when preview is off. `06_DOCUMENTATION/OPERATIONS.md`.
- All 8 live journeys pass over https://localhost.

## 2026-11-05: Documents with real OCR extraction (REMAINING_WORK 18)

- Upload → Tesseract OCR or PDF text → rule-based fields (net, gross, deductions, pay month; balances, salary credit) with confidence and a net ≤ gross check → user confirms or corrects → monthly income.
- Documents screen in the app. Latest confirmed slip replaces earlier slip income (bug found by re-running the live test).
- 7 new API tests; live journey 8. Disk-full condition that broke SeaweedFS found and cleared.

## 2026-11-05: Proactive nudges and monthly review (REMAINING_WORK 16-17)

- Daily proactive job: goal-drift and newly-eligible-scheme notifications, at most one per user per day, never repeated.
- `GET /v1/reviews`, `GET /v1/reviews/{month}` and the Monthly review screen with month navigation.
- 4 new API tests; live journey 5 covers the review screen.

## 2026-11-05: Step 6 of 6 complete, integration

### Added

- Full stack ran in Docker Compose (9 services); Ubuntu base image built with debootstrap to get past Docker Hub limits.
- Web app wired to the live API: onboarding redirect, live schemes, plan formula and limits, server voice summary, lesson reader with quiz, Life Graph screen.
- UI polish: dashboard hero, count-up numbers, drawing ring and charts, staggered entry, hover lift, hub-and-sector Life Graph.
- 7 live Playwright journeys through real Keycloak sign-in and registration; 10 live screenshots.

### Fixed

- Seven integration defects (Keycloak DB secret permissions, demo user names, worker healthcheck, cached onboarding redirect, reduced-motion delays, activity duplicates, unreadable graph). See the Step 6 results.

## 2026-11-05: Step 6 of 6 (in progress), integration; session stopped by the owner

### Added

- Inference service (real Tesseract OCR and eSpeak NG TTS), API client, voice speak/audio endpoints, real-OCR screenshot checks.
- Keycloak realm (`infra/keycloak/vaakya-realm.json`, verified import into Keycloak 26.8.1), `infra/compose.yaml` (validated), `init-secrets.sh`, web Dockerfile and `next.config.ts`.
- Handover, next-AI prompt and remaining-work list refreshed for the next model.

### Not done

- Full Compose run, live web wiring, UI polish, real-login E2E (see HANDOVER next steps).

## 2026-11-05: Step 5 of 6, four agents

### Added

- Educator (grounded, cited, abstains), Strategy Builder (calculators, risks, assumptions), Sentinel (16 signals, link heuristics, evidence, levels, handoff), Connector (eligibility engine over 10 schemes).
- Agents registered at startup; `/v1/chat`, `/v1/sentinel/checks`, `/v1/schemes*` now real.
- `06_DOCUMENTATION/CONFIDENCE_SCORE.md`.
- 92 new tests; 138 backend tests pass. Six defects found by tests and fixed.

## 2026-11-05: Step 4 of 6, AI infrastructure

### Added

- Ollama LLM adapter with two tiers, retries, JSON-schema output, fallback and a `RedactedText` privacy gate.
- Private Tier redaction of 10 Indian identifier types with Verhoeff and Luhn checks.
- Qdrant knowledge base (46 chunks: lessons, schemes, 10 scam patterns), lexical sparse retrieval with IDF, filters, abstention.
- LangGraph orchestrator: rule router in three scripts, redaction gate, twin context, handoff, safety review, SSE events, audit.
- 33 new tests; retrieval 15/15 top-3 on a labelled set.

### Not done

- No LLM, translation or embedding model has run: downloads are blocked in this environment (T0.03, T0.09, T0.10).

## 2026-11-05: Step 3 of 6, data layer

### Added

- Neo4j Financial Life Graph gateway with named, user-anchored queries; outbox relay from PostgreSQL; `GET /v1/twin`.
- Encrypted SeaweedFS document vault (AES-256-GCM envelope, path-bound).
- Scheme catalogue (10 schemes, unverified drafts), migration 0002, loader that preserves human verification.
- Retention purge, worker process, four synthetic demo accounts, generated `06_DOCUMENTATION/DATABASE_SCHEMA.md`.
- `00_PROJECT_MANAGEMENT/REMAINING_WORK.md`, kept up to date continuously (owner request).
- 11 tests against real Neo4j and SeaweedFS; 57 backend tests in total.

## 2026-11-05: Step 2 of 6, backend

### Added

- `04_APPLICATION/api/`: FastAPI service with Keycloak RS256 JWT verification and just-in-time user provisioning, RFC 9457 errors, structured JSON logging with an allow-list and HMAC user ids, per-user rate limits, body-size limits, request ids.
- PostgreSQL schema (21 tables) with an Alembic migration.
- Modules: profile, consent (append-only), preferences, onboarding, dynamic assessment, financial items and monthly budget, goals with idempotent creation, plans with inputs and formulas, contributions, planning calculators, Confidence Score fcs-1 (six dimensions), dashboard, learning (6 draft lessons and quizzes), notifications, document upload validation, export and erase.
- Deterministic calculators: emergency fund, goal feasibility, irregular-income rule, seasonal plan, loan APR, SIP illustration.
- 46 tests (17 unit, 29 integration on real PostgreSQL), mutation-checked isolation test, Dockerfile, README with examples.

### Not yet

- Chat, Sentinel, schemes and voice return 503 until Steps 4-6. Vault storage arrives in Step 3.

## 2026-11-05: Step 1 of 6, frontend

### Added

- `04_APPLICATION/web/`: Next.js 16 PWA with a design system (warm paper, ink, growth green, marigold; Fraunces + Inter), light, dark and high-contrast themes, text scaling and reduced motion.
- Screens: landing, login, registration, onboarding (consent, persona selection, profile and money questions), dashboard, AI assistant, financial planning, goals, Scam Shield, schemes, learning, Confidence Score, voice, accessibility settings, profile with data controls, notifications, about AI, offline.
- Keycloak OIDC Authorization Code + PKCE through a Next.js backend-for-frontend; tokens kept server-side. Token-attaching API proxy with SSE streaming.
- Sample-data preview mode for the four personas (D-033), labelled on every screen. AI screens never fake answers.
- Accessible SVG charts with text summaries and data tables; lakh/crore formatting with spoken forms.
- Tests: 19 unit, 12 Playwright E2E with axe. 58 screenshots.
- Decisions D-032 to D-035.

### Fixed during testing

- Accent colour contrast, three mobile overflow causes, distorted chart labels.

## 2026-11-05: Phase 0 started, T0.06 done, architecture set v1.0

### Added

- **T0.06 stack spike** (`02_ARCHITECTURE/evaluations/T0.06_stack/`): pinned `uv.lock` (Python 3.13, 162 packages) and `package-lock.json` (Next.js 16.4.5, React 19.3.1, TypeScript 7.0.2, Tailwind 4.3.4), API Dockerfile, import smoke test, service probe, a compose file for PostgreSQL, Neo4j, Qdrant, SeaweedFS and Keycloak, and licence checks with unit tests.
- **Evidence:** `05_TESTING/evaluations/T0.06_RESULTS.md` and raw outputs. Also `05_TESTING/evaluations/ARCH_BASELINE/` shows the Executive Summary pins cannot resolve (Coqui TTS 0.22 vs Python 3.12 and LlamaIndex 0.11.7), and `next@14.2.30` is deprecated for a security issue.
- **Licence register:** `06_DOCUMENTATION/LICENCE_REGISTER.md`.
- **Architecture set (T0.15):** `02_ARCHITECTURE/` system, frontend, backend, agent, database, API, security, deployment, data flow and dependency documents, with 29 Mermaid diagrams, all checked to render with mermaid-cli.
- **Coverage review:** `02_ARCHITECTURE/ARCHITECTURE_COVERAGE.md`, generated by `02_ARCHITECTURE/tools/coverage.py`. 208 features: 170 defined, 27 partial, 11 with no strategy.
- **Decisions:** D-029 (Phase 0 start taken from the owner's instruction, to confirm), D-030 (T0.06 version set), D-031 (copyleft components accepted for unmodified use).

### Changed

- T0.06 DONE. T0.15 added and DONE. NFR-MAINT-01 and NFR-LIC-01 moved to IN PROGRESS. No feature is implemented.
- The owner asked for an architecture on the Executive Summary stack (Firebase, AWS, Gemini, 2024 pins), then said to keep the open-source plan instead. The architecture follows D-026 and lists the baseline only for comparison.

### Not changed

- No application code in `04_APPLICATION/`. No file in `NOMURA/` modified.

## 2026-11-05: Production and open-source replan (v0.2, draft)

Applied the owner's answers to all questions, and the instruction that everything must be free and open source.

### Changed

- **Project direction:** The hackathon is complete. VAAKYA is now an independent production-ready application.
- **Product name:** VAAKYA - AI Financial Guardian. Agent name confirmed as Strategy Builder Agent.
- **Ownership:** Sanket Mali owns everything. Planning documents now name only him.
- **Stack:** Firebase, AWS, Gemini and paid LLM APIs replaced by self-hosted PostgreSQL, Keycloak, SeaweedFS, Ollama with open models, faster-whisper, open text-to-speech, Caddy, Prometheus, Loki and Grafana.
- **Dual-LLM:** Now a self-hosted Private Tier and Reasoning Tier.
- **Roadmap:** 24-hour plan replaced by 11 phases with milestones M1, R1, R2 and R3, and solo effort estimates.
- **Priorities:** Redefined by release instead of demo-critical.
- **Requirements:** 198 items grew to 208. Added FR-DL-05, FR-VOI-09, FR-LNG-05, NFR-SCAL-03, NFR-SEC-10, NFR-MAINT-04, NFR-MAINT-05, NFR-COST-02, NFR-LIC-01 and NFR-LIC-02. Promoted privacy, security, monitoring and reliability items to P0.
- **Versions:** Current stable versions replace hackathon pins.
- **Decisions:** 28 decisions, 13 answered questions, 32 source conflicts.

### Removed

- The other hackathon team member's name, from all planning documents.
- FR-DL-01 and FR-DL-02 blocked status.

### Not changed

- No file in `NOMURA/` was modified. Those files still contain the original team details.
- No application code was written, and Phase 0 has not started.
- Nothing was committed to git.

## 2026-11-05: Planning baseline (v0.1, draft)

### Added

- Project folder structure `00_PROJECT_MANAGEMENT` to `08_HANDOVER` at the repository root (D-001).
- Master plan, roadmap, trackers, decisions log, status, changelog, handover, requirement documents and folder purpose notes.

### Reviewed

- All material in `NOMURA/`: problem statement PDF (visually), Executive Summary with embedded diagrams, both decks slide by slide, 34 images and 20 deck-only images, including 16 UI mockups.
