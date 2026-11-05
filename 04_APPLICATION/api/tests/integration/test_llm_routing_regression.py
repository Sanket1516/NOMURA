"""Routing regression against a REAL local model (Ollama). Skipped unless VAAKYA_OLLAMA_URL and VAAKYA_LLM_PRIVATE_MODEL are set, e.g.
    VAAKYA_OLLAMA_URL=http://localhost:11434 VAAKYA_LLM_PRIVATE_MODEL=qwen2:7b uv run pytest -o addopts="" tests/integration/test_llm_routing_regression.py -s
Uses the production path (`router.route`), so it includes the confidence threshold. None of these questions matches a routing rule,
so the model decides. The set is the one in 05_TESTING/ai/bench_llm.py (qwen2:7b got 12/12 there without the confidence threshold)."""
import os

import pytest

from vaakya.agents import router
from vaakya.ai.llm import LLMAdapter, LLMConfig, TierConfig

URL, MODEL = os.environ.get("VAAKYA_OLLAMA_URL"), os.environ.get("VAAKYA_LLM_PRIVATE_MODEL")
pytestmark = pytest.mark.skipif(not (URL and MODEL), reason="needs VAAKYA_OLLAMA_URL and VAAKYA_LLM_PRIVATE_MODEL (a running Ollama)")

CASES = [
    ("Someone I met online wants me to put money in his group and says I will earn double", "sentinel"),
    ("The man on the phone says my account will close unless I share the code that came on my phone", "sentinel"),
    ("Which benefits can a widow living in a village get from the state", "connector"),
    ("I am a farmer in Karnataka, what help can I ask the government for", "connector"),
    ("I earn a little every day as a driver. How should I put money aside", "strategy"),
    ("My salary is 30000, spending is 26000. Where do I cut", "strategy"),
    ("What does compounding mean", "educator"),
    ("Tell me how a fixed deposit works", "educator"),
    ("Is it better to repay the loan early or invest the money", "strategy"),
    ("A shop gave me a card and says I must pay a fee to get a refund", "sentinel"),
    ("Can my disabled son get some monthly help", "connector"),
    ("What is the weather today", "clarify"),   # "other" from the model means: ask the person to rephrase
]
# Conservative starting floor: this path has not been measured on a real model yet. After the first real run, raise it to what was observed.
FLOOR = 9


def test_routing_of_rule_free_questions_does_not_regress():
    llm = LLMAdapter(LLMConfig(base_url=URL, tiers={"private": TierConfig(model=MODEL, timeout_s=180), "reasoning": TierConfig(model=MODEL, timeout_s=180)}))
    hits, rows = 0, []
    for q, want in CASES:
        got, conf, method = router.route(q, llm)
        hits += got == want
        rows.append(f"{'OK ' if got == want else 'BAD'} want={want:9} got={got:9} conf={conf:.2f} via={method} | {q[:60]}")
    print("\n" + "\n".join(rows) + f"\nROUTING {hits}/{len(CASES)} with model {MODEL}")
    assert hits >= FLOOR, f"routing fell to {hits}/{len(CASES)}"
