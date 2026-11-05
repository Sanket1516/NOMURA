"use client";
import { useMemo, useState } from "react";
import { CheckCircle2, CircleHelp, ExternalLink, Search, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { api, isPreviewProblem } from "@/lib/client/api";
import { cn } from "@/lib/cn";
import type { Problem, SchemeSummary } from "@/lib/types";

const CATS = [["all", "All"], ["agriculture", "Agriculture"], ["insurance", "Insurance"], ["pension", "Pension"], ["credit", "Credit"], ["disability", "Disability"]] as const;
const STATUS = {
  likely_eligible: { label: "Likely eligible", tone: "success" as const, Icon: CheckCircle2 },
  needs_info: { label: "Needs one answer", tone: "warning" as const, Icon: CircleHelp },
  not_eligible: { label: "Not eligible", tone: "neutral" as const, Icon: XCircle },
};

interface Criterion { id: string; label: string; result: "met" | "not_met" | "unknown"; user_value?: string; ask?: string }
interface Eligibility { status: SchemeSummary["status"]; criteria: Criterion[]; steps: { n: number; text: string; link?: string }[]; documents?: string[] }

export function SchemeExplorer({ schemes }: { schemes: SchemeSummary[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number][0]>("all");
  const [open, setOpen] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, Eligibility | Problem | "loading">>({});
  const shown = useMemo(() => schemes.filter((s) => (cat === "all" || s.category === cat) && `${s.name} ${s.summary}`.toLowerCase().includes(q.toLowerCase())), [schemes, q, cat]);

  async function check(id: string) {
    setResult((r) => ({ ...r, [id]: "loading" }));
    const res = await api<Eligibility>(`/v1/schemes/${id}/eligibility`);
    setResult((r) => ({ ...r, [id]: res.ok ? res.data : res.problem }));
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="scheme-q" className="sr-only">Search schemes</label>
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
          <Input id="scheme-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, for example ‘pension’ or ‘kisan’" className="pl-10" />
        </div>
        <div role="group" aria-label="Filter by category" className="relative flex gap-1 overflow-x-auto">
          {CATS.map(([k, l]) => (
            <button key={k} type="button" aria-pressed={cat === k} onClick={() => setCat(k)}
              className={cn("min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold", cat === k ? "bg-ink text-paper" : "bg-surface-2 text-ink-2")}>{l}</button>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm text-ink-3" role="status">{shown.length} scheme{shown.length === 1 ? "" : "s"}</p>
      <ul className="stagger mt-3 grid gap-4 md:grid-cols-2">
        {shown.map((s) => {
          const st = STATUS[s.status];
          const r = result[s.id];
          return (
            <li key={s.id} className="lift flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-ink-3">{s.category}</p><h2 className="font-display text-xl">{s.name}</h2></div>
                <Badge tone={st.tone}><st.Icon aria-hidden className="size-3.5" />{st.label}</Badge>
              </div>
              <p className="mt-2 text-ink-2">{s.summary}</p>
              <p className="mt-2 text-xs text-ink-3">{s.authority} · {s.verification === "verified" && s.last_verified_at ? `Verified ${s.last_verified_at}` : "Not yet verified by a reviewer"}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" aria-expanded={open === s.id} aria-controls={`elig-${s.id}`} onClick={() => { setOpen(open === s.id ? null : s.id); if (!r) void check(s.id); }}>
                  {open === s.id ? "Hide eligibility" : "Check my eligibility"}
                </Button>
                <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 px-2 text-sm font-semibold text-primary underline">Official site<ExternalLink aria-hidden className="size-3.5" /><span className="sr-only"> (opens in new tab)</span></a>
              </div>
              {open === s.id ? (
                <div id={`elig-${s.id}`} className="mt-4 border-t border-line pt-4" aria-live="polite">
                  {r === "loading" || !r ? <p className="flex items-center gap-2 text-sm"><Loader2 aria-hidden className="size-4 animate-spin" />Checking rules…</p>
                    : "criteria" in r ? <EligibilityView e={r} />
                    : <Alert tone="warning" title={isPreviewProblem(r) ? "Eligibility check needs an account" : r.title}>{isPreviewProblem(r) ? "In preview the status shown is sample data. Sign in so the Connector can check the published rules against your profile." : r.detail}</Alert>}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EligibilityView({ e }: { e: Eligibility }) {
  const icon = { met: <CheckCircle2 aria-hidden className="size-4 text-success" />, not_met: <XCircle aria-hidden className="size-4 text-danger" />, unknown: <CircleHelp aria-hidden className="size-4 text-warning" /> };
  const word = { met: "Meets", not_met: "Does not meet", unknown: "Unknown" };
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-2">{e.criteria.map((c) => (
        <li key={c.id} className="flex gap-2">{icon[c.result]}<span><span className="sr-only">{word[c.result]}: </span>{c.label}{c.user_value ? <span className="text-ink-3"> ({c.user_value})</span> : null}{c.ask ? <span className="block text-ink-3">To check: {c.ask}</span> : null}</span></li>
      ))}</ul>
      {e.documents?.length ? <><p className="font-semibold">Documents usually needed</p><ul className="list-disc pl-5">{e.documents.map((d) => <li key={d}>{d}</li>)}</ul></> : null}
      {e.steps.length ? <><p className="font-semibold">How to apply</p><ol className="list-decimal pl-5">{e.steps.map((s) => <li key={s.n}>{s.text}</li>)}</ol></> : null}
    </div>
  );
}
