"""Prometheus metrics (NFR-OBS-02). Labels are route templates and categories only, never user data."""
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest

HTTP_REQUESTS = Counter("vaakya_http_requests_total", "HTTP requests", ["method", "route", "status"])
HTTP_LATENCY = Histogram("vaakya_http_request_seconds", "HTTP request latency", ["route"],
                         buckets=(0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 45))
AGENT_ANSWERS = Counter("vaakya_agent_answers_total", "Answers by agent and whether a language model was used", ["agent", "llm_used"])
SENTINEL_CHECKS = Counter("vaakya_sentinel_checks_total", "Sentinel checks by risk level", ["level"])
SAFETY_FALLBACKS = Counter("vaakya_safety_fallbacks_total", "Answers replaced by the safe fallback")


def render() -> tuple[bytes, str]:
    return generate_latest(), CONTENT_TYPE_LATEST
