# Decisions Log

**Last updated:** 2026-11-05
**Project owner:** Sanket Mali

**This file is the single source of truth for decisions, source conflicts and open questions.**

No approved requirement changes silently. Any change to a requirement, the tech stack or a public claim needs an entry here first.

| Status | Meaning |
|---|---|
| OPEN | Needs an owner decision. Dependent work is blocked. |
| PROPOSED | Recommended by planning. Takes effect only when the plan is approved. |
| APPROVED | Confirmed by the owner. |
| ACTIVE | Applied during planning because planning needed it. Easy to reverse. |
| SUPERSEDED | Replaced by a later decision. |

---

## 1. Questions

### Open

**No open question blocks the plan. Only plan approval remains.**

One gate applies later: before real people enter their own financial data, take qualified advice on DPDP and SEBI obligations and decide the legal identity that operates VAAKYA (T0.14, NFR-PRIV-03). The product does not accept real user data until then.

### Answered by the owner on 2026-11-05

> **The later instruction in Q13 overrides the cloud and paid-service parts of Q2, Q3 and Q7.**

| ID | Question | Answer | Effect |
|---|---|---|---|
| Q1 | Finale rules? | The hackathon is complete. VAAKYA continues as an independent project with no restrictions on code, technologies or APIs. The focus is a fully functional, production-ready application. | Production plan replaces the 24-hour plan. |
| Q2 | KakushIN LLM? | It will not be used. Any suitable model may be selected on reasoning, accuracy, performance, reliability and cost: Gemini, OpenAI, Claude or others. Providers must be switchable without major code changes. | D-002 |
| Q3 | Dual-LLM? | Private Tier handles sensitive information, personal financial data and PII redaction using local or private processing wherever practical. Cloud Tier handles reasoning, planning, recommendations, scam detection and multi-agent workflows. | D-003 |
| Q4 | Agent name? | **Strategy Builder Agent.** Guardian stays in the product identity. Product name: **VAAKYA - AI Financial Guardian**. | D-004 |
| Q5 | Who owns what? | Sanket Mali owns and builds everything. Remove the other team member's name. | D-005 |
| Q6 | Languages? | English, Hindi, Marathi and Kannada initially, for text, voice input, speech output and language-aware AI responses. More Indian languages later. | D-006 |
| Q7 | Budget? | No fixed budget. Start cost-efficient and scale as required. AWS cost-optimised. No dedicated GPU initially; prefer hosted inference. API-based LLMs with usage monitoring and spending limits. Docker and AWS ECS Fargate. AWS CloudWatch. Firebase Storage or AWS S3. | D-007, D-009, D-024, D-025 |
| Q8 | Sanket's IEEE DELCON paper? | Vulnerability analysis, IEEE DELCON 2025. Verify exact title, DOI and link against the original paper before formal use. | C-007 |
| Q9 | Correct the deck? | No upcoming round. Maintain updated project documentation instead. The Problem Statement and Executive Summary remain primary references. | D-022, NFR-MAINT-05 |
| Q10 | Where do Neo4j and Qdrant run? | Owner delegated this: "just do whatever you think is good". | D-007 |
| Q11 | Where are raw documents stored? | Owner delegated this. | D-024 |
| Q12 | Real users and legal identity? | Owner delegated planning. A gate is set: no real user data until advice is taken. | NFR-PRIV-03 |
| Q13 | Constraint on tools and services? | **"All the things must be free and open source."** | D-026 |

---

## 2. Decisions

### D-001: Project folders sit at the repository root
- **Status:** ACTIVE
- **Decision:** The workspace `C:\Drive D\Projects\NOMURA` is the project root.
- **Why:** On Windows, a new `Nomura/` folder would merge with the source folder `NOMURA/`.

### D-002: Self-hosted open-licence LLMs behind one adapter
- **Status:** APPROVED in direction (Q2, Q13). Model choice follows T0.03.
- **Conflict:** C-001, C-024
- **Decision:** KakushIN LLM is dropped. Gemini, OpenAI and Claude are not used, because they are proprietary paid services (Q13 overrides Q2). All LLM calls go through one adapter (FR-ORC-07) to models served by Ollama (MIT licence).
- **Selection:** by evaluation on VAAKYA's own test sets, not reputation. Criteria: reasoning, accuracy, Hindi, Marathi and Kannada quality, speed, memory. IndicGenBench is a useful reference for Indian-language testing.
- **Candidates to test:** small Qwen 3 models (reported Apache-2.0), small Gemma 4 models (reported Apache-2.0, verify), Granite models. Confirm each licence on its model card before use.
- **Rejected by licence:** Llama community licence and other custom or non-commercial model licences.
- **Reversible:** the adapter also lets a hosted provider be added later, but that would need a new decision reversing Q13.
### D-003: Dual-LLM architecture
- **Status:** APPROVED (Q3), adapted by Q13
- **Decision:** Keep two tiers. Both are self-hosted.
  - **Private Tier:** sensitive information, personal financial data and PII redaction, using a small open model plus rules.
  - **Reasoning Tier:** complex reasoning, planning, personalised explanations, scam analysis and multi-agent workflows, using a larger open model.
- **Change from your Q3 answer:** you described a Cloud Tier with powerful cloud LLMs. A free, open-source stack cannot include one. It is replaced by the Reasoning Tier.
- **Benefit:** stronger privacy. No user data leaves the host (FR-DL-05).
- **Cost:** weaker reasoning than frontier cloud models, on a 6 GB GPU. D-013 limits the risk, because numbers and eligibility come from code.
- **Wording rule:** Say "processed on VAAKYA's own server". Do not say "on-device", which would mean the user's phone.
- **Implementation:** D-025.
### D-004: Agent and product names
- **Status:** APPROVED (Q4)
- **Product:** VAAKYA - AI Financial Guardian.
- **Agents:** Educator Agent, Strategy Builder Agent, Sentinel Agent, Connector Agent.
- **Rule:** "Guardian" is never an agent name.
### D-005: Ownership
- **Status:** APPROVED (Q5)
- **Decision:** Sanket Mali owns and builds all areas, including voice, OCR, Neo4j and architecture.
- **Effect:** Project planning documents name only Sanket Mali. Original source files in `NOMURA/` are unchanged.

### D-006: Language scope
- **Status:** APPROVED (Q6)
- **Decision:** English, Hindi, Marathi and Kannada for text, voice input, speech output and language-aware AI responses. Adding further Indian languages must need configuration and content, not architectural change (FR-LNG-05).

### D-007: Hosting
- **Status:** PROPOSED. Delegated by the owner (Q10, Q13).
- **Decision:** Docker Compose on a single Linux host, using Docker Engine (Apache-2.0).

| Need | Open-source choice | Replaces |
|---|---|---|
| Containers | Docker Engine with Compose | AWS ECS Fargate |
| HTTPS and routing | Caddy, with free Let's Encrypt certificates | ALB, CloudFront |
| Logs, metrics, alerts | OpenTelemetry, Prometheus, Loki, Grafana | CloudWatch |
| Secrets | Docker secrets | AWS IAM |

- **Why:** One host removes the Fargate storage and GPU problems, and it suits one developer.
- **Honest limit: software is free, hardware is not.** Development and testing run at no cost on your laptop. Serving the public needs an always-on machine with internet access and a GPU, which you would have to own or rent. No free open-source hosting provides this.
- **Dev-machine note:** Docker Desktop is proprietary, though free for personal use. It is acceptable for development only. Production uses Docker Engine on Linux.
- **Rollout:** moving to a larger host or several hosts stays possible, because services are containerised.
### D-008: Next.js 14.2.35 patch
- **Status:** SUPERSEDED by D-020.
### D-009: Self-hosted open-source speech
- **Status:** PROPOSED (Q5, Q13). Engines follow T0.07 and T0.08.
- **Conflict:** C-011, C-012, C-013
- **Decision:** Speech runs on the VAAKYA host behind one adapter (FR-VOI-09).

| Function | First choice | Fallback | Status |
|---|---|---|---|
| Speech-to-text | Whisper Large-v3 through faster-whisper, int8 (reported at 2-3 GB of GPU memory) | Smaller Whisper model | Fits the RTX 3050 on reported figures. Kannada and Marathi accuracy is unmeasured. |
| Text-to-speech | Indic Parler-TTS (reported Apache-2.0, covers Hindi, Marathi, Kannada) | eSpeak NG (GPLv3): robotic, but always available | Model is gated, and sources disagree on commercial terms. **Must pass the licence check in T0.07.** |

- **Coqui is dropped:** it requires Python below 3.12, its repository is archived, and XTTS weights are non-commercial, which fails D-026.
- **Screen readers:** Divya's own screen reader speaks the interface, so this does not depend on VAAKYA's TTS.
### D-010: Data ownership across stores
- **Status:** PROPOSED

| Store | Owns |
|---|---|
| SeaweedFS | Raw files |
| PostgreSQL | Operational records: profile, goals, score history, learning progress, reviews, notifications, chat, preferences |
| Neo4j | Relationships and derived projections for agents. Rebuildable from PostgreSQL. |
| Qdrant | Non-personal knowledge only. **No user data.** |
### D-011: Financial Confidence Score dimensions and formula
- **Status:** PROPOSED
- **Conflict:** C-019
- **Decision:** Five equally weighted dimensions, as in UI-10: Financial Literacy, Financial Safety, Goal Planning, Scheme Awareness, Savings Discipline. See `MASTER_PLAN.md` section 14.
- **Why:** Superset of the Executive Summary's four. UI-10's sample sub-scores (82, 90, 75, 68, 76) average 78.2, matching its overall 78.
- **Rule:** The score is computed in code, never by the LLM.

### D-012: Definition of the 3-tier impact framework
- **Status:** PROPOSED
- **Problem:** Executive Summary Appendix B cites it but no source defines it.
- **Decision:** Tier 1 Knowledge (quiz deltas). Tier 2 Behaviour (actions taken). Tier 3 Outcome (rupees saved or benefits received, tagged self-reported or document-verified).

### D-013: Deterministic core, LLM explains
- **Status:** PROPOSED
- **Decision:** Calculations, eligibility decisions and the confidence score are deterministic code. LLMs explain, personalise and classify text. They do not produce money figures or eligibility verdicts.
- **Why:** The mockups show the failure mode (C-014, C-015). Wrong numbers in financial guidance harm vulnerable users.

### D-014: Source precedence
- **Status:** APPROVED (Q9), with the order below
- **Order:**
  1. Approved decisions in this file.
  2. Problem Statement PDF.
  3. Executive Summary.
  4. `FINAL SUBMISSION ALL.pptx`.
  5. `FINAL PPT.pptx`.
  6. Loose images, as working drafts.
- **Exception:** External facts such as scheme rules are checked against primary external sources.

### D-015: Sentinel scope is user-submitted checks
- **Status:** PROPOSED
- **Conflict:** C-016
- **Decision:** Build submit-to-check for screenshots and messages. Call, transaction and passive real-time monitoring are vision items (P3).
- **Why:** The Executive Summary lists Sentinel as Reactive, and a web app cannot read another app's messages.

### D-016: Qdrant is the vector store
- **Status:** PROPOSED
- **Conflict:** C-003
- **Why:** Self-hosted Qdrant is open source (Apache-2.0, confirm in the licence register).
### D-017: Educational positioning
- **Status:** PROPOSED, and more important now that this is a production product
- **Decision:** VAAKYA educates and explains options. It does not recommend specific securities or products and does not execute transactions. Users keep the final decision.
- **Why:** Personalised investment advice may need SEBI registration, and commentary reviewed found no definitive test for AI interactions. **Take qualified advice before real users (Q12).** This is a planning flag, not legal advice.

### D-018: Agent attribution by screen
- **Status:** PROPOSED
- **Conflict:** C-026

| Screen | Agent |
|---|---|
| Ask VAAKYA | Whichever agent the orchestrator routed to |
| Learning Academy | Educator |
| Goal Studio | Strategy Builder |
| Scam Detection, Scam Knowledge Center | Sentinel |
| Government Schemes, Eligibility, Opportunities | Connector |
| Confidence Score, Life Graph, Monthly Report, Voice Companion | Shown as VAAKYA, not a single agent |

### D-019: Educator and NGO tools
- **Status:** PROPOSED
- **Decision:** Keep in the backlog (FR-BIZ-01) as a known gap.

### D-020: Use current supported versions
- **Status:** PROPOSED
- **Decision:** Hackathon version pins no longer apply (Q1). Keep the same technologies at their current stable versions, pinned in lockfiles. Confirm in T0.06.
- **Why:** The declared versions date from 2024. LangGraph 0.2 is well behind 1.x, and `next@14.2.30` is deprecated for a security issue.

| Component | Declared | Current stable checked 2026-11-05 |
|---|---|---|
| Next.js | 14.2.30 | 16.4.5 |
| React | Not declared | 19.3.1 |
| TypeScript | 5.5.4 | 7.0.2. Use the version Next.js supports. |
| Tailwind CSS | 3.4.4 | 4.3.4 |
| Python | 3.12.4 | 3.12 or 3.13 |
| FastAPI | 0.111.1 | 0.162.0 |
| LangGraph | 0.2.x | 1.2.20 |
| LlamaIndex | 0.11.7 | 0.14.25 |
| Qdrant client and server | 1.10.1 | 1.20.0 |
| Neo4j server | Community 5.23 | 5.26 community image |
| Neo4j Python driver | Not declared | 6.4.1 |
| PaddleOCR, PaddlePaddle | 2.7.3, unpinned | 3.7.0, 3.3.1 |

**Evidence:** The Python set resolves on 3.12 and 3.13 with `uv pip compile`. This shows a consistent version set exists, but it has not been install-tested or run.

### D-021: Scheduler for proactive behaviour
- **Status:** PROPOSED
- **Decision:** Use APScheduler (MIT) with its job store in PostgreSQL.
- **Why:** Proactive features need a scheduler, and the stack has none. A single-host design makes this the simplest reliable option.
### D-022: Treatment of hackathon documents
- **Status:** APPROVED (Q9)
- **Decision:** The deck and Executive Summary are not being corrected. They remain unchanged historical references. The Deck Error List stays as a warning not to copy those facts into the product.

### D-023: Mockups are design targets, not evidence
- **Status:** ACTIVE
- **Decision:** The 16 images under "UI Screenshots" are design intent. Their sample data is not a specification.

### D-024: Raw document storage
- **Status:** PROPOSED. Delegated by the owner (Q11, Q13).
- **Decision:** SeaweedFS as self-hosted S3-compatible storage, with encrypted volumes, behind a storage interface.
- **Why not Firebase Storage or AWS S3:** both are proprietary services.
- **Why not MinIO:** its community repository is no longer actively developed, and official community images are no longer published.
- **Alternative:** Garage. Confirm the chosen project's licence in the register.
### D-025: Tier implementation on the available hardware
- **Status:** PROPOSED, confirmed by T0.03 and T0.04

| Data | Handling |
|---|---|
| Documents and screenshots | OCR on the host. Files never leave it. |
| Identifiers | Redacted using Microsoft Presidio (MIT), Indian-format rules and the Private Tier model. Replaced with tokens, restored after the response. |
| Field extraction | Rules first, then the Private Tier model. |
| Reasoning and Sentinel analysis | Reasoning Tier receives redacted text and minimal structured context. |
| Voice audio | Processed on the host. Not stored by default. |

- **Hardware limit:** an RTX 3050 with 6 GB must share memory across the LLM, Whisper, translation and TTS. Models will load and unload, and requests will queue (NFR-SCAL-03). Expect one active inference at a time, until measured otherwise.
- **Why keep redaction when everything is local?** It limits what any model sees, keeps logs safe, and keeps a future external provider safe.
### D-026: Free and open-source only
- **Status:** APPROVED (Q13). This overrides earlier choices.
- **Rule:** Every runtime component is free of charge and under an OSI-approved open-source licence. No paid or proprietary service is required.
- **Scope:** application dependencies, databases, infrastructure software and AI models.
- **Model weights:** must use an open licence such as Apache-2.0 or MIT. Non-commercial and custom community licences are rejected.
- **Outside scope:** hardware, electricity, internet access and domain names, which are not software. Developer conveniences such as GitHub or Docker Desktop are not runtime dependencies.
- **Enforcement:** NFR-LIC-01, NFR-LIC-02 and a licence register.

### D-027: PostgreSQL and Keycloak replace Firebase
- **Status:** PROPOSED (Q13)
- **Decision:** PostgreSQL replaces Firestore. Keycloak (Apache-2.0, confirm in the register) replaces Firebase Authentication, using standard OIDC tokens.
- **Why:** Firebase is proprietary. Keycloak is mature, with email login, Google sign-in as an option, and multi-factor authentication.
- **Alternative considered:** self-hosted Supabase is a closer Firebase replacement, but it runs more containers on already limited hardware.
- **Note:** Google sign-in is optional, because it depends on Google's service. Email login always works.

### D-028: English pivot for reasoning
- **Status:** PROPOSED, confirmed by T0.09
- **Decision:** Translate input to English, reason in English, then translate the answer with IndicTrans2 (MIT) and a financial glossary. Use a model's native output where evaluation shows it is better.
- **Why:** Small open models are likely to be weaker in Marathi and Kannada than in English. IndicTrans2 covers all three Indian languages under an open licence, though it is scripts and checkpoints, so pin a commit.

### D-029: Plan approval taken from the owner's instruction to continue
- **Status:** ACTIVE. **Owner to confirm.**
- **Record:** On 2026-11-05 the owner started a session with the instruction "Continue the next incomplete task ... implement real functionality ... write and run tests". The planning documents said not to begin Phase 0 before explicit approval. The session read this instruction as approval to begin Phase 0. It is not recorded as an explicit plan approval.
- **Scope taken:** Phase 0 only. No PH1 or application code was written. T0.06 was the only Phase 0 task that could run without the owner's hardware.
- **If wrong:** the owner says so, and the T0.06 spike in `02_ARCHITECTURE/evaluations/T0.06_stack/` can be deleted. It changes no requirement.

### D-030: T0.06 version set confirmed
- **Status:** ACTIVE. Confirms D-020.
- **Decision:** Use the versions pinned in `02_ARCHITECTURE/evaluations/T0.06_stack/api/uv.lock` and `web/package-lock.json` as the starting point for T1.01 to T1.03. TypeScript 7.0.2 is confirmed to build and type-check with Next.js 16.4.5. Python 3.13, with 3.12 also passing. Keycloak 26.8.1. PostgreSQL 18.
- **Evidence:** `05_TESTING/evaluations/T0.06_RESULTS.md`.
- **Limit:** Tested on Linux, not on the Windows development machine. Inference packages are not included.

### D-031: Copyleft components accepted for unmodified use
- **Status:** ACTIVE. Owner to confirm.
- **Decision:** psycopg (LGPL-3.0) is accepted in the API process. Neo4j Community (GPLv3), Grafana OSS and Loki (AGPLv3) are accepted as separate, unmodified servers. Details and conditions are in `06_DOCUMENTATION/LICENCE_REGISTER.md`.
- **Why:** All are OSI-approved, so they meet D-026. Their obligations apply only to modification and distribution or network exposure, which VAAKYA does not plan.

### D-032: Owner instruction to build the application; Phase 0 gate waived for software work
- **Status:** APPROVED by the owner's instruction on 2026-11-05 ("Build the complete VAAKYA frontend / backend / data layer / AI / agents / integration", "perform them one by one in same sequence").
- **Decision:** Build in six steps, in the order given: frontend, backend, data layer, AI infrastructure, agents, integration. Commit to `main` after each.
- **Gate:** The PH0 gate is waived for software work. It is **not** waived for model selection (T0.03), scheme fact verification (T0.12) or legal scoping (T0.14). Features depending on those stay PARTIAL.
- **Stack:** The prompts named the hackathon stack (Next.js 14, Firebase, Firestore, Gemini, LangGraph 0.2). The owner had already said to keep the open-source plan ("just go with the plan you have created"). D-026 and D-030 therefore stand: Keycloak replaces Firebase Auth, PostgreSQL replaces Firestore, SeaweedFS replaces Firebase Storage, Ollama replaces Gemini.

### D-033: Preview mode with synthetic sample data
- **Status:** ACTIVE
- **Decision:** The web app has a sample-data preview: choose one of the four personas without an account. Every screen shows "Sample data" and a banner. Nothing is saved. The API proxy returns `503 Preview mode`, so AI screens show "not connected" and never a fabricated answer. `PREVIEW_MODE=off` disables it in production.
- **Why:** The owner asked for demonstration data that is clearly distinguished from persisted data.

### D-034: Screenshot location
- **Status:** ACTIVE
- **Decision:** Screenshots are saved to `07_HACKATHON_DELIVERABLES/PRODUCT_SCREENSHOTS/FRONTEND/` at the repository root, not under a new `Nomura/` folder, because D-001 forbids a `Nomura/` folder (it collides with `NOMURA/` on Windows).

### D-035: Six Confidence Score dimensions
- **Status:** ACTIVE. Owner to confirm. Amends D-011.
- **Decision:** Add **Debt awareness** as a sixth dimension, because the owner's agent brief lists "debt management awareness". FCS = round(mean of six dimensions). Formula version `fcs-1`. Details in the scoring documentation written in Step 5.

---

## 3. Source conflict register

| ID | Topic | What the sources say | Severity | Status |
|---|---|---|---|---|
| C-001 | Primary LLM | ES: Gemini 2.5 Pro. Deck: KakushIN LLM. Old HLD: Ollama / LLM. | Critical | Resolved by D-002: self-hosted open models. |
| C-002 | Agent name | Strategy Builder or Guardian | Medium | Resolved by D-004 |
| C-003 | Vector store | Qdrant, except pgvector in `HLD new slide.png` | Medium | D-016 |
| C-004 | Versions | Table and diagrams differ | Low | Replaced by D-020 |
| C-005 | Extra components | Old HLD adds Cloudflare, API Gateway, Redis, PostgreSQL, Route 53, seven microservices, bank, credit bureau and telecom integrations | Medium | Superseded. Add only with a recorded need. |
| C-006 | Roles | Executive Summary and deck assigned work differently | Medium | Resolved by D-005 |
| C-007 | Sanket's paper | ES: Intelligent Transportation Systems. s30: "Advanced Database Testing and Verification Using Automated Tools and Vulnerability Analysis". | High (factual) | Owner confirms vulnerability analysis (Q8). Verify exact title and DOI before formal use. |
| C-008 | Withdrawn | Removed under D-005 | - | Closed |
| C-009 | Languages | Priya needs Marathi, Kisan needs Kannada. UI-01 omits Kannada. A data slide sets `preferredLanguage: Hindi` for a Priya record. | High | Resolved by D-006 |
| C-010 | Embedding size | s14 says 1536. `multilingual-e5-large` outputs 1024. | Medium | FR-KB-03 uses 1024 |
| C-011 | Python and TTS | Coqui TTS 0.22 cannot install on Python 3.12 | Critical | Removed by D-009 |
| C-012 | TTS languages | Coqui's XTTS lists Hindi, not Marathi or Kannada | High | Coqui dropped by D-009. T0.07 must prove Kannada and licence. |
| C-013 | Whisper on Fargate | Fargate has no GPU | High | Removed: Fargate is no longer used (D-007). |
| C-014 | Scheme facts in mocks | See Deck Error List | High | FR-CON-01, FR-CON-02, T0.12 |
| C-015 | Mock arithmetic | See Deck Error List | Medium | FR-STR-04, NFR-ACC-02 |
| C-016 | Proactive and real-time | ES Appendix A lists Sentinel as Reactive. Appendix B and deck claim real-time alerts and call and transaction analysis. | High | D-015 |
| C-017 | Dual-LLM | Headline innovation with no matching component | Critical | Resolved by D-003, D-025 |
| C-018 | Persona details | Mockups differ from the problem statement on Priya, Rajesh and Divya | Medium | Problem statement wins |
| C-019 | Score definition | Four or five dimensions; update cadence differs | Medium | D-011 |
| C-020 | Connectivity | Deck assumes internet; ES claims offline packs | Medium | FR-OFF-02, FR-OFF-03 are P2 |
| C-021 | IVR | Claimed, with no telephony in the stack | Medium | FR-VOI-08 is P3 |
| C-022 | Stateful on Fargate | Deck runs Neo4j and Qdrant in the Fargate chain | High | Removed: D-007 uses one Docker host. |
| C-023 | Next.js version | 14.2.30 is deprecated for a security vulnerability | High | D-020 |
| C-024 | Gemini availability | `gemini-2.5-pro` closed to new users, shutdown December 1, 2026 | Critical | Removed: Gemini is not used (D-002). |
| C-025 | Unverified claims | "India's First", "the only platform", "bank-grade encryption", market sizes | Medium | Do not repeat in the product without evidence |
| C-026 | Agent badges on mocks | Several screens name the wrong agent | Low | D-018 |
| C-027 | Taglines | Several variants | Low | Product name set by D-004. Tagline stays "AI Agents for Financial Empowerment" unless changed. |
| C-028 | Implementation plan gaps | Deck plan omits onboarding, TTS, translation and a second LLM | High | Roadmap adds these |
| C-029 | Filename | Brief says `-1`; file has none | Low | Actual file used |
| C-030 | Executive Summary 2.2 | Kisan's outcome duplicates Rajesh's | Medium | Noted. Source stays unchanged (D-022). |
| C-031 | Evaluation criteria | PDF contains none | High | No longer relevant (Q1) |

| C-032 | Executive Summary stack vs free and open source | ES commits to Firebase, Gemini and AWS. All are proprietary services. | Critical | Resolved by D-002, D-007, D-024, D-026, D-027. ES remains a reference for the problem and solution, not for these vendors. |
---

## 4. Deck Error List

Do not copy these into the product, documentation or test data. The source files stay unchanged (D-022).

| # | Where | Error | Correct position | Checked |
|---|---|---|---|---|
| 1 | Withdrawn | Removed under D-005 | - | - |
| 2 | UI-12 | PMJJBY "Annual income up to ₹2 lakh" | No income criterion found. Requirements are age 18-50 and a bank or post office account with auto-debit. Confirm on official source. | External, secondary sources |
| 3 | UI-12 | Income ₹6,00,000 is marked Eligible against that same ₹2 lakh rule | Self-contradictory | Internal |
| 4 | UI-12 | "You are 24 years old" | Priya is 32 | PS |
| 5 | UI-07 | Mudra "up to ₹10 lakh" | Limit raised to ₹20 lakh in October 2024 under Tarun Plus, for borrowers who repaid a Tarun loan | PIB release via search |
| 6 | UI-07 | APY shows "You are eligible" with no checks | APY excludes income-tax payers since 1 Oct 2022, age limit 18-40 | External, secondary sources |
| 7 | UI-07 | APY "₹210+" | Contribution varies by age and pension. Use the official chart. | External, partial |
| 8 | UI-03 | Roadmap jumps from ₹48,000 at month 6 to ₹3,00,000 at month 12 on ₹8,000/month | Impossible, and ignores the ₹50,000 already saved | Arithmetic |
| 9 | UI-03, 04, 05, 11, 16 | Emergency fund shown as ₹50,000 of ₹3L, ₹1.35L of ₹3L, ₹45,000 of ₹1L | One value per user | Internal |
| 10 | UI-05 | "Ideal: 6 months of expenses" with ₹30,000 expenses, but target ₹1,00,000 | 6 × ₹30,000 = ₹1,80,000 | Arithmetic |
| 11 | UI-04, 10 | Slider at 50 beside a score of 78 | Must match | Internal |
| 12 | UI-13, 12, 04 | "Adequately protected" and "2 policies" versus "life insurance not found" | One insurance status | Internal |
| 13 | UI-11 | 80C savings with no mention of tax regime | 80C applies under the old regime only. Verify current law. | Domain knowledge |
| 14 | s14 | 1536-dimension embeddings | 1024 for multilingual-e5-large | External |
| 15 | s2 | "UI Screenshots" | They are design mockups | D-023 |
| 16 | s30 vs ES | Sanket's IEEE paper differs | Vulnerability analysis (Q8). Verify exact title and DOI. | Owner |
| 17 | ES 2.2 | Kisan's outcome text is a copy of Rajesh's | Do not reuse | Internal |
| 18 | s4, s7 | Statistics, TAM, SAM, SOM | Not independently verified. TAM, SAM and SOM carry no source. | Not checked |

---

## 5. External fact checks

Performed 2026-11-05. Treat as a snapshot, and re-check anything time-sensitive.

| Fact | Finding | Source | Confidence |
|---|---|---|---|
| Gemini 2.5 Pro | Shutdown December 1, 2026, "earliest possible" date. Not selectable in AI Studio; API limited to existing users. Page recommends `gemini-3.8-flash`; `gemini-3.1-pro-preview` is the listed Pro-tier model. | https://aistudio.google.com/docs/deprecations | High |
| Current package versions | See D-020 | npm, PyPI, Docker Hub | High |
| Current Python set | Resolves on Python 3.12 and 3.13. Not install-tested. | Local `uv pip compile` | Medium |
| Coqui TTS 0.22.0 | `requires_python >=3.9.0, <3.12`. A pip dry run for Linux finds no distribution on 3.12 and would install on 3.11. | PyPI, local pip run | High |
| Coqui project | Original repo archived; community fork exists. XTTS weights under a non-commercial licence. | Search results, Hugging Face card | Medium |
| next 14.2.30 | npm deprecation for a security vulnerability | `npm view`; https://nextjs.org/blog/security-update-2025-12-11 | High |
| IndicTrans2 | No versioned releases. MIT licence. Covers Hindi, Marathi, Kannada. Scripts and checkpoints, not a pip package. | https://github.com/AI4Bharat/IndicTrans2 | High |
| multilingual-e5-large | 1024 dimensions. Indian-language retrieval quality unconfirmed. | Search results | Medium |
| Open LLM licences | Qwen 3 and Gemma 4 small models are reported as Apache-2.0, and sizes vary by source. Sources are low quality. Check model cards. | Secondary sources | Low |
| Indic Parler-TTS | Reported Apache-2.0, covers Hindi, Marathi, Kannada. Gated model, and commercial terms are disputed by sources. | Secondary sources | Low. Must verify. |
| faster-whisper large-v3 int8 | Reported 2-3 GB of GPU memory | Secondary sources, one measured | Medium |
| MinIO | Community repository in maintenance, then archived per sources. Official community images no longer published. | Multiple reports, https://infoq.com/news/2025/12/minio-s3-api-alternatives/ | Medium |
| Neo4j Community | GPLv3 per third-party sources. Enterprise is proprietary. Modifications need sharing only if distributed. | Secondary sources | Medium. Confirm in the repository. |
| PaddleOCR | Apache-2.0. Devanagari, including Marathi, confirmed by mirrors. Kannada not confirmed. | Forks and mirrors | Medium |
| Supabase self-hosting | Needs at least 4 GB RAM and 2 cores, 8 GB+ recommended. | https://supabase.com/docs/guides/self-hosting/docker | High |
| ECS Fargate | `gpu` parameter is not valid for Fargate tasks | AWS ECS documentation | High |
| Neo4j storage | Requires a POSIX file system; NFS unsupported. EFS applicability is an inference. | https://neo4j.com/docs/operations-manual/5/installation/requirements/ | High for NFS, medium for EFS |
| PMJJBY, PMSBY | PMJJBY age 18-50, ₹2 lakh cover, ₹436 per year. PMSBY age 18-70, ₹20 per year. | Bank pages | Medium. Verify in T0.12. |
| APY | Age 18-40. Income-tax payers excluded from 1 Oct 2022. | Secondary sources | Medium |
| Mudra | Limit ₹20 lakh from 24 Oct 2024 | PIB release via search | High |
| DPDP Rules | Notified 13 Nov 2025, phased. Full compliance around May 2027. | Law-firm summaries | Medium |
| SEBI and AI advice | Registration rules exist. No definitive test for AI interactions found. | Commentary only | Low. Not legal advice. |

---

## 6. Local environment snapshot

Checked 2026-11-05 on the development machine.

| Item | Finding | Implication |
|---|---|---|
| Python | 3.11.9 only | Run the API in Docker on Python 3.12 or 3.13 |
| Node | 22.14.0 | Confirm against Next.js 16 requirements in T0.06 |
| Docker | 29.4.0, running, about 7.6 GB allocated | Measure with Neo4j and Qdrant running |
| GPU | RTX 3050 Laptop, 6 GB | The main constraint. All models must share it. |
| RAM | 15.7 GB | Tight with all services and models running. Measure in T0.11. |
| Ollama | 0.34.2 installed, service not running | Core component. Start the service for T0.03. |
| uv | Installed | Use for Python dependency locking |
| Neo4j | Not installed locally | Use the Docker image |
| Tesseract | Installed | Candidate OCR fallback for Kannada |
