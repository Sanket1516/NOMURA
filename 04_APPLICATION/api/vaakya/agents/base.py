"""Agent contract. Every agent does specialised, mostly deterministic work and returns structured output.
The LLM, when present, only words or interprets; figures, verdicts and eligibility come from code (D-013)."""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol

from sqlalchemy.orm import Session

from ..ai.llm import LLMAdapter, RedactedText

AgentId = Literal["educator", "strategy", "sentinel", "connector"]


@dataclass
class AgentContext:
    db: Session
    user_id: uuid.UUID
    question: RedactedText            # redacted text: the only form agents ever see
    lang: str
    twin: dict[str, Any]              # graph context (bands), may be empty
    profile: dict[str, Any]
    llm: LLMAdapter | None
    knowledge: Any                    # KnowledgeStore or None
    prior: list[AgentOutput] = field(default_factory=list)   # outputs of earlier agents in this request (handoff)
    channel: Literal["text", "voice", "image"] = "text"


@dataclass
class Citation:
    id: str
    title: str
    publisher: str
    url: str
    status: str

    def as_dict(self) -> dict:
        return {"id": self.id, "title": self.title, "publisher": self.publisher, "url": self.url, "effective_date": None, "status": self.status}


@dataclass
class AgentOutput:
    agent: AgentId
    text: str
    citations: list[Citation] = field(default_factory=list)
    figures: dict[str, Any] = field(default_factory=dict)       # every number the text may contain must be here
    data: dict[str, Any] = field(default_factory=dict)          # structured result (plan, verdict, schemes)
    handoff: tuple[AgentId, str] | None = None
    llm_used: bool = False
    abstained: bool = False
    events: list[tuple[str, dict]] = field(default_factory=list)


class Agent(Protocol):
    name: AgentId

    def run(self, ctx: AgentContext) -> AgentOutput: ...
