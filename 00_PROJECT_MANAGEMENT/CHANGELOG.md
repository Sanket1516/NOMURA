# Changelog

All notable changes to project plans, requirements and code. Newest first.

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
