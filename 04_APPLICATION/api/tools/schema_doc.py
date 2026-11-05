"""Generate 06_DOCUMENTATION/DATABASE_SCHEMA.md from the SQLAlchemy models and the graph gateway.
Run: uv run python tools/schema_doc.py"""
from pathlib import Path

from vaakya.models import Base
from vaakya.services.retention import RULES
from vaakya.stores import graph

OUT = Path(__file__).resolve().parents[3] / "06_DOCUMENTATION" / "DATABASE_SCHEMA.md"
lines = ["# Database Schema", "", "**Generated** by `04_APPLICATION/api/tools/schema_doc.py` from the code. Do not edit by hand.", "",
         "Stores: PostgreSQL (system of record), Neo4j (Financial Life Graph, rebuilt from PostgreSQL), SeaweedFS (encrypted documents), "
         "Qdrant (public knowledge, Step 4). Firestore and Firebase Storage are replaced by PostgreSQL and SeaweedFS (D-026, D-027).", "",
         "## PostgreSQL tables", ""]
for t in Base.metadata.sorted_tables:
    lines += [f"### `{t.name}`", "", (t.comment or ""), "", "| Column | Type | Null | Key |", "|---|---|---|---|"]
    for c in t.columns:
        key = "PK" if c.primary_key else ("FK → " + ", ".join(f.target_fullname for f in c.foreign_keys)) if c.foreign_keys else ""
        lines.append(f"| `{c.name}` | {c.type} | {'yes' if c.nullable else 'no'} | {key} |")
    idx = [i.name for i in t.indexes] + [str(u.name or ",".join(col.name for col in u.columns)) for u in t.constraints if u.__class__.__name__ == "UniqueConstraint"]
    if idx:
        lines += ["", "Indexes / unique: " + ", ".join(f"`{i}`" for i in idx if i)]
    lines.append("")
lines += ["## Ownership and access", "", "* Every user-owned table has `user_id` (FK to `users`, `ON DELETE CASCADE`, indexed).",
          "* Services fetch rows with `get_owned(model, id, user_id)`; another user's id returns 404 (tested, mutation-checked).",
          "* `user_id` comes only from the verified token.", "", "## Retention (`services/retention.py`)", "", "| Rule | Kept for |", "|---|---|"]
lines += [f"| {k} | {v[2].days} days |" for k, v in RULES.items()]
lines += ["", "Voice audio and scam screenshots are never stored. Documents stay until the user deletes them or the account. Account erase removes all rows, vault objects and graph nodes.",
          "", "## Neo4j Financial Life Graph (`stores/graph.py`)", "", "```text", graph.__doc__.strip(), "```", "", "Constraints and indexes:", ""]
lines += [f"* `{c}`" for c in graph.CONSTRAINTS]
lines += ["", "Named queries: `sync_user`, `context`, `twin`, `eligible_unreviewed`, `unmitigated_risks`, `erase_user`. All anchored on `$user_id`.", "",
          "## SeaweedFS document vault (`stores/vault.py`)", "", "Bucket `vaakya-user-docs`, key `{userId}/{yyyy}/{mm}/{documentId}`. AES-256-GCM envelope encryption with the object key as associated data.", ""]
OUT.write_text("\n".join(lines))
print(f"wrote {OUT}")
