"""T0.06 licence check (NFR-LIC-01, D-026).

Reads `pip-licenses --format=json` output on stdin. Every licence term in every distribution's
licence expression must be on the allow-list, otherwise the distribution is reported and the exit
code is 1. The check is deliberately conservative: an `A OR B` expression with an unknown B is
reported for a human decision rather than silently accepted.
"""
from __future__ import annotations

import json
import re
import sys

# Permissive and weak-copyleft OSI-approved licences that are acceptable in the API process.
ALLOWED_TERMS = [
    r"MIT(-0|-CMU)?( License)?", r"BSD(-[23]-Clause)?( License)?", r"3-Clause BSD License", r"0BSD",
    r"Apache(-2\.0| Software License| License,? Version 2\.0| 2\.0)", r"ISC( License)?( \(ISCL\))?",
    r"PSF(-2\.0)?", r"Python-2\.0", r"Python Software Foundation License", r"CNRI-Python",
    r"MPL-2\.0", r"Mozilla Public License 2\.0 \(MPL 2\.0\)", r"Zlib", r"CC0-1\.0", r"Unlicense",
    r"HPND", r"Academic Free License \(AFL\)",
    # LGPL is OSI-approved weak copyleft; Python imports are dynamic linking. Recorded in the register.
    r"LGPL-[23]\.[01](-only|-or-later)?", r"GNU Lesser General Public License v[23].*",
]
_ALLOWED = [re.compile(rf"^{p}$", re.I) for p in ALLOWED_TERMS]
_SPLIT = re.compile(r"\s*(?:;|\bAND\b|\bOR\b|\bWITH\b|\(|\))\s*")


def licence_terms(licence: str) -> list[str]:
    """Split a licence expression or classifier list into individual terms.

    pip-licenses sometimes returns the full licence text. Its first line names the licence.
    """
    first_line = licence.strip().splitlines()[0] if licence.strip() else ""
    # Keep "(MPL 2.0)" and "(AFL)" and "(ISCL)" attached to their names before splitting on parens.
    protected = re.sub(r" \((MPL 2\.0|AFL|ISCL)\)", r" [\1]", first_line)
    terms = [t.strip() for t in _SPLIT.split(protected) if t and t.strip()]
    return [re.sub(r" \[(.*?)\]", r" (\1)", t) for t in terms]


def is_allowed(licence: str) -> bool:
    terms = licence_terms(licence)
    return bool(terms) and all(any(p.match(t) for p in _ALLOWED) for t in terms)


def main() -> int:
    rows = json.load(sys.stdin)
    bad = [r for r in rows if not is_allowed(r["License"])]
    for r in rows:
        status = "ok" if r not in bad else "REVIEW"
        print(f"{status:6} {r['Name']}=={r['Version']}  [{licence_terms(r['License'])}]")
    print(f"\n{len(rows)} distributions checked, {len(bad)} need review: {[r['Name'] for r in bad]}")
    return 1 if bad else 0


if __name__ == "__main__":
    raise SystemExit(main())
