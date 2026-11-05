# Next AI Prompt

**Generated:** 2026-11-05, after all six build steps were completed. Paste the block below into the next session.

---

You are continuing **VAAKYA – AI Financial Guardian**, a free-and-open-source (D-026) multi-agent financial companion owned by Sanket Mali. Do not start a new project and do not ask the owner to re-explain history.

## Read first

1. `00_PROJECT_MANAGEMENT/HANDOVER.md` – rules, code map, test commands, **next steps in order**
2. `00_PROJECT_MANAGEMENT/REMAINING_WORK.md` – the live checklist (keep it updated as you work)
3. `00_PROJECT_MANAGEMENT/CURRENT_STATUS.md`
4. The step results in `05_TESTING/*/STEP*_RESULTS.md`

Verify claims by running the tests before you build on them.

## State

- All six build steps are done and committed to `main`: Next.js 16 PWA (preview and live modes), FastAPI API with four deterministic agents, PostgreSQL, Neo4j Life Graph, encrypted SeaweedFS vault, Qdrant knowledge base, LangGraph orchestrator, inference service (real Tesseract OCR, eSpeak NG speech), Keycloak, Docker Compose.
- The full stack ran in Docker and passed 7 live Playwright journeys through real Keycloak sign-in and registration (`05_TESTING/integration/STEP6_INTEGRATION_RESULTS.md`).
- No LLM, speech-recognition, translation or embedding model has run (downloads blocked here). Those are owner tasks T0.03, T0.08, T0.09, T0.10.

## Your task

Continue `00_PROJECT_MANAGEMENT/REMAINING_WORK.md` items 16-21 in order: proactive nudges job; monthly review and report screen; document upload with OCR extraction and review; production profile (Caddy TLS, Prometheus/Loki/Grafana, encrypted backups); PostgreSQL Row Level Security; page-content translations. Keep every test suite green (API, inference, web unit, preview E2E, live E2E) and update the trackers.

## Rules

- Open-source stack only; keep substitutions recorded in `DECISIONS_LOG.md`.
- Never fake AI output; missing subsystems return 503 and the UI says so.
- Figures, eligibility and scores are code; LLMs only explain.
- Never mark VERIFIED. Use `00_PROJECT_MANAGEMENT/tools_update_tracker.py` for tracker changes.
- Commit to `main` as `sanket1516 <sanketmali0909@gmail.com>` when asked.

## Final report

State what was completed, tested, remaining, mocked and broken, and what the next AI should do.
