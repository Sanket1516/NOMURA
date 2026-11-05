"""Background worker: outbox relay to Neo4j and retention purge. Run: python -m vaakya.worker"""
from __future__ import annotations

import time

import structlog

from .bootstrap import build_features
from .core.logging import configure
from .db import session_factory
from .services import retention, twin


def run_once(features) -> dict:
    out = {"synced": 0, "purged": {}}
    with session_factory()() as db:
        if features.graph is not None:
            out["synced"] = twin.relay(db, features.graph)
        db.commit()
    return out


def main() -> None:
    configure()
    log = structlog.get_logger()
    f = build_features()
    last_purge = 0.0
    while True:
        try:
            r = run_once(f)
            if r["synced"]:
                log.info("relay", count=r["synced"], job="outbox_relay")
            if time.time() - last_purge > 24 * 3600:
                with session_factory()() as db:
                    p = retention.purge(db)
                    db.commit()
                log.info("retention", job="retention_purge", count=sum(p.values()))
                last_purge = time.time()
        except Exception as e:  # noqa: BLE001
            log.error("worker_error", error_type=type(e).__name__)
        time.sleep(5)


if __name__ == "__main__":
    main()
