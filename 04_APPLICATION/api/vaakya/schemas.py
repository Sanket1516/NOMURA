"""Request and response models (API_DESIGN.md). Inputs forbid unknown fields; text is length-limited and NFC-normalised."""
from __future__ import annotations

import unicodedata
from datetime import date, datetime
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field

Lang = Literal["en", "hi", "mr", "kn"]
IncomeType = Literal["salaried", "variable", "seasonal"]
Paise = Annotated[int, Field(ge=0, le=10**13, description="Integer paise (₹1 = 100)")]
_CTRL = {c for c in map(chr, range(32)) if c not in "\n\t"}


def _clean(v: str) -> str:
    return "".join(ch for ch in unicodedata.normalize("NFC", v) if ch not in _CTRL).strip()


def Text(max_len: int, min_len: int = 0):  # noqa: N802
    return Annotated[str, AfterValidator(_clean), Field(min_length=min_len, max_length=max_len)]


class In(BaseModel):
    model_config = ConfigDict(extra="forbid")


class MoneyIn(In):
    paise: Paise


class Money(BaseModel):
    paise: int
    display: str
    spoken: str


# ---------- Me, profile, consent ----------
class ProfileIn(In):
    display_name: Text(80, 1)
    birth_year: int = Field(ge=1920, le=2010)
    occupation: Text(80) = ""
    state: Text(60, 2)
    district: Text(60) = ""
    rural: bool = False
    preferred_lang: Lang = "en"
    income_type: IncomeType
    literacy_level: Literal["standard", "low"] = "standard"
    dependents: int = Field(0, ge=0, le=20)
    disability: Literal["visual", "hearing", "locomotor", "other"] | None = None
    persona: Literal["priya", "rajesh", "kisan", "divya"] | None = None
    attributes: dict[str, bool | int | str | None] = Field(default_factory=dict, max_length=30,
                                                          description="Scheme-relevant facts, e.g. owns_farmland, income_tax_payer")


class ProfileOut(BaseModel):
    user_id: UUID
    display_name: str
    persona: str | None
    birth_year: int
    occupation: str
    state: str
    district: str
    rural: bool
    preferred_lang: Lang
    income_type: IncomeType
    literacy_level: str
    dependents: int
    disability: str | None
    attributes: dict[str, Any]


class OnboardingState(BaseModel):
    consent: bool
    profile: bool
    path: str | None
    assessment: bool


class MeOut(BaseModel):
    user_id: UUID
    is_demo: bool
    onboarding: OnboardingState
    profile: ProfileOut | None


Purpose = Literal["ai_processing", "document_storage", "voice_processing", "email"]


class ConsentGrant(In):
    purpose: Purpose
    version: Text(20, 1)
    granted: bool


class ConsentsIn(In):
    grants: list[ConsentGrant] = Field(min_length=1, max_length=4)


class ConsentOut(BaseModel):
    purpose: Purpose
    version: str
    granted: bool
    at: datetime


class PreferencesIn(In):
    textScale: float = Field(1, ge=1, le=1.5)
    contrast: Literal["normal", "high"] = "normal"
    theme: Literal["system", "light", "dark"] = "system"
    reducedMotion: bool = False
    voiceFirst: bool = False
    lowLiteracy: bool = False


class PathIn(In):
    path: Literal["documents", "questionnaire"]


# ---------- Assessment ----------
class Answer(In):
    question_id: Literal["monthly_income", "monthly_expenses", "loan_emi", "savings", "risk_preference", "primary_goal",
                         "income_history", "harvest"]
    value: dict[str, int] | str | list[int]
    source: Literal["typed", "voice", "document"] = "typed"


class AnswersIn(In):
    answers: list[Answer] = Field(min_length=1, max_length=10)


class Question(BaseModel):
    id: str
    type: str
    prompt: str
    why: str
    options: list[dict[str, str]] | None = None
    voice_allowed: bool = True


class NextQuestion(BaseModel):
    step: int
    total_steps: int
    question: Question | None
    done: bool


# ---------- Financial items and budget ----------
ItemKind = Literal["income", "expense", "saving", "loan", "asset", "insurance"]


class ItemIn(In):
    kind: ItemKind
    label: Text(80, 1)
    category: Text(30) = "other"
    amount: MoneyIn
    frequency: Literal["once", "monthly", "yearly"] = "once"
    on_date: date


class ItemPatch(In):
    label: Text(80, 1) | None = None
    category: Text(30) | None = None
    amount: MoneyIn | None = None
    on_date: date | None = None


class ItemOut(BaseModel):
    id: UUID
    kind: str
    label: str
    category: str
    amount: Money
    frequency: str
    on_date: date
    source: str


class BudgetOut(BaseModel):
    month: str
    income: Money
    expenses: Money
    saving: Money
    loan_payments: Money
    left: Money
    by_category: list[dict[str, Any]]
    saving_rule: dict[str, Any] | None


# ---------- Goals and planning ----------
GoalType = Literal["emergency_fund", "education", "home", "retirement", "equipment", "other"]


class GoalIn(In):
    type: GoalType
    title: Text(80, 1)
    target: MoneyIn
    target_date: date
    priority: int = Field(2, ge=1, le=5)
    saved: MoneyIn | None = None


class GoalPatch(In):
    title: Text(80, 1) | None = None
    target: MoneyIn | None = None
    target_date: date | None = None
    priority: int | None = Field(None, ge=1, le=5)
    status: Literal["active", "paused", "done"] | None = None


class ContributionIn(In):
    amount: MoneyIn
    on_date: date


class GoalOut(BaseModel):
    id: UUID
    type: str
    title: str
    target: Money
    saved: Money
    target_date: date
    monthly_plan: Money
    on_track: bool
    progress_pct: int
    status: str
    priority: int


class PlanOut(BaseModel):
    plan_id: UUID
    goal_id: UUID
    feasibility: str
    calc_version: str
    figures: dict[str, Any]
    inputs: dict[str, Any]
    formula: str
    assumptions: list[str]
    limitations: list[str]
    next_steps: list[str]


class EmergencyFundIn(In):
    monthly_expenses: MoneyIn
    income_type: IncomeType


class IrregularIn(In):
    monthly_incomes: list[MoneyIn] = Field(min_length=2, max_length=24)
    monthly_expenses: MoneyIn
    rate_pct: int | None = Field(None, ge=1, le=50)


class SeasonalIn(In):
    harvest_income: MoneyIn
    months_until_next_harvest: int = Field(ge=1, le=12)
    monthly_expenses: MoneyIn
    next_season_input_cost: MoneyIn


class LoanIn(In):
    principal: MoneyIn
    emi: MoneyIn
    months: int = Field(ge=1, le=480)
    upfront_fees: MoneyIn | None = None


class SipIn(In):
    monthly: MoneyIn
    months: int = Field(ge=1, le=600)
    assumed_annual_return_pct: float = Field(ge=0, le=20)


class CalcOut(BaseModel):
    figures: dict[str, Any]
    inputs: dict[str, Any]
    formula: str
    assumptions: list[str]
    limitations: list[str]
    version: str


# ---------- Learning ----------
class QuizAttemptIn(In):
    answers: dict[str, int] = Field(min_length=1, max_length=20)


# ---------- Chat, sentinel, voice ----------
class ChatIn(In):
    conversation_id: UUID | None = None
    message: Text(2000, 1)
    lang: Lang = "en"
    agent: Literal["educator", "strategy", "sentinel", "connector"] | None = None
    context: dict[str, str] = Field(default_factory=dict, max_length=5)


class SentinelTextIn(In):
    text: Text(5000, 1)
    kind: Literal["sms", "whatsapp", "ad", "loan_offer", "investment_tip", "url", "email", "other"] = "other"
