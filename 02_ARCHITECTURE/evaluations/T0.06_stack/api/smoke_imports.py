"""T0.06 smoke test: import every planned API dependency and exercise each one lightly.

No network services are required. Exit code 0 means every check passed.
"""
from __future__ import annotations

import importlib
import sys

MODULES = [
    "fastapi", "uvicorn", "pydantic", "pydantic_settings", "multipart",
    "langgraph", "langgraph.graph", "llama_index.core", "llama_index.vector_stores.qdrant",
    "qdrant_client", "neo4j", "psycopg", "sqlalchemy", "alembic", "apscheduler",
    "presidio_analyzer", "presidio_anonymizer", "httpx", "jwt", "boto3", "structlog",
    "ollama", "prometheus_client", "opentelemetry.sdk.trace",
]


def check_imports() -> list[str]:
    failures = []
    for name in MODULES:
        try:
            importlib.import_module(name)
        except Exception as exc:  # noqa: BLE001 - report every failure
            failures.append(f"{name}: {exc!r}")
    return failures


def check_fastapi() -> None:
    from fastapi import FastAPI
    from fastapi.testclient import TestClient

    app = FastAPI()

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    resp = TestClient(app).get("/health")
    assert resp.status_code == 200 and resp.json() == {"status": "ok"}, resp.text


def check_langgraph() -> None:
    from typing import TypedDict

    from langgraph.graph import END, START, StateGraph

    class State(TypedDict):
        text: str
        route: str

    def router(state: State) -> State:
        return {"text": state["text"], "route": "sentinel" if "otp" in state["text"].lower() else "educator"}

    g = StateGraph(State)
    g.add_node("router", router)
    g.add_edge(START, "router")
    g.add_edge("router", END)
    out = g.compile().invoke({"text": "Share your OTP now", "route": ""})
    assert out["route"] == "sentinel", out


def check_qdrant_inmemory() -> None:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams

    c = QdrantClient(":memory:")
    c.create_collection("financial_knowledge", vectors_config=VectorParams(size=4, distance=Distance.COSINE))
    c.upsert("financial_knowledge", points=[PointStruct(id=1, vector=[1, 0, 0, 0], payload={"category": "scheme"})])
    hits = c.query_points("financial_knowledge", query=[1, 0, 0, 0], limit=1).points
    assert hits and hits[0].id == 1, hits


def check_sqlalchemy() -> None:
    from sqlalchemy import create_engine, text

    with create_engine("sqlite://").connect() as conn:
        assert conn.execute(text("select 1")).scalar() == 1


def check_jwt() -> None:
    import jwt
    from cryptography.hazmat.primitives.asymmetric import rsa

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    token = jwt.encode({"sub": "u1", "aud": "vaakya-api"}, key, algorithm="RS256")
    claims = jwt.decode(token, key.public_key(), algorithms=["RS256"], audience="vaakya-api")
    assert claims["sub"] == "u1"


def check_presidio_anonymizer() -> None:
    # The analyzer needs a spaCy model download, which is a T0.04 concern. The anonymizer works standalone.
    from presidio_anonymizer import AnonymizerEngine
    from presidio_anonymizer.entities import OperatorConfig, RecognizerResult

    text = "Call 9876543210 now"
    res = AnonymizerEngine().anonymize(
        text=text,
        analyzer_results=[RecognizerResult(entity_type="PHONE_NUMBER", start=5, end=15, score=1.0)],
        operators={"PHONE_NUMBER": OperatorConfig("replace", {"new_value": "<PHONE_1>"})},
    )
    assert res.text == "Call <PHONE_1> now", res.text


def check_apscheduler() -> None:
    from apscheduler.schedulers.background import BackgroundScheduler

    s = BackgroundScheduler()
    s.add_job(lambda: None, "interval", minutes=60, id="probe")
    s.start(paused=True)
    assert s.get_job("probe") is not None
    s.shutdown(wait=False)


CHECKS = [check_fastapi, check_langgraph, check_qdrant_inmemory, check_sqlalchemy, check_jwt,
          check_presidio_anonymizer, check_apscheduler]


def main() -> int:
    print(f"Python {sys.version.split()[0]}")
    failures = check_imports()
    print(f"imports: {len(MODULES) - len(failures)}/{len(MODULES)} ok")
    for check in CHECKS:
        try:
            check()
            print(f"PASS {check.__name__}")
        except Exception as exc:  # noqa: BLE001
            failures.append(f"{check.__name__}: {exc!r}")
            print(f"FAIL {check.__name__}: {exc!r}")
    for f in failures:
        print("FAILURE", f)
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
