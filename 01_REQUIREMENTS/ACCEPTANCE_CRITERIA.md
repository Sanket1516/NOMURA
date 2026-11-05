# Acceptance Criteria

**Last updated:** 2026-11-05 | **Status:** Draft, awaiting approval

One testable criterion per requirement, using the same IDs. A feature may only be marked VERIFIED in the tracker when its criterion is met and evidence is linked.

## Definition of Done

A requirement reaches **VERIFIED** only when all of these hold:

1. Code exists and runs in the integrated application, not in isolation.
2. It uses real services and real logic. Anything stubbed is classified MOCK or PLACEHOLDER and cannot be VERIFIED.
3. Automated or recorded manual tests pass, with evidence in `05_TESTING/`.
4. Tracker, `CURRENT_STATUS.md` and `CHANGELOG.md` are updated in the same change.
5. A person other than the author, or a separate review pass, has confirmed it.
6. For P0 user-facing features: works by keyboard, screen reader and at least one non-English language.

## Project-level success criterion (from source)

The owner's goal is a fully functional, production-ready application built only from free and open-source software (`DECISIONS_LOG.md`). Release criteria are in `IMPLEMENTATION_ROADMAP.md`.

The hackathon's success metric was a working end-to-end demo with a real user flow, financial plan, scam detection and scheme discovery. That is now Milestone M1, and no longer the finish line.

## Persona end-to-end scenarios

| ID | Persona | Scenario must show |
|---|---|---|
| AC-P1 | Priya | Marathi. Evaluates a ULIP pitch, checks a WhatsApp tip with Sentinel, sets education and retirement goals. |
| AC-P2 | Rajesh | Variable income plan feasible in a Rs 15,000 month, starter emergency fund, flags a predatory loan app. |
| AC-P3 | Kisan | Kannada. Seasonal plan, PM-KISAN, crop insurance and KCC eligibility with application steps. |
| AC-P4 | Divya | Complete journey using voice and screen reader only, no visual charts needed, disability schemes found. |


## ONB: Onboarding and entry

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-ONB-01 | P0 | A new user can register with email, sign out and sign in again; an unauthenticated API call returns 401. |
| FR-ONB-02 | P0 | From the landing screen a user reaches assessment and voice mode by touch, keyboard and screen reader, and changes language without signing in. |
| FR-ONB-03 | P0 | Saved profile appears in PostgreSQL and as the User node in Neo4j; each field can be edited later. |
| FR-ONB-04 | P0 | Upload is impossible before consent; withdrawing consent stops further processing and the withdrawal is recorded with a timestamp. |
| FR-ONB-05 | P0 | Both paths end with a populated twin and baseline score without requiring the other path. |
| FR-ONB-06 | P0 | Priya, Rajesh and Kisan test personas each receive a different question branch; no salaried-only assumption reaches Rajesh or Kisan. |

## DOC: Document intelligence and Document Hub

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-DOC-01 | P0 | A salary slip PDF and a phone photo both upload; unsupported or oversized files are rejected with a clear message. |
| FR-DOC-02 | P0 | User B cannot read User A's document with a valid User B token; objects are encrypted at rest; path follows the user/year/month layout. |
| FR-DOC-03 | P0 | Text is extracted from sample salary slips and statements in English, Hindi, Marathi and Kannada, with field accuracy recorded in 05_TESTING. |
| FR-DOC-04 | P0 | Salary slip and bank statement produce schema-valid JSON. Other document types follow FR-DOC-07. |
| FR-DOC-05 | P0 | A wrong value corrected by the user is what reaches Neo4j; unconfirmed values never do. |
| FR-DOC-06 | P0 | Network inspection of a full onboarding shows no document data sent to any external service. |
| FR-DOC-07 | P2 | Each listed type has an extraction schema and at least one passing sample. |
| FR-DOC-08 | P2 | User finds a document by name or type and deletes it; deletion removes the stored object. |

## ASM: Financial assessment and dynamic questionnaire

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-ASM-01 | P0 | All steps complete by keyboard and screen reader; progress survives a page reload. |
| FR-ASM-02 | P0 | A user who uploaded a salary slip is not asked for salary; the assistant states what was already extracted. |
| FR-ASM-03 | P0 | All five fields are stored and visible in the twin. |
| FR-ASM-04 | P1 | Divya test persona completes the assessment with voice and screen reader only. |
| FR-ASM-05 | P0 | Score and all sub-scores exist immediately after the last step. |

## FLG: Financial Life Graph (Financial Digital Twin)

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-FLG-01 | P0 | Schema script creates constraints; the three example paths from the Heart of VAAKYA slide are queryable. |
| FR-FLG-02 | P0 | All six categories are populated for each demo persona. |
| FR-FLG-03 | P0 | Twin exists within the same session as onboarding completion. |
| FR-FLG-04 | P1 | Finishing a lesson, updating a goal and running a scam check each change the graph. |
| FR-FLG-05 | P3 | Deferred: no transaction or market data source is defined in any source document. |
| FR-FLG-06 | P1 | Queries return the emergency-fund gap, insurance gap and eligible schemes for a test persona. |
| FR-FLG-07 | P0 | The same question from Priya and Rajesh returns different, profile-grounded answers citing their own figures. |
| FR-FLG-08 | P2 | A completed recommendation is not repeated and changes the next suggested action. |
| FR-FLG-09 | P0 | A test proves no query can return another user's nodes; agents have no raw Cypher access. |
| FR-FLG-10 | P1 | Screen renders live graph data and has a complete text/spoken equivalent. |

## FCS: Financial Confidence Score

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-FCS-01 | P0 | Score shows the correct band; a screen reader announces value, band and meaning. |
| FR-FCS-02 | P0 | Each dimension shows 0-100 with a band and a one-line reason. |
| FR-FCS-03 | P0 | Unit tests reproduce the score from a fixture; the UI-10 sample values (82, 90, 75, 68, 76) yield 78. |
| FR-FCS-04 | P0 | An event from each of the four areas updates its dimension and writes history. |
| FR-FCS-05 | P1 | Point estimates come from the formula, and completing an action moves the score by that amount. |
| FR-FCS-06 | P1 | History chart has a text equivalent and matches stored snapshots. |

## ORC: Multi-agent orchestration

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-ORC-01 | P0 | A labelled routing test set of 40 prompts meets the threshold in NFR-ACC-05. |
| FR-ORC-02 | P0 | A follow-up question in a session uses prior context without the user repeating it. |
| FR-ORC-03 | P1 | 'I got this loan offer, should I take it for my goal?' uses Sentinel and Strategy Builder in one turn. |
| FR-ORC-04 | P1 | Injected LLM and database faults produce the fallback message and a logged trace. |
| FR-ORC-05 | P0 | Each input type reaches the correct agent. |
| FR-ORC-06 | P1 | Screen-to-agent mapping matches D-018 on every screen. |
| FR-ORC-07 | P0 | Changing a task's model in configuration needs no agent code change; contract tests pass for at least two open models; a model failure triggers the configured fallback. |

## DL: Dual-LLM privacy tier

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-DL-01 | P0 | Every LLM call is tagged private or reasoning, and a test proves the Reasoning Tier receives redacted context only. |
| FR-DL-02 | P0 | Both tiers run on the target hardware and meet the latency budget recorded by the evaluation. |
| FR-DL-03 | P0 | A golden test set with names, account numbers, PAN, Aadhaar and phone numbers in English, Hindi, Marathi and Kannada shows zero leakage to the Reasoning Tier. |
| FR-DL-04 | P1 | An audit view lists the field categories sent for the last request. |
| FR-DL-05 | P0 | A network test of all four persona journeys shows no user data leaving the host. |

## KB: Knowledge base and retrieval

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-KB-01 | P0 | Every document has source, publisher, date and URL recorded in a manifest; at least one document per category. |
| FR-KB-02 | P0 | Pipeline re-runs idempotently and reports chunk counts by category. |
| FR-KB-03 | P0 | Collection config shows size 1024; a sample query returns relevant chunks. |
| FR-KB-04 | P1 | A scam query does not return scheme chunks when filtered. |

## ASK: Ask VAAKYA (conversational interface)

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-ASK-01 | P0 | All four suggested prompts return grounded answers. |
| FR-ASK-02 | P0 | Displayed inputs equal stored values and the arithmetic reproduces the recommendation. |
| FR-ASK-03 | P1 | A previous conversation reopens with its context. |

## EDU: Educator Agent and Learning Academy

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-EDU-01 | P0 | Answers cite retrieved sources; an out-of-corpus question is declined rather than guessed. |
| FR-EDU-02 | P0 | SIP explained for Priya and for Kisan differs in vocabulary, examples and language. |
| FR-EDU-03 | P1 | Rajesh never sees advice that assumes a fixed salary or a minimum investable amount. |
| FR-EDU-04 | P1 | At least two modules are complete end to end in all supported languages; the rest are marked as such. |
| FR-EDU-05 | P1 | A wrong answer in insurance raises Insurance 101 as next suggested module. |
| FR-EDU-06 | P2 | Module order changes with quiz performance. |
| FR-EDU-07 | P1 | Each published lesson has a recorded reviewer and date. |
| FR-EDU-08 | P1 | Completing a lesson updates progress and the literacy dimension. |
| FR-EDU-09 | P1 | For a ULIP pitch the answer explains charges, lock-in and suitability questions, and does not tell the user what to buy. |
| FR-EDU-10 | P2 | A sample EPF statement is summarised by voice. |
| FR-EDU-11 | P2 | Explanation states that Section 80C is regime-dependent. |

## STR: Strategy Builder Agent and Goal Studio

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-STR-01 | P0 | A goal saved in Goal Studio appears in PostgreSQL and as a PURSUES relationship in the graph. |
| FR-STR-02 | P1 | Rajesh with no emergency fund is offered a starter emergency fund first. |
| FR-STR-03 | P0 | Same inputs always give the same achievability value and a sustainable alternative timeline. |
| FR-STR-04 | P0 | Unit tests cover emergency fund, monthly savings and timeline; every displayed figure traces to a calculator result. |
| FR-STR-05 | P0 | Milestones sum exactly to the target from current savings. The arithmetic flaw in UI-03 is not reproduced (C-015). |
| FR-STR-06 | P0 | With Rajesh's Rs 15,000-40,000 range the plan stays feasible in the lowest-income month. |
| FR-STR-07 | P1 | Kisan's plan shows season-based set-asides instead of monthly targets. |
| FR-STR-08 | P0 | Updating savings moves progress consistently on Goal Studio and Dashboard. |
| FR-STR-09 | P1 | Each roadmap has one concrete next action a user can finish today. |
| FR-STR-10 | P2 | Retirement goal uses explicit, displayed assumptions. |
| FR-STR-11 | P1 | A scheduled job creates a nudge for an off-track test goal without the user asking. |
| FR-STR-12 | P1 | A sample instant-loan offer is shown as total cost and effective interest, computed in code. |
| FR-STR-13 | P2 | Both options are compared with displayed assumptions and no directive. |
| FR-STR-14 | P2 | Educational answers cite sources; live price data is out of scope unless a source is approved. |

## SEN: Sentinel Agent and Scam Shield

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-SEN-01 | P0 | Both capture paths work; a larger file gets a clear error. |
| FR-SEN-02 | P0 | Pasted text and screenshots both produce a result. |
| FR-SEN-03 | P0 | Sample set achieves the extraction accuracy recorded in 05_TESTING. |
| FR-SEN-04 | P0 | Evaluation set meets NFR-ACC-04. The score is labelled a risk indicator, not a probability. |
| FR-SEN-05 | P0 | Each listed reason maps to text actually found in the input. |
| FR-SEN-06 | P0 | Every high-risk verdict includes do-not-share-OTP, do-not-click and report-and-block guidance. |
| FR-SEN-07 | P1 | Result names a matched pattern with its source. |
| FR-SEN-08 | P0 | Sample predatory loan screenshots are flagged with loan-specific reasons. |
| FR-SEN-09 | P0 | '50% in 7 days' style tips are flagged, with an explanation why. |
| FR-SEN-10 | P2 | Curated, sourced content. Report counts appear only when they come from real data. |
| FR-SEN-11 | P1 | A scam check appears in the graph and changes the safety dimension. |
| FR-SEN-12 | P2 | Local heuristics only unless a reputation source is approved; offline checks must be labelled. |
| FR-SEN-13 | P3 | Deferred: no call-audio pipeline exists in any architecture diagram. |
| FR-SEN-14 | P3 | Deferred: no transaction data source is defined. |
| FR-SEN-15 | P3 | Deferred: a PWA cannot read a user's SMS or WhatsApp. Sentinel is listed as Reactive in ES Appendix A; see C-016. |
| FR-SEN-16 | P1 | High-risk results show verified official reporting channels. |

## CON: Connector Agent and Scheme Advisor

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-CON-01 | P0 | Each scheme has official source URL and verification date; a human has confirmed the facts. |
| FR-CON-02 | P0 | Table-driven tests pass for all P0 schemes, including boundary ages. The incorrect PMJJBY income rule in UI-12 is not reproduced (C-014). |
| FR-CON-03 | P0 | Each criterion shows the rule, the user's value and the result. |
| FR-CON-04 | P1 | Figures come from the catalogue and show source and date. |
| FR-CON-05 | P0 | Each P0 scheme has reviewed steps, required documents and where to apply. |
| FR-CON-06 | P1 | Search and filters return correct results by touch and by voice. |
| FR-CON-07 | P2 | Rank is derived from stated criteria and explained; no unexplained percentage is shown. |
| FR-CON-08 | P1 | Divya test persona receives relevant schemes through voice. |
| FR-CON-09 | P0 | Kisan flow is demonstrated in Kannada end to end. |
| FR-CON-10 | P1 | Feed reflects twin state and each item links to an action. |
| FR-CON-11 | P1 | Editing a profile attribute surfaces a newly eligible scheme. |
| FR-CON-12 | P1 | Stale records are flagged to the user. |
| FR-CON-13 | P2 | Priya receives a benefits checklist. |

## DSH: Dashboard

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-DSH-01 | P0 | All figures come from live data and match their detail screens. |
| FR-DSH-02 | P1 | Value matches the assessment. |
| FR-DSH-03 | P2 | Timeline reads from the event log. |
| FR-DSH-04 | P2 | Categories sum to stated income; the source (statement or manual) is shown. |
| FR-DSH-05 | P0 | All routes are reachable by screen reader and keyboard. |

## COA: Monthly Financial Coach

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-COA-01 | P1 | Review is generated from real twin data for one test month and all figures reconcile. |
| FR-COA-02 | P1 | Report figures match Dashboard and Score (C-015 resolved). |
| FR-COA-03 | P2 | A real email arrives at a test address. In-app delivery remains the primary channel. |
| FR-COA-04 | P2 | Clicking through updates the twin and changes the next recommendation. |
| FR-COA-05 | P2 | Reminder fires for a due milestone. |

## ENG: Engagement mechanics

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-ENG-01 | P2 | XP total reconciles with completed activities. |
| FR-ENG-02 | P2 | Streak increments once per day and resets correctly. |
| FR-ENG-03 | P2 | Challenge awards stated XP once. |
| FR-ENG-04 | P1 | Each loop stage links to the next in the user flow. |
| FR-ENG-05 | P3 | Deferred: no team document proposes this; listed for traceability. |

## IMP: Behavioral impact measurement

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-IMP-01 | P0 | Goal, lesson, scam and scheme actions all write typed events. |
| FR-IMP-02 | P1 | Each tier has a metric computed from the event log. |
| FR-IMP-03 | P2 | Claimed savings are tagged self-reported or document-verified. |
| FR-IMP-04 | P1 | Pre and post quiz delta is recorded per module. |
| FR-IMP-05 | P2 | Aggregate outcomes come from real events, with small cohorts suppressed. |

## VOI: Voice pipeline

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-VOI-01 | P0 | Sample set per language meets the accuracy recorded by evaluation T0.08. |
| FR-VOI-02 | P0 | Spoken output works in English, Hindi, Marathi and Kannada, with the selected engine and licence recorded. |
| FR-VOI-03 | P0 | A voice question gets a spoken answer inside NFR-PERF-02. |
| FR-VOI-04 | P1 | Screen is fully usable without sight. |
| FR-VOI-05 | P1 | Named screens open by voice command. |
| FR-VOI-06 | P1 | Summary reads live figures, not a generic description. |
| FR-VOI-07 | P0 | A round trip is demonstrated in each of the four languages. |
| FR-VOI-08 | P3 | Deferred: no telephony component in the tech stack. Listed in ES Appendix B only. |
| FR-VOI-09 | P0 | Changing a language's speech engine needs no feature code change. |

## A11: Accessibility features

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-A11-01 | P1 | Settings persist and apply to all screens. |
| FR-A11-02 | P0 | Divya test persona gets all dashboard figures with the display off. |
| FR-A11-03 | P0 | Manual test scripts pass for login, assessment, chat, scam check and scheme lookup. |
| FR-A11-04 | P1 | Full Divya journey is completed with no sighted assistance. |

## LNG: Language and literacy adaptation

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-LNG-01 | P0 | All P0 screens render fully in all four languages with no untranslated strings. |
| FR-LNG-02 | P0 | Financial glossary terms translate consistently in reviewed samples. |
| FR-LNG-03 | P1 | Kisan's examples use farming seasons, not salaries. |
| FR-LNG-04 | P1 | Core flows can be completed with minimal reading. |
| FR-LNG-05 | P1 | A fifth test language can be enabled with no feature code change. |

## OFF: PWA and offline

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-OFF-01 | P0 | Lighthouse PWA checks pass and the app installs on Android. |
| FR-OFF-02 | P2 | A downloaded lesson opens in airplane mode. |
| FR-OFF-03 | P2 | App opens offline and says so, without errors. |
| FR-OFF-04 | P2 | Core chat works on a throttled Slow 3G profile. |

## SAF: Responsible AI safeguards

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-SAF-01 | P0 | Notice is shown at first use and always reachable, in every language. |
| FR-SAF-02 | P0 | No response gives a directive to buy a specific security or product; an evaluation set confirms this. |
| FR-SAF-03 | P0 | Adversarial prompt set passes NFR-ACC-06. |
| FR-SAF-04 | P0 | Answers show publisher and date of sources. |
| FR-SAF-05 | P1 | High-stakes intents show routes to official helplines, an NGO or a registered professional. Staffed support is not assumed. |
| FR-SAF-06 | P0 | Delete removes PostgreSQL, Neo4j and Storage data for the user. |

## BIZ: Ecosystem and future business (vision only)

| ID | Priority | Acceptance criterion |
|---|---|---|
| FR-BIZ-01 | P3 | Deferred: gap against the problem statement. No team document proposes it. See D-019. |
| FR-BIZ-02 | P3 | Deferred: a future revenue concept, not a build item. |
| FR-BIZ-03 | P3 | Deferred: appears only in a superseded diagram; no access exists. |

## Non-functional

| ID | Priority | Acceptance criterion |
|---|---|---|
| NFR-PERF-01 | P1 | Measured over 30 requests; result stored in 05_TESTING. Provisional until T0.03. |
| NFR-PERF-02 | P1 | Measured per language with the selected self-hosted engines. Provisional until T0.07 and T0.08. |
| NFR-PERF-03 | P1 | Lighthouse run stored as evidence. |
| NFR-PERF-04 | P1 | Measured over the evaluation set. |
| NFR-SCAL-01 | P0 | Two API replicas serve one session without errors. |
| NFR-SCAL-02 | P1 | Document exists in 02_ARCHITECTURE; no capacity claim is made without a test. |
| NFR-SCAL-03 | P0 | With 10 concurrent requests none fails, and each user sees queue status. |
| NFR-AVAIL-01 | P0 | Fault-injection test passes. |
| NFR-AVAIL-02 | P0 | A release is promoted from staging to production and rolled back successfully. |
| NFR-AVAIL-03 | P0 | Restore from backup is rehearsed once. |
| NFR-SEC-01 | P0 | Automated route test finds no unauthenticated data route. |
| NFR-SEC-02 | P0 | Cross-tenant tests pass on all stores. |
| NFR-SEC-03 | P0 | Configuration verified; marketing terms such as 'bank-grade' are not used without basis. |
| NFR-SEC-04 | P0 | Secret scan is clean. |
| NFR-SEC-05 | P0 | Malformed and oversized files are rejected. |
| NFR-SEC-06 | P0 | A scam screenshot containing instructions to the AI does not change the verdict. |
| NFR-SEC-07 | P0 | Log review on a full end-to-end run finds none. |
| NFR-SEC-08 | P0 | npm audit and pip-audit results stored; exceptions recorded in DECISIONS_LOG. |
| NFR-SEC-09 | P0 | Excess requests get HTTP 429. |
| NFR-SEC-10 | P0 | Findings are recorded and all high-severity items are closed. |
| NFR-PRIV-01 | P0 | Payload inspection on a full end-to-end run. |
| NFR-PRIV-02 | P0 | Policy documented; deletion test passes. Voice audio is deleted after transcription by default. |
| NFR-PRIV-03 | P0 | Checklist complete and reviewed by a qualified adviser. Planning documents are not legal certification. |
| NFR-A11Y-01 | P0 | axe-core clean on P0 screens, plus manual review. |
| NFR-A11Y-02 | P0 | Signed manual test records in 05_TESTING. |
| NFR-A11Y-03 | P0 | Automated and manual checks pass. |
| NFR-A11Y-04 | P1 | Review of P0 screens recorded. |
| NFR-I18N-01 | P0 | Visual check on Android in each language. |
| NFR-I18N-02 | P1 | Formatter tests pass; TTS reads figures correctly. |
| NFR-ACC-01 | P0 | Human-reviewed fact sheet complete. |
| NFR-ACC-02 | P0 | Cross-screen reconciliation test passes for each demo persona. |
| NFR-ACC-03 | P1 | Target at least 85% supported on a 30-question set, per language. |
| NFR-ACC-04 | P1 | Results published with the dataset; real accuracy is reported even if below target. |
| NFR-ACC-05 | P1 | Result stored in 05_TESTING. |
| NFR-ACC-06 | P0 | 100% pass on critical cases. |
| NFR-ACC-07 | P1 | Measured figure is recorded. |
| NFR-COMP-01 | P0 | Tested on one physical low-end device if available. |
| NFR-COMP-02 | P2 | Throttled test recorded. |
| NFR-OBS-01 | P0 | One request can be followed end to end in logs. |
| NFR-OBS-02 | P0 | Dashboards show API, model queue and host health; a test alert fires. |
| NFR-MAINT-01 | P0 | Clean machine rebuild succeeds from lockfiles. |
| NFR-MAINT-02 | P0 | Each phase-gate review confirms this. |
| NFR-MAINT-03 | P0 | CI or a local gate script passes. |
| NFR-MAINT-04 | P0 | One command deploys to staging; production needs a manual approval step. |
| NFR-MAINT-05 | P1 | All eight documents exist and match the shipped release. |
| NFR-COST-01 | P0 | Per-request token usage is logged. |
| NFR-COST-02 | P0 | Reaching a test limit returns a clear message; usage is visible per task. |
| NFR-LIC-01 | P0 | An automated licence report passes, and the licence register in 06_DOCUMENTATION covers every component and model. |
| NFR-LIC-02 | P0 | All four persona journeys pass with outbound internet blocked, apart from optional Google sign-in. |
