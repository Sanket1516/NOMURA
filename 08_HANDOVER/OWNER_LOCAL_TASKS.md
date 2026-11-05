# Owner's local tasks (one file)

**Who runs this:** you, or an AI session running in VS Code on your Windows machine (Docker Desktop, Ollama, RTX 3050). A cloud session cannot do any of it: no Docker daemon, no Ollama, no GPU there.
**How to use it:** `git pull`, then give this file to your local AI with: *"Do the tasks in 08_HANDOVER/OWNER_LOCAL_TASKS.md in order, run every check, report pass/fail honestly, and do not commit until I say so."*
Rules are unchanged (see `HANDOFF_STATUS.md` section 0 and 8): open-source only, never fake AI output, money/eligibility/scores are code, no VERIFIED labels, commit as `sanket1516 <sanketmali0909@gmail.com>` only when asked.
Setup once: `cd 04_APPLICATION/infra && export VAAKYA_DOMAIN=localhost`. Commands for the stack and tests are in `HANDOFF_STATUS.md` section 6.

## A. Verify what the cloud session wrote (it could not run these)

| # | Task | How | Pass when |
|---|---|---|---|
| A1 | Metrics token (KI-13) | `sh init-secrets.sh` (adds `secrets/metrics_token.txt` and `VAAKYA_METRICS_TOKEN` to `secrets/api.env`; check both exist and the file is not tracked by git). Recreate the API: `docker compose -f compose.yaml -f compose.prod.yaml up -d --no-build api worker`. From a container on the network: `/metrics` without a token returns 401, with `Authorization: Bearer <token>` returns 200 | 401 then 200 |
| A2 | API tests, both modes | Four test containers from section 6, then `uv run pytest -o addopts=""` and `VAAKYA_TEST_RLS=1 uv run pytest -o addopts=""`. New test: `test_metrics_need_the_token_when_one_is_configured` | All pass; report counts |
| A3 | Language from profile (KI-19) | Clear cookies, sign in as the Marathi demo persona through Keycloak | Interface is in Marathi without touching the picker. A user who already picked a language keeps it |
| A4 | Live E2E | Command in section 6 (rebuild `web` first, see B1) | 8 passed |
| A5 | CI workflow (KI-16/KI-12) | Push a branch, open the Actions tab | Jobs run. Expect small fixes on first run (inference deps, Trivy findings). Do not hide findings; fix or record them in KNOWN_ISSUES |
| A7 | Low-literacy mode (KI-20) | Settings → Accessibility → Simple words mode, then open Home on a phone. Show it to someone who finds the standard screens hard; note what confuses them | Home is understood without help; list what is still unclear |
| A8 | Consent language (KI-18) | Register a new user in Marathi, accept consent, then `select purpose, lang from consents` in Postgres | `lang` is `mr` |
| A6 | PWA install button | Open https://localhost in Chrome or Edge, sign in, look for the download icon in the top bar, click it, confirm the app installs and opens standalone. Safari and Firefox should show no button | Installs on Chrome/Edge; no dead button elsewhere |

## B. Unfinished from HANDOFF_STATUS section 3

| # | Task | How | Pass when |
|---|---|---|---|
| B1 | Nonce CSP in the real image (3a) | Preview E2E already passes (28/28, cloud run). Rebuild: `docker compose -f compose.yaml -f compose.prod.yaml build web && ... up -d --no-build web`, then the live E2E over https://localhost | Live E2E 8 passed and no CSP violations. If scripts break under `strict-dynamic`, revert to `'unsafe-inline'`, record why in KI-07. If it passes, update SECURITY_AUDIT.md and KI-07 |
| B2 | Switch on Ollama `qwen2:7b` (3b) | Steps 1 to 6 of HANDOFF_STATUS 3b. Educator answer must show `llm_used: true`; Sentinel, Strategy, Connector keep rule-based numbers and eligibility. Add tests with a stubbed adapter that returns invented numbers and "buy this" text: safety review must block both | llm_used true, safety tests pass, API and live E2E green. Record D-037 (qwen2:7b chosen, Gemini not added); update KI-01, REMAINING_WORK, FEATURE_TRACKER (never VERIFIED) |
| B3 | Prometheus and Grafana (3c) | `docker compose -f compose.yaml -f compose.prod.yaml --profile monitoring up -d`, then `docker exec vaakya-prometheus-1 wget -qO- localhost:9090/api/v1/targets`. Note: `vaakya-api` needs the token from A1 (already wired in `prometheus.yml`). Set a Grafana admin password | Both targets `up`. Update KI-11 |

## C. Tests only you can do on your hardware or with people

1. KI-09: `cd 04_APPLICATION/web && NODE_TLS_REJECT_UNAUTHORIZED=0 BASE=https://localhost DEMO_PASSWORD=<from infra/secrets/keycloak.env> OUT=../../05_TESTING/audit/load_result.md node scripts/load_test.mjs` (add `CHAT=5` once with the model off, once on). Paste the output into PERFORMANCE_REPORT.md with date and machine.
2. KI-10: Keycloak brute-force lockout on the live stack (5 wrong passwords, then correct one).
3. Models on the RTX 3050: faster-whisper (T0.08), IndicTrans2 (T0.09), e5 embeddings (T0.10), Indic TTS (T0.07). Hindi, Marathi and Kannada generation with qwen2:7b is unproven; test it before turning `translated` on.
4. Real phones, TalkBack, NVDA, VoiceOver, Firefox and Safari (KI-08).
5. KI-15: email verification and password reset with a real mail relay.

## D. Humans only (no software can close these)

Verify the 10 schemes against official sources (T0.12) · legal advice on DPDP/SEBI and the consent wording in hi/mr/kn (T0.14, KI-18) · native-speaker review of `web/lib/i18n/` · accuracy review of the six lessons (FR-EDU-07) · decisions D-029, D-031, D-035 and whether Gemini is ever allowed.

## E. When done

Update trackers (FEATURE_TRACKER via `tools_update_tracker.py`, TASK_TRACKER, CHANGELOG, CURRENT_STATUS, REMAINING_WORK, KNOWN_ISSUES, HANDOFF_STATUS), then ask the owner whether to commit.
