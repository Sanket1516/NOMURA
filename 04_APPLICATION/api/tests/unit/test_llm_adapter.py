"""Contract tests for the LLM adapter against Ollama's documented HTTP API, using a mock transport.
They prove request shape, retries, fallback, schema handling and the privacy gate. They do NOT test model quality (T0.03)."""
import json

import httpx
import pytest

from vaakya.ai import llm


def adapter(handler, retries=1):
    client = httpx.Client(base_url="http://ollama.test", transport=httpx.MockTransport(handler))
    cfg = llm.LLMConfig(base_url="http://ollama.test", retries=retries, tiers={
        "private": llm.TierConfig(model="small"), "reasoning": llm.TierConfig(model="big", fallback="small")})
    a = llm.LLMAdapter(cfg, client=client)
    llm.time.sleep = lambda s: None  # no real waiting in tests
    return a


def ok(content, model="big"):
    return httpx.Response(200, json={"model": model, "message": {"role": "assistant", "content": content}, "prompt_eval_count": 12, "eval_count": 7})


def test_request_shape_and_structured_output():
    seen = {}

    def h(req):
        seen.update(json.loads(req.content))
        return ok('{"intent": "learn", "confidence": 0.9}', "small")
    r = adapter(h).complete("route", "sys", "What is SIP?", schema={"type": "object", "required": ["intent", "confidence"]})
    assert seen["model"] == "small" and seen["stream"] is False and seen["format"]["required"] == ["intent", "confidence"]
    assert seen["messages"][0] == {"role": "system", "content": "sys"}
    assert r.data == {"intent": "learn", "confidence": 0.9} and r.tier == "private" and r.tokens_in == 12


def test_reasoning_tier_refuses_unredacted_text():
    a = adapter(lambda req: ok("x"))
    with pytest.raises(TypeError):
        a.complete("explain", "sys", "Call me on 9876543210")
    assert a.complete("explain", "sys", llm.RedactedText("Call me on <PHONE_1>")).text == "x"


def test_retries_then_succeeds():
    calls = []

    def h(req):
        calls.append(1)
        return httpx.Response(503) if len(calls) < 2 else ok("done")
    assert adapter(h).complete("explain", "s", llm.RedactedText("q")).text == "done" and len(calls) == 2


def test_invalid_json_is_retried_and_missing_keys_rejected():
    replies = iter(["not json", '{"a": 1}', '{"intent": "x", "confidence": 1}'])
    r = adapter(lambda req: ok(next(replies), "small"), retries=2).complete("route", "s", "q", schema={"required": ["intent", "confidence"]})
    assert r.data["intent"] == "x"


def test_falls_back_to_second_model():
    def h(req):
        model = json.loads(req.content)["model"]
        return httpx.Response(404, json={"error": "model not found"}) if model == "big" else ok("from small", "small")
    r = adapter(h).complete("explain", "s", llm.RedactedText("q"))
    assert r.model == "small" and r.text == "from small"


def test_unavailable_when_nothing_answers():
    def h(req):
        raise httpx.ConnectError("refused")
    with pytest.raises(llm.LLMUnavailable):
        adapter(h).complete("explain", "s", llm.RedactedText("q"))
    assert adapter(h).available() is False


def test_from_settings_requires_models():
    assert llm.from_settings("http://x", None, "m") is None
    assert llm.from_settings("http://x", "a", "b").cfg.tiers["reasoning"].fallback == "a"
