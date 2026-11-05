"""Retrieval against a real Qdrant 1.20 (skipped if not running). Lexical retrieval; dense e5 waits for T0.10."""
import os
import socket

import pytest

from vaakya.ai import knowledge as k

QURL = os.environ.get("TEST_QDRANT_URL", "http://localhost:56333")


def _up():
    try:
        socket.create_connection(("localhost", int(QURL.rsplit(":", 1)[1])), timeout=1).close()
        return True
    except OSError:
        return False


pytestmark = pytest.mark.skipif(not _up(), reason="Qdrant not running")


@pytest.fixture(scope="module")
def store():
    s = k.KnowledgeStore(QURL)
    if s.client.collection_exists(k.COLLECTION):
        s.client.delete_collection(k.COLLECTION)
    s.ingest()
    return s


def test_corpus_has_all_sources():
    c = k.corpus()
    cats = {x.category for x in c}
    assert cats == {"lesson", "scheme_info", "scam_pattern"} and len(c) >= 40
    assert all(x.status in ("draft_unreviewed", "unverified_draft") for x in c)


def test_ingest_is_idempotent(store):
    n = store.client.count(k.COLLECTION).count
    store.ingest()
    assert store.client.count(k.COLLECTION).count == n


# Labelled retrieval set: question -> chunk that must be in the top 3.
LABELLED = [
    ("What is a SIP and is the return fixed?", "lesson:sip-basics:0"),
    ("How much emergency fund do I need if my income changes every month?", "lesson:emergency-fund:1"),
    ("Someone asked for my OTP on the phone", "lesson:digital-safety:0"),
    ("Do I need my UPI PIN to receive money?", "lesson:digital-safety:1"),
    ("difference between term insurance and ULIP", "lesson:insurance-101:2"),
    ("how to compare loans real cost processing fee", "lesson:credit-score:0"),
    ("loan app wants access to my contacts", "scam:loan-app"),
    ("police video call digital arrest parcel", "scam:digital-arrest"),
    ("whatsapp group guaranteed daily return stock tips", "scam:investment-group"),
    ("₹6,000 a year for farmers", "scheme:pm-kisan"),
    ("crop insurance premium kharif", "scheme:pmfby"),
    ("pension scheme for age 30 not income tax payer", "scheme:apy"),
    ("accident insurance 20 rupees", "scheme:pmsby"),
    ("disability ID card", "scheme:udid"),
    ("savings account for my daughter", "scheme:ssy"),
]


def test_retrieval_accuracy_on_labelled_set(store):
    hits = 0
    misses = []
    for q, expected in LABELLED:
        top = [h.chunk_id for h in store.search(q, limit=3)]
        if expected in top:
            hits += 1
        else:
            misses.append((q, expected, top))
    accuracy = hits / len(LABELLED)
    print(f"top-3 accuracy {accuracy:.0%}", misses)
    assert accuracy >= 0.85, misses


def test_metadata_filters(store):
    assert all(h.category == "scam_pattern" for h in store.search("loan", categories=["scam_pattern"]))
    assert [h.chunk_id for h in store.search("life cover premium", scheme_id="pmjjby")] == ["scheme:pmjjby"]


def test_abstains_on_out_of_scope_questions(store):
    for q in ["Who won the cricket world cup?", "recipe for biryani", "xyzzy plugh", "best movie this weekend", "weather in Pune tomorrow"]:
        assert store.grounded(q) == [], q
    in_scope = [q for q, _ in LABELLED]
    answered = sum(bool(store.grounded(q)) for q in in_scope)
    print(f"answered {answered}/{len(in_scope)} in-scope questions")
    assert answered / len(in_scope) >= 0.8
