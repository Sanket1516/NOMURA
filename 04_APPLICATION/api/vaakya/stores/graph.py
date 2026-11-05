"""Financial Life Graph gateway (FR-FLG-01, -09). The ONLY module that talks to Neo4j.

Rules: named queries only; every query is anchored on (u:User {id: $user_id}); every value is a parameter.
Neo4j Community has no per-user access control, so isolation lives here and is tested with two users.
PostgreSQL is the system of record (D-010): a user's subgraph is rebuilt idempotently from a snapshot.

Model (DATABASE_ARCHITECTURE §3, relationship names per the data-layer brief):
  (User)-[:HAS_INCOME]->(Income)        (User)-[:HAS_EXPENSE]->(Expense)
  (User)-[:HAS_GOAL]->(Goal)            (User)-[:HAS_RISK]->(Risk)-[:MITIGATED_BY]->(Goal)
  (User)-[:ELIGIBLE_FOR {status}]->(Scheme)
  (User)-[:COMPLETED]->(LearningModule)-[:COVERS]->(KnowledgeTopic)
  (User)-[:RECEIVED]->(Recommendation)-[:ADDRESSES]->(Risk|Goal)
  (User)-[:CHECKED]->(ScamCheck)
Shared, ownerless nodes: Scheme, LearningModule, KnowledgeTopic. All other nodes carry owner = user id.
"""
from __future__ import annotations

import uuid
from typing import Any

from neo4j import Driver, GraphDatabase

CONSTRAINTS = [
    "CREATE CONSTRAINT user_id IF NOT EXISTS FOR (n:User) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT scheme_id IF NOT EXISTS FOR (n:Scheme) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT module_id IF NOT EXISTS FOR (n:LearningModule) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT topic_id IF NOT EXISTS FOR (n:KnowledgeTopic) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT goal_id IF NOT EXISTS FOR (n:Goal) REQUIRE n.id IS UNIQUE",
    "CREATE INDEX owner_income IF NOT EXISTS FOR (n:Income) ON (n.owner)",
    "CREATE INDEX owner_expense IF NOT EXISTS FOR (n:Expense) ON (n.owner)",
    "CREATE INDEX owner_goal IF NOT EXISTS FOR (n:Goal) ON (n.owner)",
    "CREATE INDEX owner_risk IF NOT EXISTS FOR (n:Risk) ON (n.owner)",
    "CREATE INDEX owner_rec IF NOT EXISTS FOR (n:Recommendation) ON (n.owner)",
    "CREATE INDEX owner_scam IF NOT EXISTS FOR (n:ScamCheck) ON (n.owner)",
]

# Rebuild one user's subgraph. Owned nodes are removed and recreated inside one transaction.
SYNC = """
MERGE (u:User {id: $user_id})
SET u += $user
WITH u
OPTIONAL MATCH (o {owner: $user_id}) DETACH DELETE o
WITH DISTINCT u
OPTIONAL MATCH (u)-[r:ELIGIBLE_FOR|COMPLETED]->() DELETE r
WITH DISTINCT u
FOREACH (i IN $incomes | CREATE (u)-[:HAS_INCOME]->(:Income {owner: $user_id, id: i.id, kind: i.kind, band: i.band, frequency: i.frequency}))
FOREACH (e IN $expenses | CREATE (u)-[:HAS_EXPENSE]->(:Expense {owner: $user_id, id: e.id, category: e.category, band: e.band}))
FOREACH (g IN $goals | CREATE (u)-[:HAS_GOAL]->(:Goal {owner: $user_id, id: g.id, type: g.type, title: g.title, status: g.status,
                                                     on_track: g.on_track, progress_pct: g.progress_pct}))
FOREACH (c IN $scam_checks | CREATE (u)-[:CHECKED]->(:ScamCheck {owner: $user_id, id: c.id, level: c.level, at: c.at}))
WITH u
UNWIND (CASE WHEN size($risks) = 0 THEN [null] ELSE $risks END) AS r
FOREACH (_ IN CASE WHEN r IS NULL THEN [] ELSE [1] END |
  CREATE (u)-[:HAS_RISK]->(rk:Risk {owner: $user_id, kind: r.kind, severity: r.severity, detail: r.detail}))
WITH DISTINCT u
UNWIND (CASE WHEN size($schemes) = 0 THEN [null] ELSE $schemes END) AS s
FOREACH (_ IN CASE WHEN s IS NULL THEN [] ELSE [1] END |
  MERGE (sc:Scheme {id: s.id}) SET sc.name = s.name, sc.category = s.category
  MERGE (u)-[e:ELIGIBLE_FOR]->(sc) SET e.status = s.status, e.rules_version = s.rules_version, e.reviewed = s.reviewed)
WITH DISTINCT u
UNWIND (CASE WHEN size($modules) = 0 THEN [null] ELSE $modules END) AS m
FOREACH (_ IN CASE WHEN m IS NULL THEN [] ELSE [1] END |
  MERGE (lm:LearningModule {id: m.id}) SET lm.title = m.title
  MERGE (t:KnowledgeTopic {id: m.topic}) SET t.name = m.topic
  MERGE (lm)-[:COVERS]->(t)
  MERGE (u)-[:COMPLETED]->(lm))
WITH DISTINCT u
UNWIND (CASE WHEN size($recommendations) = 0 THEN [null] ELSE $recommendations END) AS rec
FOREACH (_ IN CASE WHEN rec IS NULL THEN [] ELSE [1] END |
  CREATE (u)-[:RECEIVED]->(:Recommendation {owner: $user_id, id: rec.id, title: rec.title, agent: rec.agent, addresses: rec.addresses}))
WITH DISTINCT u
// Link risks to the goals that mitigate them, and recommendations to what they address.
OPTIONAL MATCH (u)-[:HAS_RISK]->(rk:Risk {kind: 'no_emergency_fund'}), (u)-[:HAS_GOAL]->(g:Goal {type: 'emergency_fund'})
FOREACH (_ IN CASE WHEN rk IS NULL OR g IS NULL THEN [] ELSE [1] END | MERGE (rk)-[:MITIGATED_BY]->(g))
WITH DISTINCT u
OPTIONAL MATCH (u)-[:RECEIVED]->(rec:Recommendation), (u)-[:HAS_RISK]->(rk2:Risk)
WHERE rec.addresses = rk2.kind
FOREACH (_ IN CASE WHEN rec IS NULL THEN [] ELSE [1] END | MERGE (rec)-[:ADDRESSES]->(rk2))
RETURN u.id AS id
"""

TWIN = """
MATCH (u:User {id: $user_id})
OPTIONAL MATCH (u)-[r]->(n)
OPTIONAL MATCH (n)-[r2:COVERS|MITIGATED_BY|ADDRESSES]->(m)
WHERE (m.owner = $user_id OR m:KnowledgeTopic OR m:Scheme)
RETURN u {.*} AS user,
       collect(DISTINCT {from: u.id, to: coalesce(n.id, elementId(n)), type: type(r), props: properties(r)}) AS edges1,
       collect(DISTINCT {id: coalesce(n.id, elementId(n)), labels: labels(n), props: properties(n)}) AS nodes1,
       collect(DISTINCT {from: coalesce(n.id, elementId(n)), to: coalesce(m.id, elementId(m)), type: type(r2)}) AS edges2,
       collect(DISTINCT {id: coalesce(m.id, elementId(m)), labels: labels(m), props: properties(m)}) AS nodes2
"""

CONTEXT = """
MATCH (u:User {id: $user_id})
OPTIONAL MATCH (u)-[:HAS_INCOME]->(i:Income)
OPTIONAL MATCH (u)-[:HAS_GOAL]->(g:Goal {status: 'active'})
OPTIONAL MATCH (u)-[:HAS_RISK]->(r:Risk)
OPTIONAL MATCH (u)-[e:ELIGIBLE_FOR {status: 'likely_eligible'}]->(s:Scheme)
OPTIONAL MATCH (u)-[:COMPLETED]->(lm:LearningModule)
RETURN u {.income_type, .state, .rural, .age_band, .dependents, .literacy_level, .lang} AS user,
       collect(DISTINCT i {.kind, .band, .frequency}) AS income,
       collect(DISTINCT g {.id, .type, .title, .on_track, .progress_pct}) AS goals,
       collect(DISTINCT r {.kind, .severity}) AS risks,
       collect(DISTINCT s.id) AS eligible_schemes,
       collect(DISTINCT lm.id) AS completed_modules
"""

ELIGIBLE_UNREVIEWED = """
MATCH (u:User {id: $user_id})-[e:ELIGIBLE_FOR {status: 'likely_eligible'}]->(s:Scheme)
WHERE coalesce(e.reviewed, false) = false
RETURN s.id AS id, s.name AS name ORDER BY s.name
"""

UNMITIGATED_RISKS = """
MATCH (u:User {id: $user_id})-[:HAS_RISK]->(r:Risk)
WHERE NOT (r)-[:MITIGATED_BY]->(:Goal)
RETURN r.kind AS kind, r.severity AS severity, r.detail AS detail
"""

ERASE_OWNED = "MATCH (n {owner: $user_id}) DETACH DELETE n RETURN count(n) AS deleted"
ERASE_USER = "MATCH (u:User {id: $user_id}) DETACH DELETE u RETURN count(u) AS deleted"


class GraphGateway:
    def __init__(self, uri: str, user: str, password: str, driver: Driver | None = None):
        self.driver = driver or GraphDatabase.driver(uri, auth=(user, password), connection_timeout=5, max_transaction_retry_time=10)

    def close(self) -> None:
        self.driver.close()

    def init_schema(self) -> None:
        for stmt in CONSTRAINTS:
            self.driver.execute_query(stmt)

    def _q(self, query: str, user_id: uuid.UUID | str, **params: Any):
        return self.driver.execute_query(query, user_id=str(user_id), **params)

    def sync_user(self, user_id: uuid.UUID, snap: dict[str, Any]) -> None:
        self._q(SYNC, user_id, user=snap["user"], incomes=snap["incomes"], expenses=snap["expenses"], goals=snap["goals"],
                risks=snap["risks"], schemes=snap["schemes"], modules=snap["modules"], recommendations=snap["recommendations"],
                scam_checks=snap["scam_checks"])

    def context(self, user_id: uuid.UUID) -> dict[str, Any]:
        recs, _, _ = self._q(CONTEXT, user_id)
        return dict(recs[0]) if recs and recs[0]["user"] is not None else {}

    def twin(self, user_id: uuid.UUID) -> dict[str, Any]:
        recs, _, _ = self._q(TWIN, user_id)
        if not recs or recs[0]["user"] is None:
            return {"nodes": [], "edges": []}
        r = recs[0]
        nodes = {n["id"]: n for n in r["nodes1"] + r["nodes2"] if n["id"] is not None}
        edges = [e for e in r["edges1"] + r["edges2"] if e["type"] is not None and e["to"] is not None]
        return {"user": r["user"], "nodes": list(nodes.values()), "edges": edges}

    def eligible_unreviewed(self, user_id: uuid.UUID) -> list[dict]:
        recs, _, _ = self._q(ELIGIBLE_UNREVIEWED, user_id)
        return [dict(r) for r in recs]

    def unmitigated_risks(self, user_id: uuid.UUID) -> list[dict]:
        recs, _, _ = self._q(UNMITIGATED_RISKS, user_id)
        return [dict(r) for r in recs]

    def erase_user(self, user_id: uuid.UUID) -> int:
        owned, _, _ = self._q(ERASE_OWNED, user_id)
        user, _, _ = self._q(ERASE_USER, user_id)
        return int(owned[0]["deleted"]) + int(user[0]["deleted"])

    def owned_count(self, user_id: uuid.UUID) -> int:
        recs, _, _ = self._q("MATCH (n {owner: $user_id}) RETURN count(n) AS c", user_id)
        return int(recs[0]["c"])
