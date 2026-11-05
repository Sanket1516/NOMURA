import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, PartyPopper, ShieldAlert, Sparkles, Target } from "lucide-react";
import { loadDashboard } from "@/lib/server/data";
import { apiFetch } from "@/lib/server/api";
import { formatMonth } from "@/lib/format";
import type { Dashboard, Money } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { MoneyText } from "@/components/finance/money";

export const metadata: Metadata = { title: "Monthly review" };

interface Review {
  month: string; score: { from: number | null; to: number | null; change: number }; dimensions: { key: string; label: string; score: number }[];
  saved: Money; achievements: string[]; alerts: string[]; new_schemes: string[]; focus: { text: string; href: string; estimated_points: number }[];
  goals: { id: string; title: string; progress_pct: number; on_track: boolean }[]; has_activity: boolean; notice: string;
}

function sample(d: Dashboard, month: string): Review {
  const h = d.score.history;
  return { month, score: { from: h.at(-2)?.overall ?? null, to: d.score.overall, change: d.score.change_30d }, dimensions: d.score.dimensions,
    saved: d.savings.saved_this_month, achievements: d.learning.filter((m) => m.progress_pct === 100).map((m) => `Completed ${m.title}`),
    alerts: d.scam_alerts.filter((a) => a.level === "high" || a.level === "critical").map((a) => a.summary), new_schemes: [],
    focus: d.score.actions, goals: d.goals, has_activity: true, notice: "Sample review for the preview persona." };
}

const shift = (m: string, by: number) => { const [y, mm] = m.split("-").map(Number); const t = y * 12 + mm - 1 + by; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`; };

export default async function ReviewPage({ params }: { params: Promise<{ month: string }> }) {
  const { month } = await params;
  const d = await loadDashboard();
  const r = d.origin === "live" ? await apiFetch<Review>(`/v1/reviews/${encodeURIComponent(month)}`) : sample(d, month);
  const up = r.score.change >= 0;
  return (
    <>
      <PageHeader eyebrow="Monthly review" title={formatMonth(month).replace(" ", " 20")} origin={d.origin} description={r.notice}
        action={<nav aria-label="Months" className="flex gap-1">
          <Link href={`/reviews/${shift(month, -1)}`} className="grid size-11 place-items-center rounded-full ring-1 ring-line hover:bg-surface-2" aria-label="Previous month"><ChevronLeft aria-hidden /></Link>
          <Link href={`/reviews/${shift(month, 1)}`} className="grid size-11 place-items-center rounded-full ring-1 ring-line hover:bg-surface-2" aria-label="Next month"><ChevronRight aria-hidden /></Link>
        </nav>} />
      {!r.has_activity ? <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-2">No activity recorded for this month.</p> : (
        <div className="stagger grid gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-5" aria-labelledby="sc-h">
            <CardHeader id="sc-h" eyebrow="Confidence Score" title="This month's change" />
            <div className="flex items-end gap-4">
              <p className="font-display text-6xl leading-none"><AnimatedNumber value={r.score.to ?? 0} /></p>
              <span className={`mb-2 inline-flex items-center gap-1 rounded-full px-3 py-1 font-bold ${up ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
                {up ? <ArrowUpRight aria-hidden className="size-4" /> : <ArrowDownRight aria-hidden className="size-4" />}{up ? "+" : "−"}{Math.abs(r.score.change)}<span className="sr-only"> points</span>
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-3">From {r.score.from ?? "–"} at the start of the month.</p>
            <ul className="mt-4 space-y-2.5">{r.dimensions.map((x) => (
              <li key={x.key}><div className="flex justify-between text-sm"><span>{x.label}</span><span className="tabular font-semibold">{x.score}</span></div>
                <Progress value={x.score} label={`${x.label} ${x.score}`} className="mt-1 h-1.5" /></li>))}</ul>
          </Card>
          <Card className="lg:col-span-7" aria-labelledby="ach-h">
            <CardHeader id="ach-h" eyebrow="Well done" title="Achievements" />
            <p className="rounded-2xl bg-primary-soft p-4"><span className="text-sm text-ink-2">Saved towards goals</span><br /><MoneyText value={r.saved} className="font-display text-3xl" /></p>
            <ul className="mt-4 space-y-2">{r.achievements.length ? r.achievements.map((a) => <li key={a} className="flex gap-2"><PartyPopper aria-hidden className="mt-0.5 size-4 shrink-0 text-accent" />{a}</li>)
              : <li className="text-ink-2">No lessons or checks this month yet.</li>}</ul>
            {r.new_schemes.length ? <p className="mt-4 flex gap-2 text-sm"><Sparkles aria-hidden className="mt-0.5 size-4 text-connector" />Schemes you may get: {r.new_schemes.join(", ")}</p> : null}
          </Card>
          <Card className="lg:col-span-6" aria-labelledby="al-h">
            <CardHeader id="al-h" eyebrow="Watch out" title="Alerts" />
            {r.alerts.length ? <ul className="space-y-2">{r.alerts.map((a) => <li key={a} className="flex gap-2 rounded-xl bg-danger-soft p-3 text-sm"><ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />{a}</li>)}</ul>
              : <p className="text-ink-2">No alerts this month.</p>}
          </Card>
          <Card className="lg:col-span-6" aria-labelledby="fo-h">
            <CardHeader id="fo-h" eyebrow="Next month" title="Focus areas" />
            <ul className="space-y-2">{r.focus.map((f) => <li key={f.text}><Link href={f.href} className="lift flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <span className="flex gap-2"><Target aria-hidden className="mt-0.5 size-4 text-primary" />{f.text}</span><span className="text-sm font-semibold text-success">about +{f.estimated_points}</span></Link></li>)}</ul>
          </Card>
        </div>
      )}
    </>
  );
}
