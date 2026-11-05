"""Benchmark the candidate Ollama models through the project's own LLMAdapter. Prints raw outputs so a person can judge them."""
import json, re, sys, time
from pathlib import Path
from vaakya.ai.llm import LLMAdapter, LLMConfig, TierConfig, RedactedText
from vaakya.agents.router import SCHEMA, PRIORITY
from vaakya.agents.educator import SYSTEM

MODELS = sys.argv[1:] or ["gemma:2b", "qwen2:7b"]
ROUTE = [  # no regex rule fires on these, so the router would fall to the model
    ("Someone I met online wants me to put money in his group and says I will earn double", "sentinel"),
    ("The man on the phone says my account will close unless I share the code that came on my phone", "sentinel"),
    ("Which benefits can a widow living in a village get from the state", "connector"),
    ("I am a farmer in Karnataka, what help can I ask the government for", "connector"),
    ("I earn a little every day as a driver. How should I put money aside", "strategy"),
    ("My salary is 30000, spending is 26000. Where do I cut", "strategy"),
    ("What does compounding mean", "educator"),
    ("Tell me how a fixed deposit works", "educator"),
    ("Is it better to repay the loan early or invest the money", "strategy"),
    ("A shop gave me a card and says I must pay a fee to get a refund", "sentinel"),
    ("Can my disabled son get some monthly help", "connector"),
    ("What is the weather today", "other"),
]
data = json.loads(Path("vaakya/data/learning.json").read_text(encoding="utf-8"))
mods = data.get("modules") or data.get("lessons") or list(data.values())[-1]
def src(i):
    m = mods[i]
    return " ".join(f"{s['heading']}: {s['body']}" for s in m["sections"])
ASK = [(0, "Explain this to me in simple words"), (1, "Why should I keep money aside for emergencies"), (2, "How do I know a message is a scam")]

def adapter(model):
    return LLMAdapter(LLMConfig(base_url="http://localhost:11434", tiers={
        "private": TierConfig(model=model, num_ctx=4096, keep_alive="10m", timeout_s=180),
        "reasoning": TierConfig(model=model, num_ctx=8192, keep_alive="10m", timeout_s=180)}))

for model in MODELS:
    print("=" * 70, model)
    a = adapter(model)
    t0 = time.time(); a.complete("route", "ping", "hello", schema=SCHEMA); print(f"cold start+first call: {time.time()-t0:.1f}s")
    ok = 0; lat = []
    for q, want in ROUTE:
        try:
            r = a.complete("route", "Classify the user's money question into one intent: sentinel (scams, fraud, suspicious messages), "
                           "connector (government schemes), strategy (saving, budgets, goals, loans to repay), educator (explain a concept), "
                           "or other. Reply as JSON.", q, schema=SCHEMA)
            got = r.data["intent"]; lat.append(r.latency_ms)
        except Exception as e:
            got = f"ERR {type(e).__name__}"
        ok += got == want
        print(f"  route {'OK ' if got == want else 'BAD'} want={want:9} got={got:9} | {q[:60]}")
    print(f"ROUTING {ok}/{len(ROUTE)}  median latency {sorted(lat)[len(lat)//2] if lat else '-'} ms")
    for mi, q in ASK:
        s = src(mi)[:1500]
        for level in ("plain words, up to 6 sentences", "very simple words, 3 short sentences"):
            r = a.complete("answer", SYSTEM, RedactedText(f"<source id=1>{s}</source>\n\nQuestion: {q}\nAnswer in {level}."))
            print(f"--- ANSWER [{mods[mi].get('title','')}] level={level} {r.latency_ms} ms, {r.tokens_out} tok\n{r.text.strip()}")
    # language ability (no translation model exists; measure honestly)
    s = src(1)[:900]
    for lang in ("Hindi", "Marathi", "Kannada"):
        r = a.complete("answer", SYSTEM + f" Reply in {lang}.", RedactedText(f"<source id=1>{s}</source>\n\nQuestion: Why should I keep money aside for emergencies?\nAnswer in 3 short sentences in {lang}."))
        print(f"--- LANG {lang} {r.latency_ms} ms\n{r.text.strip()}")
