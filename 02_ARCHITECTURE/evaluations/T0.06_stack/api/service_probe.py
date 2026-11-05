"""T0.06 service probe: connect the pinned Python clients to the running spike services.

Run inside the spike compose network (see README). Each probe makes one real round trip.
"""
from __future__ import annotations

import time
import uuid


def wait(fn, name: str, timeout: float = 180.0):
    deadline = time.monotonic() + timeout
    while True:
        try:
            result = fn()
            print(f"PASS {name}: {result}")
            return True
        except Exception as exc:  # noqa: BLE001
            if time.monotonic() > deadline:
                print(f"FAIL {name}: {exc!r}")
                return False
            time.sleep(3)


def postgres():
    import psycopg

    with psycopg.connect("host=postgres dbname=vaakya user=postgres password=spike-only") as c:
        return c.execute("select version()").fetchone()[0].split(",")[0]


def neo4j():
    from neo4j import GraphDatabase

    with GraphDatabase.driver("bolt://neo4j:7687", auth=("neo4j", "spike-only-pass")) as d:
        rec, _, _ = d.execute_query("MERGE (u:User {id:$id}) RETURN count(u) AS n", id="probe")
        comps, _, _ = d.execute_query("CALL dbms.components() YIELD versions, edition RETURN versions[0] AS v, edition")
        return f"{comps[0]['v']} {comps[0]['edition']}, merged {rec[0]['n']} node"


def qdrant():
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams

    c = QdrantClient(url="http://qdrant:6333")
    name = "probe_" + uuid.uuid4().hex[:6]
    c.create_collection(name, vectors_config=VectorParams(size=1024, distance=Distance.COSINE))
    c.upsert(name, points=[PointStruct(id=1, vector=[0.01] * 1024, payload={"category": "probe"})])
    hit = c.query_points(name, query=[0.01] * 1024, limit=1).points[0]
    c.delete_collection(name)
    return f"1024-dim collection round trip ok, hit id {hit.id}"


def seaweedfs():
    import boto3

    s3 = boto3.client("s3", endpoint_url="http://seaweedfs:8333", aws_access_key_id="any",
                      aws_secret_access_key="any", region_name="us-east-1")
    s3.create_bucket(Bucket="vaakya-user-docs")
    s3.put_object(Bucket="vaakya-user-docs", Key="probe/2026/11/hello.txt", Body=b"hello")
    body = s3.get_object(Bucket="vaakya-user-docs", Key="probe/2026/11/hello.txt")["Body"].read()
    assert body == b"hello"
    return "S3 put/get round trip ok"


def keycloak():
    import httpx

    r = httpx.get("http://keycloak:8080/realms/master/.well-known/openid-configuration", timeout=5)
    r.raise_for_status()
    jwks = httpx.get(r.json()["jwks_uri"], timeout=5).json()
    return f"OIDC discovery ok, {len(jwks['keys'])} signing keys"


if __name__ == "__main__":
    results = [wait(f, f.__name__) for f in (postgres, neo4j, qdrant, seaweedfs, keycloak)]
    raise SystemExit(0 if all(results) else 1)
