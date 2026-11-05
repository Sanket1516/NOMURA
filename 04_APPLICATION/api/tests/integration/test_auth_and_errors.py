from ..conftest import OTHER_KEY, make_token


def test_health_is_public_and_ready_reports_subsystems(client):
    assert client.get("/healthz").json()["status"] == "ok"
    r = client.get("/readyz").json()
    assert r["checks"]["postgres"] == "ok"
    assert r["checks"]["orchestrator"] == "not configured"


def test_missing_token_is_401_problem(client):
    r = client.get("/v1/me")
    assert r.status_code == 401
    assert r.headers["content-type"].startswith("application/problem+json")
    body = r.json()
    assert body["type"].endswith("/unauthenticated") and body["request_id"]
    assert r.headers["www-authenticate"] == "Bearer"


def test_bad_tokens_are_rejected(client):
    bad = {
        "expired": make_token("x", exp_in=-120),
        "wrong audience": make_token("x", aud="someone-else"),
        "wrong issuer": make_token("x", iss="https://evil.test/realms/vaakya"),
        "wrong key": make_token("x", key=OTHER_KEY),
        "alg none": "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ4In0.",
        "garbage": "not-a-jwt",
    }
    for name, tok in bad.items():
        r = client.get("/v1/me", headers={"authorization": f"Bearer {tok}"})
        assert r.status_code == 401, name


def test_hs256_token_signed_with_public_key_is_rejected(client):
    import jwt
    from cryptography.hazmat.primitives import serialization
    from ..conftest import KEY
    pub = KEY.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
    tok = jwt.encode({"sub": "x", "aud": "vaakya-api", "iss": "https://issuer.test/realms/vaakya", "exp": 9999999999, "iat": 1}, pub.decode()[:40], algorithm="HS256")
    assert client.get("/v1/me", headers={"authorization": f"Bearer {tok}"}).status_code == 401


def test_first_call_provisions_user(alice):
    r = alice.get("/v1/me")
    assert r.status_code == 200
    assert r.json()["onboarding"] == {"consent": False, "profile": False, "path": None, "assessment": False}


def test_validation_errors_are_422_with_fields(alice):
    r = alice.put("/v1/me/profile", json={"display_name": "", "birth_year": 1800, "state": "M", "income_type": "lottery"})
    assert r.status_code == 422
    locs = {tuple(e["loc"]) for e in r.json()["errors"]}
    assert ("body", "birth_year") in locs and ("body", "income_type") in locs


def test_unknown_fields_are_rejected(alice):
    r = alice.put("/v1/me/preferences", json={"textScale": 1, "user_id": "someone-else"})
    assert r.status_code == 422


def test_request_id_is_echoed_and_unknown_route_is_problem(alice):
    r = alice.get("/v1/nope", headers={"x-request-id": "abc-123"})
    assert r.status_code == 404 and r.headers["x-request-id"] == "abc-123"


def test_oversized_json_is_413(alice):
    r = alice.put("/v1/me/preferences", content=b"{" + b" " * (1024 * 1024 + 10) + b"}", headers={"content-type": "application/json"})
    assert r.status_code == 413


def test_text_is_normalised_and_control_chars_removed(alice):
    from ..conftest import PROFILE
    r = alice.put("/v1/me/profile", json={**PROFILE, "display_name": "Pri\u0000ya\u0007 "})
    assert r.status_code == 200 and r.json()["display_name"] == "Priya"
