"""OIDC access-token verification (SECURITY_ARCHITECTURE §2). user_id always comes from the token, never the body."""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated, Protocol

import jwt
import structlog
from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .core.errors import AuthError, ForbiddenError
from .core.logging import user_hash
from .db import get_db
from .models import User


class KeyResolver(Protocol):
    def key_for(self, token: str): ...


class JwksResolver:
    """Fetches and caches Keycloak's JWKS; refreshes on an unknown kid (key rotation)."""

    def __init__(self, url: str):
        self._client = jwt.PyJWKClient(url, cache_keys=True, lifespan=600)

    def key_for(self, token: str):
        try:
            return self._client.get_signing_key_from_jwt(token).key
        except jwt.PyJWKClientError as e:
            raise AuthError("Signing key not found") from e


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    sub: str
    roles: frozenset[str]
    is_demo: bool


def _resolver(request: Request, settings: Settings) -> KeyResolver:
    r = getattr(request.app.state, "key_resolver", None)
    if r is None:
        url = settings.oidc_jwks_url or f"{settings.oidc_issuer}/protocol/openid-connect/certs"
        r = request.app.state.key_resolver = JwksResolver(url)
    return r


def verify(token: str, resolver: KeyResolver, settings: Settings) -> dict:
    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError as e:
        raise AuthError("Malformed token") from e
    if header.get("alg") != "RS256":
        raise AuthError("Unsupported token algorithm")
    try:
        return jwt.decode(token, key=resolver.key_for(token), algorithms=["RS256"], audience=settings.oidc_audience,
                          issuer=settings.oidc_issuer, leeway=30,
                          options={"require": ["exp", "iat", "sub", "aud", "iss"]})
    except jwt.ExpiredSignatureError as e:
        raise AuthError("Token expired") from e
    except jwt.PyJWTError as e:
        raise AuthError("Invalid token") from e


def current_user(request: Request, db: Annotated[Session, Depends(get_db, scope="function")],
                 settings: Annotated[Settings, Depends(get_settings)]) -> CurrentUser:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise AuthError("Missing bearer token", headers={"WWW-Authenticate": "Bearer"})
    claims = verify(auth[7:].strip(), _resolver(request, settings), settings)
    sub = str(claims["sub"])
    user = db.scalar(select(User).where(User.keycloak_sub == sub))
    if user is None:  # just-in-time provisioning on first authenticated request
        user = User(keycloak_sub=sub)
        db.add(user)
        db.flush()
    from .db import scope_to_user
    scope_to_user(db, user.id)  # Row Level Security: every following query in this request sees only this user's rows
    if user.status != "active":
        raise AuthError("Account is being deleted")
    roles = frozenset((claims.get("realm_access") or {}).get("roles", []))
    structlog.contextvars.bind_contextvars(user=user_hash(str(user.id), settings.log_hmac_key))
    request.state.user_id = user.id
    return CurrentUser(id=user.id, sub=sub, roles=roles, is_demo=user.is_demo)


User_ = Annotated[CurrentUser, Depends(current_user)]


def require_role(role: str):
    def dep(user: User_) -> CurrentUser:
        if role not in user.roles:
            raise ForbiddenError()
        return user
    return Depends(dep)
