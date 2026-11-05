"use client";
import { useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { Tabs } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field, Select, Textarea } from "@/components/ui/field";
import { RiskBadge } from "@/components/finance/risk";
import { AiNotice, Citations } from "@/components/ai/citations";
import { useAnnounce } from "@/components/a11y/live-region";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { Lang, Problem, SentinelVerdict } from "@/lib/types";
import { tr } from "@/lib/i18n/pages";

export function ScamCheck({ lang = "en" }: { lang?: Lang }) {
  const t = (k: Parameters<typeof tr>[1]) => tr(lang, k);
  const announce = useAnnounce();
  const [text, setText] = useState("");
  const [kind, setKind] = useState("sms");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<SentinelVerdict | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);

  async function run(body: { json?: unknown; form?: FormData }) {
    setBusy(true); setVerdict(null); setProblem(null);
    const res = await api<SentinelVerdict>("/v1/sentinel/checks", { method: "POST", ...(body.form ? { body: body.form } : { json: body.json }) });
    setBusy(false);
    if (!res.ok) { setProblem(res.problem); announce(`Check failed: ${res.problem.title}`, "assertive"); return; }
    setVerdict(res.data);
    announce(`${res.data.risk_level} risk. ${res.data.reasons[0]?.explanation ?? "No warning signs found."}`, "assertive");
  }

  function pick(f: File | undefined) {
    setFileError(null); setFile(null);
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) { setFileError(t("scam.err.type")); return; }
    if (f.size > 10 * 1024 * 1024) { setFileError(t("scam.err.size")); return; }
    setFile(f);
  }

  return (
    <div>
      <Tabs label={t("scam.tabs")} tabs={[
        { id: "text", label: t("scam.tab.text"), panel: (
          <form onSubmit={(e) => { e.preventDefault(); if (text.trim()) void run({ json: { text, kind } }); }} className="space-y-4">
            <Field label={t("scam.field.text")} hint={t("scam.field.hint")}>{(a) => (
              <Textarea id={a.id} aria-describedby={a.describedBy} rows={6} maxLength={5000} value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Example: Dear customer, your KYC expires today. Update now at http://…" />)}</Field>
            <Field label={t("scam.field.source")}>{(a) => (
              <Select id={a.id} value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="sms">{t("scam.src.sms")}</option><option value="whatsapp">{t("scam.src.whatsapp")}</option><option value="ad">{t("scam.src.ad")}</option>
                <option value="loan_offer">{t("scam.src.loan")}</option><option value="investment_tip">{t("scam.src.tip")}</option><option value="url">{t("scam.src.url")}</option>
              </Select>)}</Field>
            <Button type="submit" disabled={busy || !text.trim()}>{busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}{t("scam.btn.text")}</Button>
          </form>) },
        { id: "image", label: t("scam.tab.image"), panel: (
          <form onSubmit={(e) => { e.preventDefault(); if (file) { const f = new FormData(); f.set("image", file); void run({ form: f }); } }} className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-8 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
              <ImageUp aria-hidden className="size-8 text-ink-3" />
              <span className="font-semibold">{file ? file.name : t("scam.choose")}</span>
              <span className="text-sm text-ink-3">{t("scam.choose.hint")}</span>
              <input type="file" accept="image/png,image/jpeg" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {fileError ? <p role="alert" className="text-sm font-semibold text-danger">{fileError}</p> : null}
            <Button type="submit" disabled={busy || !file}>{busy ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}{t("scam.btn.image")}</Button>
          </form>) },
      ]} />

      <div aria-live="polite" className="mt-5">
        {busy ? <p className="flex items-center gap-2 text-ink-2" role="status"><Loader2 aria-hidden className="size-4 animate-spin" />{t("scam.busy")}</p> : null}
        {problem ? (
          <Alert tone={isPreviewProblem(problem) ? "warning" : "danger"} role="alert" title={isPreviewProblem(problem) ? "Sentinel is not connected in preview" : problem.title}>
            {isPreviewProblem(problem) ? "VAAKYA does not show made-up verdicts. Sign in to check real messages." : problem.detail}
          </Alert>
        ) : null}
        {verdict ? <Verdict v={verdict} lang={lang} /> : null}
      </div>
    </div>
  );
}

function Verdict({ v, lang }: { v: SentinelVerdict; lang: Lang }) {
  const t = (k: Parameters<typeof tr>[1]) => tr(lang, k);
  return (
    <section aria-labelledby="verdict-h" className="rounded-2xl border border-line bg-paper p-5">
      <h3 id="verdict-h" className="flex flex-wrap items-center gap-3 font-display text-2xl"><RiskBadge level={v.risk_level} lang={lang} /><span className="text-base text-ink-3">{v.indicator_label}: {v.risk_indicator}/100</span></h3>
      {v.reasons.length ? (
        <>
          <h4 className="mt-4 font-semibold">{t("scam.why")}</h4>
          <ul className="mt-2 space-y-2">{v.reasons.map((r) => (
            <li key={r.signal + r.evidence} className="rounded-xl bg-surface-2 p-3 text-sm">
              <p className="font-semibold">{r.explanation}</p>
              <p className="mt-1 text-ink-3">{t("scam.found")}: “{r.evidence}”</p>
            </li>))}
          </ul>
        </>
      ) : <p className="mt-3 text-ink-2">{t("scam.none")}</p>}
      <h4 className="mt-4 font-semibold">{t("scam.todo")}</h4>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{v.actions.map((a) => <li key={a}>{a}</li>)}</ul>
      <Citations items={v.ai.citations} lang={lang} />
      <AiNotice text={v.ai.notice} lang={lang} />
    </section>
  );
}
