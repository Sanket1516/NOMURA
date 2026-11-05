# VAAKYA – Hand-off status (written 2026-11-05, late session)

**Purpose:** if the working AI runs out of tokens, the next AI reads this file first, then follows the paste-ready prompt at the bottom.
**Owner:** Sanket Mali. **Repo:** `sanket1516/nomura`, branch `main`. **Machine:** Windows 11, Docker Desktop, RTX 3050 6 GB, Ollama running on the host.
**Project rules (unchanged):** free and open-source stack (D-026), never fake AI output, money/eligibility/scores are code, say "processed on VAAKYA's own server", never mark a feature VERIFIED, no `Nomura/` folder, commit only when the owner asks (as `sanket1516 <sanketmali0909@gmail.com>`, with the Co-Authored-By line).

## 1. How much is done (honest estimate)

There is no single true percentage. Rough completion by area (my estimate, not a measurement):

| Area | Done | What is left |
|---|---|---|
| Application software (web, API, data stores, auth, agents as rules, OCR, TTS, backups, RLS) | ~90% | items in section 3 |
| Interface in hi / mr / kn | ~95% written, 0% reviewed | native-speaker and legal review (human) |
| Security hardening | ~80% | nonce CSP (in progress), image scan, pen test |
| Real AI (LLM, speech-to-text, translation, embeddings) | ~15% | Ollama LLM benchmarked, not yet switched on; the rest needs models |
| Content correctness (schemes, lessons, scam rules) | ~30% | human verification (T0.12, FR-EDU-07, T6.05) |
| Operations (monitoring, CI, load tests) | ~40% | Prometheus/Grafana started, unchecked; no CI; no load test |
| Legal / compliance | 0% | DPDP and SEBI advice (T0.14) |

**Overall:** the software runs end to end and is well tested; it is **not launch-ready** because of human-only items (section 4) and the missing AI models.

## 2. Verified in this session (evidence exists)

All run on a fresh Windows build of the production overlay (https://localhost behind Caddy):

- API 156 passed + 4 skipped, normal and with `VAAKYA_TEST_RLS=1` (restricted `vaakya_api` role, 20 tables forced RLS).
- Inference 10 passed (run in a container from the `vaakya-inference` image).
- Web unit 23 passed; preview E2E 27 passed before the CSP change (every screen in hi/mr/kn with axe); live E2E 8 passed through real Keycloak.
- `npm audit` and `pip-audit`: 0 vulnerabilities.
- Fixed: CRLF line endings (Postgres init), UTF-8 file reads (rupee sign), CSP added, CSRF Origin check, API docs off in production, misleading UI claims (lessons "reviewed", "simple words mode").
- Reports: `05_TESTING/audit/` (TEST_REPORT, SECURITY_AUDIT, PERFORMANCE_REPORT, FINAL_PROJECT_AUDIT), `00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md` (KI-01..KI-20), `REMAINING_WORK.md`, `DECISIONS_LOG.md` (D-036).

## 2b. Update from the cloud session (2026-11-05, later)

Committed on branch `claude/tender-allen-nshe5u` (not merged to main). Run in the cloud container: preview E2E **29 passed** (nonce CSP, new install-button test), web unit **26 passed**, typecheck and ruff clean. **Not run** (no Docker, Ollama or GPU there): DB-backed API tests, live E2E, CI on GitHub.
Written, unverified on the live stack: `/metrics` bearer token (KI-13), `.github/workflows/ci.yml` (KI-16, KI-12), interface language from the profile on first sign-in (KI-19), PWA install button (shows only when the browser offers installation). Everything that needs your machine is in `08_HANDOVER/OWNER_LOCAL_TASKS.md`.
Sections 3a to 3c below are still open; the "uncommitted" wording in section 3 is out of date because that work is now committed.

## 3. In flight (partly UNVERIFIED; committed on the branch above)

The ~99 changed files from the earlier session are now committed on the branch. Merge to main when the owner agrees.

### 3a. Nonce-based Content-Security-Policy – coded, NOT yet verified
- Changed: `04_APPLICATION/web/proxy.ts` (per-request nonce + CSP, `strict-dynamic`), `app/layout.tsx` (reads `x-nonce`, nonce on the inline boot script), `next.config.ts` (static CSP removed), `e2e/preview.spec.ts` (new tests: nonce present, no `'unsafe-inline'` in script-src, fresh nonce per request, no CSP violations in console).
- Verified so far: the build succeeds, and these 3 preview tests pass: every app page with axe, CSP header has a nonce and no `'unsafe-inline'` in script-src and a fresh nonce per request, and no CSP violations in the browser console across 14 pages. **Not yet run:** the full preview suite (all 29 or so tests), the Docker image rebuild, and the live E2E with the nonce policy.
- To finish: `cd 04_APPLICATION/web && npm run build && npx playwright test e2e/preview.spec.ts` (all must pass). Then rebuild the web image (`VAAKYA_DOMAIN=localhost docker compose -f compose.yaml -f compose.prod.yaml build web && ... up -d --no-build web`) and run the live E2E (command in section 6). If scripts break under `strict-dynamic`, fall back to the earlier policy (`script-src 'self' 'unsafe-inline'`) and record it in KNOWN_ISSUES KI-07. Then update SECURITY_AUDIT.md and KI-07.

### 3b. Local LLM through Ollama – benchmarked, NOT switched on
- Owner said: use the best Ollama model already downloaded, or a Gemini API key. Ollama on the host has `gemma:2b` (1.7 GB) and `qwen2:7b` (4.4 GB). Gemini was **not** added: no key was supplied, and it would send user data to Google, which contradicts "processed on VAAKYA's own server" and D-026. If the owner still wants it, it needs an explicit decision, a key, a new provider in `api/vaakya/ai/llm.py`, and changed consent/privacy wording.
- Benchmark script and raw outputs: `05_TESTING/ai/bench_llm.py`, `bench_gemma2b_2026-11-05.txt`, `bench_qwen2-7b_2026-11-05.txt`. Run with `cd 04_APPLICATION/api && PYTHONUTF8=1 PYTHONPATH=. uv run python ../../05_TESTING/ai/bench_llm.py qwen2:7b`.
- Results through the project's own `LLMAdapter`:
  - `gemma:2b`: routing 7/12; no citations; ignores "answer in Hindi/Marathi/Kannada". Not recommended.
  - `qwen2:7b`: routing **12/12**; answers stay inside the source text; ~1.4 to 4 s warm, ~16 s cold start; 4.1 GB VRAM (fits the 6 GB GPU, only one model at a time). It often omits `[n]` citation markers (the citations panel still lists sources). **Indic-language answers were not evaluated** (the test hung on Kannada; treat Hindi/Marathi/Kannada generation as unproven and keep `translated: false`).
- Recommendation: use `qwen2:7b` for both tiers (private and reasoning) for now.
- Already done: `infra/compose.yaml` passes `VAAKYA_OLLAMA_URL`, `VAAKYA_LLM_PRIVATE_MODEL`, `VAAKYA_LLM_REASONING_MODEL` to the API and now has `extra_hosts: host.docker.internal:host-gateway` on `api`.
- To finish:
  1. `export VAAKYA_OLLAMA_URL=http://host.docker.internal:11434 VAAKYA_LLM_PRIVATE_MODEL=qwen2:7b VAAKYA_LLM_REASONING_MODEL=qwen2:7b VAAKYA_DOMAIN=localhost` then `docker compose -f compose.yaml -f compose.prod.yaml up -d --no-build api worker`. Check `docker exec vaakya-api-1 python -c "import urllib.request;print(urllib.request.urlopen('http://host.docker.internal:11434/api/tags').status)"`. (If Ollama only listens on 127.0.0.1 and the container cannot reach it, set `OLLAMA_HOST=0.0.0.0` on the host and restart Ollama.)
  2. Ask the Educator a question through the live app and confirm the response shows `llm_used: true`, citations, and the "Rule-based answer" label is gone. Check the Sentinel, Strategy and Connector answers still take their rule-based path for numbers and eligibility (the model only explains).
  3. Re-run the API tests and the live E2E; live journey 2 may assert on rule-based wording and need loosening to "has citations".
  4. Confirm the safety review (`api/vaakya/agents/safety.py`) still blocks invented numbers and "buy this" language when the model writes the text. Add tests with a stubbed adapter returning bad text.
  5. Add a small regression check using `bench_llm.py`'s routing set. Record results in `05_TESTING/ai/` and update KI-01 (partly resolved), REMAINING_WORK, FEATURE_TRACKER (never VERIFIED), DECISIONS_LOG (new D-037: Ollama qwen2:7b chosen, Gemini not added).
  6. If the offline-model label in the UI says "language model offline", make sure it flips correctly when the model is on.

### 3c. Monitoring – containers started, NOT checked
- `prometheus` and `grafana` containers were started with the `monitoring` profile and are running. Prometheus targets (`api:8000/metrics`, Keycloak `/auth/metrics`) were not checked. Check `docker exec vaakya-prometheus-1 wget -qO- localhost:9090/api/v1/targets`. Grafana is on 127.0.0.1:3001 with anonymous access off; no dashboards or admin password were set. Then update KI-11.

### 3d. Ideas started but not built
- `/metrics` token protection (KI-13), CI workflow (`.github/workflows`, KI-16), interface language set from the profile on first sign-in (KI-19), recording the language shown with each consent (KI-18), load test (KI-09), independent scam test set (KI-05), PWA install button / offline lessons (PWA works but offline is only an offline screen).

## 4. Remaining work that only a human can do

1. **Commit** the work (owner decides).
2. **Models on the RTX 3050:** speech-to-text (faster-whisper, T0.08), IndicTrans2 (T0.09), e5 embeddings (T0.10), Indic TTS (T0.07). Until then answers are English and `translated: false`.
3. **Verify the 10 schemes** against official sources (T0.12). Do not launch before.
4. **Legal advice** (DPDP, SEBI; consent wording in hi/mr/kn, KI-18) (T0.14).
5. **Native-speaker review** of everything in `04_APPLICATION/web/lib/i18n/`; **accuracy review** of the six lessons (FR-EDU-07).
6. **Real assistive-technology and device testing** (TalkBack, NVDA, VoiceOver, real phones, Firefox/WebKit).
7. **Owner decisions:** D-029, D-031 (copyleft parts), D-035 (sixth score dimension), whether to allow Gemini.

## 5. Remaining work an AI can do (priority order)

1. Finish 3a (CSP), 3b (Ollama), 3c (monitoring), re-run all suites, update docs, ask the owner about committing.
2. KI-10 live test of Keycloak brute-force lockout; KI-12 image scan in CI; write the CI workflow.
3. KI-19, KI-18 (language cookie from profile; store language with each consent via the `version` string or a migration with RLS).
4. KI-13 `/metrics` token; KI-09 load measurements (Playwright login → reuse cookie → simple concurrent load) written into PERFORMANCE_REPORT.md with real numbers only.
5. KI-05 a second labelled scam set (label it "not independent" unless a different person wrote it).
6. PWA: install button; offline lessons only if no personal data is cached.

## 6. Commands that work (Windows, Git Bash)

```bash
# whole stack (secrets already exist in 04_APPLICATION/infra/secrets, git-ignored)
cd 04_APPLICATION/infra && export VAAKYA_DOMAIN=localhost
docker compose -f compose.yaml -f compose.prod.yaml up -d --no-build
docker compose -f compose.yaml -f compose.prod.yaml exec api python -m vaakya.seed all
# live E2E (demo password is in infra/secrets/keycloak.env)
cd ../web && PW=$(grep VAAKYA_DEMO_PASSWORD ../infra/secrets/keycloak.env | cut -d= -f2)
NODE_TLS_REJECT_UNAUTHORIZED=0 LIVE_E2E=1 E2E_BASE_URL=https://localhost DEMO_PASSWORD=$PW npx playwright test e2e/live.spec.ts
# preview E2E and unit
npm run build && npx playwright test e2e/preview.spec.ts && npx vitest run
# API tests need these four containers, then both runs
docker run -d --name vaakya-pg-test -e POSTGRES_PASSWORD=test -e POSTGRES_DB=vaakya -p 55432:5432 postgres:18
docker run -d --name vaakya-neo4j-test -e NEO4J_AUTH=neo4j/test-pass-123 -p 57687:7687 neo4j:5.26-community
MSYS_NO_PATHCONV=1 docker run -d --name vaakya-sw-test -p 58333:8333 chrislusf/seaweedfs:4.50 server -s3 -dir=/data
docker run -d --name vaakya-qdrant-test -p 56333:6333 qdrant/qdrant:v1.20.0
cd 04_APPLICATION/api && uv run pytest -o addopts="" ; VAAKYA_TEST_RLS=1 uv run pytest -o addopts=""
docker rm -f vaakya-pg-test vaakya-neo4j-test vaakya-sw-test vaakya-qdrant-test
```

Windows gotchas: keep LF endings (`.gitattributes` enforces); read files as UTF-8; prefix `MSYS_NO_PATHCONV=1` for `docker run` with container paths; export `VAAKYA_DOMAIN` for every compose call; heredocs containing quotes and non-ASCII sometimes break in Git Bash, so write files with the editor tool.

## 7. Where things are

`00_PROJECT_MANAGEMENT/` trackers (HANDOVER, REMAINING_WORK, KNOWN_ISSUES, CURRENT_STATUS, CHANGELOG, DECISIONS_LOG, FEATURE_TRACKER via `tools_update_tracker.py`) · `05_TESTING/audit/` reports · `05_TESTING/ai/` LLM benchmarks · `08_HANDOVER/WORK_SUMMARY.md` · `04_APPLICATION/{web,api,inference,infra}` · UI strings `web/lib/i18n/{nav,pages}.ts`.

## 8. Paste-ready prompt for the next AI

See the block in `08_HANDOVER/NEXT_AI_PROMPT.md` (same text as below).

```
You are continuing VAAKYA – AI Financial Guardian, a free-and-open-source (D-026) multi-agent financial companion owned by Sanket Mali.
Repository: sanket1516/nomura, branch main, folder C:\Drive D\Projects\NOMURA. Do not start a new project and do not ask the owner to re-explain history.

READ FIRST, IN ORDER
1. 08_HANDOVER/HANDOFF_STATUS.md  (what is done, what is in flight and unverified, what remains, commands)
2. 00_PROJECT_MANAGEMENT/KNOWN_ISSUES.md and REMAINING_WORK.md
3. 00_PROJECT_MANAGEMENT/HANDOVER.md (rules, code map, Windows notes)
4. 05_TESTING/audit/FINAL_PROJECT_AUDIT.md
Also read 08_HANDOVER/OWNER_LOCAL_TASKS.md: it lists what a cloud session could not run (live stack, Ollama, CI) and is the checklist for your first hour.
Verify claims by running the tests before building on them. The work is committed on branch claude/tender-allen-nshe5u (merge or cherry-pick to main only when the owner asks); check `git status` and `git log` first.

YOUR TASKS, IN ORDER
1. Do OWNER_LOCAL_TASKS sections A and B first. Nonce CSP (3a): the preview E2E already passes (29/29, cloud run); rebuild the web image and run the live E2E. If it breaks, revert to the previous policy and record why.
2. Switch on the local Ollama model (3b): qwen2:7b for both tiers via VAAKYA_OLLAMA_URL=http://host.docker.internal:11434. Confirm llm_used true on Educator answers, safety review still blocks invented numbers and product pushing, tests and live E2E green. Do NOT add Gemini unless the owner explicitly decides and supplies a key.
3. Check Prometheus targets and Grafana (3c).
4. Work through the open items of section 5 of the hand-off (metrics token, CI workflow, language-from-profile and the PWA install button are written but unverified on the live stack; KI-18, KI-10, KI-09, KI-05 remain). Keep every suite green: API (normal and VAAKYA_TEST_RLS=1), inference, web unit, preview E2E, live E2E.
5. Update trackers (FEATURE_TRACKER via tools_update_tracker.py, TASK_TRACKER, CHANGELOG, CURRENT_STATUS, HANDOVER, REMAINING_WORK, KNOWN_ISSUES, WORK_SUMMARY, HANDOFF_STATUS) and ask the owner whether to commit.

RULES
- Open-source stack only. The owner's older prompts name Firebase, Gemini, PaddleOCR and old version pins; the owner confirmed to keep the open-source plan. Record substitutions in DECISIONS_LOG.md.
- Never fake AI output. A missing subsystem returns 503 with the reason and the UI says so. Label rule-based answers llm_used:false.
- Money figures, eligibility and scores are code; language models only explain them.
- Say "processed on VAAKYA's own server", never "on-device".
- Never mark a feature VERIFIED. Do not create a Nomura/ folder.
- Commit to main as sanket1516 <sanketmali0909@gmail.com> only when the owner asks.
- Do not claim a test passed unless you ran it. Do not claim translations are reviewed.
- Environment: Windows 11, Docker Desktop, Git Bash. Keep LF endings, read data files as UTF-8, export VAAKYA_DOMAIN=localhost for compose, MSYS_NO_PATHCONV=1 for docker run with container paths.

FINAL REPORT
State clearly what was completed, tested, remaining, mocked and broken, and what the next AI should do.
```
