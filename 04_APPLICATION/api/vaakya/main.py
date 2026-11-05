"""App factory: middleware, error handlers, routers (BACKEND_ARCHITECTURE §4)."""
from __future__ import annotations

import time
import uuid

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from starlette.responses import JSONResponse

from . import __version__
from .config import get_settings
from .core import errors
from .core.logging import configure
from .db import engine
from .features import Features
from .routes import ai, documents, finance, me, progress

MAX_JSON_BYTES = 1024 * 1024
MAX_MULTIPART_BYTES = 11 * 1024 * 1024


def create_app(features: Features | None = None) -> FastAPI:
    settings = get_settings()
    configure()
    app = FastAPI(title="VAAKYA API", version=__version__,
                  description="VAAKYA - AI Financial Guardian. Educational guidance; every money figure comes from tested calculators.",
                  docs_url="/docs", redoc_url=None, openapi_url="/openapi.json")
    app.state.features = features or Features()
    log = structlog.get_logger()

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        rid = request.headers.get("x-request-id", "")
        rid = rid if rid and len(rid) <= 64 and rid.replace("-", "").isalnum() else str(uuid.uuid4())
        request.state.request_id = rid
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(request_id=rid)
        length = int(request.headers.get("content-length") or 0)
        cap = MAX_MULTIPART_BYTES if request.headers.get("content-type", "").startswith("multipart/") else MAX_JSON_BYTES
        if length > cap:
            return JSONResponse({"type": errors.PROBLEM_BASE + "too-large", "title": "Request too large", "status": 413, "request_id": rid},
                                status_code=413, media_type="application/problem+json", headers={"x-request-id": rid})
        start = time.perf_counter()
        response = await call_next(request)
        route = request.scope.get("route")
        log.info("request", method=request.method, route=getattr(route, "path", "unmatched"), status=response.status_code,
                 duration_ms=round((time.perf_counter() - start) * 1000, 1))
        response.headers["x-request-id"] = rid
        response.headers["cache-control"] = response.headers.get("cache-control", "no-store")
        response.headers["x-content-type-options"] = "nosniff"
        return response

    if settings.cors_origins:
        app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=False,
                           allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["authorization", "content-type", "idempotency-key"])
    errors.install(app)
    for r in (me.router, finance.router, progress.router, documents.router, ai.router):
        app.include_router(r)

    @app.get("/healthz", tags=["health"])
    def healthz() -> dict:
        return {"status": "ok", "version": __version__}

    @app.get("/readyz", tags=["health"])
    def readyz() -> JSONResponse:
        checks = {}
        try:
            with engine().connect() as c:
                c.execute(text("select 1"))
            checks["postgres"] = "ok"
        except Exception:  # noqa: BLE001
            checks["postgres"] = "down"
        f: Features = app.state.features
        checks.update({k: ("configured" if getattr(f, k) is not None else "not configured")
                       for k in ("vault", "graph", "orchestrator", "sentinel", "connector", "speech")})
        ok = checks["postgres"] == "ok"
        return JSONResponse({"status": "ready" if ok else "not ready", "checks": checks}, status_code=200 if ok else 503)

    return app
