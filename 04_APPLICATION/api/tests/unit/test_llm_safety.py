"""What happens when a language model writes the Educator's answer (HANDOFF 3b step 4). The model is a stub returning chosen text,
so these tests prove the safety review and fallbacks around a model, not model quality. Run them again after a real model is switched on."""
import uuid
from types import SimpleNamespace

import pytest

import vaakya.agents.orchestrator as orch_mod
from vaakya.agents.educator import Educator
from vaakya.agents.orchestrator import SAFE_FALLBACK, Orchestrator
from vaakya.ai.knowledge import Hit
from vaakya.ai.llm import LLMUnavailable

SOURCE = "Emergency fund: Keep three to six months of expenses in an easily reachable account. A steady earner can aim for three months."


class Knowledge:
    def grounded(self, query, **kw):
        return [Hit("c1", 0.9, "Emergency Fund", SOURCE, "lesson", "VAAKYA", "/learn/emergency-fund", "draft", None)]


class StubLLM:
    def __init__(self, reply=None, error=None):
        self.reply, self.error, self.prompts = reply, error, []
        self.cfg = SimpleNamespace(tiers={"reasoning": SimpleNamespace(model="stub-model")})   # read by the data-flow audit

    def complete(self, task, system, text, **kw):
        self.prompts.append(str(text))
        if self.error:
            raise self.error
        return SimpleNamespace(text=self.reply, tier="reasoning", model="stub", tokens_in=1, tokens_out=1, data=None)


class FakeDb:
    def get(self, model, key): return None
    def add(self, x): pass
    def flush(self): pass


def ask(llm, question="How many months of expenses should an emergency fund cover?"):
    orch_mod.emit = lambda *a, **k: None   # no database in unit tests
    o = Orchestrator({"educator": Educator()}, llm=llm, knowledge=Knowledge())
    return o.answer(FakeDb(), uuid.uuid4(), question, agent="educator")


def test_grounded_model_answer_passes_and_is_marked_as_model_written():
    llm = StubLLM("Keep three to six months of expenses in an account you can reach quickly [1].")
    f = ask(llm)
    assert f["text"].startswith("Keep three to six months") and f["llm_used"] is True and f["citations"]


@pytest.mark.parametrize("bad", [
    "An emergency fund should hold 18 months of expenses and earns 14% a year [1].",          # invented numbers
    "You should buy the HDFC Flexi Cap fund now, it is risk-free [1].",                        # product pushing and a blocked claim
    "Put everything in this scheme for guaranteed returns of 12% [1].",                        # guaranteed returns
    "Double your money in a year, act now before the offer ends [1].",                         # scam-style claims
])
def test_unsafe_model_text_is_replaced_never_shown(bad):
    f = ask(StubLLM(bad))
    assert f["text"] == SAFE_FALLBACK and f["safety_problems"]
    assert bad not in f["text"]


def test_model_text_without_citation_marks_still_carries_the_retrieved_sources():
    # The Educator always attaches the retrieved sources, so an answer without [n] marks still carries its citations list.
    f = ask(StubLLM("Keep three to six months of expenses in an account you can reach quickly."))
    assert f["text"].startswith("Keep three") and f["citations"]


def test_model_failure_falls_back_to_the_sourced_rule_based_answer():
    f = ask(StubLLM(error=LLMUnavailable("down")))
    assert f["llm_used"] is False and f["citations"] and f["text"] != SAFE_FALLBACK


def test_model_sees_only_redacted_text():
    llm = StubLLM("Keep three to six months of expenses [1].")
    ask(llm, "My phone is 9876543210 and my PAN is ABCPD1234E. How many months should an emergency fund cover?")
    assert llm.prompts and "9876543210" not in llm.prompts[0] and "ABCPD1234E" not in llm.prompts[0]
