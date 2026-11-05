"""RFC 9457 problem details and the domain exceptions that map to them (BACKEND_ARCHITECTURE §7)."""
from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_BASE = "https://vaakya.app/problems/"


class ApiError(Exception):
    status = 500
    kind = "internal"
    title = "Something went wrong"

    def __init__(self, detail: str | None = None, *, title: str | None = None, extra: dict[str, Any] | None = None,
                 headers: dict[str, str] | None = None):
        super().__init__(detail or self.title)
        self.detail = detail
        self.title = title or self.title
        self.extra = extra or {}
        self.headers = headers


class AuthError(ApiError):
    status, kind, title = 401, "unauthenticated", "Please sign in again"


class ForbiddenError(ApiError):
    status, kind, title = 403, "forbidden", "You do not have access"


class NotFoundError(ApiError):
    status, kind, title = 404, "not-found", "Not found"


class ConflictError(ApiError):
    status, kind, title = 409, "conflict", "Conflict"


class ConsentRequiredError(ApiError):
    status, kind, title = 409, "consent-required", "Consent needed for this action"


class DomainValidationError(ApiError):
    status, kind, title = 422, "validation", "Invalid request"


class PayloadTooLarge(ApiError):
    status, kind, title = 413, "too-large", "File is too large"


class UnsupportedMedia(ApiError):
    status, kind, title = 415, "unsupported-media", "Unsupported file type"


class RateLimited(ApiError):
    status, kind, title = 429, "rate-limited", "Too many requests"


class ServiceUnavailable(ApiError):
    status, kind, title = 503, "unavailable", "Service unavailable"


def problem(request: Request, status: int, kind: str, title: str, detail: str | None = None, **extra: Any) -> JSONResponse:
    body = {"type": PROBLEM_BASE + kind, "title": title, "status": status, "instance": request.url.path,
            "request_id": getattr(request.state, "request_id", None)}
    if detail:
        body["detail"] = detail
    body.update(extra)
    return JSONResponse(body, status_code=status, media_type="application/problem+json")


def install(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def _api(request: Request, exc: ApiError):
        resp = problem(request, exc.status, exc.kind, exc.title, exc.detail, **exc.extra)
        for k, v in (exc.headers or {}).items():
            resp.headers[k] = v
        return resp

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError):
        errors = [{"loc": list(e.get("loc", [])), "msg": e.get("msg", ""), "type": e.get("type", "")} for e in exc.errors()]
        return problem(request, 422, "validation", "Invalid request", "One or more fields are invalid.", errors=errors)

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException):
        kinds = {404: "not-found", 405: "method-not-allowed", 401: "unauthenticated", 403: "forbidden"}
        return problem(request, exc.status_code, kinds.get(exc.status_code, "http"), str(exc.detail))

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception):  # never leak internals
        import structlog
        structlog.get_logger().exception("unhandled_error", error_type=type(exc).__name__)
        return problem(request, 500, "internal", "Something went wrong", "Please try again. Quote the request id if it keeps happening.")
