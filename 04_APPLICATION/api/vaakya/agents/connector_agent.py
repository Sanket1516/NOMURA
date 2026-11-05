"""Connector agent (FR-CON-02..05, -08, -09): matches the profile against the scheme catalogue with the deterministic engine.
It explains results and steps; it never decides eligibility or invents schemes or amounts."""
from __future__ import annotations

from ..models import Scheme
from ..services.connector import ConnectorService
from .base import AgentContext, AgentOutput, Citation

STATUS = {"likely_eligible": "you are likely eligible", "needs_info": "I need one or two answers to check", "not_eligible": "you do not meet the published rules"}


class Connector:
    name = "connector"

    def __init__(self, service: ConnectorService):
        self.service = service

    def run(self, ctx: AgentContext) -> AgentOutput:
        q = str(ctx.question).lower()
        results = self.service.evaluate_all(ctx.db, ctx.user_id, record=True)
        named = [(row, r) for row, r in results if row.id.replace("-", "") in q.replace("-", "").replace(" ", "")
                 or row.data["name"].lower() in q or any(w in q for w in _aliases(row))]
        chosen = named or [x for x in results if x[1]["status"] == "likely_eligible"][:3] + [x for x in results if x[1]["status"] == "needs_info"][:2]
        if not chosen:
            return AgentOutput(agent="connector", text="From what you have told me, none of the schemes I cover match yet. Add details such as "
                               "farmland, bank account or disability in your profile and I will check again.", abstained=True)
        lines, cites, data = [], [], []
        for row, r in chosen:
            d = row.data
            lines.append(f"**{d['name']}**: {STATUS[r['status']]}. {d['benefit']['text']}")
            unknown = [c["ask"] for c in r["criteria"] if c["result"] == "unknown"][:2]
            failed = [c["label"] for c in r["criteria"] if c["result"] == "not_met"][:2]
            if failed:
                lines.append("  Not met: " + "; ".join(failed) + ".")
            if unknown:
                lines.append("  To check: " + " ".join(unknown))
            if r["status"] == "likely_eligible":
                lines.append(f"  First step: {d['steps'][0]['text']} Documents: {', '.join(d['documents'][:3])}.")
            cites.append(Citation(f"scheme:{row.id}", d["name"], d["authority"], d["source_url"], row.verification))
            data.append({"id": row.id, "status": r["status"], "benefit": d["benefit"]["text"]})
        verified = all(row.verification == "verified" for row, _ in chosen)
        lines.append("" if verified else "\nThese scheme details are awaiting human verification. Confirm on the official site linked below; "
                     "the scheme authority makes the final decision.")
        return AgentOutput(agent="connector", text="\n".join(lines).strip(), citations=cites, data={"schemes": data})


def _aliases(row: Scheme) -> list[str]:
    return {"pm-kisan": ["kisan samman", "6000", "6,000"], "pmfby": ["crop insurance", "fasal"], "kcc": ["kisan credit"],
            "pmjjby": ["life insurance", "jeevan jyoti"], "pmsby": ["accident insurance", "suraksha"], "apy": ["atal", "pension"],
            "ssy": ["sukanya", "daughter", "girl child"], "mudra": ["business loan"], "udid": ["disability card", "disability id"],
            "igndps": ["disability pension"]}.get(row.id, [])
