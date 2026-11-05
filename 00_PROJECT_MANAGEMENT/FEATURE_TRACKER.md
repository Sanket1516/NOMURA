# Feature Tracker

**Last updated:** 2026-11-05 | **Single source of truth for feature status.**

## Rules

- **No mock is ever marked complete.** A MOCK or PLACEHOLDER can reach at most PARTIALLY IMPLEMENTED.
- **Implemented means running code exists in the integrated app.** Mockup images do not count: the UI images in the decks are designs.
- **Evidence is required** to move to TESTED or VERIFIED: a test report, log or recording in `05_TESTING/`.
- A `Yes` under Verified needs the Definition of Done in `01_REQUIREMENTS/ACCEPTANCE_CRITERIA.md`.
- Update this file in the same change as the work.

**Statuses:** NOT STARTED, PLANNED, IN PROGRESS, PARTIALLY IMPLEMENTED, IMPLEMENTED, TESTED, VERIFIED, BLOCKED

**Classification:** REAL IMPLEMENTATION, PARTIAL IMPLEMENTATION, MOCK, PLACEHOLDER, NOT IMPLEMENTED

## Summary

| Metric | Count |
|---|---|
| Total tracked | 208 |
| Functional | 159 |
| Non-functional | 49 |
| P0 / P1 / P2 / P3 | 113 / 59 / 27 / 9 |
| PLANNED | 199 |
| BLOCKED | 0 |
| NOT STARTED (backlog) | 9 |
| Implemented, Tested, Verified | 0 |

**No application code exists. Every feature is classified NOT IMPLEMENTED.**

The planned target classification for each feature is in `01_REQUIREMENTS/FUNCTIONAL_REQUIREMENTS.md`. Source tags are defined there too.


## ONB: Onboarding and entry

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-ONB-01 | Account registration and login | ES-STACK; DK-s10; DK-s11; UI-01; UB-FOSS; D-027 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ONB-02 | Landing experience | UI-01; PS-U2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ONB-03 | Profile setup | DK-s11; DK-s12; PS-U3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ONB-04 | Consent capture | DK-s8; PS-R3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ONB-05 | Two onboarding paths | DK-s12 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ONB-06 | Context-adaptive onboarding | PS-Q1; PS-U3; PN-RAJ-1; PN-KIS-1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## DOC: Document intelligence and Document Hub

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-DOC-01 | Document upload | DK-s12; DK-s11; ES-A5 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-02 | Secure document vault | ES-STACK; DK-s14; DK-s12; UB-FOSS; D-024 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-03 | OCR extraction | ES-STACK; DK-s12 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-04 | Structured AI extraction | DK-s12 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-05 | Extraction validation | DK-s12; UI-02 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-06 | Raw-document isolation | DK-s12; DK-s14; ES-INV | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-07 | All supported document types | DK-s12; DK-s14; PN-DIV-5 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DOC-08 | Financial Document Hub | DK-s25; DK-s26 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## ASM: Financial assessment and dynamic questionnaire

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-ASM-01 | Assessment wizard | UI-02; DK-s29 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ASM-02 | Dynamic questionnaire | DK-s12; DK-s11; UI-02 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ASM-03 | Core data fields | DK-s12; UI-02 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ASM-04 | Voice answers | UI-02; PS-A2; PN-DIV-1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ASM-05 | Baseline score trigger | DK-s11; DK-s29 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## FLG: Financial Life Graph (Financial Digital Twin)

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-FLG-01 | Graph schema | ES-2.1; DK-s13; UB-IN2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-02 | Twin coverage | ES-2.1; UB-IN2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-03 | Create | DK-s13; DK-s11 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-04 | Enrich | DK-s13 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-05 | Enrich from external feeds | DK-s13 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-FLG-06 | Analyze | DK-s13; DK-s10 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-07 | Act and guide | ES-2.1; DK-s13; PS-Q1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-08 | Evolve | DK-s13 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-09 | Graph access gateway | ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FLG-10 | Life Graph screen | UI-09; UI-16 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## FCS: Financial Confidence Score

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-FCS-01 | Overall score | ES-INV; UB-IN3; UI-04; UI-10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FCS-02 | Score dimensions | ES-INV; UI-10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FCS-03 | Deterministic explainable formula | ER; PS-R1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FCS-04 | Confidence Engine | DK-s29 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FCS-05 | Improvement actions | UI-10; UI-11; DK-s26 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-FCS-06 | Score history | UI-04; UI-13; DK-s11 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## ORC: Multi-agent orchestration

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-ORC-01 | LangGraph orchestrator | ES-2.1; ES-STACK; UB-IN1; PS-T1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ORC-02 | Shared state | DK-s10; ES-STACK | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ORC-03 | Multi-agent handoff | DK-s15; PS-T1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ORC-04 | Graceful failure | ER; PS-R2 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ORC-05 | Multimodal input | ES-A5; PS-A2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ORC-06 | Agent attribution | UI-03; UI-06; UI-07; UI-08; D-018 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ORC-07 | LLM provider abstraction | UB-Q2; UB-FOSS; ER; D-002 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## DL: Dual-LLM privacy tier

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-DL-01 | Dual-LLM routing | ES-INV; UB-IN4; UB-Q3; UB-FOSS; D-003; D-025 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DL-02 | Private-tier runtime | ES-INV; UB-Q3; UB-FOSS; D-003; D-025 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DL-03 | Sensitive-data minimisation | DK-s12; PS-R3; ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DL-04 | Data-flow audit log | ER; PS-R1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DL-05 | No external data egress | UB-FOSS; UB-Q3; D-026; PN-DIV-7 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## KB: Knowledge base and retrieval

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-KB-01 | Knowledge corpus | DK-s14; DK-s10; ES-A1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-KB-02 | Ingestion pipeline | ES-STACK; DK-s10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-KB-03 | Vector store | DK-s14; ES-STACK; C-010 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-KB-04 | Metadata filtering | ER; DK-s14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## ASK: Ask VAAKYA (conversational interface)

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-ASK-01 | Chat interface | UI-05; DK-s26 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ASK-02 | Why this recommendation | UI-05; PS-U2; PS-R1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ASK-03 | Conversation history | UI-14; DK-s14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## EDU: Educator Agent and Learning Academy

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-EDU-01 | Grounded financial Q&A | ES-A1; ES-A5; PS-E1; DK-s29 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-02 | Simple-language explanations | ES-A1; DK-s15; PN-PRI-1; PS-U1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-03 | Role-based content | DK-s24; PN-PRI-5; PN-RAJ-6; PN-KIS-7 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-04 | Micro-learning modules | UI-08; DK-s15; DK-s24; PS-E1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-05 | Quizzes and knowledge-gap detection | DK-s24 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-06 | Adaptive learning path | DK-s15; DK-s24; DK-s25 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-07 | Reviewed learning content | DK-s8; PS-R4 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-08 | Learning progress | DK-s29; DK-s14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-09 | Product evaluation assistant | ES-2.2; DK-s6; PN-PRI-3 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-10 | Statement explanation | PN-DIV-5 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-EDU-11 | Tax-saving education | PN-DIV-4; UI-11; DK-s6 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## STR: Strategy Builder Agent and Goal Studio

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-STR-01 | Goal Studio | DK-s11; DK-s24; UI-02; UI-03; PN-PRI-2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-02 | AI-recommended goals | DK-s24 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-03 | Feasibility analysis | DK-s24; UI-03 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-04 | Deterministic financial calculators | ER; PS-R2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-05 | AI roadmap | DK-s24; DK-s11; ES-A2; UI-03 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-06 | Irregular-income planning | PS-E3; PS-E9; PN-RAJ-1; PN-RAJ-2; ES-2.2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-07 | Seasonal-income planning | PS-E3; PS-E9; PN-KIS-1; PN-KIS-4 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-08 | Goal progress tracking | DK-s29; DK-s25; UI-03 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-09 | Bite-sized next steps | PN-RAJ-5; DK-s15 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-10 | Retirement planning | PN-PRI-2; PS-E9; DK-s24 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-11 | Proactive nudges | ES-A5; ES-APPB; PS-U1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-12 | Debt-trap guidance | PN-RAJ-4; PN-KIS-2; PS-Q4 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-13 | Trade-off guidance | PN-KIS-5 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-STR-14 | Farming context information | PN-KIS-6; PS-E9 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## SEN: Sentinel Agent and Scam Shield

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-SEN-01 | Suspicious content capture | UI-06; ES-A5; DK-s29 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-02 | Message and offer analysis | ES-INV; ES-A3; UB-IN6; PS-E2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-03 | OCR for screenshots | ES-A5; ES-STACK | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-04 | Risk score and verdict | ES-A3; UI-06; DK-s10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-05 | Explainable reasons | UI-06; PS-R1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-06 | Recommended protective actions | UI-06; DK-s15; DK-s29 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-07 | Known-pattern matching | UI-06; DK-s14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-08 | Predatory loan detection | ES-2.1; ES-A3; PN-RAJ-4; DK-s10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-09 | Investment-tip verification | PN-PRI-4; ES-2.1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-10 | Scam Knowledge Center | UI-15; DK-s15; PS-E2 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-11 | Scam history | DK-s10; DK-s25 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-12 | Link analysis | DK-s15; ES-A3 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SEN-13 | Call analysis | DK-s15 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-SEN-14 | Transaction analysis | DK-s15 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-SEN-15 | Real-time passive monitoring | DK-s15; DK-s11; ES-APPB | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-SEN-16 | Escalation to official channels | PS-R4; UI-15; ER | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## CON: Connector Agent and Scheme Advisor

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-CON-01 | Scheme catalogue | DK-s6; UI-07; ES-A4; PN-KIS-3; UB-IN7 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-02 | Deterministic eligibility engine | ER; ES-A4; ES-APPB | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-03 | Eligibility explanation | UI-12; PS-R1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-04 | Benefit estimation | ES-A4; UI-07 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-05 | Application guidance | ES-A4; ES-APPB; DK-s29; PN-KIS-3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-06 | Scheme search and filters | UI-07 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-07 | Match ranking | UI-07; UI-11 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-08 | Disability benefits | PN-DIV-8; ES-2.2 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-09 | Farmer scheme flow | PN-KIS-3; PN-KIS-7; PS-E5 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-10 | Opportunities feed | UI-11; DK-s25; DK-s26 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-11 | Proactive eligibility detection | DK-s29; DK-s15; ES-APPB | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-12 | Scheme data freshness | DK-s8; ER | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-CON-13 | Employer-benefit awareness | PN-PRI-6 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## DSH: Dashboard

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-DSH-01 | Home dashboard | UI-04; DK-s24; DK-s10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DSH-02 | Risk profile | UI-04; UI-02 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DSH-03 | Recent activity | UI-04 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DSH-04 | Spending overview | UI-13; PN-PRI-7 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-DSH-05 | App navigation | UI-04; UI-05 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## COA: Monthly Financial Coach

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-COA-01 | Monthly review generation | DK-s24; DK-s25; DK-s11 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-COA-02 | Monthly report screen | UI-13 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-COA-03 | Review email | DK-s24; DK-s27; UB-FOSS | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-COA-04 | One-click review loop | DK-s24 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-COA-05 | Reminders | DK-s25; DK-s8; DK-s13 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## ENG: Engagement mechanics

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-ENG-01 | XP, levels and badges | UI-08; PS-E6; PS-Q6 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ENG-02 | Streaks | UI-04; UI-08; PS-E6 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ENG-03 | Daily challenge | UI-08; PS-I2 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ENG-04 | Retention flywheel | DK-s25; PS-I2 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-ENG-05 | Social support | PS-E6 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |

## IMP: Behavioral impact measurement

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-IMP-01 | Behaviour event log | ES-INV; UB-IN8; PS-I1; PS-Q7 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-IMP-02 | Three-tier impact framework | ES-APPB; UB-IN8; PS-E7; PS-I1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-IMP-03 | Verified rupee change | ES-APPB; UB-IN8; PS-Q7 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-IMP-04 | Pre and post literacy measurement | PS-I1; PS-Q7 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-IMP-05 | Impact dashboard | DK-s26; PS-Q7 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## VOI: Voice pipeline

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-VOI-01 | Speech to text | ES-STACK; UB-FOSS; UB-Q5; D-009; DK-s10; PN-DIV-1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-02 | Text to speech | UB-FOSS; UB-Q5; D-009; DK-s10; PN-DIV-1; C-012 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-03 | End-to-end voice pipeline | DK-s10; ES-INV; UB-IN5 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-04 | Voice Companion screen | UI-14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-05 | Voice navigation | UI-01; UI-14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-06 | Voice Explain and Voice Summary | UI-03; UI-04; UI-06 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-07 | Regional-language voice | PN-PRI-1; PN-KIS-7; PS-A2; UB-Q5 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-VOI-08 | IVR access | ES-APPB; DK-s10-OLD | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-VOI-09 | Speech engine abstraction | UB-FOSS; ER; D-009 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## A11: Accessibility features

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-A11-01 | Accessibility settings | UI-01; UI-02; DK-s10 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-A11-02 | Non-visual chart equivalents | PN-DIV-3; PS-A1; UB-IN5 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-A11-03 | Screen-reader native flows | ES-APPB; ES-INV; PN-DIV-2; PS-E4 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-A11-04 | Independent private use | PN-DIV-7; PS-Q5 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## LNG: Language and literacy adaptation

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-LNG-01 | Interface localisation | UB-Q5; UI-01; PN-PRI-1; PN-KIS-7; PS-A1; C-009 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-LNG-02 | Language-aware AI responses | UB-Q5; ES-STACK; DK-s27; PS-E5; PS-Q1; D-028 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-LNG-03 | Culturally relevant content | PS-E5; PN-KIS-7; DK-s26 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-LNG-04 | Low-literacy mode | PS-A1; PS-A2; ES-INV; PS-Q2 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-LNG-05 | Language extensibility | UB-Q5 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## OFF: PWA and offline

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-OFF-01 | Installable PWA | ES-STACK; DK-s10 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-OFF-02 | Offline learning packs | ES-APPB; PS-A3 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-OFF-03 | Offline-first shell | DK-s10-DEP; PS-A3 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-OFF-04 | Low-bandwidth operation | PS-A1; PS-Q5; NFR-COMP-02 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## SAF: Responsible AI safeguards

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-SAF-01 | AI transparency | PS-R1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SAF-02 | Educational positioning | DK-s8; PS-R2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SAF-03 | Output guardrails | PS-R2; PS-Q4 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SAF-04 | Source citations | PS-U2; PS-Q4; UI-01 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SAF-05 | Human escalation | PS-R4; DK-s10-OLD | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| FR-SAF-06 | Data controls | PS-R3; DK-s8 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |

## BIZ: Ecosystem and future business (vision only)

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| FR-BIZ-01 | Educator and NGO tools | PS-E8 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-BIZ-02 | Partner ecosystem | DK-s26; PS-T2 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |
| FR-BIZ-03 | External financial integrations | DK-s10-OLD; PS-T2 | P3 | No | No | No | No | NOT STARTED | None | NOT IMPLEMENTED |

## Non-functional requirements

| Feature ID | Feature | Source | Priority | Planned | Implemented | Tested | Verified | Status | Evidence | Classification |
|---|---|---|---|---|---|---|---|---|---|---|
| NFR-PERF-01 | Text response time | ER | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-PERF-02 | Voice round trip | ER; PS-A2 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-PERF-03 | Dashboard load | ER; DK-s14 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-PERF-04 | Scam check time | ER; DK-s15 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SCAL-01 | Stateless API tier | DK-s10; PS-I3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SCAL-02 | Scale path documented | DK-s7; PS-I3 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SCAL-03 | Inference queue | ER; UB-FOSS | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-AVAIL-01 | LLM failure handling | ER; PS-R2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-AVAIL-02 | Environments and rollback | ER; UB-Q1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-AVAIL-03 | Data durability | ER; D-007 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-01 | Authentication everywhere | ER; ES-STACK; D-027 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-02 | Per-user authorisation | ER; PS-R3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-03 | Encryption | DK-s14; DK-s25 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-04 | Secrets management | ER; ES-STACK | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-05 | Upload safety | ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-06 | Prompt-injection resistance | ER; PS-R2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-07 | Safe logging | ER; PS-R3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-08 | Patched dependencies | ER; D-020 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-09 | Abuse limits | ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-SEC-10 | Pre-launch security review | ER; UB-Q1; UB-FOSS | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-PRIV-01 | Data minimisation | DK-s12; PS-R3 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-PRIV-02 | Retention and deletion | PS-R3; ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-PRIV-03 | DPDP compliance before real users | ER; UB-Q1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-A11Y-01 | WCAG conformance | ER; PS-A1; UB-IN5 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-A11Y-02 | Assistive-technology testing | ER; PN-DIV-2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-A11Y-03 | Target size and non-colour signalling | DK-s6; ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-A11Y-04 | Cognitive load | PS-U1 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-I18N-01 | Script support | ER; PN-KIS-7 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-I18N-02 | Indian number formats | ER; UI-03 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-01 | Scheme fact accuracy | DK-s8; ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-02 | Financial arithmetic correctness | ER; C-015 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-03 | Grounded answers | ER; ES-A5 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-04 | Scam detection quality | ER; DK-s8 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-05 | Routing accuracy | ER | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-06 | Safety evaluation | ER; PS-R2 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-ACC-07 | OCR quality | DK-s8 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-COMP-01 | Devices and browsers | ER; PS-A1 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-COMP-02 | Limited bandwidth | PS-A1; PS-Q5 | P2 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-OBS-01 | Tracing | ER; ES-STACK | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-OBS-02 | Monitoring | ER; UB-FOSS; D-007 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-MAINT-01 | Pinned versions | ER; UB-Q1; D-020 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-MAINT-02 | Documentation currency | UB-RULES | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-MAINT-03 | Automated quality gates | ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-MAINT-04 | Deployment automation | ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-MAINT-05 | Maintained documentation set | UB-Q9 | P1 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-COST-01 | Model resource control | DK-s12; DK-s14 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-COST-02 | Usage limits | UB-Q7; ER | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-LIC-01 | Free and open-source software only | UB-FOSS; D-026 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
| NFR-LIC-02 | No required paid or proprietary service | UB-FOSS; D-026 | P0 | Yes | No | No | No | PLANNED | None | NOT IMPLEMENTED |
