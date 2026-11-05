# Next AI Prompt

**Generated:** 2026-11-05, when the owner asked to stop mid-Step 6 and hand over. Paste the block below into the next session.

---

You are continuing **VAAKYA – AI Financial Guardian**, a free-and-open-source (D-026) multi-agent financial companion owned by Sanket Mali. Do not start a new project and do not ask the owner to re-explain history.

## Read first

1. `00_PROJECT_MANAGEMENT/HANDOVER.md` – rules, code map, test commands, **next steps in order**
2. `00_PROJECT_MANAGEMENT/REMAINING_WORK.md` – the live checklist (keep it updated as you work)
3. `00_PROJECT_MANAGEMENT/CURRENT_STATUS.md`
4. The step results in `05_TESTING/*/STEP*_RESULTS.md`

Verify claims by running the tests before you build on them.

## State

- Steps 1-5 of the owner's six-step build are done and committed to `main`: Next.js 16 frontend (preview mode on sample data), FastAPI backend on PostgreSQL, Neo4j Life Graph, encrypted SeaweedFS vault, Qdrant knowledge base, LangGraph orchestrator, four deterministic agents, inference service with real Tesseract OCR and eSpeak NG speech.
- Step 6 (integration) is in progress: Keycloak realm and `infra/compose.yaml` are written and the realm import was verified; nothing has run as a full Compose stack; the web app is not yet wired to the live API; UI polish and real-login E2E are not done.
- No LLM, speech-recognition, translation or embedding model has ever run (downloads were blocked). Those are owner tasks T0.03, T0.08, T0.09, T0.10 on his RTX 3050.

## Your task

Do HANDOVER "Next steps" 1 to 5 in order: run the stack with Compose and seed it; wire every screen to the live API (redirect to onboarding on 409, schemes via `/v1/schemes`, voice summary via `/v1/voice/speak`, new `/learn/[moduleId]` and `/life-graph` pages, budget and plan on the planning page); make the UI as beautiful and dynamic as possible (count-up numbers, animated ring and bars, staggered entry, hover lift; respect reduced motion; keep axe and the 360 px test green); write Playwright journeys through real Keycloak sign-in and registration; capture live screenshots; then update all trackers and regenerate this prompt.

## Rules

- Open-source stack only; keep substitutions recorded in `DECISIONS_LOG.md`.
- Never fake AI output; missing subsystems return 503 and the UI says so.
- Figures, eligibility and scores are code; LLMs only explain.
- Never mark VERIFIED. Use `00_PROJECT_MANAGEMENT/tools_update_tracker.py` for tracker changes.
- Commit to `main` as `sanket1516 <sanketmali0909@gmail.com>` when asked.

## Final report

State what was completed, tested, remaining, mocked and broken, and what the next AI should do.
