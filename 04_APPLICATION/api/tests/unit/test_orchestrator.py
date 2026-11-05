"""Orchestrator mechanics with simple test agents (the real agents are tested in Step 5)."""
import uuid

from vaakya.agents import router, safety
from vaakya.agents.base import AgentOutput, Citation
from vaakya.agents.orchestrator import CLARIFY, SAFE_FALLBACK, Orchestrator


class Echo:
    def __init__(self, name, text="ok", handoff=None, cite=True, figures=None):
        self.name, self.text, self.handoff, self.cite, self.figures = name, text, handoff, cite, figures or {}
        self.seen = []

    def run(self, ctx):
        self.seen.append(str(ctx.question))
        return AgentOutput(agent=self.name, text=self.text, handoff=self.handoff, figures=self.figures,
                           citations=[Citation("c1", "Source", "VAAKYA", "/learn", "draft")] if self.cite else [])


class FakeDb:
    def get(self, model, key):
        return None

    def add(self, x):
        pass

    def flush(self):
        pass


def orch(**agents):
    base = {n: Echo(n) for n in ("educator", "strategy", "sentinel", "connector")}
    base.update(agents)
    return Orchestrator(base), base


def ask(o, text, **kw):
    import vaakya.agents.orchestrator as m
    m.emit = lambda *a, **k: None  # no DB in unit tests
    return o.answer(FakeDb(), uuid.uuid4(), text, **kw)


def test_router_rules_cover_languages_and_priority():
    assert router.route("Someone asked for my OTP")[0] == "sentinel"
    assert router.route("Am I eligible for PM-KISAN?")[0] == "connector"
    assert router.route("How much should I save for an emergency fund?")[0] == "strategy"
    assert router.route("What is a mutual fund?")[0] == "educator"
    assert router.route("यह योजना क्या है")[0] == "connector"
    assert router.route("Is this loan app safe? It promises a guaranteed loan plan")[0] == "sentinel"  # protection wins ties
    assert router.route("hello there")[0] == "clarify"
    assert router.route("anything", image=True)[0] == "sentinel"


def test_agents_only_see_redacted_text():
    o, agents = orch()
    final = ask(o, "Explain SIP. My number is 9876543210")
    assert "9876543210" not in agents["educator"].seen[0] and "<PHONE_1>" in agents["educator"].seen[0]
    assert final["categories_redacted"] == ["PHONE"] and final["agents"] == ["educator"]


def test_clarifies_when_unsure():
    o, _ = orch()
    assert ask(o, "hello")["text"] == CLARIFY


def test_handoff_runs_second_agent_and_stops_loops():
    o, agents = orch(sentinel=Echo("sentinel", "High risk.", handoff=("strategy", "needs cash"), cite=False),
                     strategy=Echo("strategy", "Safer options.", handoff=("sentinel", "loop"), cite=False))
    final = ask(o, "Is this instant loan app safe?")
    assert final["agents"] == ["sentinel", "strategy"] and "High risk." in final["text"] and "Safer options." in final["text"]


def test_user_choice_overrides_router():
    o, _ = orch()
    assert ask(o, "Is this a scam?", agent="educator")["agents"] == ["educator"]


def test_safety_blocks_invented_numbers_and_claims():
    o, _ = orch(educator=Echo("educator", "SIP gives a guaranteed return of 15% every year."))
    final = ask(o, "What is SIP?")
    assert final["text"] == SAFE_FALLBACK and any("blocked" in p for p in final["safety_problems"])
    o, _ = orch(strategy=Echo("strategy", "Save ₹7,500 a month.", cite=False))
    assert ask(o, "Plan my savings")["text"] == SAFE_FALLBACK  # 7500 is not from a tool
    o, _ = orch(strategy=Echo("strategy", "Save ₹7,500 a month.", cite=False, figures={"monthly": "₹7,500"}))
    assert ask(o, "Plan my savings")["text"] == "Save ₹7,500 a month."


def test_grounded_agents_must_cite():
    o, _ = orch(educator=Echo("educator", "An answer.", cite=False))
    assert ask(o, "What is inflation?")["text"] == SAFE_FALLBACK


def test_high_stakes_adds_help_route():
    o, _ = orch()
    assert safety.HELP in ask(o, "I lost money to a fraud, what is a chargeback?")["text"]
