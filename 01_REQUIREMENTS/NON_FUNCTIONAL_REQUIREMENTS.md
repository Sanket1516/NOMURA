# Non-Functional Requirements

**Last updated:** 2026-11-05 | **Status:** Draft, awaiting approval

Total: **49 non-functional requirements.**

> **Every numeric target in this file is an engineering proposal (`ER`).** No source document specifies any latency, accuracy or capacity figure. Numbers will be confirmed or revised by the spikes in Phase 0. Measured results must be reported honestly, even when they miss the target.

Source tags are defined in `FUNCTIONAL_REQUIREMENTS.md`.

## Performance

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-PERF-01 | **Text response time.** Typed question returns a first answer within 20 s at p95 on the target hardware. | ER | P1 | PH10 |
| NFR-PERF-02 | **Voice round trip.** Voice question to spoken answer within 45 s at p95 on the target hardware. | ER; PS-A2 | P1 | PH10 |
| NFR-PERF-03 | **Dashboard load.** Dashboard interactive within 3 s on a simulated 4G connection. | ER; DK-s14 | P1 | PH10 |
| NFR-PERF-04 | **Scam check time.** Screenshot to verdict within 30 s on the target hardware. | ER; DK-s15 | P1 | PH10 |

## Scalability

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-SCAL-01 | **Stateless API tier.** API containers hold no user state so they can scale horizontally. | DK-s10; PS-I3 | P0 | PH1 |
| NFR-SCAL-02 | **Scale path documented.** Document how capacity grows with hardware, and the path to the 1M-user target from the deck. It is a target, not a tested capacity. | DK-s7; PS-I3 | P1 | PH10 |
| NFR-SCAL-03 | **Inference queue.** Requests wait in a fair queue when the model is busy, and the user sees clear progress. | ER; UB-FOSS | P0 | PH3 |

## Availability and reliability

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-AVAIL-01 | **LLM failure handling.** Time out, retry once and fall back for LLM failures. | ER; PS-R2 | P0 | PH3 |
| NFR-AVAIL-02 | **Environments and rollback.** Separate local, staging and production Docker Compose environments, with tested rollback. | ER; UB-Q1 | P0 | PH10 |
| NFR-AVAIL-03 | **Data durability.** Back up Neo4j and Qdrant; stateful services do not rely on ephemeral task storage. | ER; D-007 | P0 | PH10 |

## Security

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-SEC-01 | **Authentication everywhere.** Every API route except health checks requires a verified Keycloak token. | ER; ES-STACK; D-027 | P0 | PH1 |
| NFR-SEC-02 | **Per-user authorisation.** Every read and write is scoped to the authenticated user across PostgreSQL, Storage, Neo4j and agent tools. | ER; PS-R3 | P0 | PH2 |
| NFR-SEC-03 | **Encryption.** TLS in transit and encrypted storage at rest, as the deck claims. | DK-s14; DK-s25 | P0 | PH1 |
| NFR-SEC-04 | **Secrets management.** No secrets in the repository; use Docker secrets or an equivalent protected file. | ER; ES-STACK | P0 | PH1 |
| NFR-SEC-05 | **Upload safety.** Validate type and size of uploads; no document is executed or trusted. | ER | P0 | PH4 |
| NFR-SEC-06 | **Prompt-injection resistance.** Content from documents, OCR and retrieved text is treated as data, never instructions. | ER; PS-R2 | P0 | PH3 |
| NFR-SEC-07 | **Safe logging.** Logs and traces contain no raw PII or financial values. | ER; PS-R3 | P0 | PH1 |
| NFR-SEC-08 | **Patched dependencies.** No dependency with an unpatched known vulnerability. Use current supported versions (D-020). | ER; D-020 | P0 | PH1 |
| NFR-SEC-09 | **Abuse limits.** Rate-limit LLM and upload endpoints. | ER | P0 | PH3 |
| NFR-SEC-10 | **Pre-launch security review.** Complete a threat model and security testing with open-source tools before real user data is accepted. | ER; UB-Q1; UB-FOSS | P0 | PH10 |

## Privacy

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-PRIV-01 | **Data minimisation.** Only the minimum necessary data reaches any external service. | DK-s12; PS-R3 | P0 | PH3 |
| NFR-PRIV-02 | **Retention and deletion.** Defined retention for documents, voice recordings and logs. | PS-R3; ER | P0 | PH8 |
| NFR-PRIV-03 | **DPDP compliance before real users.** Consent, notice, erasure and breach handling meet the DPDP Act and Rules before real users' data is processed. | ER; UB-Q1 | P0 | PH10 |

## Accessibility conformance

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-A11Y-01 | **WCAG conformance.** Target WCAG 2.2 AA on P0 screens. | ER; PS-A1; UB-IN5 | P0 | PH9 |
| NFR-A11Y-02 | **Assistive-technology testing.** Tested with TalkBack on Android and NVDA on Windows. | ER; PN-DIV-2 | P0 | PH9 |
| NFR-A11Y-03 | **Target size and non-colour signalling.** Touch targets at least 44 by 44 px; no meaning conveyed by colour alone. | DK-s6; ER | P0 | PH9 |
| NFR-A11Y-04 | **Cognitive load.** Information appears progressively; a screen has one primary action. | PS-U1 | P1 | PH9 |

## Internationalisation

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-I18N-01 | **Script support.** Devanagari and Kannada render correctly with proper fonts. | ER; PN-KIS-7 | P0 | PH9 |
| NFR-I18N-02 | **Indian number formats.** Rupee values use lakh and crore grouping and are spoken correctly. | ER; UI-03 | P1 | PH9 |

## Accuracy and AI quality

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-ACC-01 | **Scheme fact accuracy.** Scheme facts match official sources at the recorded verification date. | DK-s8; ER | P0 | PH2 |
| NFR-ACC-02 | **Financial arithmetic correctness.** All displayed figures reconcile across screens. | ER; C-015 | P0 | PH10 |
| NFR-ACC-03 | **Grounded answers.** RAG answers are supported by retrieved sources. | ER; ES-A5 | P1 | PH3 |
| NFR-ACC-04 | **Scam detection quality.** Measure precision and recall on a labelled set of at least 30 scam and 30 genuine messages. Target recall at least 90% and false-positive rate at most 10%. | ER; DK-s8 | P1 | PH6 |
| NFR-ACC-05 | **Routing accuracy.** Orchestrator routes at least 90% of the labelled test set correctly. | ER | P1 | PH3 |
| NFR-ACC-06 | **Safety evaluation.** Adversarial set covering guaranteed returns, specific-security requests and harmful-loan coaxing passes without violation. | ER; PS-R2 | P0 | PH3 |
| NFR-ACC-07 | **OCR quality.** Report field-level OCR accuracy for supported document formats. | DK-s8 | P1 | PH4 |

## Compatibility

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-COMP-01 | **Devices and browsers.** Works on Chrome for Android and a current desktop browser, on a low-end Android device. | ER; PS-A1 | P0 | PH10 |
| NFR-COMP-02 | **Limited bandwidth.** Usable on slow connections. | PS-A1; PS-Q5 | P2 | PH9 |

## Observability

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-OBS-01 | **Tracing.** Each request has a trace ID across orchestrator, agents and tools. | ER; ES-STACK | P0 | PH3 |
| NFR-OBS-02 | **Monitoring.** Logs, metrics and alerts through self-hosted OpenTelemetry, Prometheus, Loki and Grafana. | ER; UB-FOSS; D-007 | P0 | PH1 |

## Maintainability

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-MAINT-01 | **Pinned versions.** Every dependency is pinned in lockfiles, using current supported versions (D-020). | ER; UB-Q1; D-020 | P0 | PH1 |
| NFR-MAINT-02 | **Documentation currency.** Tracker, status and changelog are updated in the same change as the code. | UB-RULES | P0 | PH1 |
| NFR-MAINT-03 | **Automated quality gates.** Lint, type check and tests run before merge. | ER | P0 | PH1 |
| NFR-MAINT-04 | **Deployment automation.** Scripted build, test and deployment to staging and production. | ER | P0 | PH1 |
| NFR-MAINT-05 | **Maintained documentation set.** Keep technical architecture, system design diagrams, database schemas, API documentation, AI agent workflows, development roadmap, deployment documentation and the README up to date. | UB-Q9 | P1 | PH10 |

## Cost

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-COST-01 | **Model resource control.** Send only relevant context to LLMs and record token use and inference time. | DK-s12; DK-s14 | P0 | PH3 |
| NFR-COST-02 | **Usage limits.** Meter usage per task and per user, and enforce limits so one user cannot exhaust the host. | UB-Q7; ER | P0 | PH3 |

## Licensing

| ID | Requirement | Source | Priority | Phase |
|---|---|---|---|---|
| NFR-LIC-01 | **Free and open-source software only.** Every runtime component is free of charge and under an OSI-approved open-source licence. Model weights must use an open licence such as Apache-2.0 or MIT. Non-commercial and custom community licences are rejected. | UB-FOSS; D-026 | P0 | PH1 |
| NFR-LIC-02 | **No required paid or proprietary service.** The application runs fully with no paid account or proprietary hosted service. | UB-FOSS; D-026 | P0 | PH10 |
