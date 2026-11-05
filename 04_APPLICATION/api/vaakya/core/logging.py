"""Structured JSON logging with an allow-list of keys. Request and response bodies are never logged (NFR-SEC-07)."""
from __future__ import annotations

import hashlib
import hmac
import logging
import re
import sys

import structlog

ALLOWED_KEYS = {
    "event", "level", "timestamp", "request_id", "method", "route", "status", "duration_ms", "user", "agent", "tier",
    "model", "tokens_in", "tokens_out", "error_type", "bucket", "feature", "count", "job", "categories", "llm_used",
}
# Backstop: anything that looks like an Indian phone, Aadhaar, PAN or email is masked even in allowed keys.
_PATTERNS = [re.compile(p) for p in (r"\b[6-9]\d{9}\b", r"\b\d{4}\s?\d{4}\s?\d{4}\b", r"\b[A-Z]{5}\d{4}[A-Z]\b", r"[\w.+-]+@[\w-]+\.[\w.]+")]


def _filter(_, __, event_dict: dict) -> dict:
    out = {k: v for k, v in event_dict.items() if k in ALLOWED_KEYS}
    for k, v in out.items():
        if isinstance(v, str):
            for p in _PATTERNS:
                v = p.sub("[redacted]", v)
            out[k] = v
    return out


def configure(level: str = "INFO") -> None:
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=level)
    structlog.configure(
        processors=[structlog.contextvars.merge_contextvars, structlog.processors.add_log_level,
                    structlog.processors.TimeStamper(fmt="iso", utc=True), _filter, structlog.processors.JSONRenderer()],
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )


def user_hash(user_id: str, key: str) -> str:
    return hmac.new(key.encode(), user_id.encode(), hashlib.sha256).hexdigest()[:16]
