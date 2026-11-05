"""Data layer against real Neo4j 5.26 and SeaweedFS 4.50 (skipped when they are not running)."""
import base64
import os
import socket
import uuid
from datetime import date

import pytest

NEO4J = os.environ.get("TEST_NEO4J_URI", "bolt://localhost:57687")
S3 = os.environ.get("TEST_S3_ENDPOINT", "http://localhost:58333")


def _up(host: str, port: int) -> bool:
    try:
        socket.create_connection((host, port), timeout=1).close()
        return True
    except OSError:
        return False


needs_neo4j = pytest.mark.skipif(not _up("localhost", int(NEO4J.rsplit(":", 1)[1])), reason="Neo4j not running")
needs_s3 = pytest.mark.skipif(not _up("localhost", int(S3.rsplit(":", 1)[1])), reason="SeaweedFS not running")


@pytest.fixture(scope="module")
def graph():
    from vaakya.stores.graph import GraphGateway
    g = GraphGateway(NEO4J, "neo4j", os.environ.get("TEST_NEO4J_PASSWORD", "test-pass-123"))
    import time
    for _ in range(30):
        try:
            g.init_schema()
            break
        except Exception:  # noqa: BLE001 - Neo4j still starting
            time.sleep(2)
    yield g
    g.close()


@pytest.fixture(scope="module")
def vault():
    from vaakya.stores.vault import EnvelopeCipher, S3Vault
    v = S3Vault(S3, "any", "any", EnvelopeCipher(os.urandom(32)), bucket="vaakya-test-docs")
    import time
    for _ in range(20):
        try:
            v.ensure_bucket()
            break
        except Exception:  # noqa: BLE001
            time.sleep(1)
    return v


# ---------------- Vault ----------------
def test_cipher_round_trip_and_aad_binding():
    from vaakya.stores.vault import EnvelopeCipher, VaultIntegrityError
    c = EnvelopeCipher(os.urandom(32))
    blob = c.encrypt(b"salary slip", b"user-a/2026/11/doc1")
    assert c.decrypt(blob, b"user-a/2026/11/doc1") == b"salary slip"
    with pytest.raises(VaultIntegrityError):
        c.decrypt(blob, b"user-b/2026/11/doc1")  # moved to another user's path
    tampered = blob[:-1] + bytes([blob[-1] ^ 1])
    with pytest.raises(VaultIntegrityError):
        c.decrypt(tampered, b"user-a/2026/11/doc1")
    with pytest.raises(VaultIntegrityError):
        EnvelopeCipher(os.urandom(32)).decrypt(blob, b"user-a/2026/11/doc1")  # wrong master key
    with pytest.raises(ValueError):
        EnvelopeCipher(b"short")
    assert EnvelopeCipher.from_b64(base64.b64encode(b"k" * 32).decode())


@needs_s3
def test_s3_vault_stores_ciphertext_only(vault):
    uid = uuid.uuid4()
    key = f"{uid}/2026/11/{uuid.uuid4()}"
    vault.put(key, b"%PDF-1.4 secret salary 35000", "application/pdf")
    raw = vault.get_raw(key)
    assert raw.startswith(b"VKV1") and b"secret salary" not in raw
    assert vault.get(key) == b"%PDF-1.4 secret salary 35000"
    other = f"{uuid.uuid4()}/2026/11/x"
    vault.put(other, b"bob", "image/png")
    assert vault.delete_prefix(f"{uid}/") == 1
    assert vault.keys(f"{uid}/") == [] and vault.get(other) == b"bob"
    with pytest.raises(ValueError):
        vault.delete_prefix("/")


@needs_s3
def test_upload_through_api_lands_encrypted(app, onboarded, vault):
    import io

    from PIL import Image
    app.state.features.vault = vault
    try:
        buf = io.BytesIO()
        Image.new("RGB", (20, 20), "white").save(buf, "PNG")
        r = onboarded.post("/v1/documents", files={"file": ("a.png", buf.getvalue(), "image/png")}, data={"kind": "salary_slip"})
        assert r.status_code == 202, r.text
        me = onboarded.get("/v1/me").json()["user_id"]
        keys = vault.keys(f"{me}/")
        assert len(keys) == 1 and vault.get_raw(keys[0]).startswith(b"VKV1")
        assert vault.get(keys[0]).startswith(b"\x89PNG")
        # Account erase removes the stored objects too.
        app.state.features.graph = None
        rep = onboarded.delete("/v1/me").json()
        assert rep["report"]["vault_objects_deleted"] == 1 and vault.keys(f"{me}/") == []
    finally:
        app.state.features.vault = None


# ---------------- Graph ----------------
def _snap(goal_title="Emergency fund", risk=True, scheme_status="likely_eligible"):
    return {
        "user": {"income_type": "salaried", "state": "Maharashtra", "rural": False, "age_band": "30s", "dependents": 2, "literacy_level": "standard", "lang": "mr"},
        "incomes": [{"id": "inc", "kind": "salaried", "band": "30-50k", "frequency": "monthly"}],
        "expenses": [{"id": "exp1", "category": "household", "band": "15-30k"}],
        "goals": [{"id": f"g-{uuid.uuid4()}", "type": "emergency_fund", "title": goal_title, "status": "active", "on_track": True, "progress_pct": 27}],
        "risks": [{"kind": "no_emergency_fund", "severity": "medium", "detail": "Less than three months saved"},
                  {"kind": "uninsured_dependants", "severity": "high", "detail": "2 dependants, no insurance recorded"}] if risk else [],
        "schemes": [{"id": "pmjjby", "name": "PMJJBY", "category": "insurance", "status": scheme_status, "rules_version": "1", "reviewed": False}],
        "modules": [{"id": "digital-safety", "title": "Digital Safety", "topic": "Protection"}],
        "recommendations": [{"id": "rec1", "title": "Review a scheme", "agent": "connector", "addresses": "uninsured_dependants"}],
        "scam_checks": [{"id": "sc1", "level": "high", "at": "2026-11-01T10:00:00+00:00"}],
    }


@needs_neo4j
def test_sync_creates_real_graph_and_queries_work(graph):
    a = uuid.uuid4()
    graph.sync_user(a, _snap())
    ctx = graph.context(a)
    assert ctx["user"]["income_type"] == "salaried" and ctx["eligible_schemes"] == ["pmjjby"]
    assert ctx["completed_modules"] == ["digital-safety"] and len(ctx["risks"]) == 2
    t = graph.twin(a)
    types = {e["type"] for e in t["edges"]}
    assert {"HAS_INCOME", "HAS_EXPENSE", "HAS_GOAL", "HAS_RISK", "ELIGIBLE_FOR", "COMPLETED", "RECEIVED", "CHECKED", "COVERS", "MITIGATED_BY", "ADDRESSES"} <= types
    # Emergency-fund risk is mitigated by the goal; the insurance risk is not.
    assert [r["kind"] for r in graph.unmitigated_risks(a)] == ["uninsured_dependants"]
    assert graph.eligible_unreviewed(a) == [{"id": "pmjjby", "name": "PMJJBY"}]
    graph.erase_user(a)


@needs_neo4j
def test_sync_is_idempotent_and_replaces_stale_nodes(graph):
    a = uuid.uuid4()
    graph.sync_user(a, _snap())
    n1 = graph.owned_count(a)
    graph.sync_user(a, _snap())
    assert graph.owned_count(a) == n1  # no duplicates
    graph.sync_user(a, _snap(goal_title="Renamed", risk=False, scheme_status="not_eligible"))
    ctx = graph.context(a)
    assert ctx["risks"] == [] and ctx["eligible_schemes"] == [] and ctx["goals"][0]["title"] == "Renamed"
    graph.erase_user(a)


@needs_neo4j
def test_two_users_are_isolated_and_shared_nodes_survive_erase(graph):
    a, b = uuid.uuid4(), uuid.uuid4()
    graph.sync_user(a, _snap(goal_title="A goal"))
    graph.sync_user(b, _snap(goal_title="B goal"))
    ta = graph.twin(a)
    a_labels = {n["props"].get("title") for n in ta["nodes"]}
    assert "B goal" not in a_labels and "A goal" in a_labels
    assert all(n["props"].get("owner") in (None, str(a)) for n in ta["nodes"])
    assert graph.context(b)["goals"][0]["title"] == "B goal"
    deleted = graph.erase_user(a)
    assert deleted >= 8 and graph.owned_count(a) == 0 and graph.context(a) == {}
    # Shared scheme/module nodes and the other user's graph are intact.
    assert graph.context(b)["eligible_schemes"] == ["pmjjby"] and graph.context(b)["completed_modules"] == ["digital-safety"]
    graph.erase_user(b)


@needs_neo4j
def test_parameterised_queries_resist_injection(graph):
    a = uuid.uuid4()
    graph.sync_user(a, _snap(goal_title="x'}) DETACH DELETE (n) //"))
    assert graph.context(a)["goals"][0]["title"] == "x'}) DETACH DELETE (n) //"
    assert graph.context(uuid.UUID(int=0)) == {}  # unknown user sees nothing
    graph.erase_user(a)


@needs_neo4j
def test_outbox_relay_projects_postgres_into_neo4j(app, onboarded, graph):
    from vaakya.db import session_factory
    from vaakya.services import twin
    onboarded.post("/v1/goals", json={"type": "emergency_fund", "title": "Emergency fund", "target": {"paise": 7_800_000},
                                      "target_date": date(date.today().year + 2, 1, 1).isoformat()})
    onboarded.post("/v1/learning/modules/digital-safety/quiz-attempts", json={"answers": {"q1": 1, "q2": 1, "q3": 0, "q4": 1}})
    me = uuid.UUID(onboarded.get("/v1/me").json()["user_id"])
    with session_factory()() as db:
        assert twin.relay(db, graph) == 1
        db.commit()
        assert twin.relay(db, graph) == 0  # nothing pending
    ctx = graph.context(me)
    assert ctx["user"]["income_type"] == "salaried" and ctx["income"][0]["band"] == "30-50k"
    assert [g["title"] for g in ctx["goals"]] == ["Emergency fund"] and ctx["completed_modules"] == ["digital-safety"]
    kinds = {r["kind"] for r in ctx["risks"]}
    assert "uninsured_dependants" in kinds  # 2 dependants, no insurance item
    # API view + erase through the API
    app.state.features.graph = graph
    try:
        v = onboarded.get("/v1/twin").json()
        assert v["source"] == "neo4j" and any(g["group"] == "Goals" for g in v["outline"])
        assert any("dependants" in i["text"] for i in v["insights"])
        rep = onboarded.delete("/v1/me").json()
        assert rep["report"]["graph_nodes_deleted"] > 0 and graph.owned_count(me) == 0
    finally:
        app.state.features.graph = None


def test_retention_purge(app, onboarded):
    from datetime import datetime, timedelta, timezone

    from vaakya.db import session_factory
    from vaakya.models import Conversation, Message, User
    from vaakya.services import retention
    with session_factory()() as db:
        uid = db.query(User.id).first()[0]
        c = Conversation(user_id=uid, title="t")
        db.add(c)
        db.flush()
        old = datetime.now(timezone.utc) - timedelta(days=400)
        db.add_all([Message(user_id=uid, conversation_id=c.id, role="user", content_redacted="old", created_at=old),
                    Message(user_id=uid, conversation_id=c.id, role="user", content_redacted="new")])
        db.flush()
        out = retention.purge(db)
        assert out["messages"] == 1
        assert [m.content_redacted for m in db.query(Message).all()] == ["new"]
        db.rollback()
