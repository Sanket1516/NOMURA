"use client";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ImagePlus, Loader2, Mic, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { AGENTS, AgentBadge } from "@/components/ai/agent";
import { AiNotice, Citations } from "@/components/ai/citations";
import { useAnnounce } from "@/components/a11y/live-region";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { RiskBadge } from "@/components/finance/risk";
import { useRecorder } from "@/components/voice/recorder";
import { api, isPreviewProblem } from "@/lib/client/api";
import { readSse } from "@/lib/client/sse";
import { cn } from "@/lib/cn";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";
import type { AgentId, AiMeta, ChatMessage, Citation, Lang, Problem, SentinelVerdict } from "@/lib/types";

type Target = "auto" | AgentId;
const SUGGESTIONS: Record<Target, string[]> = {
  auto: ["What is an emergency fund?", "Is this loan offer safe?", "Which schemes can I get?"],
  educator: ["Explain SIP in simple words", "ULIP vs term insurance: what is the difference?", "How is a credit score calculated?"],
  strategy: ["Plan an emergency fund for me", "My income changes every month. How do I save?", "How much should I save for my child's education?"],
  sentinel: ["Someone asked for my OTP to 'verify KYC'", "Is a 2% daily return investment group real?", "An app offers a loan in 5 minutes"],
  connector: ["Which farm schemes can I get?", "Am I eligible for PMJJBY?", "How do I get a UDID card?"],
};

const uid = () => Math.random().toString(36).slice(2);
const now = () => new Date().toISOString();

export function Chat({ name, lang, ui = "en", preview, initialAgent, initialQuestion }: { name: string; lang: Lang; ui?: Lang; preview: boolean; initialAgent?: string; initialQuestion?: string }) {
  const t = (k: PageKey) => tr(ui, k);
  const announce = useAnnounce();
  const [target, setTarget] = useState<Target>(initialAgent && initialAgent in AGENTS ? (initialAgent as AgentId) : "auto");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuestion ?? "");
  const [busy, setBusy] = useState<false | "thinking" | "transcribing" | "checking">(false);
  const [queue, setQueue] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState<Problem | null>(null);
  const logEnd = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const recorder = useRecorder();

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  const patch = (id: string, p: Partial<ChatMessage>) => setMessages((m) => m.map((x) => (x.id === id ? { ...x, ...p } : x)));

  function failed(id: string, problem: Problem) {
    if (isPreviewProblem(problem) || problem.status === 503) setNotConnected(problem);
    patch(id, { status: "error", error: problem.detail ?? problem.title, text: "" });
    announce(`Not answered: ${problem.title}`, "assertive");
  }

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const user: ChatMessage = { id: uid(), role: "user", text: q, at: now(), status: "done" };
    const reply: ChatMessage = { id: uid(), role: "assistant", text: "", at: now(), status: "sending" };
    setMessages((m) => [...m, user, reply]);
    setBusy("thinking");
    let res: Response;
    try {
      res = await fetch("/api/proxy/v1/chat", {
        method: "POST", headers: { "content-type": "application/json", accept: "text/event-stream" },
        body: JSON.stringify({ conversation_id: conversationId, message: q, lang, agent: target === "auto" ? null : target, context: { screen: "assistant" } }),
      });
    } catch {
      failed(reply.id, { type: "about:blank", title: "You appear to be offline", status: 0 });
      setBusy(false); return;
    }
    if (!res.ok) {
      failed(reply.id, (await res.json().catch(() => null)) ?? { type: "about:blank", title: res.statusText, status: res.status });
      setBusy(false); return;
    }
    let text2 = "";
    const citations: Citation[] = [];
    try {
      for await (const ev of readSse(res)) {
        if (ev.event === "queued") setQueue(JSON.parse(ev.data).position ?? null);
        else if (ev.event === "agent") { setQueue(null); patch(reply.id, { agent: JSON.parse(ev.data).agent }); }
        else if (ev.event === "token") { text2 += JSON.parse(ev.data).text ?? ""; patch(reply.id, { text: text2 }); }
        else if (ev.event === "citation") { citations.push(JSON.parse(ev.data)); }
        else if (ev.event === "final") {
          const f = JSON.parse(ev.data) as { conversation_id: string; text: string; ai: AiMeta; audio_url?: string };
          setConversationId(f.conversation_id);
          patch(reply.id, { text: f.text, ai: { ...f.ai, citations: f.ai.citations?.length ? f.ai.citations : citations }, agent: f.ai.agents[0], status: "done", audio_url: f.audio_url });
          announce(`${AGENTS[f.ai.agents[0]]?.name ?? "VAAKYA"} answered: ${f.text.slice(0, 220)}`);
        } else if (ev.event === "error") failed(reply.id, JSON.parse(ev.data));
      }
    } catch {
      failed(reply.id, { type: "about:blank", title: "The answer was interrupted", status: 0, detail: "Please ask again." });
    }
    setQueue(null);
    setBusy(false);
    textarea.current?.focus();
  }

  async function sendVoice() {
    if (recorder.state === "recording") {
      const blob = await recorder.stop();
      if (!blob) return;
      const user: ChatMessage = { id: uid(), role: "user", text: "Voice message", at: now(), attachment: { kind: "audio", name: "voice" }, status: "sending" };
      const reply: ChatMessage = { id: uid(), role: "assistant", text: "", at: now(), status: "sending" };
      setMessages((m) => [...m, user, reply]);
      setBusy("transcribing");
      const form = new FormData();
      form.set("audio", blob, "voice.webm");
      form.set("lang", lang);
      const r = await api<{ transcript: { text: string }; answer: { text: string; ai: AiMeta }; audio?: { url: string } }>("/v1/voice/query", { method: "POST", body: form });
      setBusy(false);
      if (!r.ok) { patch(user.id, { status: "done" }); failed(reply.id, r.problem); return; }
      patch(user.id, { text: r.data.transcript.text, status: "done" });
      patch(reply.id, { text: r.data.answer.text, ai: r.data.answer.ai, agent: r.data.answer.ai.agents[0], status: "done", audio_url: r.data.audio?.url ? `/api/proxy${r.data.audio.url}` : undefined });
      announce(`Answer: ${r.data.answer.text.slice(0, 220)}`);
    } else {
      await recorder.start();
    }
  }

  async function sendImage(file: File) {
    if (!["image/png", "image/jpeg"].includes(file.type)) { announce("Only PNG or JPG images are supported", "assertive"); return; }
    if (file.size > 10 * 1024 * 1024) { announce("Image is larger than 10 MB", "assertive"); return; }
    const user: ChatMessage = { id: uid(), role: "user", text: "Please check this screenshot.", at: now(), attachment: { kind: "image", name: file.name }, status: "done" };
    const reply: ChatMessage = { id: uid(), role: "assistant", text: "", at: now(), status: "sending", agent: "sentinel" };
    setMessages((m) => [...m, user, reply]);
    setBusy("checking");
    const form = new FormData();
    form.set("image", file);
    const r = await api<SentinelVerdict>("/v1/sentinel/checks", { method: "POST", body: form });
    setBusy(false);
    if (!r.ok) { failed(reply.id, r.problem); return; }
    const v = r.data;
    patch(reply.id, { status: "done", ai: v.ai, text: `__verdict__${JSON.stringify(v)}` });
    announce(`Sentinel result: ${v.risk_level} risk. ${v.reasons[0]?.explanation ?? ""}`, "assertive");
  }

  return (
    <div className="mx-auto flex min-w-0 max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="font-display text-[2rem] leading-tight sm:text-[2.4rem]">{t("chat.title")}</h1>
        <p className="mt-1 text-ink-2">{trf(ui, "chat.hello", { name })}</p>
      </div>

      <fieldset className="mb-4 min-w-0">
        <legend className="mb-2 text-sm font-semibold text-ink-2">{t("chat.who")}</legend>
        <div className="relative flex gap-2 overflow-x-auto pb-1">
          {(["auto", "educator", "strategy", "sentinel", "connector"] as Target[]).map((tg) => {
            const a = tg === "auto" ? null : AGENTS[tg];
            const Icon = a?.Icon ?? Sparkles;
            return (
              <label key={tg} className={cn("flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                target === tg ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-2 hover:text-ink")}>
                <input type="radio" name="agent" value={tg} checked={target === tg} onChange={() => setTarget(tg)} className="sr-only" />
                <Icon aria-hidden className="size-4" />{a ? a.name : t("chat.auto")}
              </label>
            );
          })}
        </div>
        <p className="mt-1 text-sm text-ink-3">{target === "auto" ? t("chat.auto.desc") : t(`ag.${target}.desc` as PageKey)}</p>
      </fieldset>

      {notConnected ? (
        <Alert tone="warning" role="status" title={preview ? t("chat.preview.title") : notConnected.title} className="mb-4">
          {preview ? t("chat.preview.body") : notConnected.detail}
        </Alert>
      ) : null}

      <div role="log" aria-label={t("chat.log")} aria-live="off" className="min-h-[38vh] space-y-4 rounded-2xl border border-line bg-surface p-4">
        {!messages.length ? (
          <div className="py-6 text-center">
            <p className="font-display text-xl">{t("chat.help")}</p>
            <ul className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS[target].map((s) => (
                <li key={s}><button type="button" onClick={() => void send(s)} className="min-h-11 rounded-full bg-surface-2 px-4 text-sm hover:bg-primary-soft">{s}</button></li>
              ))}
            </ul>
          </div>
        ) : messages.map((m) => <Bubble key={m.id} m={m} ui={ui} />)}
        {busy ? (
          <p className="flex items-center gap-2 text-sm text-ink-3" role="status">
            <Loader2 aria-hidden className="size-4 animate-spin" />
            {busy === "transcribing" ? t("chat.busy.listen") : busy === "checking" ? t("chat.busy.check") : queue ? trf(ui, "chat.busy.queue", { n: queue }) : t("chat.busy.think")}
          </p>
        ) : null}
        <div ref={logEnd} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="sticky bottom-20 mt-4 rounded-2xl border border-line bg-surface p-2 shadow-card lg:bottom-4">
        <label htmlFor="ask" className="sr-only">{t("chat.q")}</label>
        <textarea id="ask" ref={textarea} rows={2} maxLength={2000} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }}
          placeholder={t("chat.placeholder")} className="w-full resize-none bg-transparent px-3 py-2 text-ink outline-none placeholder:text-ink-3" />
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <Button type="button" variant="ghost" size="icon" onClick={() => void sendVoice()} disabled={Boolean(busy) && recorder.state !== "recording"}
              aria-label={recorder.state === "recording" ? t("chat.rec.stop") : t("chat.rec.start")} aria-pressed={recorder.state === "recording"}
              className={cn(recorder.state === "recording" && "animate-listening bg-danger text-white hover:bg-danger")}>
              {recorder.state === "recording" ? <Square aria-hidden className="size-5" /> : <Mic aria-hidden className="size-5" />}
            </Button>
            <Button type="button" variant="ghost" size="icon" aria-label={t("chat.upload")} onClick={() => fileInput.current?.click()} disabled={Boolean(busy)}>
              <ImagePlus aria-hidden className="size-5" />
            </Button>
            <input ref={fileInput} type="file" accept="image/png,image/jpeg" className="sr-only" tabIndex={-1} aria-hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void sendImage(f); e.target.value = ""; }} />
          </div>
          <Button type="submit" disabled={!input.trim() || Boolean(busy)}><Send aria-hidden className="size-4" />{t("chat.send")}</Button>
        </div>
        {recorder.state === "denied" ? <p className="px-2 pb-1 text-sm text-danger" role="alert">{t("chat.mic.denied")}</p> : null}
        {recorder.state === "unsupported" ? <p className="px-2 pb-1 text-sm text-danger" role="alert">{t("chat.mic.unsupported")}</p> : null}
      </form>
      <p className="mt-2 text-center text-xs text-ink-3">{t("chat.disclaimer")}</p>
    </div>
  );
}

function Bubble({ m, ui }: { m: ChatMessage; ui: Lang }) {
  const t = (k: PageKey) => tr(ui, k);
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-paper">
          <p className="sr-only">{t("chat.yousaid")}</p>
          {m.attachment ? <p className="text-xs opacity-80">{m.attachment.kind === "image" ? trf(ui, "chat.image", { name: m.attachment.name }) : t("chat.voice")}</p> : null}
          <p className="whitespace-pre-wrap">{m.text}</p>
        </div>
      </div>
    );
  }
  const verdict = m.text.startsWith("__verdict__") ? (JSON.parse(m.text.slice(11)) as SentinelVerdict) : null;
  return (
    <article className="max-w-[92%] rounded-2xl rounded-bl-md border border-line bg-paper px-4 py-3" aria-busy={m.status === "sending"}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        {m.ai?.agents?.length ? m.ai.agents.map((a) => <AgentBadge key={a} agent={a} />) : m.agent ? <AgentBadge agent={m.agent} /> : <span className="text-sm font-semibold text-ink-2">VAAKYA</span>}
        {m.ai && m.ai.llm_used === false ? <span className="text-xs text-ink-3">{t("chat.rule")}</span> : null}
      </div>
      {m.status === "error" ? (
        <p className="flex items-start gap-2 text-danger"><AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0" /><span><strong>{t("chat.notanswered")}</strong> {m.error}</span></p>
      ) : verdict ? (
        <div>
          <div className="flex items-center gap-2"><RiskBadge level={verdict.risk_level} lang={ui} /><span className="text-sm text-ink-3">{verdict.indicator_label}: {verdict.risk_indicator}/100</span></div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{verdict.reasons.map((r) => <li key={r.signal}><strong>{r.explanation}</strong> <span className="text-ink-3">“{r.evidence}”</span></li>)}</ul>
          <p className="mt-2 text-sm font-semibold">{t("scam.todo")}</p>
          <ul className="list-disc pl-5 text-sm">{verdict.actions.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      ) : (
        <p className="whitespace-pre-wrap">{m.text || (m.status === "sending" ? "…" : "")}</p>
      )}
      {m.audio_url ? (
        <div className="mt-2 flex items-center gap-2"><Volume2 aria-hidden className="size-4 text-ink-3" /><audio controls src={m.audio_url} className="h-9 max-w-full"><track kind="captions" /></audio></div>
      ) : null}
      {m.ai ? <><Citations items={m.ai.citations ?? []} lang={ui} /><AiNotice text={m.ai.notice} lang={ui} /></> : null}
    </article>
  );
}
