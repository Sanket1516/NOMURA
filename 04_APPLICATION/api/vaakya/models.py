"""PostgreSQL schema (DATABASE_ARCHITECTURE §2). Money is integer paise. Every user-owned row has user_id."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (BigInteger, Boolean, Date, DateTime, ForeignKey, Index, Integer, String, Text, UniqueConstraint,
                        func)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


def pk() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def owner() -> Mapped[uuid.UUID]:
    return mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)


def created() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now(), default=utcnow, nullable=False)


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = pk()
    keycloak_sub: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    onboarding_path: Mapped[str | None] = mapped_column(String(20))
    assessment_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created()


class Profile(Base):
    __tablename__ = "profiles"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(80), nullable=False)
    persona: Mapped[str | None] = mapped_column(String(20))
    birth_year: Mapped[int] = mapped_column(Integer, nullable=False)
    occupation: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    state: Mapped[str] = mapped_column(String(60), nullable=False)
    district: Mapped[str] = mapped_column(String(60), default="", nullable=False)
    rural: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    preferred_lang: Mapped[str] = mapped_column(String(2), default="en", nullable=False)
    income_type: Mapped[str] = mapped_column(String(10), nullable=False)
    literacy_level: Mapped[str] = mapped_column(String(10), default="standard", nullable=False)
    dependents: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    disability: Mapped[str | None] = mapped_column(String(20))
    # Scheme-relevant facts. Unknown stays NULL; the eligibility engine reports "unknown", never guesses.
    attributes: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)


class Preferences(Base):
    __tablename__ = "preferences"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    data: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)


class Consent(Base):
    """Append-only. The current state of a purpose is its latest row (FR-ONB-04)."""
    __tablename__ = "consents"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    purpose: Mapped[str] = mapped_column(String(30), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    granted: Mapped[bool] = mapped_column(Boolean, nullable=False)
    at: Mapped[datetime] = created()


class QuestionnaireResponse(Base):
    __tablename__ = "questionnaire_responses"
    __table_args__ = (UniqueConstraint("user_id", "question_id"),)
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    question_id: Mapped[str] = mapped_column(String(40), nullable=False)
    answer: Mapped[dict] = mapped_column(JSONB, nullable=False)
    source: Mapped[str] = mapped_column(String(10), default="typed", nullable=False)
    at: Mapped[datetime] = created()


class FinancialItem(Base):
    """Budget entries and standing facts: income, expense, saving, loan, asset, insurance (FR-ASM-03, budget management)."""
    __tablename__ = "financial_items"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    kind: Mapped[str] = mapped_column(String(12), nullable=False)
    label: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[str] = mapped_column(String(30), default="other", nullable=False)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    frequency: Mapped[str] = mapped_column(String(10), default="once", nullable=False)  # once | monthly | yearly
    on_date: Mapped[date] = mapped_column(Date, nullable=False)
    source: Mapped[str] = mapped_column(String(10), default="typed", nullable=False)  # typed | document | assessment | seed
    attributes: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = created()
    __table_args__ = (Index("ix_items_user_date", "user_id", "on_date"),)


class Goal(Base):
    __tablename__ = "goals"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    title: Mapped[str] = mapped_column(String(80), nullable=False)
    target_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    saved_paise: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    target_date: Mapped[date] = mapped_column(Date, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=2, nullable=False)
    status: Mapped[str] = mapped_column(String(12), default="active", nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = created()
    __table_args__ = (UniqueConstraint("user_id", "idempotency_key"),)


class Plan(Base):
    """Every figure with its inputs and formula, so "Why this?" can show it (FR-ASK-02)."""
    __tablename__ = "plans"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    goal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), index=True, nullable=False)
    calc_version: Mapped[str] = mapped_column(String(20), nullable=False)
    inputs: Mapped[dict] = mapped_column(JSONB, nullable=False)
    outputs: Mapped[dict] = mapped_column(JSONB, nullable=False)
    feasibility: Mapped[str] = mapped_column(String(30), nullable=False)
    created_at: Mapped[datetime] = created()


class GoalContribution(Base):
    __tablename__ = "goal_contributions"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    goal_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), index=True, nullable=False)
    amount_paise: Mapped[int] = mapped_column(BigInteger, nullable=False)
    on_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = created()


class Conversation(Base):
    __tablename__ = "conversations"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    title: Mapped[str] = mapped_column(String(120), default="", nullable=False)
    created_at: Mapped[datetime] = created()


class Message(Base):
    """Only redacted text is stored (FR-ASK-03, NFR-PRIV-01)."""
    __tablename__ = "messages"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(10), nullable=False)
    content_redacted: Mapped[str] = mapped_column(Text, nullable=False)
    agents: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    citations: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)
    created_at: Mapped[datetime] = created()


class Document(Base):
    __tablename__ = "documents"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    object_key: Mapped[str] = mapped_column(String(200), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    mime: Mapped[str] = mapped_column(String(40), nullable=False)
    size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="uploaded", nullable=False)
    created_at: Mapped[datetime] = created()


class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True, nullable=False)
    field: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[dict] = mapped_column(JSONB, nullable=False)
    confidence: Mapped[float | None] = mapped_column()
    confirmed_value: Mapped[dict | None] = mapped_column(JSONB)


class SentinelCheck(Base):
    __tablename__ = "sentinel_checks"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    input_kind: Mapped[str] = mapped_column(String(20), nullable=False)
    risk_level: Mapped[str] = mapped_column(String(10), nullable=False)
    risk_indicator: Mapped[int] = mapped_column(Integer, nullable=False)
    signals: Mapped[list] = mapped_column(JSONB, nullable=False)
    summary: Mapped[str] = mapped_column(String(200), nullable=False)
    weights_version: Mapped[str] = mapped_column(String(20), nullable=False)
    created_at: Mapped[datetime] = created()


class LearningProgress(Base):
    __tablename__ = "learning_progress"
    __table_args__ = (UniqueConstraint("user_id", "module_id"),)
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    module_id: Mapped[str] = mapped_column(String(40), nullable=False)
    progress_pct: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    module_id: Mapped[str] = mapped_column(String(40), nullable=False)
    correct: Mapped[int] = mapped_column(Integer, nullable=False)
    total: Mapped[int] = mapped_column(Integer, nullable=False)
    answers: Mapped[dict] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = created()


class ScoreSnapshot(Base):
    __tablename__ = "score_history"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    formula_version: Mapped[str] = mapped_column(String(10), nullable=False)
    overall: Mapped[int] = mapped_column(Integer, nullable=False)
    dimensions: Mapped[dict] = mapped_column(JSONB, nullable=False)
    reason: Mapped[str] = mapped_column(String(60), nullable=False)
    computed_at: Mapped[datetime] = created()


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    kind: Mapped[str] = mapped_column(String(12), nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    body: Mapped[str] = mapped_column(String(400), nullable=False)
    href: Mapped[str | None] = mapped_column(String(120))
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = created()


class Event(Base):
    """Append-only behaviour log (FR-IMP-01). The Confidence Engine reads only this and the tables above."""
    __tablename__ = "events"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    occurred_at: Mapped[datetime] = created()
    __table_args__ = (Index("ix_events_user_type", "user_id", "type"),)


class Outbox(Base):
    """Rows to project into Neo4j (D-010). Written in the same transaction as the change."""
    __tablename__ = "outbox"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True, nullable=False)
    topic: Mapped[str] = mapped_column(String(30), nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = created()
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class DataflowAudit(Base):
    """Which field categories reached the Reasoning Tier, never the values (FR-DL-04)."""
    __tablename__ = "dataflow_audit"
    id: Mapped[uuid.UUID] = pk()
    user_id: Mapped[uuid.UUID] = owner()
    request_id: Mapped[str] = mapped_column(String(40), nullable=False)
    tier: Mapped[str] = mapped_column(String(10), nullable=False)
    model: Mapped[str] = mapped_column(String(60), nullable=False)
    categories: Mapped[list] = mapped_column(JSONB, nullable=False)
    at: Mapped[datetime] = created()
