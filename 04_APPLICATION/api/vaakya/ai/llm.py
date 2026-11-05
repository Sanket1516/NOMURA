"""LLM adapter (FR-ORC-07, AGENT_ARCHITECTURE §5). One entry point for every model call.

* Two tiers: "private" (sees raw text, small model) and "reasoning" (sees only RedactedText).
* Per-task model choice, timeouts, retries with backoff, JSON-schema-constrained output, fallback model.
* Provider: Ollama HTTP API (self-hosted, D-026). Nothing leaves the host.
* If no model is reachable, callers get LLMUnavailable and must use their deterministic path, labelled llm_used=False.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from typing import Any, Literal

import httpx
import structlog

Tier = Literal["private", "reasoning"]


class LLMUnavailable(Exception):
    pass


class RedactedText(str):
    """Text that passed the Private Tier redaction gateway. The Reasoning Tier accepts only this type (privacy rule R1)."""


@dataclass
class TierConfig:
    model: str
    num_ctx: int = 4096
    keep_alive: str = "10m"
    fallback: str | None = None
    timeout_s: float = 60.0


@dataclass
class LLMConfig:
    base_url: str
    tiers: dict[str, TierConfig]
    tasks: dict[str, Tier] = field(default_factory=lambda: {
        "route": "private", "extract_fields": "private", "safety_judge": "private",
        "classify_message": "reasoning", "explain": "reasoning", "word_plan": "reasoning", "answer": "reasoning"})
    retries: int = 2


@dataclass
class LLMResult:
    text: str
    data: Any
    model: str
    tier: Tier
    tokens_in: int
    tokens_out: int
    latency_ms: int


class LLMAdapter:
    def __init__(self, cfg: LLMConfig, client: httpx.Client | None = None):
        self.cfg = cfg
        self.client = client or httpx.Client(base_url=cfg.base_url, timeout=httpx.Timeout(60.0, connect=3.0))
        self.log = structlog.get_logger()

    def available(self) -> bool:
        try:
            r = self.client.get("/api/tags", timeout=3)
            names = {m["name"] for m in r.json().get("models", [])}
            return r.status_code == 200 and any(t.model in names for t in self.cfg.tiers.values())
        except (httpx.HTTPError, ValueError):
            return False

    def complete(self, task: str, system: str, user: str, *, schema: dict | None = None, temperature: float = 0.2) -> LLMResult:
        tier: Tier = self.cfg.tasks.get(task, "reasoning")
        if tier == "reasoning" and not isinstance(user, RedactedText):
            raise TypeError("Reasoning Tier input must be RedactedText (privacy rule R1)")
        tc = self.cfg.tiers[tier]
        models = [tc.model] + ([tc.fallback] if tc.fallback else [])
        last: Exception | None = None
        for model in models:
            for attempt in range(self.cfg.retries + 1):
                try:
                    return self._call(model, tier, tc, system, str(user), schema, temperature)
                except (httpx.TimeoutException, httpx.TransportError) as e:
                    last = e
                except _Retryable as e:
                    last = e
                except _NotRetryable as e:
                    last = e
                    break  # try the fallback model
                time.sleep(min(0.5 * 2**attempt, 4))
        self.log.warning("llm_unavailable", tier=tier, error_type=type(last).__name__ if last else "none")
        raise LLMUnavailable(f"No {tier} model answered") from last

    def _call(self, model: str, tier: Tier, tc: TierConfig, system: str, user: str, schema: dict | None, temperature: float) -> LLMResult:
        body: dict[str, Any] = {"model": model, "stream": False, "keep_alive": tc.keep_alive,
                                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}],
                                "options": {"temperature": temperature, "num_ctx": tc.num_ctx}}
        if schema:
            body["format"] = schema  # Ollama structured outputs: JSON constrained to the schema
        t0 = time.perf_counter()
        r = self.client.post("/api/chat", json=body, timeout=tc.timeout_s)
        if r.status_code >= 500 or r.status_code == 429:
            raise _Retryable(r.status_code)
        if r.status_code >= 400:
            raise _NotRetryable(r.status_code)
        j = r.json()
        text = j.get("message", {}).get("content", "")
        data = None
        if schema:
            try:
                data = json.loads(text)
            except json.JSONDecodeError as e:
                raise _Retryable("invalid json") from e
            missing = [k for k in schema.get("required", []) if k not in data]
            if missing:
                raise _Retryable(f"missing {missing}")
        res = LLMResult(text=text, data=data, model=model, tier=tier, tokens_in=int(j.get("prompt_eval_count", 0)),
                        tokens_out=int(j.get("eval_count", 0)), latency_ms=int((time.perf_counter() - t0) * 1000))
        self.log.info("llm_call", tier=tier, model=model, tokens_in=res.tokens_in, tokens_out=res.tokens_out, duration_ms=res.latency_ms)
        return res


class _Retryable(Exception):
    pass


class _NotRetryable(Exception):
    pass


def from_settings(base_url: str | None, private_model: str | None, reasoning_model: str | None) -> LLMAdapter | None:
    """Models are chosen by T0.03; until then they are configuration (VAAKYA_LLM_PRIVATE_MODEL / _REASONING_MODEL)."""
    if not (base_url and private_model and reasoning_model):
        return None
    return LLMAdapter(LLMConfig(base_url=base_url, tiers={
        "private": TierConfig(model=private_model, num_ctx=4096, keep_alive="30m"),
        "reasoning": TierConfig(model=reasoning_model, num_ctx=8192, keep_alive="5m", fallback=private_model, timeout_s=90)}))
