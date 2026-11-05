"""Per-user sliding-window limits (SECURITY_ARCHITECTURE §10, NFR-SEC-09, NFR-COST-02).
In-memory: correct for one API replica. Multiple replicas need a shared store (documented scale step)."""
from __future__ import annotations

import time
from collections import defaultdict, deque
from threading import Lock

from fastapi import Depends, Request

from .auth import User_
from .config import get_settings
from .core.errors import RateLimited

LIMITS: dict[str, tuple[int, int]] = {  # bucket: (requests, window seconds)
    "chat": (30, 3600),
    "voice": (30, 3600),
    "sentinel": (20, 3600),
    "upload": (20, 86400),
    "write": (300, 3600),
}

_hits: dict[tuple[str, str], deque[float]] = defaultdict(deque)
_lock = Lock()


def check(key: str, bucket: str, now: float | None = None) -> None:
    limit, window = LIMITS[bucket]
    now = now or time.monotonic()
    with _lock:
        q = _hits[(key, bucket)]
        while q and q[0] <= now - window:
            q.popleft()
        if len(q) >= limit:
            retry = int(q[0] + window - now) + 1
            raise RateLimited(f"Limit of {limit} per {window // 60} minutes reached for {bucket}.", headers={"Retry-After": str(retry)},
                              extra={"retry_after": retry})
        q.append(now)


def reset() -> None:
    with _lock:
        _hits.clear()


def limit(bucket: str):
    def dep(request: Request, user: User_) -> None:
        if get_settings().rate_limit_enabled:
            check(str(user.id), bucket)
    return Depends(dep)
