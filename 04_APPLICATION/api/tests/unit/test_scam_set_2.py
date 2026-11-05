"""Second labelled set (KI-05). NOT independent: same author as the rules, written after they were frozen.
This is a regression floor, not a quality bar: recall was 10/28 when the set was written (2026-11-05). It may only go up,
and false alarms on genuine messages must stay at zero. Skipped where the repo's 05_TESTING folder is absent (Docker image)."""
import json
from pathlib import Path

import pytest

from vaakya.domain import sentinel_signals as ss

SET = Path(__file__).resolve().parents[4] / "05_TESTING" / "data" / "scam_set_2.json"
BASELINE_RECALL = 10   # raise this when the rules improve; never lower it

pytestmark = pytest.mark.skipif(not SET.exists(), reason="05_TESTING/data/scam_set_2.json not present")


def _score():
    msgs = json.loads(SET.read_text(encoding="utf-8"))["messages"]
    flagged = {m["id"]: ss.analyse(m["text"])["risk_level"] in ("high", "critical") for m in msgs}
    return msgs, flagged


def test_no_false_alarms_on_genuine_messages():
    msgs, flagged = _score()
    assert [m["id"] for m in msgs if not m["label"] and flagged[m["id"]]] == []


def test_recall_does_not_fall_below_the_baseline():
    msgs, flagged = _score()
    assert sum(1 for m in msgs if m["label"] and flagged[m["id"]]) >= BASELINE_RECALL
