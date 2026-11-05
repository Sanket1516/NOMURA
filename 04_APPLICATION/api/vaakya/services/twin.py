"""Financial Life Graph projection and views (FR-FLG-02..07, -10).

snapshot() reads PostgreSQL and produces the subgraph for one user; relay() applies pending outbox rows.
Graph values are bands, never exact amounts, because the twin is passed to agents as context (DATABASE_ARCHITECTURE §3).
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from ..models import Event, FinancialItem, Goal, LearningProgress, Outbox, Profile, SentinelCheck
from .assessment import monthly_figures
from .common import today_ist
from .goals import goal_out
from .learning import catalogue
from .score import score_view

AGENT_FOR = {"literacy": "educator", "safety": "sentinel", "goal_planning": "strategy", "scheme_awareness": "connector",
             "savings_discipline": "strategy", "debt_awareness": "strategy"}
RISK_FOR_DIM = {"safety": "scam_exposure", "debt_awareness": "high_emi", "savings_discipline": "no_emergency_fund"}


def band(paise: int) -> str:
    r = paise // 100
    for limit, label in ((5000, "<5k"), (15000, "5-15k"), (30000, "15-30k"), (50000, "30-50k"), (100000, "50k-1L")):
        if r < limit:
            return label
    return "1L+"


def risks(db: Session, user_id: uuid.UUID, prof: Profile | None, f: dict[str, int]) -> list[dict]:
    """Deterministic risk rules (FR-FLG-06 Analyze)."""
    out = []
    goals = db.scalars(select(Goal).where(Goal.user_id == user_id, Goal.type == "emergency_fund", Goal.status != "deleted")).all()
    reserve = f["savings"] + sum(g.saved_paise for g in goals)
    if f["expenses"] and reserve < f["expenses"]:
        out.append({"kind": "no_emergency_fund", "severity": "high", "detail": "Less than one month of expenses saved"})
    elif f["expenses"] and reserve < 3 * f["expenses"]:
        out.append({"kind": "no_emergency_fund", "severity": "medium", "detail": "Less than three months of expenses saved"})
    if f["income"] and f["emi"] * 100 >= 40 * f["income"]:
        out.append({"kind": "high_emi", "severity": "high", "detail": "EMIs are 40% or more of income"})
    if prof and prof.income_type in ("variable", "seasonal"):
        out.append({"kind": "income_volatility", "severity": "medium", "detail": f"{prof.income_type.capitalize()} income"})
    if prof and prof.dependents > 0:
        insured = db.scalar(select(FinancialItem.id).where(FinancialItem.user_id == user_id, FinancialItem.kind == "insurance").limit(1))
        if insured is None:
            out.append({"kind": "uninsured_dependants", "severity": "high", "detail": f"{prof.dependents} dependants, no insurance recorded"})
    if db.scalar(select(SentinelCheck.id).where(SentinelCheck.user_id == user_id, SentinelCheck.risk_level.in_(["high", "critical"])).limit(1)):
        out.append({"kind": "scam_exposure", "severity": "medium", "detail": "Received a high-risk scam message"})
    return out


def snapshot(db: Session, user_id: uuid.UUID) -> dict:
    prof = db.get(Profile, user_id)
    f = monthly_figures(db, user_id)
    today = today_ist()
    user = {"income_type": prof.income_type if prof else None, "state": prof.state if prof else None, "rural": prof.rural if prof else None,
            "age_band": f"{(today.year - prof.birth_year) // 10 * 10}s" if prof else None, "dependents": prof.dependents if prof else 0,
            "literacy_level": prof.literacy_level if prof else None, "lang": prof.preferred_lang if prof else None}
    incomes = [{"id": f"{user_id}:income", "kind": prof.income_type if prof else "unknown", "band": band(f["income"]), "frequency": "monthly"}] if f["income"] else []
    exp_items = db.scalars(select(FinancialItem).where(FinancialItem.user_id == user_id, FinancialItem.kind == "expense", FinancialItem.frequency == "monthly")).all()
    expenses = [{"id": str(e.id), "category": e.category, "band": band(e.amount_paise)} for e in exp_items]
    goals = [goal_out(db, g, today) for g in db.scalars(select(Goal).where(Goal.user_id == user_id, Goal.status != "deleted"))]
    sv = score_view(db, user_id)
    rk = risks(db, user_id, prof, f)
    recs = []
    if sv:
        for a in sv["actions"]:
            recs.append({"id": f"{user_id}:rec:{a['dimension']}", "title": a["text"], "agent": AGENT_FOR[a["dimension"]],
                         "addresses": RISK_FOR_DIM.get(a["dimension"], a["dimension"])})
    latest: dict[str, dict] = {}
    viewed = set()
    for t, p in db.execute(select(Event.type, Event.payload).where(Event.user_id == user_id, Event.type.in_(["SchemeEvaluated", "SchemeViewed"]))
                           .order_by(Event.occurred_at)):
        if t == "SchemeEvaluated":
            latest[p["scheme_id"]] = p
        else:
            viewed.add(p["scheme_id"])
    schemes = [{"id": sid, "name": p.get("name", sid), "category": p.get("category", ""), "status": p.get("status"),
                "rules_version": p.get("rules_version", ""), "reviewed": sid in viewed} for sid, p in latest.items()]
    mods = {m["id"]: m for m in catalogue()["modules"]}
    done = db.scalars(select(LearningProgress.module_id).where(LearningProgress.user_id == user_id, LearningProgress.progress_pct >= 100)).all()
    checks = db.scalars(select(SentinelCheck).where(SentinelCheck.user_id == user_id).order_by(SentinelCheck.created_at.desc()).limit(20)).all()
    return {
        "user": user, "incomes": incomes, "expenses": expenses, "risks": rk, "schemes": schemes, "recommendations": recs,
        "goals": [{"id": str(g.id), "type": g.type, "title": g.title, "status": g.status, "on_track": g.on_track, "progress_pct": g.progress_pct} for g in goals],
        "modules": [{"id": m, "title": mods[m]["title"], "topic": mods[m]["topic"]} for m in done if m in mods],
        "scam_checks": [{"id": str(c.id), "level": c.risk_level, "at": c.created_at.isoformat()} for c in checks],
    }


def relay(db: Session, graph, batch: int = 200) -> int:
    """Apply pending outbox rows: one subgraph rebuild per affected user. Returns users synced."""
    rows = db.scalars(select(Outbox).where(Outbox.processed_at.is_(None)).order_by(Outbox.id).limit(batch).with_for_update(skip_locked=True)).all()
    users = {r.user_id for r in rows}
    synced = 0
    for uid in users:
        ids = [r.id for r in rows if r.user_id == uid]
        try:
            graph.sync_user(uid, snapshot(db, uid))
            db.execute(update(Outbox).where(Outbox.id.in_(ids)).values(processed_at=datetime.now(timezone.utc)))
            synced += 1
        except Exception:  # noqa: BLE001 - retried on the next run
            db.execute(update(Outbox).where(Outbox.id.in_(ids)).values(attempts=Outbox.attempts + 1))
    db.flush()
    return synced


def _describe(label: str, p: dict) -> str:
    """Plain-language text for one graph node (also the screen-reader outline)."""
    if label == "Income":
        return f"{str(p.get('kind', '')).capitalize()} income, {p.get('band')} a month"
    if label == "Expense":
        return f"{str(p.get('category', '')).capitalize()}, {p.get('band')} a month"
    if label == "Goal":
        return f"{p.get('title')}: {p.get('progress_pct')}% saved, {'on track' if p.get('on_track') else 'needs attention'}"
    if label == "Risk":
        return f"{p.get('detail')} ({p.get('severity')})"
    if label == "ScamCheck":
        return f"{p.get('level')} risk message"
    return str(p.get("title") or p.get("name") or p.get("id") or label)


def twin_view(graph, user_id: uuid.UUID) -> dict:
    """Life Graph screen model: nodes, edges, an accessible outline, and insights from graph queries."""
    t = graph.twin(user_id)
    kind_order = ["Income", "Expense", "Goal", "Risk", "Scheme", "LearningModule", "KnowledgeTopic", "Recommendation", "ScamCheck"]
    names = {"Income": "Income", "Expense": "Spending", "Goal": "Goals", "Risk": "Risks", "Scheme": "Schemes", "LearningModule": "Lessons completed",
             "KnowledgeTopic": "Topics", "Recommendation": "Recommendations", "ScamCheck": "Scam checks"}
    nodes = []
    for n in t["nodes"]:
        label = next((x for x in n["labels"] if x in kind_order), n["labels"][0] if n["labels"] else "Node")
        text = _describe(label, n["props"])
        nodes.append({"id": n["id"], "type": label, "label": text})
    outline = [{"group": names[k], "items": [n["label"] for n in nodes if n["type"] == k]} for k in kind_order if any(n["type"] == k for n in nodes)]
    insights = [{"text": f"{r['detail']}. No goal addresses this yet.", "agent": "strategy", "query": "unmitigated_risks"} for r in graph.unmitigated_risks(user_id)]
    insights += [{"text": f"You may be eligible for {s['name']} and have not reviewed it.", "agent": "connector", "query": "eligible_unreviewed"}
                 for s in graph.eligible_unreviewed(user_id)]
    return {"nodes": nodes, "edges": [{"from": e["from"], "to": e["to"], "type": e["type"]} for e in t["edges"]], "outline": outline,
            "insights": insights, "source": "neo4j"}


