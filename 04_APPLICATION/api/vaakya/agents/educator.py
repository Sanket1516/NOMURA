"""Educator agent (FR-EDU-01, -02, -03, -09): grounded explanations from the trusted corpus, adapted to literacy level.

With a Reasoning Tier model: the model words an answer ONLY from numbered sources and must cite them.
Without a model: an extractive answer made of the most relevant source sentences (llm_used = False), still cited.
No hit above the abstention threshold → the agent says it has no trusted source, instead of answering from memory."""
from __future__ import annotations

import re

from ..ai.knowledge import KnowledgeStore, tokenize
from ..ai.llm import LLMUnavailable, RedactedText
from .base import AgentContext, AgentOutput, Citation

ABSTAIN = ("I do not have a trusted source on that yet, so I will not guess. I can explain saving, budgeting, insurance, loans, "
           "credit scores, SIPs, scams and government schemes. Try asking about one of those.")
SYSTEM = ("You are VAAKYA's Educator. Explain using ONLY the numbered sources. Cite each claim like [1]. If the sources do not answer, say so. "
          "Never tell the user to buy a specific product. Use short sentences. Educational guidance only.")


def _sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 20]


class Educator:
    name = "educator"

    def run(self, ctx: AgentContext) -> AgentOutput:
        store: KnowledgeStore | None = ctx.knowledge
        if store is None:
            return AgentOutput(agent="educator", text="The knowledge service is not available right now, so I cannot give a sourced answer.",
                               abstained=True)
        hits = store.grounded(str(ctx.question), categories=["lesson", "scam_pattern", "scheme_info"], limit=3)
        if not hits:
            return AgentOutput(agent="educator", text=ABSTAIN, abstained=True)
        cites = [Citation(h.chunk_id, h.title, h.publisher, h.url, h.status) for h in hits]
        sources = {"sources": [h.text for h in hits]}
        low = ctx.profile.get("literacy_level") == "low"
        if ctx.llm is not None:
            try:
                numbered = "\n".join(f"<source id={i + 1}>{h.text}</source>" for i, h in enumerate(hits))
                level = "very simple words, 3 short sentences" if low else "plain words, up to 6 sentences"
                r = ctx.llm.complete("answer", SYSTEM, RedactedText(f"{numbered}\n\nQuestion: {ctx.question}\nAnswer in {level}."))
                return AgentOutput(agent="educator", text=r.text.strip(), citations=cites, data=sources, llm_used=True)
            except LLMUnavailable:
                pass
        q = set(tokenize(str(ctx.question)))
        scored = []
        for rank, h in enumerate(hits):
            for i, sent in enumerate(_sentences(h.text.split(": ", 1)[-1])):
                overlap = len(q & set(tokenize(sent)))
                scored.append((overlap, -rank, -i, sent, rank))
        scored.sort(reverse=True)
        keep = sorted(scored[: (2 if low else 3)], key=lambda x: (x[4], -x[2]))
        text = " ".join(f"{s} [{rank + 1}]" for _, _, _, s, rank in keep)
        role = ctx.profile.get("occupation")
        if role and not low:
            text += f"\n\nAsk me how this applies to you as a {role.lower()}, or open the related lesson."
        return AgentOutput(agent="educator", text=text, citations=cites, data=sources, llm_used=False)
