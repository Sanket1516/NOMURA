# Step 4 Results: AI infrastructure

**Date:** 2026-11-05 | **Code:** `04_APPLICATION/api/vaakya/ai/`, `vaakya/agents/{base,router,safety,orchestrator}.py`

## Substitutions and limits (stated plainly)

| Requested | Built | Status |
|---|---|---|
| Gemini 2.5 Pro (cloud) | `LLMAdapter` for self-hosted **Ollama**, two tiers (D-003, D-026) | Contract-tested. **No model has run**: model downloads are blocked in this container; model choice is T0.03 on the RTX 3050 |
| LangGraph 0.2.x | LangGraph 1.2.20 | Real graph, tested |
| LlamaIndex 0.11.7 | Ingestion and retrieval written directly against qdrant-client; LlamaIndex 0.14 stays in the lockfile for document parsing later | Simpler and fully tested |
| Qdrant 1.10.1 | Qdrant 1.20.0 | Real collection, tested |
| multilingual-e5-large | Dense `e5` slot ready (1024-dim); **lexical sparse retrieval with server-side IDF** used now | e5 weights cannot be downloaded here (T0.10) |
| "On-device" privacy | Private Tier redaction **on VAAKYA's own server**; Reasoning Tier also self-hosted | Nothing is sent to any cloud AI. Wording follows the master plan: never "on-device" |

## Dual-LLM data handling

| Information | Where it stays | Reaches the Reasoning Tier? |
|---|---|---|
| Raw question, OCR text, transcripts | VAAKYA server, memory only | No: only the redacted form |
| Aadhaar, PAN, phone, email, UPI id, IFSC, card, account numbers, OTP/PIN, the user's own name | Replaced by tokens like `<PHONE_1>`; map in memory for the request | No |
| Profile and twin context | Bands only (for example income "30-50k") | Yes, as bands |
| Retrieved knowledge | Public lessons, schemes, scam patterns | Yes |
| Audit | `dataflow_audit` records categories, never values | - |
| Consent | `ai_processing` consent required for chat and voice (enforced in API) | - |

The type system enforces it: the adapter raises if a Reasoning Tier task receives text that is not `RedactedText`.

## Tests (33 new; all pass)

| Suite | Result | Proves |
|---|---|---|
| LLM adapter contract (7) | PASS | Ollama request shape, JSON-schema output, retry on 5xx and bad JSON, fallback model, unavailable path, privacy gate |
| Redaction (5) | PASS | 10 identifier types with Verhoeff and Luhn checks; ordinary amounts untouched; stable tokens; Devanagari text; restore |
| Knowledge on real Qdrant (5) | PASS | 46 chunks from lessons, schemes, scam patterns; idempotent ingest; **top-3 retrieval 15/15 (100%)** on a labelled set; filters; abstains on 5/5 out-of-scope questions and answers 15/15 in-scope |
| Orchestrator (8) | PASS | Router in 3 scripts and protection priority; agents see only redacted text; clarify; handoff ≤ 2 hops without loops; user override; safety blocks invented numbers, guaranteed-return claims and uncited answers; high-stakes help route |
| Latency | Not measured | Needs real models on the target GPU (T10.02) |

The labelled retrieval set has 15 questions, written by the developer. A larger, independent set is needed (T0.10).

## Not done

- Translation (IndicTrans2): answers are English, marked `translated: false`.
- PostgreSQL LangGraph checkpointer: conversation state is kept in the `messages` table instead.
