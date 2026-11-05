# Handover

**Last updated:** 2026-11-05
**For:** Any person or AI model continuing this project.
**State:** Plan updated with the owner's decisions. **Implementation and Phase 0 are not approved yet.**

## Stop here first

**Do not write application code or begin Phase 0 until Sanket Mali explicitly approves the plan.**

If you are starting a new session:

1. Read this file.
2. Read `CURRENT_STATUS.md`.
3. Read `DECISIONS_LOG.md`.
4. Ask whether the plan is approved. Do not assume it.

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
| `02_ARCHITECTURE/` to `08_HANDOVER/` | Purpose notes only |

This repository root is the project root (D-001). Do not create a `Nomura/` folder, because it would collide with `NOMURA/` on Windows.

## Single source of truth

| Question | Read |
|---|---|
| What must be built? | `01_REQUIREMENTS/FUNCTIONAL_REQUIREMENTS.md` |
| How is it judged done? | `01_REQUIREMENTS/ACCEPTANCE_CRITERIA.md` |
| What is its status? | `FEATURE_TRACKER.md` |
| What is the order of work? | `IMPLEMENTATION_ROADMAP.md` |
| What was decided? | `DECISIONS_LOG.md` |
| What is the overall design? | `MASTER_PLAN.md` |
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

## Recommended next step after approval

Phase 0, in this order:

1. T0.03: open LLM evaluation on the RTX 3050. Start Ollama first.
2. T0.07, T0.08, T0.09: speech and translation evaluations.
3. T0.13: Kannada and Devanagari OCR.
4. T0.06, T0.11: stack build and shared-resource test.
5. T0.12, T0.14: scheme fact sheet and legal scoping.

**If T0.03 shows open models are not good enough on this hardware, stop and tell the owner.** The options are better hardware or relaxing the open-source rule, and only the owner can choose.

## Regenerated documents

Requirement, tracker and task documents were generated from a temporary dataset to keep IDs matching. They are now the master copies, so edit them directly.

## Known environment facts

Windows 11, Python 3.11.9 only, Node 22.14, Docker 29.4 (about 7.6 GB allocated), RTX 3050 (6 GB), 15.7 GB RAM, Ollama 0.34.2 installed but the service was not running, Tesseract installed. `ollama list` hangs when the service is down, so use a timeout. Full list in `DECISIONS_LOG.md` section 6.

## Git

- Branch `main` has no commits. Everything is untracked.
- Commit only when asked.
- `NOMURA/` is about 134 MB and contains personal portrait photos. Decide whether it belongs in version control before the first commit, especially for a public repository.
