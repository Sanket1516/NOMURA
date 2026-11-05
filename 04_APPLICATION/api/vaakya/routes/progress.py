import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import schemas as s
from ..auth import User_
from ..core.errors import ConflictError
from ..db import get_db
from ..ratelimit import limit
from ..features import Features, features, need
from ..services import dashboard, learning, notifications, twin
from ..services.score import history, score_view

router = APIRouter(prefix="/v1", tags=["score", "dashboard", "learning", "notifications"])
DB = Annotated[Session, Depends(get_db)]


@router.get("/dashboard", summary="Home dashboard view model")
def get_dashboard(user: User_, db: DB) -> dict:
    return dashboard.build(db, user.id)


@router.get("/score", summary="Financial Confidence Score: overall, six dimensions, actions, history")
def get_score(user: User_, db: DB) -> dict:
    v = score_view(db, user.id)
    if v is None:
        raise ConflictError("Complete the assessment to get your first score.", extra={"next": "/onboarding"})
    return v


@router.get("/score/history")
def get_history(user: User_, db: DB) -> list[dict]:
    return history(db, user.id, months=24)


@router.get("/twin", summary="Financial Life Graph from Neo4j: nodes, edges, accessible outline, insights")
def get_twin(user: User_, db: DB, f: Annotated[Features, Depends(features)]) -> dict:
    graph = need(f.graph, "The Financial Life Graph")
    graph.sync_user(user.id, twin.snapshot(db, user.id))  # read-your-writes for this user
    return twin.twin_view(graph, user.id)


@router.get("/learning/modules")
def modules(user: User_, db: DB) -> list[dict]:
    return learning.list_modules(db, user.id)


@router.get("/learning/modules/{module_id}")
def module(module_id: str, user: User_, db: DB) -> dict:
    return learning.get_module(db, user.id, module_id)


@router.post("/learning/modules/{module_id}/complete", dependencies=[limit("write")])
def complete(module_id: str, user: User_, db: DB) -> dict:
    return learning.complete_lesson(db, user.id, module_id)


@router.post("/learning/modules/{module_id}/quiz-attempts", dependencies=[limit("write")])
def quiz(module_id: str, body: s.QuizAttemptIn, user: User_, db: DB) -> dict:
    return learning.attempt_quiz(db, user.id, module_id, body.answers)


@router.get("/notifications")
def list_notifications(user: User_, db: DB, unread: bool = False) -> list[dict]:
    return notifications.list_(db, user.id, unread_only=unread)


@router.post("/notifications/{notif_id}/read")
def read(notif_id: uuid.UUID, user: User_, db: DB) -> dict:
    return notifications.mark_read(db, user.id, notif_id)
