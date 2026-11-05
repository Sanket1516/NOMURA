from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas as s
from ..auth import User_
from ..db import get_db
from ..features import Features, features
from ..ratelimit import limit
from ..services import assessment, data_rights, profile

router = APIRouter(prefix="/v1", tags=["me", "onboarding", "assessment"])
DB = Annotated[Session, Depends(get_db)]


@router.get("/me", response_model=s.MeOut, summary="Account summary and onboarding state")
def get_me(user: User_, db: DB):
    return profile.me(db, user.id)


@router.put("/me/profile", response_model=s.ProfileOut, dependencies=[limit("write")])
def put_profile(body: s.ProfileIn, user: User_, db: DB):
    return profile.upsert_profile(db, user.id, body)


@router.get("/me/consents", response_model=list[s.ConsentOut])
def get_consents(user: User_, db: DB):
    return profile.list_consents(db, user.id)


@router.put("/me/consents", response_model=list[s.ConsentOut], dependencies=[limit("write")])
def put_consents(body: s.ConsentsIn, user: User_, db: DB):
    return profile.put_consents(db, user.id, body)


@router.get("/me/preferences")
def get_preferences(user: User_, db: DB) -> dict:
    return profile.get_prefs(db, user.id)


@router.put("/me/preferences", dependencies=[limit("write")])
def put_preferences(body: s.PreferencesIn, user: User_, db: DB) -> dict:
    return profile.put_prefs(db, user.id, body)


@router.post("/me/export", summary="Everything VAAKYA stores about you, as JSON")
def export(user: User_, db: DB) -> dict:
    return data_rights.export(db, user.id)


@router.delete("/me", status_code=202, summary="Erase your account and data from every store")
def erase(user: User_, db: DB, f: Annotated[Features, Depends(features)]) -> dict:
    return data_rights.erase(db, user.id, vault=f.vault, graph=f.graph)


@router.post("/onboarding/path", status_code=204, dependencies=[limit("write")])
def onboarding_path(body: s.PathIn, user: User_, db: DB) -> None:
    profile.set_path(db, user.id, body.path)


@router.get("/assessment/next", response_model=s.NextQuestion)
def next_question(user: User_, db: DB):
    return assessment.next_question(db, user.id)


@router.post("/assessment/answers", response_model=s.NextQuestion, dependencies=[limit("write")])
def answers(body: s.AnswersIn, user: User_, db: DB):
    return assessment.save_answers(db, user.id, body)


@router.post("/assessment/complete", summary="Finish the assessment: builds financial items and the baseline score")
def complete(user: User_, db: DB) -> dict:
    return assessment.complete(db, user.id)
