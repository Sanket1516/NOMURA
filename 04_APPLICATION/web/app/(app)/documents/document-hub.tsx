"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Select } from "@/components/ui/field";
import { useAnnounce } from "@/components/a11y/live-region";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/format";
import type { Lang, Money, Problem } from "@/lib/types";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

interface DocField { field: string; value: Money | string; confidence: number | null; confirmed: boolean; warning?: string | null }
export interface Doc { id: string; kind: string; status: string; mime: string; size: number; created_at: string; fields: DocField[]; extraction_error?: string }

const KINDS = ["salary_slip", "bank_statement", "insurance_policy", "other"] as const;
const FIELDS = ["net_monthly_income", "gross_monthly_income", "total_deductions", "pay_month", "closing_balance", "opening_balance", "salary_credit"];
const STATUS: Record<string, "success" | "warning" | "neutral" | "danger"> = {
  pending_review: "warning", confirmed: "success", no_fields_found: "neutral", stored: "neutral", extraction_failed: "danger",
};
const isMoney = (v: Money | string): v is Money => typeof v === "object" && v !== null && "paise" in v;

export function DocumentHub({ initial, live, lang = "en" }: { initial: Doc[]; live: boolean; lang?: Lang }) {
  const t = (k: PageKey) => tr(lang, k);
  const kindLabel = (k: string) => (KINDS as readonly string[]).includes(k) ? t(`doc.k.${k}` as PageKey) : k;
  const router = useRouter();
  const announce = useAnnounce();
  const [docs, setDocs] = useState(initial);
  const [kind, setKind] = useState("salary_slip");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setProblem({ type: "v", title: t("doc.toobig"), status: 413 }); return; }
    setBusy(true); setProblem(null);
    const form = new FormData();
    form.set("file", file); form.set("kind", kind);
    const r = await api<Doc>("/v1/documents", { method: "POST", body: form });
    setBusy(false);
    if (!r.ok) { setProblem(r.problem); announce(r.problem.title, "assertive"); return; }
    setDocs((d) => [r.data, ...d]);
    setFile(null);
    announce(r.data.fields.length ? trf(lang, "doc.found", { n: r.data.fields.length }) : r.data.extraction_error ?? t("doc.stored.msg"));
  }

  async function confirm(doc: Doc) {
    const fields = doc.fields.map((f) => {
      const raw = edits[doc.id]?.[f.field];
      if (isMoney(f.value)) return { field: f.field, value: { paise: Math.round(Number((raw ?? String(f.value.paise / 100)).replace(/[,\s₹]/g, "")) * 100) } };
      return { field: f.field, value: raw ?? f.value };
    });
    const r = await api<{ status: string }>(`/v1/documents/${doc.id}/confirm`, { method: "POST", json: { fields } });
    if (!r.ok) { setProblem(r.problem); return; }
    setDocs((d) => d.map((x) => (x.id === doc.id ? { ...x, status: "confirmed", fields: x.fields.map((f) => ({ ...f, confirmed: true })) } : x)));
    announce(t("doc.confirmed.msg"));
    router.refresh();
  }

  async function remove(doc: Doc) {
    const r = await api(`/v1/documents/${doc.id}`, { method: "DELETE" });
    if (r.ok) { setDocs((d) => d.filter((x) => x.id !== doc.id)); announce(t("doc.deleted.msg")); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={upload} className="card lift h-fit space-y-4 rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="font-display text-xl">{t("doc.upload")}</h2>
        <Field label={t("doc.what")}>{(a) => <Select id={a.id} value={kind} onChange={(e) => setKind(e.target.value)} disabled={!live}>{KINDS.map((v) => <option key={v} value={v}>{kindLabel(v)}</option>)}</Select>}</Field>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
          <Upload aria-hidden className="size-7 text-ink-3" />
          <span className="font-semibold">{file ? file.name : t("doc.choose")}</span>
          <span className="text-sm text-ink-3">{t("doc.choose.hint")}</span>
          <input type="file" accept="image/png,image/jpeg,application/pdf" capture="environment" className="sr-only" disabled={!live}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {problem ? <Alert tone="danger" role="alert" title={problem.title}>{problem.detail}</Alert> : null}
        <Button type="submit" disabled={!file || busy || !live} className="w-full">{busy ? <><Loader2 aria-hidden className="size-4 animate-spin" />{t("doc.reading")}</> : t("doc.upload.btn")}</Button>
      </form>
      <section aria-labelledby="docs-h" className="space-y-4">
        <h2 id="docs-h" className="sr-only">{t("doc.list")}</h2>
        {!docs.length ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-2">{t("doc.none")}</p> : docs.map((doc) => {
          const stTone = STATUS[doc.status] ?? "neutral";
          const stLabel = doc.status in STATUS ? t(`doc.s.${doc.status}` as PageKey) : doc.status;
          return (
            <article key={doc.id} className="card lift rounded-xl border border-line bg-surface p-5 shadow-card" aria-label={kindLabel(doc.kind)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold"><FileText aria-hidden className="size-5 text-primary" />{kindLabel(doc.kind)}
                  <span className="text-sm font-normal text-ink-3">· {formatDate(doc.created_at)}</span></p>
                <div className="flex items-center gap-2"><Badge tone={stTone}>{stLabel}</Badge>
                  <Button variant="ghost" size="icon" aria-label={t("doc.delete")} onClick={() => void remove(doc)}><Trash2 aria-hidden className="size-4" /></Button></div>
              </div>
              {doc.extraction_error ? <p className="mt-2 text-sm text-danger">{doc.extraction_error}</p> : null}
              {doc.fields.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {doc.fields.map((f) => (
                    <Field key={f.field} label={FIELDS.includes(f.field) ? t(`doc.f.${f.field}` as PageKey) : f.field}
                      hint={f.warning ?? (f.confidence != null ? trf(lang, "doc.conf", { n: Math.round(f.confidence * 100) }) : undefined)}>
                      {(a) => <Input id={a.id} aria-describedby={a.describedBy} disabled={doc.status === "confirmed"} inputMode={isMoney(f.value) ? "decimal" : undefined}
                        defaultValue={isMoney(f.value) ? String(f.value.paise / 100) : f.value}
                        onChange={(e) => setEdits((x) => ({ ...x, [doc.id]: { ...x[doc.id], [f.field]: e.target.value } }))} />}
                    </Field>
                  ))}
                </div>
              ) : null}
              {doc.status === "pending_review" ? <Button className="mt-4" onClick={() => void confirm(doc)}><CheckCircle2 aria-hidden className="size-4" />{t("doc.correct")}</Button> : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
