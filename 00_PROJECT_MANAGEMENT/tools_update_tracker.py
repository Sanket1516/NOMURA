"""Update FEATURE_TRACKER.md rows by feature id. Usage: python3 tools_update_tracker.py <json file>
JSON: {"FR-X-01": {"implemented": "Yes|Partial|No", "tested": "...", "verified": "No", "status": "...", "evidence": "...", "classification": "..."}}
Refuses to set verified to anything but "No" (STRICT RULE: verification needs the Definition of Done)."""
import json, re, sys
from pathlib import Path
p = Path(__file__).parent / "FEATURE_TRACKER.md"
updates = json.load(open(sys.argv[1]))
s = p.read_text()
for fid, u in updates.items():
    assert u.get("verified", "No") == "No", f"{fid}: VERIFIED not allowed by this tool"
    pat = re.compile(rf"^\| {re.escape(fid)} \|(.*)$", re.M)
    m = pat.search(s)
    assert m, fid
    cells = [c.strip() for c in m.group(0).strip().strip("|").split("|")]
    # id, feature, source, priority, planned, implemented, tested, verified, status, evidence, classification
    cells[5] = u.get("implemented", cells[5]); cells[6] = u.get("tested", cells[6]); cells[7] = "No"
    cells[8] = u["status"]; cells[9] = u["evidence"]; cells[10] = u["classification"]
    s = s[:m.start()] + "| " + " | ".join(cells) + " |" + s[m.end():]
# Recount summary
statuses = re.findall(r"^\| (?:FR|NFR)-[A-Z0-9]+-\d+ \|(?:[^|]*\|){7} ([A-Z ]+?) \|", s, re.M)
from collections import Counter
c = Counter(statuses)
print(dict(c))
p.write_text(s)
