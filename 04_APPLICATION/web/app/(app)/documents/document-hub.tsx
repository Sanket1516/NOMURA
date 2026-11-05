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
import type { Money, Problem } from "@/lib/types";

interface DocField { field: string; value: Money | string; confidence: number | null; confirmed: boolean; warning?: string | null }
export interface Doc { id: string; kind: string; status: string; mime: string; size: number; created_at: string; fields: DocField[]; extraction_error?: string }

const KINDS = [["salary_slip", "Salary slip"], ["bank_statement", "Bank statement"], ["insurance_policy", "Insurance policy"], ["other", "Other"]] as const;
const LABEL: Record<string, string> = { net_monthly_income: "Net monthly pay", gross_monthly_income: "Gross monthly pay", total_deductions: "Total deductions",
  pay_month: "Pay month", closing_balance: "Closing balance", opening_balance: "Opening balance", salary_credit: "Salary credit" };
const STATUS: Record<string, { label: string; tone: "success" | "warning" | "neutral" | "danger" }> = {
  pending_review: { label: "Check the values", tone: "warning" }, confirmed: { label: "Confirmed", tone: "success" },
  no_fields_found: { label: "Nothing found", tone: "neutral" }, stored: { label: "Stored", tone: "neutral" }, extraction_failed: { label: "Could not read", tone: "danger" },
};
const isMoney = (v: Money | string): v is Money => typeof v === "object" && v !== null && "paise" in v;

export function DocumentHub({ initial, live }: { initial: Doc[]; live: boolean }) {
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
    if (file.size > 10 * 1024 * 1024) { setProblem({ type: "v", title: "Files must be 10 MB or smaller", status: 413 }); return; }
    setBusy(true); setProblem(null);
    const form = new FormData();
    form.set("file", file); form.set("kind", kind);
    const r = await api<Doc>("/v1/documents", { method: "POST", body: form });
    setBusy(false);
    if (!r.ok) { setProblem(r.problem); announce(r.problem.title, "assertive"); return; }
    setDocs((d) => [r.data, ...d]);
    setFile(null);
    announce(r.data.fields.length ? `Found ${r.data.fields.length} values. Please check them.` : r.data.extraction_error ?? "Document stored.");
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
    announce("Values confirmed and added to your finances.");
    router.refresh();
  }

  async function remove(doc: Doc) {
    const r = await api(`/v1/documents/${doc.id}`, { method: "DELETE" });
    if (r.ok) { setDocs((d) => d.filter((x) => x.id !== doc.id)); announce("Document deleted."); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={upload} className="card lift h-fit space-y-4 rounded-xl border border-line bg-surface p-5 shadow-card">
        <h2 className="font-display text-xl">Upload</h2>
        <Field label="What is it?">{(a) => <Select id={a.id} value={kind} onChange={(e) => setKind(e.target.value)} disabled={!live}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>}</Field>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line p-6 text-center has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
          <Upload aria-hidden className="size-7 text-ink-3" />
          <span className="font-semibold">{file ? file.name : "Choose a photo or PDF"}</span>
          <span className="text-sm text-ink-3">PNG, JPG or PDF up to 10 MB. Encrypted and kept until you delete it.</span>
          <input type="file" accept="image/png,image/jpeg,application/pdf" capture="environment" className="sr-only" disabled={!live}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        {problem ? <Alert tone="danger" role="alert" title={problem.title}>{problem.detail}</Alert> : null}
        <Button type="submit" disabled={!file || busy || !live} className="w-full">{busy ? <><Loader2 aria-hidden className="size-4 animate-spin" />Reading…</> : "Upload and read"}</Button>
      </form>
      <section aria-labelledby="docs-h" className="space-y-4">
        <h2 id="docs-h" className="sr-only">Uploaded documents</h2>
        {!docs.length ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-2">No documents yet.</p> : docs.map((doc) => {
          const st = STATUS[doc.status] ?? { label: doc.status, tone: "neutral" as const };
          return (
            <article key={doc.id} className="card lift rounded-xl border border-line bg-surface p-5 shadow-card" aria-label={`${doc.kind.replace("_", " ")} document`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 font-semibold"><FileText aria-hidden className="size-5 text-primary" />{KINDS.find((k) => k[0] === doc.kind)?.[1] ?? doc.kind}
                  <span className="text-sm font-normal text-ink-3">· {formatDate(doc.created_at)}</span></p>
                <div className="flex items-center gap-2"><Badge tone={st.tone}>{st.label}</Badge>
                  <Button variant="ghost" size="icon" aria-label="Delete document" onClick={() => void remove(doc)}><Trash2 aria-hidden className="size-4" /></Button></div>
              </div>
              {doc.extraction_error ? <p className="mt-2 text-sm text-danger">{doc.extraction_error}</p> : null}
              {doc.fields.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {doc.fields.map((f) => (
                    <Field key={f.field} label={LABEL[f.field] ?? f.field}
                      hint={f.warning ?? (f.confidence != null ? `Read with ${Math.round(f.confidence * 100)}% confidence` : undefined)}>
                      {(a) => <Input id={a.id} aria-describedby={a.describedBy} disabled={doc.status === "confirmed"} inputMode={isMoney(f.value) ? "decimal" : undefined}
                        defaultValue={isMoney(f.value) ? String(f.value.paise / 100) : f.value}
                        onChange={(e) => setEdits((x) => ({ ...x, [doc.id]: { ...x[doc.id], [f.field]: e.target.value } }))} />}
                    </Field>
                  ))}
                </div>
              ) : null}
              {doc.status === "pending_review" ? <Button className="mt-4" onClick={() => void confirm(doc)}><CheckCircle2 aria-hidden className="size-4" />These values are correct</Button> : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}
