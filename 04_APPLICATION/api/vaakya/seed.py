"""Database initialisation and seed data. Run: python -m vaakya.seed [schemes|demo|all]

* schemes: upsert the catalogue from data/schemes.json. Never overwrites a human verification record.
* demo:    four SYNTHETIC persona accounts (is_demo = true) built through the same services real users use,
           so every number is computed, not typed in. Their Keycloak ids are fixed so the realm file can match them.
"""
from __future__ import annotations

import json
import sys
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import schemas as s
from .db import session_factory
from .models import Scheme, ScoreSnapshot, User
from .services import assessment, goals, learning, profile
from .services.common import today_ist

DEMO_SUBS = {  # must match infra/keycloak realm user ids
    "priya": "7f3d2a10-0001-4000-8000-00000000a001",
    "rajesh": "7f3d2a10-0002-4000-8000-00000000a002",
    "kisan": "7f3d2a10-0003-4000-8000-00000000a003",
    "divya": "7f3d2a10-0004-4000-8000-00000000a004",
}


def load_schemes(db: Session) -> int:
    data = json.loads((Path(__file__).parent / "data" / "schemes.json").read_text())
    n = 0
    for sc in data["schemes"]:
        row = db.get(Scheme, sc["id"])
        if row is None:
            db.add(Scheme(id=sc["id"], data=sc, rules_version=sc["rules_version"], verification="unverified_draft",
                          review_due_at=today_ist() + timedelta(days=90)))
        else:
            row.data, row.rules_version = sc, sc["rules_version"]  # keep verified_by / last_verified_at
        n += 1
    return n


def _p(rupees: int) -> dict:
    return {"paise": rupees * 100}


PERSONAS = {
    "priya": {
        "profile": dict(display_name="Priya", persona="priya", birth_year=1994, occupation="School teacher", state="Maharashtra", district="Thane",
                        preferred_lang="mr", income_type="salaried", dependents=2,
                        attributes={"has_bank_account": True, "income_tax_payer": False}),
        "income": (35000, 35000), "expenses": 26000, "emi": 0, "savings": 30000, "risk": "low", "goal": "emergency_fund",
        "goals": [("emergency_fund", "Emergency fund (6 months)", 156000, 700), ("education", "Children's education", 500000, 3500)],
        "discipline": [100, 100, 60, 100, 100], "lessons": {"emergency-fund": [0, 1, 0], "smart-budgeting": [1, 0, 1], "digital-safety": [1, 1, 0, 1]},
    },
    "rajesh": {
        "profile": dict(display_name="Rajesh", persona="rajesh", birth_year=2002, occupation="Delivery partner (gig)", state="Maharashtra", district="Mumbai",
                        preferred_lang="hi", income_type="variable", dependents=0, attributes={"has_bank_account": True, "income_tax_payer": False}),
        "income": (15000, 40000), "expenses": 19000, "emi": 1600, "savings": 6000, "risk": "medium", "goal": "emergency_fund",
        "goals": [("emergency_fund", "Emergency fund (6 months)", 114000, 1000), ("equipment", "Own e-bike", 65000, 750)],
        "discipline": [100, 40, 100, 30, 100], "lessons": {"emergency-fund": [0, 0, 1]},
    },
    "kisan": {
        "profile": dict(display_name="Kisan", persona="kisan", birth_year=1981, occupation="Farmer, 3 acres", state="Karnataka", district="Dharwad", rural=True,
                        preferred_lang="kn", income_type="seasonal", literacy_level="low", dependents=3,
                        attributes={"has_bank_account": True, "owns_farmland": True, "is_cultivator": True, "income_tax_payer": False,
                                    "institutional_landholder": False, "constitutional_post_holder": False, "govt_employee_excluded": False,
                                    "pensioner_10k_plus": False, "practising_professional": False}),
        "income": (5000, 25000), "expenses": 9000, "emi": 2500, "savings": 18000, "risk": "low", "goal": "other",
        "goals": [("other", "Next-season seeds and fertiliser", 35000, 180), ("education", "Daughter's college", 300000, 2400)],
        "discipline": [0, 0, 100, 0, 100], "lessons": {"emergency-fund": [0, 1, 0]},
    },
    "divya": {
        "profile": dict(display_name="Divya", persona="divya", birth_year=1998, occupation="Content writer", state="Maharashtra", district="Pune",
                        preferred_lang="en", income_type="salaried", dependents=0, disability="visual",
                        attributes={"has_bank_account": True, "income_tax_payer": False, "has_disability": True}),
        "income": (25000, 25000), "expenses": 17000, "emi": 0, "savings": 35000, "risk": "medium", "goal": "emergency_fund",
        "goals": [("emergency_fund", "Emergency fund (3 months)", 51000, 360), ("equipment", "Braille display", 90000, 900)],
        "discipline": [100, 100, 100, 100, 100], "lessons": {"emergency-fund": [0, 1, 0], "smart-budgeting": [1, 0, 1], "digital-safety": [1, 1, 0, 1],
                                             "insurance-101": [1, 0, 0]},
    },
}


def _phase_done(db: Session, uid: uuid.UUID, when: datetime, seen: set) -> None:
    """Close a seeding phase: recompute, then date every snapshot made in this phase to `when` (history is real, only dated)."""
    from .services.score import recompute
    recompute(db, uid, reason="seed_phase")
    new = [x for x in db.scalars(select(ScoreSnapshot).where(ScoreSnapshot.user_id == uid).order_by(ScoreSnapshot.computed_at, ScoreSnapshot.id))
           if x.id not in seen]
    for i, snap in enumerate(new):  # keep creation order: the phase's final state is its last snapshot
        snap.computed_at = when + timedelta(seconds=i)
        seen.add(snap.id)


def seed_persona(db: Session, key: str) -> uuid.UUID:
    cfg = PERSONAS[key]
    sub = DEMO_SUBS[key]
    if db.scalar(select(User.id).where(User.keycloak_sub == sub)):
        return db.scalar(select(User.id).where(User.keycloak_sub == sub))  # idempotent: already seeded
    user = User(keycloak_sub=sub, is_demo=True, onboarding_path="questionnaire")
    db.add(user)
    db.flush()
    uid = user.id
    today = today_ist()
    start = datetime.now(timezone.utc) - timedelta(days=150)
    profile.put_consents(db, uid, s.ConsentsIn(grants=[s.ConsentGrant(purpose=p, version="2026-11", granted=True)
                                                       for p in ("ai_processing", "document_storage", "voice_processing")]))
    profile.upsert_profile(db, uid, s.ProfileIn(**cfg["profile"]))
    lo, hi = cfg["income"]
    assessment.save_answers(db, uid, s.AnswersIn(answers=[
        s.Answer(question_id="monthly_income", value={"min_paise": lo * 100, "max_paise": hi * 100}),
        s.Answer(question_id="monthly_expenses", value={"paise": cfg["expenses"] * 100}),
        s.Answer(question_id="loan_emi", value={"paise": cfg["emi"] * 100}),
        s.Answer(question_id="savings", value={"paise": cfg["savings"] * 100}),
        s.Answer(question_id="risk_preference", value=cfg["risk"]),
        s.Answer(question_id="primary_goal", value=cfg["goal"]),
    ]))
    assessment.complete(db, uid)
    seen: set = set()
    _phase_done(db, uid, start, seen)
    # Goals with plans, then five months of saving history.
    created = []
    for gtype, title, target, days in cfg["goals"]:
        g, _ = goals.create_goal(db, uid, s.GoalIn(type=gtype, title=title, target=_p(target), target_date=today + timedelta(days=days),
                                                   priority=len(created) + 1), idem=f"seed-{key}-{gtype}")
        created.append(g)
    # Five months of saving that follows each goal's computed plan; the persona's `discipline` sets which months fall short.
    for back in range(5, 0, -1):
        y, m = divmod(today.year * 12 + today.month - 1 - back, 12)
        d = date(y, m + 1, 3)
        share = cfg["discipline"][5 - back]
        for g in created:
            amount = g.monthly_plan.paise * share // 100
            if amount > 0:
                goals.contribute(db, uid, g.id, s.ContributionIn(amount={"paise": amount}, on_date=d))
    _phase_done(db, uid, start + timedelta(days=60), seen)
    for i, (mid, answers) in enumerate(cfg["lessons"].items()):
        learning.complete_lesson(db, uid, mid)
        learning.attempt_quiz(db, uid, mid, {f"q{j + 1}": a for j, a in enumerate(answers)})
        _phase_done(db, uid, start + timedelta(days=90 + 15 * i), seen)
    from .services.score import recompute
    recompute(db, uid, reason="seed_current")
    from .services.notifications import notify
    notify(db, uid, "review", "Welcome to the demo account", "This account holds synthetic data for demonstration.", "/home")
    return uid


def main(argv: list[str]) -> None:
    what = argv[1] if len(argv) > 1 else "all"
    with session_factory()() as db:
        if what in ("schemes", "all"):
            print("schemes:", load_schemes(db))
        if what in ("demo", "all"):
            for k in PERSONAS:
                print("demo:", k, seed_persona(db, k))
        db.commit()


if __name__ == "__main__":
    main(sys.argv)
