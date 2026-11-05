# Handover

**Last updated:** 2026-11-05
**For:** Any person or AI model continuing this project.
**State:** Phase 0 in progress (D-029, owner to confirm). T0.06 and the architecture set (T0.15) are done. **No application code. PH1 must wait for the Phase 0 gate.**

## Stop here first

**The owner waived the Phase 0 gate for software work (D-032).** Model choice, scheme verification and legal scoping still gate their features.

If you are starting a new session:

1. Read this file, `CURRENT_STATUS.md`, `DECISIONS_LOG.md` (D-026 to D-031), and `08_HANDOVER/NEXT_AI_PROMPT.md`.
2. Read `02_ARCHITECTURE/SYSTEM_ARCHITECTURE.md` and the document it points to for your task.
3. Check whether the owner has confirmed D-029. Do not claim plan approval beyond what is recorded.

## Build progress (D-032)

Step 1 frontend: DONE (`04_APPLICATION/web`, results `05_TESTING/frontend/STEP1_FRONTEND_RESULTS.md`). Step 2 backend: DONE (`04_APPLICATION/api`, results `05_TESTING/backend/STEP2_BACKEND_RESULTS.md`). Steps 2 to 6: see `TASK_TRACKER.md` "Build sequence".

## Latest session (2026-11-05)

- **T0.06 done** in a Linux cloud container: lockfiles, API image, smoke tests, service probe, licence checks. Evidence: `05_TESTING/evaluations/T0.06_RESULTS.md`.
- **Licence register** started: `06_DOCUMENTATION/LICENCE_REGISTER.md`.
- **Architecture v1.0** in `02_ARCHITECTURE/`, with a generated coverage review over all 208 features.
- The owner first asked for an architecture on the Executive Summary stack (Firebase, AWS, Gemini, 2024 pins), then said "just go with the plan you have created". **D-026 stands.** Do not reintroduce proprietary services.
- Commits go to `main` with author `sanket1516 <sanketmali0909@gmail.com>`, as the owner asked.

## What this project is

VAAKYA - AI Financial Guardian is a multi-agent financial companion. It began at the Nomura KakushIN 2026 hackathon, which is complete. Sanket Mali now owns it as an independent, production-ready application.

It serves four personas (Priya, Rajesh, Kisan, Divya) through four agents (Educator, Strategy Builder, Sentinel, Connector), a Financial Life Graph and a Financial Confidence Score.

## The hard rule

**Everything must be free and open source (D-026).** Runtime components need OSI-approved licences. Model weights must use open licences such as Apache-2.0 or MIT. Check licences before adding anything, and add an entry to the licence register.

The Executive Summary and decks name Firebase, AWS and Gemini. Do not use them. `DECISIONS_LOG.md` overrides those documents on vendors.

## Where things are

| Path | Contents |
|---|---|
| `NOMURA/` | **Source material. Read-only.** |
| `NOMURA/INVINCIBLES/` | Problem statement PDF and Executive Summary |
| `00_PROJECT_MANAGEMENT/` | Plan, roadmap, trackers, decisions, status |
| `01_REQUIREMENTS/` | Requirements, personas, acceptance criteria |
| `02_ARCHITECTURE/` | Architecture set v1.0, coverage review, `evaluations/T0.06_stack/` spike |
| `05_TESTING/evaluations/` | Phase 0 evidence |
| `06_DOCUMENTATION/LICENCE_REGISTER.md` | Licence register |
| `08_HANDOVER/NEXT_AI_PROMPT.md` | Prompt for the next AI session |
| `04_APPLICATION/`, `07_HACKATHON_DELIVERABLES/` | Purpose notes only |

This repository root is the project root (D-001). Do not create a `Nomura/` folder, because it would collide with `NOMURA/` on Windows.

## Single source of truth

| Question | Read |
|---|---|
| What must be built? | `01_REQUIREMENTS/FUNCTIONAL_REQUIREMENTS.md` |
| How is it judged done? | `01_REQUIREMENTS/ACCEPTANCE_CRITERIA.md` |
| What is its status? | `FEATURE_TRACKER.md` |
| What is the order of work? | `IMPLEMENTATION_ROADMAP.md` |
| What was decided? | `DECISIONS_LOG.md` |
| What is the overall design? | `MASTER_PLAN.md`, detailed in `02_ARCHITECTURE/` |
| Which component implements a feature? | `02_ARCHITECTURE/ARCHITECTURE_COVERAGE.md` |
| Which licences are approved? | `06_DOCUMENTATION/LICENCE_REGISTER.md` |
| What was in the source files? | `MASTER_PLAN.md` Appendix A |

## How the sources work

- **The PDF and both decks are images.** Text extraction yields almost nothing, so view the pages. Render PDFs with `pypdfium2`, because `pdftoppm` is not installed.
- **UI "screenshots" are design mockups.** No app exists. Their sample figures contain errors listed in `DECISIONS_LOG.md`. Do not copy them.
- **Requirements tagged `ER`** are engineering recommendations, not source commitments.

## Working rules

1. One source of truth.
2. No silent changes to approved requirements.
3. Do not invent technical capabilities.
4. Record all architectural decisions.
5. Identify risks and external dependencies.
6. Keep documentation understandable to another AI model.
7. Never mark mock functionality as complete.
8. Update `FEATURE_TRACKER.md`, `CURRENT_STATUS.md` and `CHANGELOG.md` in the same change as the work.
9. Calculations, eligibility and scores are code. LLMs explain them (D-013).
10. If something promised cannot be delivered, say so and record it.
11. No real user financial data until the legal gate passes (NFR-PRIV-03).

## Recommended next steps

Phase 0, in this order:

1. T0.03: open LLM evaluation on the RTX 3050. Start Ollama first.
2. T0.07, T0.08, T0.09: speech and translation evaluations.
3. T0.13: Kannada and Devanagari OCR.
4. T0.11: shared-resource test on the GPU. T0.06 is done; reuse `02_ARCHITECTURE/evaluations/T0.06_stack/infra/compose.spike.yaml`.
5. T0.12, T0.14: scheme fact sheet and legal scoping.

**If T0.03 shows open models are not good enough on this hardware, stop and tell the owner.** The options are better hardware or relaxing the open-source rule, and only the owner can choose.

## Regenerated documents

Requirement, tracker and task documents were generated from a temporary dataset to keep IDs matching. They are now the master copies, so edit them directly.

## Known environment facts

Windows 11, Python 3.11.9 only, Node 22.14, Docker 29.4 (about 7.6 GB allocated), RTX 3050 (6 GB), 15.7 GB RAM, Ollama 0.34.2 installed but the service was not running, Tesseract installed. `ollama list` hangs when the service is down, so use a timeout. Full list in `DECISIONS_LOG.md` section 6.

## Git

- Default branch `main`. The owner asked for commits on `main` with author `sanket1516 <sanketmali0909@gmail.com>`.
- Commit only when asked.
- `NOMURA/` (about 134 MB, includes personal portrait photos) is already committed. Removing it from history would need a rewrite; ask the owner first.

## Environment notes from the cloud session

- Docker works after starting `dockerd`. Docker Hub pulls work. `ghcr.io` and `quay.io` blobs were blocked by that session's network policy, so the Dockerfile installs uv from PyPI and Keycloak comes from Docker Hub.
- The GitHub API for third-party repositories was not available, so licences were verified from images and package metadata instead.
