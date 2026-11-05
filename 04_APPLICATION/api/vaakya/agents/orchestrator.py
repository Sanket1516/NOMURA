"""LangGraph orchestrator (FR-ORC-01..06, AGENT_ARCHITECTURE §2).

Graph: normalise → private_gate (redaction) → route → load_context → agent ⟲ handoff (≤ 2 hops) → safety → finalise.
Agents communicate only through the shared state. Untrusted text is redacted before any agent or model sees it.
Translation (IndicTrans2) is not available yet: answers are in English with `translated: false` (FR-LNG-02 partial).
"""
from __future__ import annotations

import time
import unicodedata
import uuid
from collections.abc import Iterator
from typing import Any, TypedDict

import structlog
from langgraph.graph import END, START, StateGraph
from sqlalchemy.orm import Session

from ..models import Conversation, DataflowAudit, Message, Profile
from ..services.common import emit, get_owned
from . import router, safety
from .base import Agent, AgentContext, AgentOutput

MAX_HOPS = 2
CLARIFY = ("I can help with four things: explaining money topics, planning savings and goals, checking messages for scams, "
           "and finding government schemes. Which one do you need?")
SAFE_FALLBACK = ("I could not give a reliable answer to that. I would rather say so than guess. "
                 "Try asking in a different way, or choose a topic: learning, planning, scam check or schemes.")


class State(TypedDict, total=False):
    request_id: str
    user_id: uuid.UUID
    lang: str
    raw: str
    forced: str | None
    channel: str
    question: Any
    names: list[str]
    categories: list[str]
    target: str
    route_method: str
    confidence: float
    twin: dict
    profile: dict
    outputs: list[AgentOutput]
    hops: int
    final: dict
    problems: list[str]


class Orchestrator:
    def __init__(self, agents: dict[str, Agent], graph=None, llm=None, knowledge=None):
        self.agents, self.graph_store, self.llm, self.knowledge = agents, graph, llm, knowledge
        self.log = structlog.get_logger()
        self.app = self._build()
        self._db: Session | None = None

    # ---------------- nodes ----------------
    def _normalise(self, s: State) -> State:
        text = "".join(ch for ch in unicodedata.normalize("NFC", s["raw"]) if ch.isprintable() or ch in "\n\t").strip()[:2000]
        return {"raw": text, "outputs": [], "hops": 0}

    def _private_gate(self, s: State) -> State:
        from ..ai.redaction import redact
        r = redact(s["raw"], known_names=s.get("names", []))
        return {"question": r.text, "categories": r.categories}

    def _route(self, s: State) -> State:
        if s.get("forced"):
            return {"target": s["forced"], "route_method": "user", "confidence": 1.0}
        target, conf, method = router.route(s["question"], self.llm, image=s.get("channel") == "image")
        return {"target": target, "route_method": method, "confidence": conf}

    def _load_context(self, s: State) -> State:
        twin = {}
        if self.graph_store is not None:
            try:
                twin = self.graph_store.context(s["user_id"])
            except Exception:  # noqa: BLE001 - answer without twin context rather than fail (graceful degradation)
                twin = {}
        p = self._db.get(Profile, s["user_id"]) if self._db else None
        prof = {"income_type": p.income_type, "literacy_level": p.literacy_level, "dependents": p.dependents, "state": p.state,
                "occupation": p.occupation, "lang": p.preferred_lang} if p else {}
        return {"twin": twin, "profile": prof}

    def _agent(self, s: State) -> State:
        agent = self.agents[s["target"]]
        ctx = AgentContext(db=self._db, user_id=s["user_id"], question=s["question"], lang=s["lang"], twin=s.get("twin", {}),  # type: ignore[arg-type]
                           profile=s.get("profile", {}), llm=self.llm, knowledge=self.knowledge, prior=list(s["outputs"]),
                           channel=s.get("channel", "text"))  # type: ignore[arg-type]
        out = agent.run(ctx)
        return {"outputs": s["outputs"] + [out], "hops": s["hops"] + 1}

    def _after_agent(self, s: State) -> str:
        last = s["outputs"][-1]
        done = {o.agent for o in s["outputs"]}
        if last.handoff and last.handoff[0] not in done and last.handoff[0] in self.agents and s["hops"] < MAX_HOPS:
            return "handoff"
        return "safety"

    def _handoff(self, s: State) -> State:
        return {"target": s["outputs"][-1].handoff[0]}  # type: ignore[index]

    def _safety(self, s: State) -> State:
        problems = []
        for out in s["outputs"]:
            ok, p = safety.review(out, s["question"], [c.title for c in out.citations] + [str(out.data)])
            if not ok:
                problems += [f"{out.agent}: {x}" for x in p]
        return {"problems": problems}

    def _finalise(self, s: State) -> State:
        outs = s["outputs"]
        if s.get("problems"):
            self.log.warning("safety_fallback", agent=",".join(o.agent for o in outs), count=len(s["problems"]))
            text, citations, data = SAFE_FALLBACK, [], {}
        else:
            text = "\n\n".join(o.text for o in outs)
            citations = [c.as_dict() for o in outs for c in o.citations]
            data = {o.agent: o.data for o in outs if o.data}
        if safety.needs_escalation(s["question"]):
            text += "\n\n" + safety.HELP
        seen, uniq = set(), []
        for c in citations:
            if c["id"] not in seen:
                seen.add(c["id"])
                uniq.append(c)
        return {"final": {"text": text, "agents": [o.agent for o in outs], "citations": uniq, "data": data,
                          "llm_used": any(o.llm_used for o in outs), "safety_problems": s.get("problems", []), "translated": False}}

    def _clarify(self, s: State) -> State:
        return {"final": {"text": CLARIFY, "agents": [], "citations": [], "data": {"choices": list(self.agents)}, "llm_used": False,
                          "safety_problems": [], "translated": False}}

    def _build(self):
        g = StateGraph(State)
        for name, fn in [("normalise", self._normalise), ("private_gate", self._private_gate), ("route", self._route),
                         ("load_context", self._load_context), ("agent", self._agent), ("handoff", self._handoff),
                         ("safety", self._safety), ("finalise", self._finalise), ("clarify", self._clarify)]:
            g.add_node(name, fn)
        g.add_edge(START, "normalise")
        g.add_edge("normalise", "private_gate")
        g.add_edge("private_gate", "route")
        g.add_conditional_edges("route", lambda s: "clarify" if s["target"] == "clarify" or s["target"] not in self.agents else "load_context",
                                {"clarify": "clarify", "load_context": "load_context"})
        g.add_edge("load_context", "agent")
        g.add_conditional_edges("agent", self._after_agent, {"handoff": "handoff", "safety": "safety"})
        g.add_edge("handoff", "agent")
        g.add_edge("safety", "finalise")
        g.add_edge("finalise", END)
        g.add_edge("clarify", END)
        return g.compile()

    # ---------------- entry points ----------------
    def answer(self, db: Session, user_id: uuid.UUID, message: str, *, lang: str = "en", agent: str | None = None,
               channel: str = "text", request_id: str = "") -> dict:
        self._db = db
        prof = db.get(Profile, user_id)
        t0 = time.perf_counter()
        state = self.app.invoke({"request_id": request_id, "user_id": user_id, "lang": lang, "raw": message, "forced": agent,
                                 "channel": channel, "names": [prof.display_name] if prof else []})
        final = state["final"]
        final["route"] = {"method": state.get("route_method"), "confidence": state.get("confidence")}
        final["latency_ms"] = int((time.perf_counter() - t0) * 1000)
        final["question_redacted"] = str(state.get("question", ""))
        final["categories_redacted"] = state.get("categories", [])
        for out in state.get("outputs", []):
            for ev, payload in out.events:
                emit(db, user_id, ev, payload)
        if final["agents"]:
            emit(db, user_id, "AnswerGiven", {"agent": final["agents"][0], "agents": final["agents"], "llm_used": final["llm_used"]})
        if final["llm_used"]:
            db.add(DataflowAudit(user_id=user_id, request_id=request_id or str(uuid.uuid4()), tier="reasoning",
                                 model=self.llm.cfg.tiers["reasoning"].model if self.llm else "none",
                                 categories=["question_redacted"] + [f"redacted:{c}" for c in final["categories_redacted"]] + ["profile_bands"]))
        return final

    def run(self, db: Session, user_id: uuid.UUID, body, request_id: str = "") -> Iterator[tuple[str, dict]]:
        """SSE event stream for /v1/chat: queued → agent → token(s) → citation(s) → final."""
        yield "queued", {"position": 1}
        conv = get_owned(db, Conversation, body.conversation_id, user_id) if body.conversation_id else None
        final = self.answer(db, user_id, body.message, lang=body.lang, agent=body.agent, request_id=request_id)
        if conv is None:
            conv = Conversation(user_id=user_id, title=final["question_redacted"][:80])
            db.add(conv)
            db.flush()
        db.add(Message(user_id=user_id, conversation_id=conv.id, role="user", content_redacted=final["question_redacted"]))
        db.add(Message(user_id=user_id, conversation_id=conv.id, role="assistant", content_redacted=final["text"],
                       agents=final["agents"], citations=final["citations"]))
        db.flush()
        for a in final["agents"]:
            yield "agent", {"agent": a}
        for i in range(0, len(final["text"]), 120):
            yield "token", {"text": final["text"][i:i + 120]}
        for c in final["citations"]:
            yield "citation", c
        yield "final", {"conversation_id": str(conv.id), "text": final["text"], "data": final["data"],
                        "ai": {"agents": final["agents"], "notice": safety.NOTICE, "citations": final["citations"], "request_id": request_id,
                               "llm_used": final["llm_used"], "translated": final["translated"]}}
