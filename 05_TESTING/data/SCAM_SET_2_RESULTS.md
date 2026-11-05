# Scam set 2 – results (KI-05)

**Date:** 2026-11-05. **Status of the set: NOT INDEPENDENT.** An AI assistant wrote both the Sentinel rules and this set (after the rules were frozen, without tuning to it). Labels are the author's judgement. A person who did not write the rules must label a real sample (T6.05) before any detection rate is published or shown in the app.

Run: `cd 04_APPLICATION/api && PYTHONUTF8=1 PYTHONPATH=. uv run python ../../05_TESTING/data/eval_scam_set.py`
Data: `scam_set_2.json` (28 scam messages in en/hi/mr/kn, 24 genuine including real-looking bank alerts that mention OTPs, links and urgency).

| Measure | Developer set (rules were tuned on it) | Set 2 (not tuned on) |
|---|---|---|
| Scams flagged high or critical | 12 / 12 | **10 / 28 (36%)** |
| Genuine messages wrongly flagged | 0 / 7 | **0 / 24** |

## What it shows

- The earlier 12/12 overstated detection. The rules over-fit their original examples; do not quote 12/12 anywhere.
- Zero false alarms held on 24 harder genuine messages, so the rules are cautious. The cost is missed scams.
- 18 scams were missed. 7 of them still raised a medium level (shown as "be careful", not as a block); 11 raised only low or nothing.
- By kind: Hindi, Marathi and Kannada phrasings (4 of 6 missed, rules have almost no non-English patterns); advance-fee loan/job/lottery paraphrases ("insurance charge", "training kit", "processing फीस"); family-emergency and "read me the code" phrasings; fake-officer calls (TRAI, Cyber Cell); investment groups without the exact words "guaranteed returns".
- Missed by an exact-wording gap, not by design: s14 ("read me the 6 digit code") and s24 ("Press 9 to speak to an officer").

## What was NOT done

The rules were not changed. Improving them against this set would turn it into training data and make the next number meaningless. Next steps, in order:
1. Improve the rules (more patterns, non-English coverage, combination rules such as "unsolicited + payment + urgency"), then measure on a **new** held-out set, ideally labelled by someone who did not write the rules.
2. Until then keep the app's wording as a risk indicator, never a detection rate, and keep the "not a verdict" framing.

A regression test (`api/tests/unit/test_scam_set_2.py`) fails if recall falls below 10/28 or any genuine message is flagged. Raise `BASELINE_RECALL` when the rules improve.
