"""Sentinel agent (FR-SEN-02..09): runs the Sentinel pipeline on the user's message; hands loan offers to the Strategy Builder."""
from __future__ import annotations

from ..services.sentinel import SentinelService
from .base import AgentContext, AgentOutput, Citation

LEVEL = {"low": "LOW", "medium": "MEDIUM", "high": "HIGH", "critical": "CRITICAL"}


class Sentinel:
    name = "sentinel"

    def __init__(self, service: SentinelService):
        self.service = service

    def run(self, ctx: AgentContext) -> AgentOutput:
        text = str(ctx.question)
        v = self.service._record(ctx.db, ctx.user_id, "chat", self.service.analyse(text))
        lines = [f"Risk: {LEVEL[v['risk_level']]} ({v['risk_indicator']}/100 warning-sign indicator, not a certainty)."]
        if v["reasons"]:
            lines.append("Why:")
            lines += [f"- {r['explanation']} Found: “{r['evidence']}”" for r in v["reasons"][:4]]
        else:
            lines.append("I found no known warning signs. That does not prove it is safe.")
        lines.append("What to do:")
        lines += [f"- {a}" for a in v["actions"]]
        loan = any(r["signal"] in ("instant_loan", "contacts_permission", "upfront_payment") for r in v["reasons"]) or "loan" in text.lower()
        cites = [Citation(c["id"], c["title"], c["publisher"], c["url"], "draft_unreviewed") for c in v["ai"]["citations"]]
        return AgentOutput(agent="sentinel", text="\n".join(lines), citations=cites, data={"verdict": {k: v[k] for k in ("risk_level", "risk_indicator", "reasons", "actions")},
                                                                                           "loan_offer": loan},
                           figures={"indicator": v["risk_indicator"], "scale": 100}, handoff=("strategy", "user may need money") if loan else None)
