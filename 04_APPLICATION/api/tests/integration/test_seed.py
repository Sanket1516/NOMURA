from sqlalchemy import func, select


def test_seed_is_idempotent_consistent_and_flagged_demo(app):
    from vaakya import seed
    from vaakya.db import session_factory
    from vaakya.models import Scheme, User
    from vaakya.services.dashboard import build
    with session_factory()() as db:
        assert seed.load_schemes(db) == 10
        ids = [seed.seed_persona(db, k) for k in seed.PERSONAS]
        again = [seed.seed_persona(db, k) for k in seed.PERSONAS]
        db.commit()
        assert ids == again and db.scalar(select(func.count()).select_from(User)) == 4
        assert all(u.is_demo for u in db.scalars(select(User)))
        sc = db.get(Scheme, "pm-kisan")
        assert sc.verification == "unverified_draft" and sc.data["benefit"]["amount_paise_per_year"] == 600000
        for uid in ids:
            d = build(db, uid)
            dims = [x["score"] for x in d["score"]["dimensions"]]
            assert d["score"]["overall"] == round(sum(dims) / 6) or abs(d["score"]["overall"] - sum(dims) / 6) <= 0.5
            assert len(d["score"]["history"]) >= 3 and d["goals"]


def test_scheme_load_keeps_human_verification(app):
    from datetime import date

    from vaakya import seed
    from vaakya.db import session_factory
    from vaakya.models import Scheme
    with session_factory()() as db:
        seed.load_schemes(db)
        row = db.get(Scheme, "pmjjby")
        row.verification, row.verified_by, row.last_verified_at = "verified", "reviewer@example", date(2026, 11, 1)
        db.flush()
        seed.load_schemes(db)
        row = db.get(Scheme, "pmjjby")
        assert (row.verification, row.verified_by) == ("verified", "reviewer@example")
        db.rollback()
