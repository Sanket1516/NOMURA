# API Design

**Version:** 1.0 (2026-11-05) | **Status:** Design | **Base path:** `/v1` behind Caddy at `/api`
**Format:** JSON, UTF-8, `snake_case`. Money in **integer paise** with a formatted string where shown. Dates ISO 8601. Errors RFC 9457 (see `BACKEND_ARCHITECTURE.md` §7).
**Auth:** `Authorization: Bearer <Keycloak access token>` on every route except health. `user_id` always comes from the token.
**Source of truth when built:** the generated OpenAPI document. This file is the design that the code must match.

## Conventions

| Topic | Rule |
|---|---|
| Ids | UUIDv7 strings; scheme ids are slugs (`pm-kisan`) |
| Pagination | `?limit=20&cursor=<opaque>` → `{ items: [], next_cursor }` |
| Language | `Accept-Language: mr` or `lang` field; response `lang` echoes it |
| Idempotency | `Idempotency-Key` header on POSTs that create (goals, uploads, checks) |
| Streaming | `Accept: text/event-stream` on chat and voice |
| AI responses | Always include `ai: { agent[], notice, citations[] }` |
| Versioning | URL major version. Additive changes only within `/v1` |

## Shared schemas

```ts
type Money = { paise: number; display: string; spoken?: string };   // display "₹1,20,000", spoken "one lakh twenty thousand rupees"
type Citation = { id: string; title: string; publisher: string; url: string; effective_date: string };
type AiMeta = { agents: ("educator"|"strategy"|"sentinel"|"connector")[]; notice: string; citations: Citation[]; request_id: string };
type Lang = "en" | "hi" | "mr" | "kn";
```

## Endpoint index

| Method | Path | Purpose | Req |
|---|---|---|---|
| GET | `/v1/me` | Account summary, onboarding state | FR-ONB-01 |
| PUT | `/v1/me/profile` | Create or update profile | FR-ONB-03 |
| GET, PUT | `/v1/me/preferences` | Accessibility and language preferences | FR-A11-01 |
| GET, PUT | `/v1/me/consents` | View, grant, withdraw consent | FR-ONB-04 |
| POST | `/v1/me/export` | Start data export | FR-SAF-06 |
| DELETE | `/v1/me` | Erase account | FR-SAF-06 |
| GET | `/v1/me/deletion-report`, `/v1/me/export/{id}` | Deletion verification, export download | FR-SAF-06 |
| POST | `/v1/onboarding/path` | Choose documents or questionnaire | FR-ONB-05 |
| POST | `/v1/documents` | Upload document | FR-DOC-01 |
| GET | `/v1/documents`, `/v1/documents/{id}` | List, status, extracted fields | FR-DOC-05 |
| POST | `/v1/documents/{id}/confirm` | Confirm or correct fields | FR-DOC-05 |
| DELETE | `/v1/documents/{id}` | Delete document | FR-DOC-08 |
| GET | `/v1/assessment/next` | Next unanswered question | FR-ASM-02 |
| POST | `/v1/assessment/answers` | Submit answer(s) | FR-ASM-01 |
| POST | `/v1/assessment/complete` | Finish, build twin, baseline score | FR-ASM-05 |
| GET | `/v1/dashboard` | Home aggregate | FR-DSH-01 |
| GET, POST | `/v1/goals` | List, create goal | FR-STR-01 |
| GET, PATCH, DELETE | `/v1/goals/{id}` | Goal detail with plan | FR-STR-08 |
| POST | `/v1/goals/{id}/plan` | (Re)compute plan and roadmap | FR-STR-03/05 |
| POST | `/v1/goals/{id}/contributions` | Record progress | FR-STR-08 |
| POST | `/v1/chat` | Ask VAAKYA (SSE) | FR-ASK-01 |
| GET | `/v1/conversations`, `/v1/conversations/{id}` | History | FR-ASK-03 |
| POST | `/v1/voice/query` | Audio in, answer + audio out | FR-VOI-03 |
| POST | `/v1/voice/speak` | TTS for page summaries | FR-VOI-06 |
| POST | `/v1/voice/transcribe` | STT only (assessment answers, navigation) | FR-ASM-04 |
| POST | `/v1/sentinel/checks` | Analyse screenshot or text | FR-SEN-01..06 |
| GET | `/v1/sentinel/checks`, `/{id}` | Scam history | FR-SEN-11 |
| GET | `/v1/sentinel/reporting-routes` | Official channels | FR-SEN-16 |
| GET | `/v1/schemes` | Search and filter with status | FR-CON-01/06 |
| GET | `/v1/schemes/{id}` | Detail, steps, freshness | FR-CON-05/12 |
| GET | `/v1/schemes/{id}/eligibility` | Per-criterion result | FR-CON-03 |
| GET | `/v1/score` | Current score, dimensions, actions | FR-FCS-01..05 |
| GET | `/v1/score/history` | Time series | FR-FCS-06 |
| GET | `/v1/twin` | Life Graph view model | FR-FLG-10 |
| GET | `/v1/learning/modules`, `/{id}` | Modules and progress | FR-EDU-04/08 |
| POST | `/v1/learning/modules/{id}/complete` | Mark lesson done | FR-EDU-08 |
| GET, POST | `/v1/learning/quizzes/{id}`, `/attempts` | Quiz | FR-EDU-05 |
| GET | `/v1/opportunities` | Feed | FR-CON-10 |
| GET | `/v1/reviews`, `/v1/reviews/{month}` | Monthly reviews | FR-COA-02 |
| GET | `/v1/notifications`; POST `/{id}/read` | Nudges | FR-STR-11 |
| GET, POST | `/v1/admin/content`, `/{id}/approve` | Content review | FR-EDU-07 |
| GET, PUT | `/v1/admin/schemes/{id}` | Scheme data and verification | NFR-ACC-01 |
| GET | `/healthz`, `/readyz` | Liveness, readiness | NFR-OBS-02 |

## Major endpoint schemas

### `PUT /v1/me/profile`

```json
// request
{ "display_name": "Priya", "birth_year": 1994, "occupation": "teacher", "state": "MH", "district": "Thane",
  "rural": false, "preferred_lang": "mr", "income_type": "salaried", "literacy_level": "standard",
  "dependents": 2, "disability": null }
// 200
{ "user_id": "0193…", "onboarding": { "consent": true, "profile": true, "path": null, "assessment": false } }
```

### `PUT /v1/me/consents`

```json
// request
{ "grants": [ { "purpose": "document_storage", "version": "2026-11", "granted": true },
              { "purpose": "ai_processing", "version": "2026-11", "granted": true },
              { "purpose": "voice_processing", "version": "2026-11", "granted": false } ] }
// 200
{ "consents": [ { "purpose": "document_storage", "version": "2026-11", "granted_at": "2026-11-05T09:12:00Z", "withdrawn_at": null } ] }
```

### `POST /v1/documents` (multipart)

Fields: `file` (PDF, PNG, JPG; ≤ 10 MB), `kind` (`salary_slip`, `bank_statement`, `insurance_policy`, `epf_statement`, `land_record`, `other`). Requires `document_storage` consent, else 409.

```json
// 202
{ "id": "0193…", "status": "uploaded", "kind": "salary_slip", "poll": "/v1/documents/0193…" }
```

### `GET /v1/documents/{id}`

```json
{ "id": "0193…", "status": "pending_review", "kind": "salary_slip",
  "fields": [
    { "field": "net_monthly_income", "value": { "paise": 3500000, "display": "₹35,000" }, "confidence": 0.93, "confirmed": false },
    { "field": "employer_type", "value": "government_school", "confidence": 0.71, "confirmed": false } ],
  "engine": { "ocr": "paddleocr", "extraction_tier": "private" } }
```

### `POST /v1/documents/{id}/confirm`

```json
{ "fields": [ { "field": "net_monthly_income", "value": { "paise": 3500000 } },
              { "field": "employer_type", "value": "government_school" } ] }
// 200 { "status": "confirmed", "twin_updated": true }
```

### `GET /v1/assessment/next` and `POST /v1/assessment/answers`

```json
// GET 200
{ "step": 2, "total_steps": 5, "question": { "id": "monthly_expenses", "type": "money_range",
  "prompt": "Roughly how much do you spend in a month?", "options": null, "voice_allowed": true,
  "why": "Needed to size your emergency fund" }, "done": false }
// POST request
{ "answers": [ { "question_id": "monthly_expenses", "value": { "min_paise": 1500000, "max_paise": 2000000 }, "source": "voice" } ] }
// POST 200 → same shape as GET for the next question
```

### `POST /v1/assessment/complete`

```json
// 200
{ "twin": { "created": true }, "score": { "overall": 54, "band": "Fair", "formula_version": "fcs-1" } }
```

### `GET /v1/dashboard`

```json
{ "score": { "overall": 62, "band": "Fair", "change_30d": 4, "text": "Fair, up 4 points this month" },
  "snapshot": { "monthly_income": { "paise": 3500000, "display": "₹35,000" }, "emergency_fund_months": 1.2, "debt_to_income_pct": 18 },
  "goals": [ { "id": "…", "title": "Emergency fund", "progress_pct": 40, "on_track": true } ],
  "learning": { "modules_done": 3, "modules_total": 6 },
  "schemes": { "eligible": 3, "reviewed": 1 },
  "scam_risk": { "checks_30d": 2, "last_level": "high" },
  "insight": { "text": "…", "agent": "strategy", "why": "/v1/goals/…" },
  "opportunities": [ { "kind": "scheme", "ref": "pmjjby", "title": "…" } ],
  "risk_profile": { "appetite": "low", "explanation": "…" } }
```

### `POST /v1/goals` and `POST /v1/goals/{id}/plan`

```json
// POST /v1/goals request
{ "type": "emergency_fund", "title": "Emergency fund", "target": { "paise": 9000000 }, "target_date": "2027-10-31", "priority": 1 }
// POST /plan 200
{ "plan_id": "…", "feasibility": "achievable_with_changes", "calc_version": "calc-1",
  "figures": [
    { "key": "monthly_saving", "value": { "paise": 750000, "display": "₹7,500" }, "formula": "target / months", "inputs": { "target_paise": 9000000, "months": 12 } },
    { "key": "lean_month_floor", "value": { "paise": 300000, "display": "₹3,000" }, "formula": "10% of lowest income month" } ],
  "milestones": [ { "month": "2026-12", "target": { "paise": 750000 } } ],
  "next_steps": [ "Set up an automatic ₹3,000 transfer on payday" ],
  "explanation": "…", "ai": { "agents": ["strategy"], "notice": "Educational guidance. You decide.", "citations": [] } }
```

Irregular income: `income_type = variable` makes the plan return `saving_rule: { percent: 12, floor_paise: 300000 }` instead of a fixed amount (FR-STR-06). Seasonal: `harvest_months` and `set_aside_for_next_season` (FR-STR-07).

### `POST /v1/chat` (SSE)

```json
// request
{ "conversation_id": null, "message": "SIP आणि FD मध्ये काय फरक आहे?", "lang": "mr", "context": { "screen": "ask" } }
```

```text
event: queued     data: {"position": 1}
event: agent      data: {"agent": "educator"}
event: token      data: {"text": "SIP म्हणजे…"}
event: citation   data: {"id":"c1","title":"Mutual fund basics","publisher":"SEBI","url":"…","effective_date":"2025-04-01"}
event: final      data: {"conversation_id":"…","message_id":"…","text":"…","ai":{…},"why":null,"followups":["What is a lock-in?"]}
```

Errors arrive as `event: error data: {problem details}`. Non-streaming clients get the `final` payload as JSON.

### `POST /v1/voice/query` (multipart)

Fields: `audio` (webm/opus or wav, ≤ 60 s, ≤ 5 MB), `lang` (optional hint). Requires `voice_processing` consent.

```json
// 200 (or SSE with stages: transcribing, thinking, speaking)
{ "transcript": { "text": "…", "lang": "kn", "confidence": 0.82 },
  "answer": { "text": "…", "ai": { … } },
  "audio": { "url": "/v1/voice/audio/…", "mime": "audio/ogg", "expires_in": 300 } }
```

Audio responses are kept in memory or temp storage for 5 minutes, then deleted.

### `POST /v1/sentinel/checks`

Multipart `image` (PNG/JPG ≤ 10 MB) **or** JSON `{ "text": "…", "kind": "sms|whatsapp|ad|loan_offer|investment_tip" }`.

```json
// 200
{ "id": "…", "risk_level": "high", "risk_indicator": 86, "indicator_label": "Risk indicator, not a probability",
  "weights_version": "sig-1",
  "reasons": [
    { "signal": "otp_request", "severity": "critical", "evidence": "share the OTP you receive", "explanation": "Banks never ask for an OTP." },
    { "signal": "urgency", "severity": "medium", "evidence": "within 2 hours", "explanation": "Pressure to act fast is a common scam tactic." } ],
  "similar_patterns": [ { "id": "scam-kyc-update", "title": "Fake KYC update" } ],
  "actions": [ "Do not reply or share the OTP", "Call your bank using the number on your card", "Report at 1930 or cybercrime.gov.in" ],
  "ai": { "agents": ["sentinel"], "notice": "…", "citations": [ … ] } }
```

### `GET /v1/schemes` and `/v1/schemes/{id}/eligibility`

```json
// GET /v1/schemes?category=agriculture&q=kisan&lang=kn
{ "items": [ { "id": "pm-kisan", "name": "ಪಿಎಂ-ಕಿಸಾನ್", "category": "agriculture", "status": "likely_eligible",
               "last_verified_at": "2026-10-01", "stale": false } ], "next_cursor": null }
// GET /v1/schemes/pm-kisan/eligibility
{ "scheme_id": "pm-kisan", "rules_version": "pm-kisan-3", "status": "likely_eligible",
  "criteria": [
    { "id": "landholding", "label": "Owns cultivable land", "result": "met", "user_value": "3 acres" },
    { "id": "income_tax_payer", "label": "Not an income-tax payer", "result": "met" },
    { "id": "institutional_landholder", "label": "Not an institutional landholder", "result": "unknown", "ask": "Is the land held by a trust or company?" } ],
  "benefit": { "estimate": { "paise": 600000, "display": "₹6,000 per year" }, "basis": "Fixed scheme amount" },
  "steps": [ { "n": 1, "text": "…", "link": "https://pmkisan.gov.in" } ],
  "explanation": "…", "source": { "url": "…", "last_verified_at": "2026-10-01" }, "ai": { … } }
```

The values above are illustrative. Real scheme figures come only from the verified fact sheet (T0.12).

### `GET /v1/score`

```json
{ "overall": 62, "band": "Fair", "formula_version": "fcs-1", "computed_at": "…",
  "dimensions": [
    { "key": "literacy", "score": 70, "inputs": { "quiz_accuracy": 0.75, "core_modules_done": 3 } },
    { "key": "safety", "score": 66 }, { "key": "goal_planning", "score": 58 },
    { "key": "scheme_awareness", "score": 40 }, { "key": "savings_discipline", "score": 76 } ],
  "actions": [ { "text": "Finish Insurance 101", "estimated_points": 3, "link": "/learn/insurance-101" } ],
  "text_equivalent": "Your score is 62, Fair. Strongest: savings discipline 76. Weakest: scheme awareness 40.",
  "not_a_credit_score": true }
```

### `GET /v1/twin`

```json
{ "nodes": [ { "id": "…", "type": "Goal", "label": "Emergency fund", "status": "on_track" } ],
  "edges": [ { "from": "user", "to": "…", "type": "PURSUES" } ],
  "insights": [ { "text": "Two dependants have no insurance cover.", "agent": "strategy", "query": "protection_gaps" } ],
  "outline": [ { "group": "Income", "items": ["Salary, ₹30k–40k a month"] } ] }
```

`outline` is the screen-reader primary view (FR-A11-02).

### `GET /v1/reviews/{month}`

```json
{ "month": "2026-10", "score": { "from": 58, "to": 62 }, "achievements": ["…"], "alerts": ["…"],
  "new_schemes": ["pmsby"], "focus": ["…"], "goals": [ { "id": "…", "progress_pct": 40 } ], "ai": { … } }
```

### `DELETE /v1/me`

```json
// 202
{ "status": "deletion_pending", "complete_by": "2026-12-05", "verification": "/v1/me/deletion-report" }
```

### `POST /v1/me/export`

```json
// 202 { "export_id": "…", "status": "preparing" }  → GET /v1/me/export/{id} returns a one-time download when ready
```
