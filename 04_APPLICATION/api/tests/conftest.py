"""Integration tests run against a real PostgreSQL (VAAKYA_DATABASE_URL) with real JWT verification.
A test RSA key signs tokens; the app's key resolver is pointed at its public key."""
from __future__ import annotations

import os
import time
import uuid

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa

ADMIN_URL = os.environ.get("VAAKYA_DATABASE_URL", "postgresql+psycopg://postgres:test@localhost:55432/vaakya")
os.environ["VAAKYA_ADMIN_DATABASE_URL"] = ADMIN_URL
# VAAKYA_TEST_RLS=1 runs the whole suite as a restricted, non-owner role so Row Level Security is enforced.
RLS = os.environ.get("VAAKYA_TEST_RLS") == "1"
os.environ["VAAKYA_DATABASE_URL"] = ADMIN_URL.replace("postgres:test@", "vaakya_api_test:test@") if RLS else ADMIN_URL
os.environ.setdefault("VAAKYA_OIDC_ISSUER", "https://issuer.test/realms/vaakya")
os.environ.setdefault("VAAKYA_ENV", "test")

ISSUER = os.environ["VAAKYA_OIDC_ISSUER"]
KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
OTHER_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)


class StaticResolver:
    def key_for(self, token: str):
        return KEY.public_key()


def make_token(sub: str, *, aud: str = "vaakya-api", exp_in: int = 300, key=KEY, roles: list[str] | None = None, alg: str = "RS256", **extra) -> str:
    now = int(time.time())
    claims = {"sub": sub, "aud": aud, "iss": extra.pop("iss", ISSUER), "iat": now, "exp": now + exp_in,
              "realm_access": {"roles": roles or ["user"]}, **extra}
    return jwt.encode(claims, key, algorithm=alg)


def _db_reachable() -> bool:
    from sqlalchemy import create_engine, text
    try:
        with create_engine(ADMIN_URL).connect() as c:
            c.execute(text("select 1"))
        return True
    except Exception:  # noqa: BLE001
        return False


@pytest.fixture(scope="session")
def app():
    if not _db_reachable():
        pytest.skip("PostgreSQL not reachable; start it (see README) to run integration tests")
    from alembic import command
    from alembic.config import Config
    command.upgrade(Config(os.path.join(os.path.dirname(__file__), "..", "alembic.ini")), "head")
    if RLS:
        from sqlalchemy import create_engine, text
        with create_engine(ADMIN_URL).begin() as c:
            c.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'vaakya_api_test') THEN "
                           "CREATE ROLE vaakya_api_test LOGIN PASSWORD 'test' IN ROLE vaakya_app; END IF; END $$"))
    from vaakya.main import create_app
    a = create_app()
    a.state.key_resolver = StaticResolver()
    return a


@pytest.fixture(autouse=True)
def clean(request):
    if "app" not in request.fixturenames and "client" not in request.fixturenames:
        yield
        return
    from sqlalchemy import text

    from vaakya import ratelimit
    from vaakya.db import admin_engine
    ratelimit.reset()
    with admin_engine().begin() as c:
        c.execute(text("TRUNCATE users, outbox, schemes RESTART IDENTITY CASCADE"))
    yield


@pytest.fixture
def client(app):
    from fastapi.testclient import TestClient
    return TestClient(app, raise_server_exceptions=False)


class Api:
    def __init__(self, client, sub: str):
        self.c = client
        self.h = {"authorization": f"Bearer {make_token(sub)}"}

    def __getattr__(self, method):
        def call(path, **kw):
            headers = {**self.h, **kw.pop("headers", {})}
            return getattr(self.c, method)(path, headers=headers, **kw)
        return call


@pytest.fixture
def alice(client):
    return Api(client, "alice-" + uuid.uuid4().hex[:6])


@pytest.fixture
def bob(client):
    return Api(client, "bob-" + uuid.uuid4().hex[:6])


PROFILE = {"display_name": "Priya", "birth_year": 1994, "occupation": "Teacher", "state": "Maharashtra", "district": "Thane",
           "preferred_lang": "mr", "income_type": "salaried", "dependents": 2}
ANSWERS = [
    {"question_id": "monthly_income", "value": {"min_paise": 3_500_000, "max_paise": 3_500_000}},
    {"question_id": "monthly_expenses", "value": {"paise": 2_600_000}},
    {"question_id": "loan_emi", "value": {"paise": 0}},
    {"question_id": "savings", "value": {"paise": 4_200_000}},
    {"question_id": "risk_preference", "value": "low"},
    {"question_id": "primary_goal", "value": "emergency_fund"},
]


@pytest.fixture
def onboarded(alice):
    assert alice.put("/v1/me/consents", json={"grants": [{"purpose": "ai_processing", "version": "2026-11", "granted": True},
                                                         {"purpose": "document_storage", "version": "2026-11", "granted": True}]}).status_code == 200
    assert alice.put("/v1/me/profile", json=PROFILE).status_code == 200
    assert alice.post("/v1/assessment/answers", json={"answers": ANSWERS}).status_code == 200
    r = alice.post("/v1/assessment/complete")
    assert r.status_code == 200, r.text
    return alice
