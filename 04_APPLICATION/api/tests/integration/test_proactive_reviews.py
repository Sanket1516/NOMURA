from datetime import date, timedelta


def _goal(api):
    return api.post("/v1/goals", json={"type": "emergency_fund", "title": "Emergency fund", "target": {"paise": 7_800_000},
                                       "target_date": (date.today() + timedelta(days=700)).isoformat()}).json()


def test_goal_drift_nudge_once_and_one_per_day(app, onboarded):
    from sqlalchemy import select

    from vaakya.db import session_factory
    from vaakya.models import User
    from vaakya.services import proactive
    _goal(onboarded)
    later = date.today() + timedelta(days=70)  # two plan months pass with no saving
    with session_factory()() as db:
        uid = db.scalar(select(User.id))
        assert [c["key"].split(":")[0] for c in proactive.candidates(db, uid, later)] == ["goal_drift"]
        n = proactive.run_for_user(db, uid, later)
        assert n and n["agent"] == "strategy" and "behind" in n["body"]
        assert proactive.run_for_user(db, uid, later) is None                 # one per day
        assert proactive.run_for_user(db, uid, later + timedelta(days=1)) is None  # same nudge never twice
        db.commit()
    titles = [x["title"] for x in onboarded.get("/v1/notifications").json()]
    assert any("behind plan" in t for t in titles)


def test_on_track_goal_gets_no_nudge(app, onboarded):
    from sqlalchemy import select

    from vaakya.db import session_factory
    from vaakya.models import User
    from vaakya.services import proactive
    _goal(onboarded)
    with session_factory()() as db:
        uid = db.scalar(select(User.id))
        assert proactive.candidates(db, uid, date.today()) == []


def test_newly_eligible_scheme_nudge(app, onboarded):
    from sqlalchemy import select

    from vaakya.db import session_factory
    from vaakya.models import User
    from vaakya.seed import load_schemes
    from vaakya.services import proactive
    from vaakya.services.connector import ConnectorService

    from ..conftest import PROFILE
    onboarded.put("/v1/me/profile", json={**PROFILE, "attributes": {"has_bank_account": True, "income_tax_payer": False}})
    with session_factory()() as db:
        load_schemes(db)
        uid = db.scalar(select(User.id))
        ConnectorService().evaluate_all(db, uid)
        n = proactive.run_for_user(db, uid, date.today() + timedelta(days=2))
        assert n and n["agent"] == "connector" and n["key"].startswith("newly_eligible:")
        db.rollback()


def test_monthly_review_reflects_activity(onboarded):
    month = date.today().strftime("%Y-%m")
    g = _goal(onboarded)
    onboarded.post(f"/v1/goals/{g['id']}/contributions", json={"amount": {"paise": 500_000}, "on_date": date.today().isoformat()})
    onboarded.post("/v1/learning/modules/digital-safety/quiz-attempts", json={"answers": {"q1": 1, "q2": 1, "q3": 0, "q4": 1}})
    r = onboarded.get(f"/v1/reviews/{month}").json()
    assert r["has_activity"] and r["saved"]["display"] == "₹5,000"
    assert any("Digital Safety" in a for a in r["achievements"]) and r["score"]["to"] >= r["score"]["from"]
    assert month in onboarded.get("/v1/reviews").json()
    assert onboarded.get("/v1/reviews/2026-13").status_code == 422
    empty = onboarded.get("/v1/reviews/2020-01").json()
    assert empty["has_activity"] is False and empty["achievements"] == []
