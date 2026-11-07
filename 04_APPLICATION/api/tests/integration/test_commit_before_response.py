"""Regression: since FastAPI 0.118 a yield-dependency's teardown runs AFTER the response is sent, so the unit-of-work commit
landed after the client already had its 200. The browser's next request (the dashboard right after 'See my score') then read
the old state and answered 409, bouncing a new user back to onboarding. get_db is therefore function-scoped."""
import asyncio
import json

from sqlalchemy.orm import Session

from ..conftest import make_token


def test_the_transaction_is_committed_before_the_response_starts(app, monkeypatch):
    events: list[str] = []
    real_commit = Session.commit

    def spy(self):
        events.append("commit")
        return real_commit(self)

    monkeypatch.setattr(Session, "commit", spy)
    body = json.dumps({"grants": [{"purpose": "voice_processing", "version": "2026-11", "granted": True}]}).encode()
    scope = {"type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1", "method": "PUT", "scheme": "http", "path": "/v1/me/consents",
             "raw_path": b"/v1/me/consents", "query_string": b"", "server": ("test", 80), "client": ("127.0.0.1", 1),
             "headers": [(b"host", b"test"), (b"content-type", b"application/json"), (b"content-length", str(len(body)).encode()),
                         (b"authorization", f"Bearer {make_token('commit-order-user')}".encode())]}
    sent = False

    async def receive():
        nonlocal sent
        if not sent:
            sent = True
            return {"type": "http.request", "body": body, "more_body": False}
        await asyncio.sleep(3600)

    async def send(msg):
        if msg["type"] == "http.response.start":
            events.append(f"response {msg['status']}")

    asyncio.run(app(scope, receive, send))
    assert events[-2:] == ["commit", "response 200"] or events.index("commit") < events.index("response 200"), events
