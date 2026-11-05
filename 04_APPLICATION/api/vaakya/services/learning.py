"""Learning Academy (FR-EDU-04, -05, -08). Content is draft until reviewed (FR-EDU-07)."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..core.errors import DomainValidationError, NotFoundError
from ..models import LearningProgress, QuizAttempt
from .common import emit


@lru_cache
def catalogue() -> dict:
    return json.loads((Path(__file__).parent.parent / "data" / "learning.json").read_text())


def _module(module_id: str) -> dict:
    for m in catalogue()["modules"]:
        if m["id"] == module_id:
            return m
    raise NotFoundError("No such lesson")


def progress_map(db: Session, user_id: uuid.UUID) -> dict[str, int]:
    return {p.module_id: p.progress_pct for p in db.scalars(select(LearningProgress).where(LearningProgress.user_id == user_id))}


def list_modules(db: Session, user_id: uuid.UUID) -> list[dict]:
    prog = progress_map(db, user_id)
    return [{"id": m["id"], "title": m["title"], "topic": m["topic"], "minutes": m["minutes"], "progress_pct": prog.get(m["id"], 0),
             "content_status": catalogue()["status"]} for m in catalogue()["modules"]]


def get_module(db: Session, user_id: uuid.UUID, module_id: str) -> dict:
    m = _module(module_id)
    return {**{k: m[k] for k in ("id", "title", "topic", "minutes", "sections")},
            "quiz": [{"id": q["id"], "q": q["q"], "options": q["options"]} for q in m["quiz"]],  # answers never leave the server
            "progress_pct": progress_map(db, user_id).get(module_id, 0), "content_status": catalogue()["status"]}


def _set_progress(db: Session, user_id: uuid.UUID, module_id: str, pct: int) -> None:
    row = db.scalar(select(LearningProgress).where(LearningProgress.user_id == user_id, LearningProgress.module_id == module_id))
    if row is None:
        row = LearningProgress(user_id=user_id, module_id=module_id, progress_pct=0)
        db.add(row)
    row.progress_pct = max(row.progress_pct, pct)
    if row.progress_pct >= 100 and row.completed_at is None:
        row.completed_at = datetime.now(timezone.utc)


def complete_lesson(db: Session, user_id: uuid.UUID, module_id: str) -> dict:
    from .score import recompute
    _module(module_id)
    _set_progress(db, user_id, module_id, 60)  # reading done; the quiz completes the module
    db.flush()
    emit(db, user_id, "LessonCompleted", {"module_id": module_id, "agent": "educator"})
    recompute(db, user_id, reason="lesson_completed")
    return {"module_id": module_id, "progress_pct": progress_map(db, user_id)[module_id]}


def attempt_quiz(db: Session, user_id: uuid.UUID, module_id: str, answers: dict[str, int]) -> dict:
    from .score import recompute
    m = _module(module_id)
    key = {q["id"]: q for q in m["quiz"]}
    unknown = set(answers) - set(key)
    if unknown:
        raise DomainValidationError(f"Unknown question ids: {sorted(unknown)}")
    if set(answers) != set(key):
        raise DomainValidationError("Answer every question")
    for qid, a in answers.items():
        if not 0 <= a < len(key[qid]["options"]):
            raise DomainValidationError(f"Answer for {qid} is out of range")
    results = {qid: answers[qid] == q["answer"] for qid, q in key.items()}
    correct = sum(results.values())
    db.add(QuizAttempt(user_id=user_id, module_id=module_id, correct=correct, total=len(key), answers=answers))
    _set_progress(db, user_id, module_id, 100)
    db.flush()
    emit(db, user_id, "QuizAnswered", {"module_id": module_id, "correct": correct, "total": len(key), "agent": "educator"})
    snap = recompute(db, user_id, reason="quiz_answered")
    gaps = [key[q]["q"] for q, ok in results.items() if not ok]
    return {"module_id": module_id, "correct": correct, "total": len(key), "results": results, "gaps": gaps,
            "explanations": {q: key[q]["options"][key[q]["answer"]] for q, ok in results.items() if not ok}, "score_overall": snap.overall}
