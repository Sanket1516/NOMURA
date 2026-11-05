"""SQLAlchemy engine and session. PostgreSQL is the system of record (D-010)."""
from __future__ import annotations

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from .config import get_settings


@lru_cache
def engine() -> Engine:
    return create_engine(get_settings().database_url, pool_pre_ping=True, pool_size=5, max_overflow=5)


@lru_cache
def session_factory() -> sessionmaker[Session]:
    return sessionmaker(engine(), expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """One transaction per request: commit on success, roll back on any error."""
    with session_factory()() as s:
        try:
            yield s
            s.commit()
        except Exception:
            s.rollback()
            raise
