"""Score the Sentinel signal engine on a labelled set and print every miss.  Usage (from 04_APPLICATION/api):
    PYTHONUTF8=1 PYTHONPATH=. uv run python ../../05_TESTING/data/eval_scam_set.py [../../05_TESTING/data/scam_set_2.json]
A message counts as flagged when the risk level is high or critical. Honest reading: rules and set share an author (see the set's note)."""
import json
import sys
from pathlib import Path

from vaakya.domain import sentinel_signals as ss

path = Path(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).with_name("scam_set_2.json"))
data = json.loads(path.read_text(encoding="utf-8"))
tp = fn = fp = tn = 0
misses, alarms = [], []
for m in data["messages"]:
    r = ss.analyse(m["text"])
    flagged = r["risk_level"] in ("high", "critical")
    sig = [f.signal for f in r["findings"]]
    if m["label"] and flagged: tp += 1
    elif m["label"]: fn += 1; misses.append((m["id"], m["lang"], r["risk_level"], sig, m["text"]))
    elif flagged: fp += 1; alarms.append((m["id"], m["lang"], r["risk_level"], sig, m["text"]))
    else: tn += 1
print(f"{data['name']} [{data['status']}]  scams {tp + fn}, genuine {fp + tn}")
print(f"recall {tp}/{tp + fn}   false alarms {fp}/{fp + tn}")
for tag, rows in (("MISSED SCAM", misses), ("FALSE ALARM", alarms)):
    for i, lang, lvl, sig, text in rows:
        print(f"  {tag} {i} ({lang}) level={lvl} signals={sig}\n    {text[:110]}")
