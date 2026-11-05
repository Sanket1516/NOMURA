"""Knowledge base and retrieval (FR-KB-01..04, AGENT_ARCHITECTURE §6).

Corpus: the six lessons, the scheme catalogue and scam patterns, chunked by section with metadata.
Index: Qdrant collection `financial_knowledge` with
  * a sparse "lexical" vector (term frequencies; Qdrant applies IDF server-side) that works with no model, and
  * a dense "e5" slot (1024-dim) filled only when an embedding service is configured (T0.10).
Retrieval: filtered by category and language, top-k, then an abstention threshold: below it the caller must say
"not in my trusted sources" instead of answering. Qdrant holds no personal data; queries are not stored.
"""
from __future__ import annotations

import hashlib
import json
import re
import unicodedata
import uuid
from collections import Counter
from dataclasses import dataclass
from pathlib import Path

from qdrant_client import QdrantClient
from qdrant_client.models import (Distance, FieldCondition, Filter, MatchAny, MatchValue, Modifier, PayloadSchemaType, PointStruct,
                                  SparseVector, SparseVectorParams, VectorParams)

COLLECTION = "financial_knowledge"
DATA = Path(__file__).resolve().parent.parent / "data"
NS = uuid.UUID("6f1c3d2e-9a7b-4c1d-8e2f-112233445566")
STOP = set("a an the and or of to in on for is are be it this that with as at by from your you i me my we our not no do does can will "
           "what how why when which who should would could if than then so about into".split())
SYNONYMS = {"sip": "systematic investment plan mutual fund", "emi": "loan instalment", "ulip": "unit linked insurance plan investment",
            "otp": "one time password", "kyc": "know your customer", "upi": "unified payments interface", "apy": "atal pension",
            "kisan": "farmer", "daughter": "girl child", "beti": "girl child", "fasal": "crop", "bima": "insurance", "pension": "pension retirement"}


def tokenize(text: str) -> list[str]:
    text = unicodedata.normalize("NFKC", text.lower())
    words = re.findall(r"[\wऀ-ॿಀ-೿]+", text)
    out = []
    for w in words:
        if w in STOP or len(w) < 2:
            continue
        out.append(w[:-1] if len(w) > 4 and w.endswith("s") and not w.endswith("ss") else w)  # light plural folding
        if w in SYNONYMS:
            out += SYNONYMS[w].split()
    return out


def sparse(text: str) -> SparseVector:
    tf = Counter(int(hashlib.blake2b(t.encode(), digest_size=4).hexdigest(), 16) for t in tokenize(text))
    return SparseVector(indices=list(tf.keys()), values=[float(v) for v in tf.values()])


@dataclass
class Chunk:
    id: str
    text: str
    title: str
    category: str
    language: str
    source: str
    publisher: str
    url: str
    status: str
    scheme_id: str | None = None


def corpus() -> list[Chunk]:
    chunks: list[Chunk] = []
    learning = json.loads((DATA / "learning.json").read_text(encoding="utf-8"))
    for m in learning["modules"]:
        for i, sec in enumerate(m["sections"]):
            chunks.append(Chunk(f"lesson:{m['id']}:{i}", f"{m['title']}: {sec['heading']}. {sec['body']}", f"{m['title']} — {sec['heading']}",
                                "lesson", "en", f"lesson/{m['id']}", "VAAKYA lesson (draft, under review)", f"/learn#{m['id']}", learning["status"]))
    schemes = json.loads((DATA / "schemes.json").read_text(encoding="utf-8"))
    for sc in schemes["schemes"]:
        crit = "; ".join(c["label"] for c in sc["criteria"])
        steps = " ".join(s["text"] for s in sc["steps"])
        chunks.append(Chunk(f"scheme:{sc['id']}", f"{sc['name']}: {sc['summary']} Benefit: {sc['benefit']['text']} Who can apply: {crit}. "
                            f"How to apply: {steps} Documents: {', '.join(sc['documents'])}.", sc["name"], "scheme_info", "en",
                            f"scheme/{sc['id']}", sc["authority"], sc["source_url"], schemes["verification"], scheme_id=sc["id"]))
    scams = json.loads((DATA / "scam_patterns.json").read_text(encoding="utf-8"))
    for p in scams["patterns"]:
        chunks.append(Chunk(f"scam:{p['id']}", f"{p['title']}: {p['body']}", p["title"], "scam_pattern", "en", f"scam/{p['id']}",
                            "VAAKYA scam awareness (draft, under review)", "/shield", scams["status"]))
    return chunks


@dataclass
class Hit:
    chunk_id: str
    score: float
    title: str
    text: str
    category: str
    publisher: str
    url: str
    status: str
    scheme_id: str | None


class KnowledgeStore:
    def __init__(self, url: str | None = None, client: QdrantClient | None = None, embedder=None, min_score: float = 2.0):
        self.client = client or QdrantClient(url=url, timeout=10)
        self.embedder = embedder  # optional: callable(list[str], kind) -> list[list[float]] (e5, T0.10)
        self.min_score = min_score

    def ensure(self) -> None:
        if not self.client.collection_exists(COLLECTION):
            self.client.create_collection(COLLECTION, vectors_config={"e5": VectorParams(size=1024, distance=Distance.COSINE)},
                                          sparse_vectors_config={"lexical": SparseVectorParams(modifier=Modifier.IDF)})
            for f in ("category", "language", "scheme_id"):
                self.client.create_payload_index(COLLECTION, f, PayloadSchemaType.KEYWORD)

    def ingest(self, chunks: list[Chunk] | None = None) -> int:
        """Idempotent: point id is derived from the chunk id and content hash, so unchanged chunks are not duplicated."""
        self.ensure()
        chunks = chunks or corpus()
        points = []
        for c in chunks:
            h = hashlib.sha256(c.text.encode()).hexdigest()[:16]
            vec: dict = {"lexical": sparse(c.text)}
            if self.embedder:
                vec["e5"] = self.embedder([c.text], "passage")[0]
            points.append(PointStruct(id=str(uuid.uuid5(NS, c.id)), vector=vec,
                                      payload={**c.__dict__, "chunk_hash": h, "chunk_id": c.id}))
        self.client.upsert(COLLECTION, points=points, wait=True)
        return len(points)

    def search(self, query: str, *, categories: list[str] | None = None, language: str | None = None, scheme_id: str | None = None,
               limit: int = 5) -> list[Hit]:
        must = []
        if categories:
            must.append(FieldCondition(key="category", match=MatchAny(any=categories)))
        if language:
            must.append(FieldCondition(key="language", match=MatchAny(any=[language, "en"])))
        if scheme_id:
            must.append(FieldCondition(key="scheme_id", match=MatchValue(value=scheme_id)))
        q = sparse(query)
        if not q.indices:
            return []
        res = self.client.query_points(COLLECTION, query=q, using="lexical", query_filter=Filter(must=must) if must else None,
                                       limit=limit, with_payload=True).points
        return [Hit(chunk_id=p.payload["chunk_id"], score=float(p.score), title=p.payload["title"], text=p.payload["text"],
                    category=p.payload["category"], publisher=p.payload["publisher"], url=p.payload["url"], status=p.payload["status"],
                    scheme_id=p.payload.get("scheme_id")) for p in res]

    @staticmethod
    def coverage(query: str, text: str) -> float:
        """Share of the query's meaningful terms that appear in the source text."""
        q = set(tokenize(query))
        return len(q & set(tokenize(text))) / len(q) if q else 0.0

    def grounded(self, query: str, min_coverage: float = 0.5, **kw) -> list[Hit]:
        """Hits that pass both the score threshold and term coverage. Empty list means: abstain, do not answer from model memory."""
        return [h for h in self.search(query, **kw) if h.score >= self.min_score and self.coverage(query, h.text) >= min_coverage]
