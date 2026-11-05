"""The four agents through the real API (PostgreSQL + Qdrant when running). Each agent: normal, ambiguous,
missing information, invalid input, service failure, unsupported question, safety-sensitive question."""
import os
import socket
from datetime import date

import pytest

QURL = os.environ.get("TEST_QDRANT_URL", "http://localhost:56333")


def _up(port):
    try:
        socket.create_connection(("localhost", port), timeout=1).close()
        return True
    except OSError:
        return False


@pytest.fixture
def agents(app):
    from vaakya.ai.knowledge import KnowledgeStore
    from vaakya.bootstrap import build_agents
    from vaakya.db import session_factory
    from vaakya.seed import load_schemes
    with session_factory()() as db:
        load_schemes(db)
        db.commit()
    ks = KnowledgeStore(QURL) if _up(56333) else None
    if ks:
        ks.ingest()
    build_agents(app.state.features, knowledge=ks)
    yield app.state.features
    for k in ("orchestrator", "sentinel", "connector"):
        setattr(app.state.features, k, None)


def chat(api, message, agent=None):
    r = api.post("/v1/chat", json={"message": message, **({"agent": agent} if agent else {})})
    assert r.status_code == 200, r.text
    return r.json()


# ---------------- Educator ----------------
@pytest.mark.skipif(not _up(56333), reason="Qdrant not running")
def test_educator_grounded_answer_with_citations(agents, onboarded):
    r = chat(onboarded, "What is a SIP and is the return fixed?")
    assert r["ai"]["agents"] == ["educator"] and r["ai"]["citations"] and r["ai"]["llm_used"] is False
    assert "Systematic Investment Plan" in r["text"] and "[1]" in r["text"]


@pytest.mark.skipif(not _up(56333), reason="Qdrant not running")
def test_educator_abstains_on_unsupported_and_product_push(agents, onboarded):
    r = chat(onboarded, "Explain the rules of cricket", agent="educator")
    assert "do not have a trusted source" in r["text"] and r["ai"]["citations"] == []
    r = chat(onboarded, "difference between ULIP and term insurance")
    assert any("Insurance 101" in c["title"] for c in r["ai"]["citations"]) and "you should buy" not in r["text"].lower()


def test_educator_without_knowledge_service_says_so(app, onboarded):
    from vaakya.bootstrap import build_agents
    build_agents(app.state.features, knowledge=None)
    try:
        r = chat(onboarded, "What is an emergency fund?", agent="educator")
        assert "not available" in r["text"]
    finally:
        app.state.features.orchestrator = None


# ---------------- Strategy Builder ----------------
def test_strategy_plan_from_real_numbers(agents, onboarded):
    r = chat(onboarded, "How much should I save for an emergency fund?")
    assert r["ai"]["agents"] == ["strategy"]
    assert "₹78,000" in r["text"]  # 3 months × ₹26,000 (salaried)
    assert "Assumptions:" in r["text"] and "Limits:" in r["text"]


def test_strategy_needs_assessment_first(agents, alice):
    alice.put("/v1/me/consents", json={"grants": [{"purpose": "ai_processing", "version": "2026-11", "granted": True}]})
    r = chat(alice, "Plan my savings", agent="strategy")
    assert "money questions" in r["text"]


def test_strategy_loan_cost_and_missing_numbers(agents, onboarded):
    r = chat(onboarded, "Is this loan ok: ₹10,000 loan, repay ₹4,000 EMI for 3 months, ₹2,000 fee?", agent="strategy")
    assert "very expensive" in r["text"] and "%" in r["text"]
    r = chat(onboarded, "Should I take a loan?", agent="strategy")
    assert "three numbers" in r["text"]


def test_strategy_irregular_income(agents, alice):
    from ..conftest import ANSWERS, PROFILE
    alice.put("/v1/me/consents", json={"grants": [{"purpose": "ai_processing", "version": "2026-11", "granted": True}]})
    alice.put("/v1/me/profile", json={**PROFILE, "income_type": "variable"})
    alice.post("/v1/assessment/answers", json={"answers": [{"question_id": "monthly_income", "value": {"min_paise": 1_500_000, "max_paise": 4_000_000}}, *ANSWERS[1:]]})
    alice.post("/v1/assessment/complete")
    r = chat(alice, "My income changes every month, how do I save?")
    assert r["ai"]["agents"] == ["strategy"] and "lean month (₹15,000)" in r["text"]


# ---------------- Sentinel ----------------
def test_sentinel_chat_flags_scam_and_hands_off_loans(agents, onboarded):
    r = chat(onboarded, "Got this: Instant loan in 5 minutes without documents, allow contacts permission. Is it safe?")
    assert r["ai"]["agents"] == ["sentinel", "strategy"]
    assert "Risk: HIGH" in r["text"] or "Risk: CRITICAL" in r["text"]
    assert "three numbers" in r["text"]  # Strategy Builder joined with loan guidance


def test_sentinel_endpoint_text_records_and_feeds_score(agents, onboarded):
    before = {d["key"]: d["score"] for d in onboarded.get("/v1/score").json()["dimensions"]}["safety"]
    r = onboarded.post("/v1/sentinel/checks", json={"text": "Bank customer care here. Share the OTP you received", "kind": "sms"})
    assert r.status_code == 200 and r.json()["risk_level"] == "critical"
    assert all(x["evidence"] for x in r.json()["reasons"]) and "not a probability" in r.json()["indicator_label"]
    after = {d["key"]: d["score"] for d in onboarded.get("/v1/score").json()["dimensions"]}["safety"]
    assert after > before and len(onboarded.get("/v1/sentinel/checks").json()) == 1


def test_sentinel_genuine_message_and_invalid_input(agents, onboarded):
    r = onboarded.post("/v1/sentinel/checks", json={"text": "Your OTP is 482913. Do not share it with anyone. -SBI"}).json()
    assert r["risk_level"] in ("low", "medium") and "482913" not in str(r)
    assert onboarded.post("/v1/sentinel/checks", json={"text": ""}).status_code == 422
    assert onboarded.post("/v1/sentinel/checks", json={"text": "x" * 6000}).status_code == 422


def test_sentinel_screenshot_without_ocr_is_honest_503(agents, onboarded):
    import io

    from PIL import Image
    buf = io.BytesIO()
    Image.new("RGB", (30, 30), "white").save(buf, "PNG")
    r = onboarded.post("/v1/sentinel/checks", files={"image": ("s.png", buf.getvalue(), "image/png")})
    assert r.status_code == 503 and "Paste the text" in r.json()["detail"]
    bad = onboarded.post("/v1/sentinel/checks", files={"image": ("x.png", b"MZ not an image", "image/png")})
    assert bad.status_code == 415


# ---------------- Connector ----------------
def test_connector_lists_and_explains_with_unknowns(agents, onboarded):
    items = onboarded.get("/v1/schemes").json()
    by = {i["id"]: i["status"] for i in items}
    assert by["pmjjby"] == "needs_info"  # bank account not stated yet: unknown, not guessed
    assert by["pm-kisan"] == "needs_info" and items[0]["verification"] == "unverified_draft"
    e = onboarded.get("/v1/schemes/pmjjby/eligibility").json()
    assert {c["id"]: c["result"] for c in e["criteria"]} == {"age": "met", "bank": "unknown"}
    assert e["documents"] and e["steps"] and "human verification" in e["disclaimer"]
    assert onboarded.get("/v1/schemes/not-a-scheme/eligibility").status_code == 404


def test_connector_after_facts_and_chat(agents, onboarded):
    from ..conftest import PROFILE
    onboarded.put("/v1/me/profile", json={**PROFILE, "attributes": {"has_bank_account": True, "income_tax_payer": False}})
    by = {i["id"]: i["status"] for i in onboarded.get("/v1/schemes").json()}
    assert by["pmjjby"] == by["pmsby"] == by["apy"] == "likely_eligible"
    r = chat(onboarded, "Am I eligible for PMJJBY?")
    assert r["ai"]["agents"] == ["connector"] and "likely eligible" in r["text"] and r["ai"]["citations"][0]["url"].startswith("https://")
    assert "₹2 lakh" in r["text"] and "human verification" in r["text"]
    farm = onboarded.get("/v1/schemes?category=agriculture").json()
    assert {i["id"] for i in farm} == {"pm-kisan", "pmfby"}


# ---------------- Orchestration ----------------
def test_ambiguous_question_gets_clarification(agents, onboarded):
    r = chat(onboarded, "hello")
    assert r["ai"]["agents"] == [] and "Which one do you need" in r["text"]


def test_safety_sensitive_question_gets_help_route(agents, onboarded):
    r = chat(onboarded, "I lost money to a fraud after sharing my OTP, is my account safe?")
    assert "1930" in r["text"]


def test_chat_stores_only_redacted_text_and_streams(agents, onboarded):
    r = onboarded.post("/v1/chat", json={"message": "Someone asked for my OTP, my number is 9876543210"}, headers={"accept": "text/event-stream"})
    assert r.status_code == 200 and "event: final" in r.text and "event: agent" in r.text
    convs = onboarded.get("/v1/conversations").json()
    msgs = onboarded.get(f"/v1/conversations/{convs[0]['id']}").json()["messages"]
    assert "9876543210" not in str(msgs) and "<PHONE_1>" in msgs[0]["text"]


def test_chat_requires_consent(agents, alice):
    assert alice.post("/v1/chat", json={"message": "What is SIP?"}).status_code == 409


def test_dashboard_reflects_agent_work(agents, onboarded):
    onboarded.post("/v1/sentinel/checks", json={"text": "You have won a lottery! Pay processing fee of ₹999 to claim"})
    onboarded.get("/v1/schemes/pmjjby/eligibility")
    d = onboarded.get("/v1/dashboard").json()
    assert d["scam_alerts"] and d["scam_alerts"][0]["level"] in ("high", "critical")
    assert any(a["agent"] == "sentinel" for a in d["activity"]) and any(s["id"] == "pmjjby" for s in d["schemes"])
    _ = date.today()
