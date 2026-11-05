# Step 5 Results: Four agents and the Confidence Engine

**Date:** 2026-11-05 | **Code:** `04_APPLICATION/api/vaakya/agents/`, `domain/{sentinel_signals,eligibility}.py`, `services/{sentinel,connector}.py`
**Test environment:** real PostgreSQL 18 and Qdrant 1.20. **No LLM ran** (downloads blocked; T0.03), so every answer below comes from each agent's deterministic path and is labelled `llm_used: false`.

## What each agent actually does

| Agent | Specialised work (no LLM needed) | With an LLM (T0.03) |
|---|---|---|
| Educator | Retrieves from 46 trusted chunks in Qdrant; extractive answer with numbered citations; shorter for low-literacy users; abstains when no source passes the threshold | Words the answer only from numbered sources, must cite |
| Strategy Builder | Reads the user's own income, spending, EMIs and goals; emergency fund, goal status, irregular-income rule, seasonal split, loan APR; uses Life Graph risks; every answer lists assumptions and limits | Not used for figures, ever |
| Sentinel | 16 weighted signals + 8 link heuristics (no URL is ever opened); quoted evidence; LOW/MEDIUM/HIGH/CRITICAL; scam-pattern matches from Qdrant; records the check and updates the score; hands loan offers to Strategy Builder | Optional labels; never changes evidence |
| Connector | Deterministic eligibility on 10 schemes: per-criterion met / not met / unknown with the question to ask; benefits, documents, steps, official link; verification status | Explains results only |

## Tests (all pass; 138 backend tests in total)

| Suite | Count | Covers |
|---|---|---|
| Sentinel signals, labelled set | 23 | 12 scam and 7 genuine messages: **recall 12/12, false alarms 0/7**; quoted evidence; link look-alikes, shorteners, punycode; levels; actions |
| Eligibility engine | 14 | PM-KISAN exclusions, PMFBY unknowns, PMJJBY/PMSBY/APY age boundaries, KCC or-criterion, IGNDPS 80%, profile facts |
| Agents through the API | 18 | Each agent: normal, ambiguous, missing info, invalid input, service failure, unsupported question, safety-sensitive question; consent; redacted storage; SSE; dashboard updates |
| Orchestrator and safety | 9 | Includes warnings and quoted evidence being allowed while real claims are blocked |

**Honest limit on the Sentinel numbers:** the rules were tuned on this same developer-written set during development. They show the rules work as designed, not real-world accuracy. An independent labelled set (T6.05) is required before publishing any detection rate.

## Defects found by the tests and fixed

1. Genuine bank SMS "Do not share your OTP" flagged as a request; negation guard added.
2. `onlinesbi.sbi` flagged as a look-alike; brands now have several official domains.
3. Four scam phrasings missed; signals added or reweighted.
4. Safety review blocked warnings ("be wary of … guaranteed return") and quoted evidence; context check added.
5. Safety review blocked the Sentinel "/100" scale and Strategy example amounts; agents now declare every number.
6. Empty Sentinel text returned 500; now 422.

## Not done

- Screenshot OCR needs the inference service (Step 6); until then the endpoint says "paste the text instead" (503).
- Answers are English (no translation model).
- Proactive nudges (goal drift, newly eligible schemes) are not scheduled yet.
