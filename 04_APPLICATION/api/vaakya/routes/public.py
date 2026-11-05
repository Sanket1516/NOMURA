"""Public lesson content for reading and offline saving. No sign-in, and nothing personal in any response:
no progress, no quiz answers, no user data. The same bytes go to everyone, which is what makes them safe to cache in the browser."""
from fastapi import APIRouter

from ..services import learning

router = APIRouter(prefix="/v1/public", tags=["public"])


@router.get("/lessons", summary="Lesson list (content only, no progress)")
def lessons() -> list[dict]:
    c = learning.catalogue()
    return [{"id": m["id"], "title": m["title"], "topic": m["topic"], "minutes": m["minutes"], "content_status": c["status"]} for m in c["modules"]]


@router.get("/lessons/{module_id}", summary="One lesson's text (no quiz, no progress)")
def lesson(module_id: str) -> dict:
    m = learning._module(module_id)  # noqa: SLF001 - raises NotFoundError for an unknown id
    return {**{k: m[k] for k in ("id", "title", "topic", "minutes", "sections")}, "content_status": learning.catalogue()["status"]}
