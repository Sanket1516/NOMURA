from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import schemas as s
from ..models import Consent, Preferences, Profile, User
from .common import consents, emit


def profile_out(p: Profile) -> s.ProfileOut:
    return s.ProfileOut(user_id=p.user_id, display_name=p.display_name, persona=p.persona, birth_year=p.birth_year,
                        occupation=p.occupation, state=p.state, district=p.district, rural=p.rural,
                        preferred_lang=p.preferred_lang, income_type=p.income_type, literacy_level=p.literacy_level,  # type: ignore[arg-type]
                        dependents=p.dependents, disability=p.disability, attributes=p.attributes)


def me(db: Session, user_id: uuid.UUID) -> s.MeOut:
    user = db.get(User, user_id)
    assert user
    prof = db.get(Profile, user_id)
    c = consents(db, user_id)
    return s.MeOut(user_id=user_id, is_demo=user.is_demo, profile=profile_out(prof) if prof else None,
                   onboarding=s.OnboardingState(consent=bool(c.get("ai_processing") and c["ai_processing"].granted),
                                                profile=prof is not None, path=user.onboarding_path,
                                                assessment=user.assessment_completed_at is not None))


def upsert_profile(db: Session, user_id: uuid.UUID, body: s.ProfileIn) -> s.ProfileOut:
    p = db.get(Profile, user_id)
    data = body.model_dump()
    if p is None:
        p = Profile(user_id=user_id, **data)
        db.add(p)
    else:
        merged = {**p.attributes, **data.pop("attributes")}
        for k, v in data.items():
            setattr(p, k, v)
        p.attributes = merged
    db.flush()
    emit(db, user_id, "ProfileUpdated", {"income_type": p.income_type, "state": p.state})
    return profile_out(p)


def put_consents(db: Session, user_id: uuid.UUID, body: s.ConsentsIn) -> list[s.ConsentOut]:
    for g in body.grants:
        db.add(Consent(user_id=user_id, purpose=g.purpose, version=g.version, granted=g.granted, lang=g.lang))
    db.flush()
    emit(db, user_id, "ConsentChanged", {"purposes": [g.purpose for g in body.grants]}, project=False)
    return list_consents(db, user_id)


def list_consents(db: Session, user_id: uuid.UUID) -> list[s.ConsentOut]:
    return [s.ConsentOut(purpose=c.purpose, version=c.version, granted=c.granted, lang=c.lang, at=c.at) for c in consents(db, user_id).values()]  # type: ignore[arg-type]


def get_prefs(db: Session, user_id: uuid.UUID) -> dict:
    p = db.get(Preferences, user_id)
    return p.data if p else s.PreferencesIn().model_dump()


def put_prefs(db: Session, user_id: uuid.UUID, body: s.PreferencesIn) -> dict:
    p = db.get(Preferences, user_id)
    if p is None:
        db.add(Preferences(user_id=user_id, data=body.model_dump()))
    else:
        p.data = body.model_dump()
    return body.model_dump()


def set_path(db: Session, user_id: uuid.UUID, path: str) -> None:
    user = db.get(User, user_id)
    assert user
    user.onboarding_path = path
    emit(db, user_id, "OnboardingPathChosen", {"path": path}, project=False)


def lang_of(db: Session, user_id: uuid.UUID) -> str:
    p = db.scalar(select(Profile.preferred_lang).where(Profile.user_id == user_id))
    return p or "en"
