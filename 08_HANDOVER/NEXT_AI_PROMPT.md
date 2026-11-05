# Next AI Prompt

**Generated:** 2026-11-05, at the end of the session that completed T0.06 and the architecture set (T0.15).
Paste the block below into the next session.

---

You are continuing **VAAKYA – AI Financial Guardian**, an independent, production-ready, **free and open-source only** application (D-026), owned by Sanket Mali. The Nomura KakushIN 2026 hackathon is over. Do not start a new project.

## Read first, in this order

1. `00_PROJECT_MANAGEMENT/HANDOVER.md`
2. `00_PROJECT_MANAGEMENT/CURRENT_STATUS.md`
3. `00_PROJECT_MANAGEMENT/DECISIONS_LOG.md`, especially D-003, D-010, D-013, D-020, D-025 to D-031
4. `00_PROJECT_MANAGEMENT/TASK_TRACKER.md` (PH0 section)
5. `02_ARCHITECTURE/SYSTEM_ARCHITECTURE.md`, then the architecture document for your task
6. `02_ARCHITECTURE/ARCHITECTURE_COVERAGE.md` for the feature you touch
7. `06_DOCUMENTATION/LICENCE_REGISTER.md` before adding any dependency or model

Verify claims against the files. Do not trust completion claims, including this prompt.

## State you inherit

- **Phase 0 in progress.** D-029 records that Phase 0 began on the owner's instruction to continue. Check whether the owner has confirmed it.
- **Done:** T0.06 (versions, API image, smoke tests, licence register; evidence `05_TESTING/evaluations/T0.06_RESULTS.md`) and T0.15 (architecture set v1.0, 29 Mermaid diagrams that render).
- **No application code exists.** `04_APPLICATION/` is empty. All 208 features are NOT IMPLEMENTED. NFR-MAINT-01 and NFR-LIC-01 are IN PROGRESS from spike evidence only.
- **Stack is fixed by D-020, D-026, D-030:** Next.js 16.4.5, React 19.3.1, TypeScript 7.0.2, Tailwind 4.3.4, Python 3.13, FastAPI 0.162.0, LangGraph 1.2.20, LlamaIndex 0.14.25, Qdrant 1.20.0, PostgreSQL 18, Neo4j 5.26 Community, SeaweedFS 4.50, Keycloak 26.8.1, Ollama, Caddy, Prometheus, Loki, Grafana. **Do not reintroduce Firebase, AWS, Gemini or the 2024 pins.** The owner confirmed this on 2026-11-05.

## Your next task

Pick the first one that your environment allows:

1. **If you run on the owner's machine with the RTX 3050:** T0.03, the open-licence LLM evaluation through Ollama. Choose a Private Tier and a Reasoning Tier model with Apache-2.0 or MIT weights. Measure reasoning, accuracy, English, Hindi, Marathi and Kannada quality, latency and GPU memory. Record results in `05_TESTING/evaluations/T0.03_RESULTS.md` and licences in the register. **If the models are not good enough, stop and tell the owner** (MASTER_PLAN, roadmap PH0 "If this phase fails").
   Then T0.04, T0.07, T0.08, T0.09, T0.13 and T0.11, using `02_ARCHITECTURE/evaluations/T0.06_stack/infra/compose.spike.yaml` as the base for T0.11.
2. **If you run in a cloud container without a GPU:** you cannot do T0.03 to T0.13 honestly. Useful work that does not break the phase gate:
   - Draft T0.12, the scheme fact sheet, from official sources, marked **UNVERIFIED** until a human checks it.
   - Build the evaluation datasets named in MASTER_PLAN s18: routing prompts, RAG questions, scam and genuine messages, adversarial safety set, identifier leakage set, eligibility boundary tables. Put them in `05_TESTING/datasets/`.
   - Verify the UNVERIFIED rows in the licence register where you can read the artefact itself.
   Do **not** start PH1 application code unless the owner explicitly waives the Phase 0 gate, and record that in `DECISIONS_LOG.md`.

## Rules

- Never mark a feature IMPLEMENTED, TESTED or VERIFIED without running code and evidence in `05_TESTING/`. Mocks are recorded as MOCK.
- Calculations, eligibility and the Confidence Score are code. LLMs explain them (D-013).
- Say "processed on VAAKYA's own server", never "on-device".
- No real user financial data before T0.14 (NFR-PRIV-03).
- Every new dependency or model needs a licence register entry first.
- If you change the architecture, update the relevant `02_ARCHITECTURE/` file and re-run `python3 02_ARCHITECTURE/tools/coverage.py`.
- At the end, update FEATURE_TRACKER, TASK_TRACKER, CHANGELOG, CURRENT_STATUS, HANDOVER and regenerate this file.
- Commit on `main` with author `sanket1516 <sanketmali0909@gmail.com>`, only when the owner asks.

## Open owner decisions

| Decision | Ask |
|---|---|
| D-029 | Confirm Phase 0 approval |
| D-031 | Accept psycopg (LGPL), Neo4j (GPLv3), Grafana and Loki (AGPLv3) for unmodified use |
| Architecture | Review `02_ARCHITECTURE/`. 11 features have no strategy (all P2/P3 or need external data). See the coverage review |
| FR-STR-14 | Choose a verified source for MSP and market prices, or keep it in the backlog |
| Hardware | A bigger GPU, if T0.03 or T0.11 fails |

## Final report format

State clearly: what was completed, what was tested, what remains, what is mocked, what is broken, and what the next AI should do.
