# Test Report

**Date:** 2026-11-05 | **Environment:** Windows 11, Docker 29.4.0, fresh build of the production overlay (`compose.yaml` + `compose.prod.yaml`, Caddy TLS on https://localhost) | **Tester:** Claude (AI), for the owner

Everything below was executed in this session. Items not run are listed under "Not tested". Nothing is marked VERIFIED (the Definition of Done needs human review, native-speaker checks and real users).

## Suites run

| Suite | Method | Result |
|---|---|---|
| API unit + integration | `uv run pytest` against real PostgreSQL 18, Neo4j 5.26, SeaweedFS 4.50, Qdrant 1.20 containers | 156 passed, 4 skipped (host-OCR tests that need Tesseract on the host) |
| API with RLS enforced | `VAAKYA_TEST_RLS=1 uv run pytest` (restricted `vaakya_api` role) | 156 passed, 4 skipped |
| Inference service | pytest inside a container from the `vaakya-inference` image (real Tesseract, eSpeak NG) | 10 passed |
| Web unit | vitest | 23 passed |
| Web preview E2E | Playwright, Chromium, sample-data mode; axe-core WCAG 2.2 AA on 15 screens; keyboard; 360 px and 768 px overflow; PWA; CSP header; every screen rendered in hi, mr and kn with axe | 27 passed |
| Live E2E | Playwright through real Keycloak sign-in over https behind Caddy, on the full Docker stack with the restricted RLS role | 8 passed |
| Type check | `tsc --noEmit` | clean |
| Dependency audit | `npm audit` (production and all), `pip-audit` on the API environment | 0 known vulnerabilities |

The earlier figure was 155 passed; the one added test (production disables API docs) makes 156. Counts are taken from pytest's own summary line.

## Live journeys (8) and what each proves

| # | Journey | Actual result |
|---|---|---|
| 1 | Demo user signs in through Keycloak, sees live data | Pass. Data comes from the API, origin badge says live |
| 2 | Educator answers with citations | Pass. Answer cites sources; `llm_used: false` |
| 3 | Scam check: pasted text and a screenshot through real OCR | Pass. Tesseract read the screenshot; rule engine scored it |
| 4 | Schemes: real eligibility, unknowns asked, not guessed | Pass |
| 5 | Planning, Life Graph, lesson quiz | Pass |
| 6 | Voice reports the missing speech model honestly | Pass. UI says speech-to-text is not installed |
| 7 | New user registers in Keycloak and onboards | Pass |
| 8 | Salary slip: OCR extraction, user confirms, income is used | Pass |

## Findings from this session's testing

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Shell scripts and config files had CRLF endings on a Windows checkout; Postgres init failed ("required file not found") and the stack could not start | HIGH (stack would not start on Windows) | Fixed: `.gitattributes` forces LF; files normalised; stack rebuilt from scratch and passed |
| 2 | Data files read with the platform default encoding; the rupee sign came out as mojibake in scheme answers on Windows (a test caught it) | HIGH (wrong text shown to users on Windows hosts) | Fixed: all JSON data read as UTF-8; 156 tests pass |
| 3 | No Content-Security-Policy on the web app | MEDIUM | Fixed: CSP added; live and preview E2E pass with it |
| 4 | Interactive API docs and OpenAPI schema were on in production (reachable only inside the Docker network) | LOW | Fixed: off when `VAAKYA_ENV=production`; test added |
| 5 | Docker `/data` path rewritten by Git Bash when starting the SeaweedFS test container | LOW (tooling) | Documented in HANDOVER Windows notes |

## Not tested (be honest about the gaps)

- No language model, speech-to-text, translation or embedding model has run. AI features are rule-based and labelled `llm_used: false`; they were tested as such. Quality of real model answers is unknown.
- No test with real assistive technology (NVDA, TalkBack, VoiceOver). Automated axe scans and keyboard tests only.
- Browsers: Chromium only. Firefox and WebKit not run. Mobile is viewport emulation (360 px, 768 px), not real devices.
- No load, soak or concurrency testing. No latency percentiles were measured (see PERFORMANCE_REPORT.md).
- No penetration test, fuzzing of every endpoint, or container image scan (Trivy or similar).
- Prometheus, Grafana and Loki are configured but were not run.
- The translated pages (hi, mr, kn) have never been read by a native speaker; tests only check script and structure.
- Sentinel accuracy (12/12 scams, 0/7 false alarms) comes from a set the rules were tuned on; no independent labelled set exists. A second, untuned set written afterwards (not independent) scored recall 10/28 and 0/24 false alarms, so the 12/12 figure overstates detection (`05_TESTING/data/SCAM_SET_2_RESULTS.md`).
- Scheme facts and lesson content are unverified drafts.
