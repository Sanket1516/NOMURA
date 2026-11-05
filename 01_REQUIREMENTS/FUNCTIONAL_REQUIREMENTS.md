# Functional Requirements

**Project:** VAAKYA - AI Financial Guardian | **Last updated:** 2026-11-05 | **Status:** Draft, awaiting approval

**This file is the single source of truth for what the product must do.** Change it only with a matching entry in `DECISIONS_LOG.md`.

Status of every requirement is tracked in `00_PROJECT_MANAGEMENT/FEATURE_TRACKER.md`, which uses the same IDs.

Total: **159 functional requirements.**

## Source tags

| Tag | Meaning |
|---|---|
| `PS-*` | KakushIN Problem Statement PDF. See `PROBLEM_ANALYSIS.md`. The PDF states its outcomes are "illustrative guidelines, not requirements". |
| `PN-*` | A persona need taken from the problem statement. See `PERSONA_ANALYSIS.md`. |
| `ES-*` | Team Executive Summary (`ES-2.1`, `ES-2.2`, `ES-INV` Key Innovations, `ES-STACK` tech table, `ES-A1`...`ES-A4` agents, `ES-A5` Appendix A, `ES-APPB` Appendix B). |
| `DK-sN` | Slide N of `FINAL SUBMISSION ALL.pptx`. `DK-s10-OLD` is the superseded HLD hidden under slide 10. `DK-s10-DEP` is the dependency map embedded in the Executive Summary. |
| `UI-NN` | Mockup screen from deck slides 16-23. **These are design images, not a running product.** See `MASTER_PLAN.md` Appendix A. |
| `UB-IN*`, `UB-RULES` | The owner's planning brief. |
| `UB-Qn` | The owner's answer to question n in `DECISIONS_LOG.md`, dated 2026-11-05. |
| `UB-FOSS` | The owner's instruction that everything must be free and open source, dated 2026-11-05. |
| `ER` | **Engineering recommendation**. Not in any source document. |
| `C-NNN`, `D-NNN` | Conflict or decision in `00_PROJECT_MANAGEMENT/DECISIONS_LOG.md`. |

## Priority

| Priority | Meaning |
|---|---|
| P0 | Required for Release 1, private beta. |
| P1 | Required for Release 2, v1.0. |
| P2 | Release 3, after v1.0. |
| P3 | Vision only. Needs external partners or capabilities that are not defined. Documented for traceability, not scheduled. |

Priorities are engineering proposals pending plan approval; no source document assigns priority.


## ONB: Onboarding and entry

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-ONB-01 | **Account registration and login.** Users register and sign in through self-hosted Keycloak with email, with Google sign-in as an optional identity provider, and managed sessions. | ES-STACK; DK-s10; DK-s11; UI-01; UB-FOSS; D-027 | P0 | PH1 | REAL IMPLEMENTATION |
| FR-ONB-02 | **Landing experience.** Entry screen offers Start Financial Assessment, Try Voice Mode, language selection, accessibility entry, and trust signals. | UI-01; PS-U2 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ONB-03 | **Profile setup.** Capture name, age, occupation, location, preferred language, income type and accessibility needs. | DK-s11; DK-s12; PS-U3 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ONB-04 | **Consent capture.** Capture explicit, itemised consent for document storage and AI processing before any upload; consent is viewable and withdrawable. | DK-s8; PS-R3 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ONB-05 | **Two onboarding paths.** User chooses Upload Financial Documents or Complete Guided Questionnaire. | DK-s12 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ONB-06 | **Context-adaptive onboarding.** Questions and defaults adapt to income pattern (salaried, gig/variable, seasonal/agricultural) and literacy level. | PS-Q1; PS-U3; PN-RAJ-1; PN-KIS-1 | P0 | PH4 | REAL IMPLEMENTATION |

## DOC: Document intelligence and Document Hub

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-DOC-01 | **Document upload.** Upload PDF or image financial documents from the PWA (camera or file). | DK-s12; DK-s11; ES-A5 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-DOC-02 | **Secure document vault.** Store raw documents encrypted in self-hosted S3-compatible object storage (SeaweedFS), under a per-user path, with access limited to the owning user. | ES-STACK; DK-s14; DK-s12; UB-FOSS; D-024 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-DOC-03 | **OCR extraction.** Extract text from uploaded documents on the VAAKYA host, using PaddleOCR with Tesseract as the fallback for scripts PaddleOCR does not cover. | ES-STACK; DK-s12 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-DOC-04 | **Structured AI extraction.** Convert OCR text into structured data on the VAAKYA host: income and cash flow, investments, insurance coverage, assets and liabilities, land ownership, behaviour indicators. | DK-s12 | P0 | PH4 | PARTIAL IMPLEMENTATION |
| FR-DOC-05 | **Extraction validation.** Extracted values are validated and shown to the user for confirmation before they enter the twin. | DK-s12; UI-02 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-DOC-06 | **Raw-document isolation.** Raw documents never leave the VAAKYA host. Agents use structured insights, not raw files. | DK-s12; DK-s14; ES-INV | P0 | PH4 | REAL IMPLEMENTATION |
| FR-DOC-07 | **All supported document types.** Support salary slips, bank statements, LIC policies, insurance documents, EPF statements, investment records, 7/12 land records and government scheme documents. | DK-s12; DK-s14; PN-DIV-5 | P2 | PH4 | PARTIAL IMPLEMENTATION |
| FR-DOC-08 | **Financial Document Hub.** One place to view, search and delete all uploaded financial documents. | DK-s25; DK-s26 | P2 | PH8 | REAL IMPLEMENTATION |

## ASM: Financial assessment and dynamic questionnaire

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-ASM-01 | **Assessment wizard.** Multi-step assessment with visible step progress and Back/Next, covering income, dependents, goals and risk appetite. | UI-02; DK-s29 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ASM-02 | **Dynamic questionnaire.** Ask only for information still missing after extraction. | DK-s12; DK-s11; UI-02 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ASM-03 | **Core data fields.** Collect monthly expenses, existing loans, family dependents, savings goals and risk preference. | DK-s12; UI-02 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-ASM-04 | **Voice answers.** Any assessment question can be answered by voice. | UI-02; PS-A2; PN-DIV-1 | P1 | PH9 | REAL IMPLEMENTATION |
| FR-ASM-05 | **Baseline score trigger.** Completing the assessment produces the baseline Financial Confidence Score. | DK-s11; DK-s29 | P0 | PH8 | REAL IMPLEMENTATION |

## FLG: Financial Life Graph (Financial Digital Twin)

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-FLG-01 | **Graph schema.** Per-user graph in Neo4j modelling User, Goal, Milestone, Investment, InsurancePolicy, Person/Asset, PremiumPayment, Scheme, Benefit, Authority, Income, Liability, Banking and Risk, with PURSUES, HAS, REQUIRES, OWNS, COVERS, DUE_FOR, ELIGIBLE_FOR, PROVIDES and ISSUED_BY relationships. | ES-2.1; DK-s13; UB-IN2 | P0 | PH2 | REAL IMPLEMENTATION |
| FR-FLG-02 | **Twin coverage.** The twin represents financial profile, goals, learning progress, risk exposure, scheme eligibility and financial behaviour. | ES-2.1; UB-IN2 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-FLG-03 | **Create.** Build the twin from documents, questionnaire and initial data. | DK-s13; DK-s11 | P0 | PH4 | REAL IMPLEMENTATION |
| FR-FLG-04 | **Enrich.** Update the twin from user inputs, agent outcomes and learning events. | DK-s13 | P1 | PH5 | REAL IMPLEMENTATION |
| FR-FLG-05 | **Enrich from external feeds.** Update the twin from transactions, behaviour and market data feeds. | DK-s13 | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-FLG-06 | **Analyze.** Identify patterns, gaps, opportunities and risks from the graph. | DK-s13; DK-s10 | P1 | PH5 | REAL IMPLEMENTATION |
| FR-FLG-07 | **Act and guide.** Agents use twin context to personalise answers, recommendations and alerts instead of generic responses. | ES-2.1; DK-s13; PS-Q1 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-FLG-08 | **Evolve.** The twin improves recommendations from actions and outcomes over time. | DK-s13 | P2 | PH8 | PARTIAL IMPLEMENTATION |
| FR-FLG-09 | **Graph access gateway.** All graph reads and writes go through one parameterised, user-scoped service layer. | ER | P0 | PH2 | REAL IMPLEMENTATION |
| FR-FLG-10 | **Life Graph screen.** Show how income, savings, emergency fund, insurance, goals, investments and schemes connect, with AI insights. | UI-09; UI-16 | P1 | PH8 | REAL IMPLEMENTATION |

## FCS: Financial Confidence Score

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-FCS-01 | **Overall score.** Show a 0-100 Financial Confidence Score with a band and short interpretation. | ES-INV; UB-IN3; UI-04; UI-10 | P0 | PH8 | REAL IMPLEMENTATION |
| FR-FCS-02 | **Score dimensions.** Report sub-scores. ES names literacy, savings behaviour, scam awareness and goal progression; UI-10 adds scheme awareness. Five-dimension set proposed in D-011. | ES-INV; UI-10 | P0 | PH8 | REAL IMPLEMENTATION |
| FR-FCS-03 | **Deterministic explainable formula.** Score is computed by versioned code from recorded events, never by the LLM. The LLM may only explain it. | ER; PS-R1 | P0 | PH8 | REAL IMPLEMENTATION |
| FR-FCS-04 | **Confidence Engine.** Consolidate activity across learning, goals, safety and schemes into score updates. | DK-s29 | P0 | PH8 | REAL IMPLEMENTATION |
| FR-FCS-05 | **Improvement actions.** Show next-best actions with honest estimated point impact. | UI-10; UI-11; DK-s26 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-FCS-06 | **Score history.** Show change over time. | UI-04; UI-13; DK-s11 | P1 | PH8 | REAL IMPLEMENTATION |

## ORC: Multi-agent orchestration

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-ORC-01 | **LangGraph orchestrator.** Route each request to the Educator, Strategy Builder, Sentinel or Connector agent through LangGraph. | ES-2.1; ES-STACK; UB-IN1; PS-T1 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-ORC-02 | **Shared state.** Orchestrator keeps workflow state and shared user context across agents. | DK-s10; ES-STACK | P0 | PH3 | REAL IMPLEMENTATION |
| FR-ORC-03 | **Multi-agent handoff.** One request can involve more than one agent. | DK-s15; PS-T1 | P1 | PH7 | REAL IMPLEMENTATION |
| FR-ORC-04 | **Graceful failure.** Agent or tool failure returns a safe, understandable message and never a fabricated answer. | ER; PS-R2 | P1 | PH3 | REAL IMPLEMENTATION |
| FR-ORC-05 | **Multimodal input.** Accept text, voice and image input through one pipeline. | ES-A5; PS-A2 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-ORC-06 | **Agent attribution.** Each response and screen shows which agent produced it, mapped consistently. | UI-03; UI-06; UI-07; UI-08; D-018 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-ORC-07 | **LLM provider abstraction.** All LLM calls go through one adapter, so models can be switched by configuration per agent task, with a fallback model. Only self-hosted open-licence models are configured by default. | UB-Q2; UB-FOSS; ER; D-002 | P0 | PH1 | REAL IMPLEMENTATION |

## DL: Dual-LLM privacy tier

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-DL-01 | **Dual-LLM routing.** Private Tier: a small open model plus rules handles sensitive information, personal financial data and PII redaction. Reasoning Tier: a larger open model handles complex reasoning, planning, personalised explanations, scam analysis and multi-agent workflows. Both tiers are self-hosted. | ES-INV; UB-IN4; UB-Q3; UB-FOSS; D-003; D-025 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-DL-02 | **Private-tier runtime.** Run both LLM tiers on the VAAKYA host through Ollama, with models selected by evaluation T0.03. | ES-INV; UB-Q3; UB-FOSS; D-003; D-025 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-DL-03 | **Sensitive-data minimisation.** Classify and redact or pseudonymise personal and financial identifiers before any cloud call. | DK-s12; PS-R3; ER | P0 | PH3 | REAL IMPLEMENTATION |
| FR-DL-04 | **Data-flow audit log.** Record which fields left the private tier for each request, without storing their values. | ER; PS-R1 | P1 | PH3 | REAL IMPLEMENTATION |
| FR-DL-05 | **No external data egress.** In the default configuration, no user data is sent to any external AI, speech, translation or analytics service. | UB-FOSS; UB-Q3; D-026; PN-DIV-7 | P0 | PH3 | REAL IMPLEMENTATION |

## KB: Knowledge base and retrieval

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-KB-01 | **Knowledge corpus.** Curate financial literacy lessons, RBI documents, SEBI guidelines, government schemes, insurance rules, financial concepts, a scam knowledge base and FAQs. | DK-s14; DK-s10; ES-A1 | P0 | PH2 | PARTIAL IMPLEMENTATION |
| FR-KB-02 | **Ingestion pipeline.** LlamaIndex ingestion, chunking and retrieval with multilingual-e5-large embeddings. | ES-STACK; DK-s10 | P0 | PH2 | REAL IMPLEMENTATION |
| FR-KB-03 | **Vector store.** Store embeddings in Qdrant collection financial_knowledge with HNSW index, 1024 dimensions. | DK-s14; ES-STACK; C-010 | P0 | PH2 | REAL IMPLEMENTATION |
| FR-KB-04 | **Metadata filtering.** Filter retrieval by category, language and scheme applicability. | ER; DK-s14 | P1 | PH2 | REAL IMPLEMENTATION |

## ASK: Ask VAAKYA (conversational interface)

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-ASK-01 | **Chat interface.** Ask VAAKYA chat with greeting, suggested prompts, quick topic chips, text and tap-to-speak input. | UI-05; DK-s26 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-ASK-02 | **Why this recommendation.** Each recommendation exposes its inputs and calculation in plain language. | UI-05; PS-U2; PS-R1 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-ASK-03 | **Conversation history.** Recent conversations can be viewed and resumed. | UI-14; DK-s14 | P1 | PH3 | REAL IMPLEMENTATION |

## EDU: Educator Agent and Learning Academy

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-EDU-01 | **Grounded financial Q&A.** Answer financial questions using the RAG pipeline over trusted sources, with citations. | ES-A1; ES-A5; PS-E1; DK-s29 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-EDU-02 | **Simple-language explanations.** Explain complex concepts in simple, relatable language adapted to literacy level and preferred language. | ES-A1; DK-s15; PN-PRI-1; PS-U1 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-EDU-03 | **Role-based content.** Tailor content to role and life stage (teacher, farmer, gig worker). | DK-s24; PN-PRI-5; PN-RAJ-6; PN-KIS-7 | P1 | PH3 | REAL IMPLEMENTATION |
| FR-EDU-04 | **Micro-learning modules.** Short modules: SIP Basics, Insurance 101, Emergency Fund, Credit Score, Smart Budgeting, Digital Safety. | UI-08; DK-s15; DK-s24; PS-E1 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-EDU-05 | **Quizzes and knowledge-gap detection.** Personalised quizzes identify gaps and feed recommendations. | DK-s24 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-EDU-06 | **Adaptive learning path.** Learning path adapts continuously to progress. | DK-s15; DK-s24; DK-s25 | P2 | PH8 | PARTIAL IMPLEMENTATION |
| FR-EDU-07 | **Reviewed learning content.** AI-generated learning content is reviewed for accuracy before being published to users. | DK-s8; PS-R4 | P1 | PH2 | REAL IMPLEMENTATION |
| FR-EDU-08 | **Learning progress.** Track lessons, quizzes and completion, and feed the Confidence Engine. | DK-s29; DK-s14 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-EDU-09 | **Product evaluation assistant.** Explain and compare financial products (SIP, mutual funds, ULIP, term insurance, PPF, ELSS) so users can evaluate them before committing, including questions to ask a seller. | ES-2.2; DK-s6; PN-PRI-3 | P1 | PH3 | REAL IMPLEMENTATION |
| FR-EDU-10 | **Statement explanation.** Explain a user's own EPF statement in plain spoken language. | PN-DIV-5 | P2 | PH8 | PARTIAL IMPLEMENTATION |
| FR-EDU-11 | **Tax-saving education.** Explain tax-saving instruments and when they apply, including tax-regime dependence. | PN-DIV-4; UI-11; DK-s6 | P2 | PH8 | PARTIAL IMPLEMENTATION |

## STR: Strategy Builder Agent and Goal Studio

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-STR-01 | **Goal Studio.** Create and edit goals (Emergency Fund, Retirement, Home Purchase, Education) with target and timeline, for short, medium and long term. | DK-s11; DK-s24; UI-02; UI-03; PN-PRI-2 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-STR-02 | **AI-recommended goals.** Recommend goals from the user's profile. | DK-s24 | P1 | PH5 | REAL IMPLEMENTATION |
| FR-STR-03 | **Feasibility analysis.** Assess achievability and risk, and optimise the timeline. | DK-s24; UI-03 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-STR-04 | **Deterministic financial calculators.** All money arithmetic is done in tested code; the LLM never computes figures. | ER; PS-R2 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-STR-05 | **AI roadmap.** Generate a roadmap with monthly saving targets and milestones. | DK-s24; DK-s11; ES-A2; UI-03 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-STR-06 | **Irregular-income planning.** Plan for variable income using income ranges, lean-month floors and percentage-based saving rather than fixed monthly amounts. | PS-E3; PS-E9; PN-RAJ-1; PN-RAJ-2; ES-2.2 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-STR-07 | **Seasonal-income planning.** Plan around sowing and harvest cycles, including how much to set aside for next season. | PS-E3; PS-E9; PN-KIS-1; PN-KIS-4 | P1 | PH5 | REAL IMPLEMENTATION |
| FR-STR-08 | **Goal progress tracking.** Track progress against milestones and update the twin. | DK-s29; DK-s25; UI-03 | P0 | PH5 | REAL IMPLEMENTATION |
| FR-STR-09 | **Bite-sized next steps.** Express plans as small, practical next actions. | PN-RAJ-5; DK-s15 | P1 | PH5 | REAL IMPLEMENTATION |
| FR-STR-10 | **Retirement planning.** Retirement goal support. | PN-PRI-2; PS-E9; DK-s24 | P2 | PH5 | PARTIAL IMPLEMENTATION |
| FR-STR-11 | **Proactive nudges.** Strategy Builder acts proactively as well as reactively, prompting users when goals drift. | ES-A5; ES-APPB; PS-U1 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-STR-12 | **Debt-trap guidance.** Help users avoid debt traps and compare loan cost in plain terms. | PN-RAJ-4; PN-KIS-2; PS-Q4 | P1 | PH5 | REAL IMPLEMENTATION |
| FR-STR-13 | **Trade-off guidance.** Explain trade-offs such as equipment versus children's education. | PN-KIS-5 | P2 | PH5 | PARTIAL IMPLEMENTATION |
| FR-STR-14 | **Farming context information.** Answer market price, MSP and crop-failure protection questions. | PN-KIS-6; PS-E9 | P2 | PH7 | PARTIAL IMPLEMENTATION |

## SEN: Sentinel Agent and Scam Shield

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-SEN-01 | **Suspicious content capture.** Upload a screenshot or take a photo (PNG or JPG up to 10 MB). | UI-06; ES-A5; DK-s29 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-02 | **Message and offer analysis.** Analyse suspicious messages, advertisements and loan offers, including pasted text. | ES-INV; ES-A3; UB-IN6; PS-E2 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-03 | **OCR for screenshots.** Extract text from screenshots using PaddleOCR. | ES-A5; ES-STACK | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-04 | **Risk score and verdict.** Return risk score, risk level and a verdict. | ES-A3; UI-06; DK-s10 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-05 | **Explainable reasons.** List the specific indicators behind the verdict. | UI-06; PS-R1 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-06 | **Recommended protective actions.** Give clear next actions. | UI-06; DK-s15; DK-s29 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-07 | **Known-pattern matching.** Match against the scam knowledge base in Qdrant. | UI-06; DK-s14 | P1 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-08 | **Predatory loan detection.** Identify predatory loan apps and offers. | ES-2.1; ES-A3; PN-RAJ-4; DK-s10 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-09 | **Investment-tip verification.** Assess unsolicited investment tips such as those received on WhatsApp. | PN-PRI-4; ES-2.1 | P0 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-10 | **Scam Knowledge Center.** Recent patterns, protection tips, alert feed and emerging fraud education. | UI-15; DK-s15; PS-E2 | P2 | PH6 | PARTIAL IMPLEMENTATION |
| FR-SEN-11 | **Scam history.** Record checks in the twin and feed the safety dimension. | DK-s10; DK-s25 | P1 | PH6 | REAL IMPLEMENTATION |
| FR-SEN-12 | **Link analysis.** Analyse suspicious links. | DK-s15; ES-A3 | P2 | PH6 | PARTIAL IMPLEMENTATION |
| FR-SEN-13 | **Call analysis.** Analyse calls. | DK-s15 | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-SEN-14 | **Transaction analysis.** Analyse transactions. | DK-s15 | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-SEN-15 | **Real-time passive monitoring.** Real-time alerts without the user submitting content. | DK-s15; DK-s11; ES-APPB | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-SEN-16 | **Escalation to official channels.** Provide official reporting routes for suspected fraud. | PS-R4; UI-15; ER | P1 | PH6 | REAL IMPLEMENTATION |

## CON: Connector Agent and Scheme Advisor

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-CON-01 | **Scheme catalogue.** Curated, sourced dataset covering PM-KISAN, PMFBY, KCC, PMSBY, PMJJBY, APY, Mudra, Sukanya Samriddhi and schemes for persons with disabilities. | DK-s6; UI-07; ES-A4; PN-KIS-3; UB-IN7 | P0 | PH2 | PARTIAL IMPLEMENTATION |
| FR-CON-02 | **Deterministic eligibility engine.** Evaluate eligibility with rules against profile attributes; the LLM explains but does not decide. | ER; ES-A4; ES-APPB | P0 | PH7 | REAL IMPLEMENTATION |
| FR-CON-03 | **Eligibility explanation.** Show a per-criterion breakdown of why the user qualifies or does not. | UI-12; PS-R1 | P0 | PH7 | REAL IMPLEMENTATION |
| FR-CON-04 | **Benefit estimation.** Estimate potential benefits. | ES-A4; UI-07 | P1 | PH7 | REAL IMPLEMENTATION |
| FR-CON-05 | **Application guidance.** Step-by-step application guide per scheme. | ES-A4; ES-APPB; DK-s29; PN-KIS-3 | P0 | PH7 | REAL IMPLEMENTATION |
| FR-CON-06 | **Scheme search and filters.** Search and filter by Insurance, Pension, Agriculture and Credit. | UI-07 | P1 | PH7 | REAL IMPLEMENTATION |
| FR-CON-07 | **Match ranking.** Rank schemes by fit. | UI-07; UI-11 | P2 | PH7 | PARTIAL IMPLEMENTATION |
| FR-CON-08 | **Disability benefits.** Discover and explain schemes for persons with disabilities and how to manage benefits. | PN-DIV-8; ES-2.2 | P1 | PH7 | REAL IMPLEMENTATION |
| FR-CON-09 | **Farmer scheme flow.** Complete Kisan flow for PM-KISAN, crop insurance and Kisan Credit Card, in Kannada. | PN-KIS-3; PN-KIS-7; PS-E5 | P0 | PH7 | REAL IMPLEMENTATION |
| FR-CON-10 | **Opportunities feed.** Consolidated feed of schemes, tax opportunities, emergency-fund gaps and learning. | UI-11; DK-s25; DK-s26 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-CON-11 | **Proactive eligibility detection.** System detects eligibility without the user asking. | DK-s29; DK-s15; ES-APPB | P1 | PH7 | REAL IMPLEMENTATION |
| FR-CON-12 | **Scheme data freshness.** Show last-verified date and handle stale data. | DK-s8; ER | P1 | PH7 | REAL IMPLEMENTATION |
| FR-CON-13 | **Employer-benefit awareness.** Prompt salaried users to review employer benefits. | PN-PRI-6 | P2 | PH7 | PARTIAL IMPLEMENTATION |

## DSH: Dashboard

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-DSH-01 | **Home dashboard.** Unified view of confidence score, financial snapshot, goal progress, learning progress, scheme status, scam risk, AI insight and opportunities. | UI-04; DK-s24; DK-s10 | P0 | PH8 | REAL IMPLEMENTATION |
| FR-DSH-02 | **Risk profile.** Show risk appetite with an explanation. | UI-04; UI-02 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-DSH-03 | **Recent activity.** Timeline of goals, lessons and schemes. | UI-04 | P2 | PH8 | REAL IMPLEMENTATION |
| FR-DSH-04 | **Spending overview.** Show where money goes. | UI-13; PN-PRI-7 | P2 | PH8 | PARTIAL IMPLEMENTATION |
| FR-DSH-05 | **App navigation.** Bottom navigation for Home, Goals, Ask VAAKYA, Learn and Profile. | UI-04; UI-05 | P0 | PH3 | REAL IMPLEMENTATION |

## COA: Monthly Financial Coach

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-COA-01 | **Monthly review generation.** AI-generated review of goals, score changes, learning, newly eligible schemes, scam and risk alerts, and recommendations. | DK-s24; DK-s25; DK-s11 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-COA-02 | **Monthly report screen.** In-app report with snapshot, achievements, alerts and focus areas. | UI-13 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-COA-03 | **Review email.** Send the review by email through a self-hosted SMTP service. | DK-s24; DK-s27; UB-FOSS | P2 | PH8 | REAL IMPLEMENTATION |
| FR-COA-04 | **One-click review loop.** Email to dashboard update to progress submission to updated twin to improved recommendations. | DK-s24 | P2 | PH8 | PARTIAL IMPLEMENTATION |
| FR-COA-05 | **Reminders.** Milestone, periodic review and insurance premium renewal reminders. | DK-s25; DK-s8; DK-s13 | P2 | PH8 | REAL IMPLEMENTATION |

## ENG: Engagement mechanics

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-ENG-01 | **XP, levels and badges.** Gamified learning progression. | UI-08; PS-E6; PS-Q6 | P2 | PH8 | REAL IMPLEMENTATION |
| FR-ENG-02 | **Streaks.** Daily streak tracking. | UI-04; UI-08; PS-E6 | P2 | PH8 | REAL IMPLEMENTATION |
| FR-ENG-03 | **Daily challenge.** Short daily question set. | UI-08; PS-I2 | P2 | PH8 | REAL IMPLEMENTATION |
| FR-ENG-04 | **Retention flywheel.** Learning, goals, reviews, opportunities, protection, return loop, supported by the engagement drivers. | DK-s25; PS-I2 | P1 | PH8 | PARTIAL IMPLEMENTATION |
| FR-ENG-05 | **Social support.** Peer or community support mechanisms. | PS-E6 | P3 | BACKLOG | NOT IMPLEMENTED |

## IMP: Behavioral impact measurement

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-IMP-01 | **Behaviour event log.** Record outcome-relevant actions rather than engagement counts. | ES-INV; UB-IN8; PS-I1; PS-Q7 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-IMP-02 | **Three-tier impact framework.** Measure knowledge, behaviour and outcome. ES Appendix B names a 3-tier framework but no source defines the tiers; definition proposed in D-012. | ES-APPB; UB-IN8; PS-E7; PS-I1 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-IMP-03 | **Verified rupee change.** Track verified rupee behavioural change. | ES-APPB; UB-IN8; PS-Q7 | P2 | PH8 | PARTIAL IMPLEMENTATION |
| FR-IMP-04 | **Pre and post literacy measurement.** Compare knowledge before and after learning. | PS-I1; PS-Q7 | P1 | PH8 | REAL IMPLEMENTATION |
| FR-IMP-05 | **Impact dashboard.** Aggregate outcome view. | DK-s26; PS-Q7 | P2 | PH8 | REAL IMPLEMENTATION |

## VOI: Voice pipeline

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-VOI-01 | **Speech to text.** Transcribe user speech on the VAAKYA host with Whisper Large-v3 through faster-whisper, behind the speech adapter. | ES-STACK; UB-FOSS; UB-Q5; D-009; DK-s10; PN-DIV-1 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-VOI-02 | **Text to speech.** Speak responses on the VAAKYA host using an open-licence engine behind the speech adapter, in all four languages. Indic Parler-TTS is the first candidate and eSpeak NG the baseline. | UB-FOSS; UB-Q5; D-009; DK-s10; PN-DIV-1; C-012 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-VOI-03 | **End-to-end voice pipeline.** Audio input to transcription to translation to redaction to LangGraph to LLM to translation to spoken response. | DK-s10; ES-INV; UB-IN5 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-VOI-04 | **Voice Companion screen.** Listening state, language selector, try-asking prompts, recent conversations. | UI-14 | P1 | PH9 | REAL IMPLEMENTATION |
| FR-VOI-05 | **Voice navigation.** Navigate the app by voice. | UI-01; UI-14 | P1 | PH9 | PARTIAL IMPLEMENTATION |
| FR-VOI-06 | **Voice Explain and Voice Summary.** Page-level spoken summary of the current screen. | UI-03; UI-04; UI-06 | P1 | PH9 | REAL IMPLEMENTATION |
| FR-VOI-07 | **Regional-language voice.** Voice input and speech output work in English, Hindi, Marathi and Kannada. | PN-PRI-1; PN-KIS-7; PS-A2; UB-Q5 | P0 | PH9 | REAL IMPLEMENTATION |
| FR-VOI-08 | **IVR access.** Telephone access for users without smartphones. | ES-APPB; DK-s10-OLD | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-VOI-09 | **Speech engine abstraction.** All speech calls go through one adapter, so engines can differ by language and be replaced by configuration. | UB-FOSS; ER; D-009 | P0 | PH3 | REAL IMPLEMENTATION |

## A11: Accessibility features

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-A11-01 | **Accessibility settings.** Control text size, contrast, reduced motion and voice-first mode from every screen. | UI-01; UI-02; DK-s10 | P1 | PH9 | REAL IMPLEMENTATION |
| FR-A11-02 | **Non-visual chart equivalents.** Every chart, gauge and ring has a text and spoken equivalent. | PN-DIV-3; PS-A1; UB-IN5 | P0 | PH9 | REAL IMPLEMENTATION |
| FR-A11-03 | **Screen-reader native flows.** All core flows work with TalkBack and NVDA. | ES-APPB; ES-INV; PN-DIV-2; PS-E4 | P0 | PH9 | REAL IMPLEMENTATION |
| FR-A11-04 | **Independent private use.** A visually impaired user can complete tasks without sighted help, including entering sensitive data privately. | PN-DIV-7; PS-Q5 | P1 | PH9 | REAL IMPLEMENTATION |

## LNG: Language and literacy adaptation

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-LNG-01 | **Interface localisation.** UI available in English, Hindi, Marathi and Kannada. | UB-Q5; UI-01; PN-PRI-1; PN-KIS-7; PS-A1; C-009 | P0 | PH9 | REAL IMPLEMENTATION |
| FR-LNG-02 | **Language-aware AI responses.** Agents respond in the user's language. Default approach: reason in English and translate with IndicTrans2 using a financial glossary. Native model output is used where evaluation T0.09 shows it is better. | UB-Q5; ES-STACK; DK-s27; PS-E5; PS-Q1; D-028 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-LNG-03 | **Culturally relevant content.** Use locally relevant examples and context. | PS-E5; PN-KIS-7; DK-s26 | P1 | PH3 | REAL IMPLEMENTATION |
| FR-LNG-04 | **Low-literacy mode.** Simplified wording, icons and voice for low-literacy users. | PS-A1; PS-A2; ES-INV; PS-Q2 | P1 | PH9 | REAL IMPLEMENTATION |
| FR-LNG-05 | **Language extensibility.** A new Indian language can be added through translations and engine configuration, without architectural change. | UB-Q5 | P1 | PH9 | REAL IMPLEMENTATION |

## OFF: PWA and offline

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-OFF-01 | **Installable PWA.** Installable responsive PWA built with Next.js. | ES-STACK; DK-s10 | P0 | PH1 | REAL IMPLEMENTATION |
| FR-OFF-02 | **Offline learning packs.** Offline packs for low-connectivity users. | ES-APPB; PS-A3 | P2 | PH9 | REAL IMPLEMENTATION |
| FR-OFF-03 | **Offline-first shell.** App shell loads offline and shows cached data with clear offline state. | DK-s10-DEP; PS-A3 | P2 | PH9 | PARTIAL IMPLEMENTATION |
| FR-OFF-04 | **Low-bandwidth operation.** Works on slow connections with small payloads. | PS-A1; PS-Q5; NFR-COMP-02 | P2 | PH9 | PARTIAL IMPLEMENTATION |

## SAF: Responsible AI safeguards

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-SAF-01 | **AI transparency.** Tell users they are interacting with AI and state its capabilities and limitations. | PS-R1 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-SAF-02 | **Educational positioning.** Recommendations are educational and advisory, and users keep final decision-making authority. | DK-s8; PS-R2 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-SAF-03 | **Output guardrails.** Block guaranteed-return claims, fabricated figures, scheme invention and manipulative language. | PS-R2; PS-Q4 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-SAF-04 | **Source citations.** Show where knowledge came from to build trust. | PS-U2; PS-Q4; UI-01 | P0 | PH3 | REAL IMPLEMENTATION |
| FR-SAF-05 | **Human escalation.** Provide a route to a human for complex or high-stakes situations. | PS-R4; DK-s10-OLD | P1 | PH7 | PARTIAL IMPLEMENTATION |
| FR-SAF-06 | **Data controls.** User can view, export and delete their data. | PS-R3; DK-s8 | P0 | PH8 | REAL IMPLEMENTATION |

## BIZ: Ecosystem and future business (vision only)

| ID | Requirement | Source | Priority | Phase | Target class |
|---|---|---|---|---|---|
| FR-BIZ-01 | **Educator and NGO tools.** Tools that help educators and NGOs scale their reach. | PS-E8 | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-BIZ-02 | **Partner ecosystem.** Government outreach, bank white-label and referral marketplace, with the principle that revenue never influences advice. | DK-s26; PS-T2 | P3 | BACKLOG | NOT IMPLEMENTED |
| FR-BIZ-03 | **External financial integrations.** Bank/UPI, government APIs, credit bureaus and telecom integrations. | DK-s10-OLD; PS-T2 | P3 | BACKLOG | NOT IMPLEMENTED |

## Traceability: problem statement to requirements

Every question and consideration in the problem statement maps to at least one requirement.

| PS item | Text | Covered by |
|---|---|---|
| PS-Q1 | How might AI agents adapt to vastly different user contexts (income patterns, literacy levels, abilities, languages, life situations)? | FR-ONB-06, FR-FLG-07, FR-LNG-02 |
| PS-Q2 | What innovative approaches can make financial literacy accessible to underserved populations often excluded from traditional financial education? | FR-LNG-04 |
| PS-Q3 | How can technology bridge the gap between financial access and financial understanding in a scalable, sustainable way? | FR-KB-01, FR-EDU-01, NFR-SCAL-01 |
| PS-Q4 | What role can AI play in building trust and confidence in financial decision-making for vulnerable populations? | FR-STR-12, FR-SAF-03, FR-SAF-04 |
| PS-Q5 | How do we ensure AI solutions are inclusive, accessible, and work across different abilities, languages, and technological constraints? | FR-A11-04, FR-OFF-04, NFR-COMP-02 |
| PS-Q6 | What mechanisms can drive sustained engagement with financial learning and encourage positive behavioral change? | FR-ENG-01 |
| PS-Q7 | How might we measure real-world impact and ensure tangible improvements in financial well-being? | FR-IMP-01, FR-IMP-03, FR-IMP-04, FR-IMP-05 |
| PS-A1 | Consider diverse user groups: varying literacy levels, languages, physical abilities, technological access. | FR-A11-02, FR-LNG-01, FR-LNG-04, FR-OFF-04, NFR-A11Y-01, NFR-COMP-01, NFR-COMP-02 |
| PS-A2 | Consider voice-first, text-based, visual, or multimodal approaches based on user needs. | FR-ASM-04, FR-ORC-05, FR-VOI-07, FR-LNG-04, NFR-PERF-02 |
| PS-A3 | Think about offline capabilities for low-connectivity areas. | FR-OFF-02, FR-OFF-03 |
| PS-U1 | Make financial literacy engaging and not overwhelming. | FR-EDU-02, FR-STR-11, NFR-A11Y-04 |
| PS-U2 | Build trust with users who may be skeptical of technology or financial institutions. | FR-ONB-02, FR-ASK-02, FR-SAF-04 |
| PS-U3 | Personalize experiences to individual contexts and needs. | FR-ONB-03, FR-ONB-06 |
| PS-I1 | Track whether users are actually improving their financial decision-making. | FR-IMP-01, FR-IMP-02, FR-IMP-04 |
| PS-I2 | Engagement strategies that encourage long-term usage rather than one-time interactions. | FR-ENG-03, FR-ENG-04 |
| PS-I3 | Scale to reach millions while maintaining quality. | NFR-SCAL-01, NFR-SCAL-02 |
| PS-R1 | Transparency about AI capabilities and limitations. | FR-FCS-03, FR-DL-04, FR-ASK-02, FR-SEN-05, FR-CON-03, FR-SAF-01 |
| PS-R2 | Safeguards protecting vulnerable users from manipulation or harmful advice. | FR-ORC-04, FR-STR-04, FR-SAF-02, FR-SAF-03, NFR-AVAIL-01, NFR-SEC-06, NFR-ACC-06 |
| PS-R3 | Handle sensitive financial data responsibly. | FR-ONB-04, FR-DL-03, FR-SAF-06, NFR-SEC-02, NFR-SEC-07, NFR-PRIV-01, NFR-PRIV-02 |
| PS-R4 | Mechanisms for human oversight or escalation. | FR-EDU-07, FR-SEN-16, FR-SAF-05 |
| PS-T1 | Creative uses of Agentic AI, multi-agent systems, or other emerging technologies. | FR-ORC-01, FR-ORC-03 |
| PS-T2 | Integration possibilities with existing financial ecosystems. | FR-BIZ-02, FR-BIZ-03 |
| PS-T3 | Novel interaction paradigms beyond traditional chatbots. | FR-VOI-04, FR-FLG-10, FR-SEN-01 |
| PS-E1 | Area: Personalized financial education and guidance systems. | FR-EDU-01, FR-EDU-04 |
| PS-E2 | Area: Fraud prevention and scam awareness tools. | FR-SEN-02, FR-SEN-10 |
| PS-E3 | Area: Tools for managing irregular or seasonal incomes. | FR-STR-06, FR-STR-07 |
| PS-E4 | Area: Accessible financial interfaces for persons with disabilities. | FR-A11-03 |
| PS-E5 | Area: Multilingual and culturally-relevant content generation. | FR-CON-09, FR-LNG-02, FR-LNG-03 |
| PS-E6 | Area: Behavioral change mechanisms (gamification, nudges, social support). | FR-ENG-01, FR-ENG-02, FR-ENG-05 |
| PS-E7 | Area: Impact measurement and outcome tracking. | FR-IMP-02 |
| PS-E8 | Area: Tools for educators/NGOs to scale their reach. | FR-BIZ-01 |
| PS-E9 | Area: Financial planning for specific contexts (agriculture, gig economy, retirement, etc.). | FR-STR-06, FR-STR-07, FR-STR-10, FR-STR-14 |

## Traceability: persona needs to requirements

| Need | Text | Covered by |
|---|---|---|
| PN-PRI-1 | Priya: simple explanations from a trusted guide that speaks Marathi | FR-EDU-02, FR-VOI-07, FR-LNG-01 |
| PN-PRI-2 | Priya: save for daughter's education and plan for retirement | FR-STR-01, FR-STR-10 |
| PN-PRI-3 | Priya: understand products she is being sold (ULIPs, complex mutual funds) | FR-EDU-09 |
| PN-PRI-4 | Priya: tell legitimate advice from unknown WhatsApp 'investment tips' | FR-SEN-09 |
| PN-PRI-5 | Priya: education tailored to life stage and income level | FR-EDU-03 |
| PN-PRI-6 | Priya: stop missing employer benefits | FR-CON-13 |
| PN-PRI-7 | Priya: avoid unnecessary charges and see where money goes each month | FR-DSH-04 |
| PN-RAJ-1 | Rajesh: manage irregular cash flow (Rs 15,000-40,000 monthly) | FR-ONB-06, FR-STR-06 |
| PN-RAJ-2 | Rajesh: build small emergency savings | FR-STR-06 |
| PN-RAJ-3 | Rajesh: no health insurance cover | FR-CON-01, FR-EDU-04 |
| PN-RAJ-4 | Rajesh: avoid instant loan apps and debt traps | FR-STR-12, FR-SEN-08 |
| PN-RAJ-5 | Rajesh: bite-sized, practical steps that fit a chaotic schedule | FR-STR-09 |
| PN-RAJ-6 | Rajesh: guidance with no minimum-investment gatekeeping or salaried assumptions | FR-EDU-03 |
| PN-KIS-1 | Kisan: handle seasonal, weather-dependent income | FR-ONB-06, FR-STR-07 |
| PN-KIS-2 | Kisan: reduce informal high-interest loans and middleman losses | FR-STR-12, FR-CON-01 |
| PN-KIS-3 | Kisan: make PM-KISAN, crop insurance and KCC applications understandable | FR-CON-01, FR-CON-05, FR-CON-09 |
| PN-KIS-4 | Kisan: when to save and how much to set aside for next season | FR-STR-07 |
| PN-KIS-5 | Kisan: equipment investment versus saving for children's education | FR-STR-13 |
| PN-KIS-6 | Kisan: market prices, MSP and protection from crop failure | FR-STR-14 |
| PN-KIS-7 | Kisan: information in Kannada relevant to his farming context | FR-EDU-03, FR-CON-09, FR-VOI-07, FR-LNG-01, FR-LNG-03, NFR-I18N-01 |
| PN-DIV-1 | Divya: voice-based interactions | FR-ASM-04, FR-VOI-01, FR-VOI-02 |
| PN-DIV-2 | Divya: screen-reader friendly, accessible interfaces | FR-A11-03, NFR-A11Y-02 |
| PN-DIV-3 | Divya: guidance that does not assume she can see charts and graphs | FR-A11-02 |
| PN-DIV-4 | Divya: learn about tax-saving instruments | FR-EDU-11 |
| PN-DIV-5 | Divya: understand EPF statements | FR-DOC-07, FR-EDU-10 |
| PN-DIV-6 | Divya: start investing | FR-EDU-09, FR-EDU-04 |
| PN-DIV-7 | Divya: financial independence and privacy, without relying on family | FR-DL-05, FR-A11-04 |
| PN-DIV-8 | Divya: access and manage schemes for persons with disabilities | FR-CON-08 |

## Traceability: core innovations to requirements

| ID | Innovation | Covered by |
|---|---|---|
| UB-IN1 | Four specialized AI agents | FR-ORC-01 |
| UB-IN2 | Financial Life Graph | FR-FLG-01, FR-FLG-02 |
| UB-IN3 | Financial Confidence Score | FR-FCS-01 |
| UB-IN4 | Dual-LLM architecture | FR-DL-01 |
| UB-IN5 | Accessibility-first financial guidance | FR-VOI-03, FR-A11-02, NFR-A11Y-01 |
| UB-IN6 | Scam prevention system | FR-SEN-02 |
| UB-IN7 | Government scheme discovery | FR-CON-01 |
| UB-IN8 | Behavioral impact measurement | FR-IMP-01, FR-IMP-02, FR-IMP-03 |
