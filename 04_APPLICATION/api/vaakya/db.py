"""SQLAlchemy engine and session. PostgreSQL is the system of record (D-010)."""
from __future__ import annotations

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings


@lru_cache
def engine() -> Engine:
    """Request traffic: the restricted application role. Row Level Security applies (migration 0003)."""
    return create_engine(get_settings().database_url, pool_pre_ping=True, pool_size=5, max_overflow=5)


@lru_cache
def admin_engine() -> Engine:
    """Owner role for migrations, seeding, backups and cross-user jobs (worker)."""
    s = get_settings()
    return create_engine(s.admin_database_url or s.database_url, pool_pre_ping=True, pool_size=2, max_overflow=2)


@lru_cache
def session_factory() -> sessionmaker[Session]:
    return sessionmaker(engine(), expire_on_commit=False)


@lru_cache
def admin_session_factory() -> sessionmaker[Session]:
    return sessionmaker(admin_engine(), expire_on_commit=False)


def scope_to_user(db: Session, user_id) -> None:
    """Tell PostgreSQL whose rows this transaction may see (RLS policies read vaakya.user_id). Transaction-local."""
    db.execute(text("SELECT set_config('vaakya.user_id', :uid, true)"), {"uid": str(user_id)})


def get_db() -> Iterator[Session]:
    """One transaction per request: commit on success, roll back on any error."""
    with session_factory()() as s:
        try:
            yield s
            s.commit()
        except Exception:
            s.rollback()
            raise
