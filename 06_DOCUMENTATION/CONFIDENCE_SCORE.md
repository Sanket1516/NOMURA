# Financial Confidence Score (formula `fcs-1`)

**Code:** `04_APPLICATION/api/vaakya/domain/score.py` (pure function) and `services/score.py` (gathers inputs). **Decisions:** D-011, amended by D-035.
**Status:** Implemented and tested. Weights are engineering proposals that need owner approval and validation with real users.

## Principles

- Calculated by code from what the user does in VAAKYA. The LLM may explain it, never set it.
- Versioned. Every stored score has `formula_version` and the reason it was recomputed.
- Capped activity, so repetition cannot inflate it. Income level is never an input.
- **Not a credit score.** Lenders never see it.

## Formula

```text
FCS = round_half_up( (Literacy + Safety + GoalPlanning + SchemeAwareness + SavingsDiscipline + DebtAwareness) / 6 )
```

| Dimension | Inputs (each 0 to 1, then × 100, rounded half up) |
|---|---|
| Financial literacy | 0.6 × quiz accuracy on money lessons (excluding Digital Safety) + 0.4 × share of the 6 core lessons completed |
| Scam awareness | 0.5 × Digital Safety quiz accuracy + 0.3 × Digital Safety lesson completed + 0.2 × min(scam checks, 5) / 5 |
| Goal progress | 0.5 × has an active goal with a plan + 0.5 × share of active goals on track |
| Scheme awareness | likely-eligible schemes reviewed / likely-eligible schemes, +0.1 if an application was started, capped at 1 |
| Savings behaviour | months (of the last three) in which saving met the monthly plan of active goals; 0 until a plan exists |
| Debt awareness | 0.5 × Loans and Credit lesson completed + 0.3 × used the loan-cost check + 0.2 × EMIs under 40% of income (unknown counts as 0) |

| Band | Range |
|---|---|
| Excellent | 85-100 |
| Good | 70-84 |
| Fair | 50-69 |
| Building | 0-49 |

**Improvement actions:** the three weakest dimensions, each with an approximate gain on the overall score (2 to 5 points).

## Worked example (tested)

A user answers 3 of 4 Digital Safety questions correctly after reading the lesson, with no scam checks yet:
Safety = 0.5 × 0.75 + 0.3 × 1 + 0.2 × 0 = 0.675 → **68**.

## Tests

`tests/unit/test_score.py` (zero, full marks, caps, weights, rounding, bands, actions) and integration tests in `test_user_flows.py` and `test_agents.py` (quiz and scam checks raise the score through the API).
