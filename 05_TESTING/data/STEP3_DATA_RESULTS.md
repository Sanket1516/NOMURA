# Step 3 Results: Data layer

**Date:** 2026-11-05 | **Code:** `04_APPLICATION/api/vaakya/{stores,services/twin.py,services/retention.py,seed.py,worker.py}` | **Schema doc:** `06_DOCUMENTATION/DATABASE_SCHEMA.md` (generated)
**Services used in tests:** PostgreSQL 18.6, Neo4j 5.26 Community, SeaweedFS 4.50, all real containers.

## Substitutions (D-026, D-027)

| Requested | Built | Why |
|---|---|---|
| Cloud Firestore | PostgreSQL 18 (22 tables, 2 Alembic migrations) | Firestore is proprietary |
| Firebase Storage | SeaweedFS S3 with AES-256-GCM envelope encryption | Firebase is proprietary |
| Neo4j 5.23 | Neo4j 5.26 Community | Current supported 5.x |

## What was built

- **Financial Life Graph:** `GraphGateway`, the only Neo4j access. Nodes User, Income, Expense, Goal, Risk, Scheme, Recommendation, LearningModule, KnowledgeTopic, ScamCheck. Relationships HAS_INCOME, HAS_EXPENSE, HAS_GOAL, HAS_RISK, ELIGIBLE_FOR, COMPLETED, RECEIVED, CHECKED, COVERS, MITIGATED_BY, ADDRESSES. Named queries only, parameterised, anchored on `$user_id`.
- **Projection:** PostgreSQL → outbox → `relay()` rebuilds each affected user's subgraph idempotently. Risks derived by rules (emergency fund, EMI share, income volatility, uninsured dependants, scam exposure). Values are bands, not amounts.
- **`GET /v1/twin`:** nodes, edges, a screen-reader outline, and insights from graph queries (unmitigated risks, unreviewed eligible schemes).
- **Vault:** per-object data key, wrapped by a 32-byte master key; object path bound as associated data.
- **Scheme catalogue:** 10 schemes (PM-KISAN, PMFBY, KCC, PMJJBY, PMSBY, APY, SSY, Mudra, UDID, IGNDPS) with criteria, documents, steps and sources. **Unverified drafts** until T0.12; loader never overwrites a human verification.
- **Retention:** messages 365 days, read notifications 90, processed outbox 7, data-flow audit 365. Voice and scam screenshots are never stored.
- **Seed:** four synthetic demo accounts flagged `is_demo`, built through real services with five months of history. Computed scores: Priya 53, Rajesh 39, Kisan 24, Divya 61.
- **Worker:** `python -m vaakya.worker` runs the relay every 5 s and retention daily.

## Tests (11 new, 57 total, all pass)

| Test | Proves |
|---|---|
| Cipher round trip; wrong path, tampered byte, wrong key, short key | Encryption, integrity, path binding |
| S3 vault stores only ciphertext; prefix delete; broad prefix refused | Encrypted at rest; safe deletion |
| Upload through the API lands encrypted; account erase removes the objects | End to end with the vault |
| Graph sync creates all 11 relationship types; context, unmitigated risks, unreviewed schemes | Real graph persistence and queries |
| Re-sync creates no duplicates and removes stale nodes | Idempotent projection |
| Two users: no cross-user nodes; erase removes only the owner; shared nodes survive | FR-FLG-09 isolation |
| Injection-shaped values stored as data; unknown user sees nothing | Parameterised queries |
| Outbox relay projects PostgreSQL to Neo4j; `/v1/twin`; erase via API deletes graph nodes | D-010 pipeline |
| Retention deletes only messages older than 12 months | NFR-PRIV-02 |
| Seed idempotent, demo-flagged, scores consistent; scheme reload keeps human verification | Seed data |

## Known limits

- Neo4j projection runs in the worker; `/v1/twin` also syncs on read. No PostgreSQL Row Level Security yet.
- Seeded plans are created "today", so seeded goals start on track even after a lean month.
- Qdrant collection is part of Step 4.
