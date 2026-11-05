# Data Flow

**Version:** 1.0 (2026-11-05) | **Status:** Design
End-to-end flows for the 14-step journey (deck s11) and the five flows into the Confidence Engine (deck s29). Each flow states which tier sees what.

**Legend:** 🔒 Private Tier or deterministic code only · 🧠 Reasoning Tier sees redacted context · 💾 persisted

## 1. Journey overview

```mermaid
flowchart LR
  A[Register: Keycloak] --> B[Consent + profile 💾]
  B --> C{Path}
  C -->|documents| D[Upload 💾 vault] --> E[OCR + extraction 🔒] --> F[User confirms 💾]
  C -->|questionnaire| G[Dynamic questions 💾]
  F --> G
  G --> H[Twin created: outbox → Neo4j 💾]
  H --> I[Baseline score: deterministic 💾]
  I --> J[Goal Studio: calculators 🔒 + wording 🧠]
  J --> K[Learning, Sentinel, Connector, Ask]
  K --> L[Events 💾] --> M[Confidence Engine 💾] --> N[Monthly review 🧠]
  N --> K
```

## 2. Document onboarding

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant API as api
  participant V as SeaweedFS
  participant W as worker
  participant OCR as inference /ocr
  participant PT as Ollama Private Tier
  participant PG as PostgreSQL
  U->>API: POST /v1/documents (salary slip)
  API->>PG: check consent document_storage
  API->>API: validate magic bytes, size, strip EXIF
  API->>V: put encrypted object {user}/{yyyy}/{mm}/{doc}
  API->>PG: documents row, status uploaded + outbox job
  API-->>U: 202 + poll URL
  W->>V: get + decrypt
  W->>OCR: page images (script hint from profile language)
  OCR-->>W: lines + confidence
  W->>PT: 🔒 extract fields to JSON schema (OCR text includes identifiers)
  PT-->>W: fields + confidence
  W->>W: rule validation (net ≤ gross, plausible ranges)
  W->>PG: extracted_fields, status pending_review
  U->>API: GET /v1/documents/{id} → review screen
  U->>API: POST confirm (edits allowed)
  API->>PG: financial_items + DocumentConfirmed event + outbox(graph, score)
```

The Reasoning Tier never sees the document or its OCR text (FR-DOC-06).

## 3. Ask VAAKYA (text, Marathi)

```mermaid
sequenceDiagram
  autonumber
  participant U as Priya
  participant API as api / LangGraph
  participant PT as Private Tier
  participant TR as IndicTrans2
  participant NJ as Neo4j gateway
  participant QD as Qdrant
  participant RT as Reasoning Tier
  U->>API: "ULIP घ्यावी का?" (mr)
  API->>PT: 🔒 redact + route → learn (product evaluation)
  API->>TR: mr → en
  API->>NJ: twin_context (bands)
  API->>QD: retrieve (query embedding, category=concept, lang in [mr,en])
  API->>RT: 🧠 redacted question + bands + <source> chunks
  RT-->>API: draft with [n] citations
  API->>API: safety review: citations valid, no "buy this", educational notice
  API->>TR: en → mr with financial glossary
  API-->>U: SSE tokens + citations + Educator badge
  API->>API: 💾 messages (redacted), events, dataflow_audit
```

## 4. Voice round trip (Kannada, Kisan)

```mermaid
sequenceDiagram
  autonumber
  participant U as Kisan (PWA mic)
  participant API as api
  participant STT as inference /stt
  participant G as LangGraph
  participant TTS as inference /tts
  U->>API: POST /v1/voice/query (opus, 20 s)
  API->>API: consent voice_processing, size and duration caps
  API->>STT: audio (tmpfs, deleted after)
  STT-->>API: kn transcript + confidence
  alt confidence < threshold
    API-->>U: "Did you say …?" (text + speech)
  end
  API->>G: same graph as text, channel=voice, user_lang=kn
  G-->>API: answer (Connector: PM-KISAN steps)
  API->>TTS: kn text (engine from speech adapter config)
  TTS-->>API: ogg
  API-->>U: transcript, answer text, audio URL (5 min)
```

Divya's screen reader can read the text answer, so TTS failure never blocks her (MASTER_PLAN s17).

## 5. Scam check

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant API as api
  participant OCR as inference /ocr
  participant PT as Private Tier
  participant QD as Qdrant
  participant RT as Reasoning Tier
  U->>API: POST /v1/sentinel/checks (screenshot)
  API->>OCR: image
  OCR-->>API: text
  API->>PT: 🔒 redact the user's own identifiers
  par deterministic
    API->>API: signal rules (OTP, urgency, fee, APR, domain)
  and patterns
    API->>QD: similar scam_pattern chunks
  and model
    API->>RT: 🧠 <untrusted_content> → JSON labels + evidence quotes
  end
  API->>API: verify quotes are substrings, combine weights into indicator and level
  API-->>U: level, reasons, actions, reporting routes
  API->>API: 💾 sentinel_checks, ScamChecked event → twin + safety dimension
```

## 6. Goal planning

```mermaid
flowchart LR
  In[Goal: Emergency fund ₹90,000 by Oct 2027] --> P[Private Tier: parse params 🔒]
  P --> Snap[financial snapshot from PostgreSQL 🔒]
  Snap --> Calc[calculators: months, monthly saving, lean-month floor, feasibility 🔒]
  Calc --> Plan[(plans row: inputs + outputs 💾)]
  Plan --> Word[Reasoning Tier writes text with placeholders 🧠]
  Word --> Fill[fill placeholders from plan outputs]
  Fill --> Safe[safety: no stray numbers]
  Safe --> Out[Plan + Why this + next steps]
  Out --> Ev[GoalCreated event → twin, score 💾]
```

## 7. Scheme eligibility

```mermaid
flowchart LR
  Prof[Profile + financial_items 🔒] --> Rules[Rule DSL per scheme, versioned 🔒]
  Cat[(Verified scheme catalogue 💾)] --> Rules
  Rules --> Res[per-criterion met / not met / unknown 💾]
  Res --> Ask{unknown criteria?}
  Ask -->|yes| Q[Ask one question]
  Ask -->|no| Exp[Reasoning Tier explains result + steps from catalogue 🧠]
  Exp --> Out[Scheme answer with last-verified date]
  Res --> Ev[SchemeViewed / SchemeNewlyEligible → twin, opportunities]
```

## 8. Events into the Confidence Engine

```mermaid
flowchart LR
  E1[AssessmentCompleted] & E2[LessonCompleted, QuizAnswered] & E3[GoalCreated, GoalContribution] & E4[ScamChecked] & E5[SchemeViewed, ApplicationStarted] --> EV[(events 💾)]
  EV --> OB[(outbox)]
  OB --> R[relay]
  R --> G[Neo4j projection]
  R --> S[Score: fcs-1 formula, caps per dimension]
  S --> H[(score_history with reason 💾)]
  H --> D[Dashboard, Score screen, Monthly review]
```

## 9. Data deletion

```mermaid
flowchart LR
  Del[DELETE /v1/me] --> Mark[users.status = deletion_pending]
  Mark --> J[purge job]
  J --> V[Delete vault objects by prefix]
  J --> G[Graph: Q7 detach delete]
  J --> P[PostgreSQL: delete user rows; events anonymised by dropping user_id]
  J --> K[Keycloak: delete user]
  V & G & P & K --> Rep[Verification report: counts = 0]
```

## 10. What crosses each boundary

| Boundary | Allowed | Never |
|---|---|---|
| Browser → api | Typed inputs, files, audio | Tokens in JS-visible storage |
| api → Private Tier | Raw text, OCR, transcripts | - |
| Private → Reasoning Tier | Redacted English text, bands, tool outputs, public sources | Names, phone, Aadhaar, PAN, account numbers, addresses, raw documents |
| api → logs | Ids, timings, categories, HMAC user id | Content, figures, identifiers |
| Host → internet | Optional Google sign-in, OS updates, Let's Encrypt | Any user data |
