"use client";
import { useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";
import { useRecorder } from "@/components/voice/recorder";
import { useAnnounce } from "@/components/a11y/live-region";
import { Alert } from "@/components/ui/alert";
import { AgentBadge } from "@/components/ai/agent";
import { AiNotice, Citations } from "@/components/ai/citations";
import { api, isPreviewProblem } from "@/lib/client/api";
import { LANG_NAMES } from "@/lib/i18n/nav";
import { cn } from "@/lib/cn";
import type { AiMeta, Lang, Problem } from "@/lib/types";

const TRY: Record<Lang, string[]> = {
  en: ["How much should I save each month?", "Is this message a scam?", "Which schemes can I apply for?"],
  hi: ["मुझे हर महीने कितनी बचत करनी चाहिए?", "क्या यह संदेश धोखा है?"],
  mr: ["मी दर महिन्याला किती बचत करावी?", "हा संदेश फसवणूक आहे का?"],
  kn: ["ನಾನು ತಿಂಗಳಿಗೆ ಎಷ್ಟು ಉಳಿಸಬೇಕು?", "ನಾನು ಯಾವ ಯೋಜನೆಗಳಿಗೆ ಅರ್ಜಿ ಹಾಕಬಹುದು?"],
};

interface Turn { transcript: string; answer: string; ai: AiMeta; audio?: string }

export function VoiceCompanion({ lang: initial, name }: { lang: Lang; name: string }) {
  const announce = useAnnounce();
  const rec = useRecorder();
  const [lang, setLang] = useState<Lang>(initial);
  const [busy, setBusy] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function toggle() {
    if (rec.state !== "recording") { setProblem(null); await rec.start(); announce("Listening. Press the button again to stop."); return; }
    const blob = await rec.stop();
    if (!blob) return;
    setBusy(true);
    const form = new FormData();
    form.set("audio", blob, "voice.webm");
    form.set("lang", lang);
    const r = await api<{ transcript: { text: string }; answer: { text: string; ai: AiMeta }; audio?: { url: string } }>("/v1/voice/query", { method: "POST", body: form });
    setBusy(false);
    if (!r.ok) { setProblem(r.problem); announce(r.problem.title, "assertive"); return; }
    setTurns((t) => [{ transcript: r.data.transcript.text, answer: r.data.answer.text, ai: r.data.answer.ai, audio: r.data.audio?.url ? `/api/proxy${r.data.audio.url}` : undefined }, ...t]);
    announce(r.data.answer.text);
  }

  const recording = rec.state === "recording";
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h1 className="font-display text-[2.2rem]">Voice Companion</h1>
      <p className="mt-1 text-ink-2">Namaste {name}. Press the button, speak, then press it again.</p>
      <label className="mx-auto mt-5 flex w-fit items-center gap-2 rounded-full px-3 ring-1 ring-line">
        <span className="text-sm font-semibold">Language</span>
        <select value={lang} onChange={(e) => setLang(e.target.value as Lang)} className="min-h-11 bg-transparent font-semibold">
          {(Object.keys(LANG_NAMES) as Lang[]).map((l) => <option key={l} value={l}>{LANG_NAMES[l]}</option>)}
        </select>
      </label>
      <div className="my-10 flex justify-center">
        <button type="button" onClick={() => void toggle()} disabled={busy} aria-pressed={recording}
          aria-label={recording ? "Stop and send" : "Start speaking"}
          className={cn("grid size-36 place-items-center rounded-full text-white shadow-card transition-transform active:scale-95 disabled:opacity-60",
            recording ? "animate-listening bg-danger" : "bg-primary")}>
          {busy ? <Loader2 aria-hidden className="size-12 animate-spin" /> : recording ? <Square aria-hidden className="size-12" /> : <Mic aria-hidden className="size-14" />}
        </button>
      </div>
      <p className="font-semibold" role="status">{busy ? "Understanding what you said…" : recording ? "Listening…" : "Ready"}</p>
      {rec.state === "denied" ? <Alert tone="danger" role="alert" title="Microphone permission denied" className="mt-4 text-left">Allow the microphone in your browser settings, or use Ask VAAKYA by typing.</Alert> : null}
      {problem ? (
        <Alert tone="warning" role="alert" className="mt-4 text-left" title={isPreviewProblem(problem) ? "Voice is not connected in preview" : problem.title}>
          {isPreviewProblem(problem) ? "Speech is processed on VAAKYA's own server, which is not connected in preview. Sign in to use voice." : problem.detail}
        </Alert>
      ) : null}
      <section aria-labelledby="try-h" className="mt-8 text-left">
        <h2 id="try-h" className="font-semibold">Try asking</h2>
        <ul className="mt-2 flex flex-wrap gap-2">{TRY[lang].map((t) => <li key={t} className="rounded-full bg-surface-2 px-4 py-2 text-sm">{t}</li>)}</ul>
      </section>
      {turns.length ? (
        <section aria-labelledby="recent-h" className="mt-8 space-y-3 text-left">
          <h2 id="recent-h" className="font-semibold">This conversation</h2>
          {turns.map((t, i) => (
            <article key={i} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-sm text-ink-3">You said: “{t.transcript}”</p>
              <div className="mt-2">{t.ai.agents.map((a) => <AgentBadge key={a} agent={a} />)}</div>
              <p className="mt-2">{t.answer}</p>
              {t.audio ? <audio controls src={t.audio} className="mt-2 w-full" /> : null}
              <Citations items={t.ai.citations} /><AiNotice text={t.ai.notice} />
            </article>
          ))}
        </section>
      ) : null}
      <p className="mt-8 text-xs text-ink-3">Audio is sent only to VAAKYA&apos;s server, turned into text and deleted. It is never sent to a browser or cloud speech service.</p>
    </div>
  );
}
