import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ArrowDownLeft, ArrowUpRight, PiggyBank, Landmark as LoanIcon } from "lucide-react";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { tr } from "@/lib/i18n/pages";
import { formatDate } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SimpleHome } from "@/components/layout/simple-home";
import { DashboardHero } from "@/components/layout/dashboard-hero";
import { ScoreRing } from "@/components/finance/score-ring";
import { SavingsBars } from "@/components/finance/charts";
import { GoalCard } from "@/components/finance/goal-card";
import { MoneyText } from "@/components/finance/money";
import { RiskBadge } from "@/components/finance/risk";
import { AgentBadge } from "@/components/ai/agent";

export const metadata: Metadata = { title: "Home" };

const ENTRY_ICON = { income: ArrowDownLeft, expense: ArrowUpRight, saving: PiggyBank, loan: LoanIcon };

export default async function HomePage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const s = d.score;
  return (
    <>
      <DashboardHero d={d} lang={lang} />

      <SimpleHome d={d} lang={lang} />

      <div className="lit-detail stagger grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-5" aria-labelledby="score-h">
          <CardHeader id="score-h" eyebrow={tr(lang, "home.score.eyebrow")} title={tr(lang, "home.score.title")}
            action={<Link href="/score" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Details<span className="sr-only"> of your score</span></Link>} />
          <ScoreRing score={s} lang={lang} />
          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {s.dimensions.map((dim) => (
              <li key={dim.key}>
                <div className="flex justify-between text-sm"><span className="text-ink-2">{dim.label}</span><span className="tabular font-semibold">{dim.score}</span></div>
                <Progress value={dim.score} label={`${dim.label} ${dim.score} out of 100`} className="mt-1 h-1.5" />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-7" aria-labelledby="sav-h">
          <CardHeader id="sav-h" eyebrow={tr(lang, "home.savings.eyebrow")} title={tr(lang, "home.savings.title")}
            action={<Link href="/planning" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Plan<span className="sr-only"> your savings</span></Link>} />
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Saved", <MoneyText key="a" value={d.savings.saved_this_month} />],
              ["Planned", <MoneyText key="b" value={d.savings.planned_this_month} />],
              ["Emergency fund", <span key="c" className="tabular">{d.snapshot.emergency_fund_months} months</span>],
              ["Monthly income", <MoneyText key="d" value={d.snapshot.monthly_income} />],
            ].map(([k, v]) => (
              <div key={String(k)} className="rounded-xl bg-surface-2 p-3">
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">{k}</dt>
                <dd className="mt-1 font-display text-xl">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5"><SavingsBars data={d.savings.trend} plannedPaise={d.savings.planned_this_month.paise} lang={lang} /></div>
        </Card>

        <Card className="lg:col-span-7" aria-labelledby="goals-h">
          <CardHeader id="goals-h" eyebrow={tr(lang, "home.goals.eyebrow")} title={tr(lang, "home.goals.title")}
            action={<Link href="/goals" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">All goals</Link>} />
          <div className="grid gap-3">{d.goals.map((g) => <GoalCard key={g.id} goal={g} compact lang={lang} />)}</div>
        </Card>

        <Card className="lg:col-span-5" aria-labelledby="rec-h">
          <CardHeader id="rec-h" eyebrow={tr(lang, "home.rec.eyebrow")} title={tr(lang, "home.rec.title")} />
          <ul className="space-y-3">
            {d.recommendations.map((r) => (
              <li key={r.id} className="rounded-xl border border-line p-3">
                <AgentBadge agent={r.agent} />
                <p className="mt-2 font-semibold"><Link href={r.href} className="hover:underline">{r.title}</Link></p>
                <p className="mt-1 text-sm text-ink-2"><span className="font-semibold">Why: </span>{r.why}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-4" aria-labelledby="scam-h">
          <CardHeader id="scam-h" eyebrow={tr(lang, "home.scam.eyebrow")} title={tr(lang, "home.scam.title")}
            action={<Link href="/shield" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Check a message</Link>} />
          {d.scam_alerts.length ? (
            <ul className="space-y-3">
              {d.scam_alerts.map((a) => (
                <li key={a.id} className="rounded-xl bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-2"><RiskBadge level={a.level} lang={lang} /><time className="text-xs text-ink-3" dateTime={a.at}>{formatDate(a.at)}</time></div>
                  <p className="mt-2 text-sm">{a.summary}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-ink-2">No alerts. Forward anything suspicious to Scam Shield before you act on it.</p>}
        </Card>

        <Card className="lg:col-span-4" aria-labelledby="learn-h">
          <CardHeader id="learn-h" eyebrow={tr(lang, "home.learn.eyebrow")} title={tr(lang, "home.learn.title")}
            action={<Link href="/learn" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Learn</Link>} />
          <ul className="space-y-3">
            {d.learning.slice(0, 4).map((m) => (
              <li key={m.id}>
                <div className="flex justify-between text-sm"><span>{m.title}</span><span className="tabular text-ink-3">{m.progress_pct}%</span></div>
                <Progress value={m.progress_pct} tone={m.progress_pct === 100 ? "primary" : "accent"} label={`${m.title} ${m.progress_pct}% complete`} className="mt-1" />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="lg:col-span-4" aria-labelledby="act-h">
          <CardHeader id="act-h" eyebrow={tr(lang, "home.agents.eyebrow")} title={tr(lang, "home.agents.title")} />
          <ol className="relative space-y-4 border-l border-line pl-4">
            {d.activity.map((a) => (
              <li key={a.id}>
                <span aria-hidden className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-primary" />
                <AgentBadge agent={a.agent} />
                <p className="mt-1 text-sm"><Link href={a.href} className="hover:underline">{a.text}</Link></p>
                <time className="text-xs text-ink-3" dateTime={a.at}>{formatDate(a.at)}</time>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="lg:col-span-12" aria-labelledby="ent-h">
          <CardHeader id="ent-h" eyebrow={tr(lang, "home.entries.eyebrow")} title={tr(lang, "home.entries.title")}
            action={<Badge tone={d.origin === "demo" ? "demo" : "neutral"}>{d.origin === "demo" ? "Sample entries" : "From your records"}</Badge>} />
          <div className="relative overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Recent financial entries</caption>
              <thead className="text-xs uppercase tracking-wide text-ink-3"><tr><th scope="col" className="pb-2 font-semibold">Entry</th><th scope="col" className="hidden pb-2 font-semibold sm:table-cell">Date</th><th scope="col" className="hidden pb-2 font-semibold sm:table-cell">Type</th><th scope="col" className="pb-2 text-right font-semibold">Amount</th></tr></thead>
              <tbody>
                {d.entries.map((e) => {
                  const Icon = ENTRY_ICON[e.category];
                  return (
                    <tr key={e.id} className="border-t border-line">
                      <th scope="row" className="py-3 font-medium"><span className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-2"><Icon aria-hidden className="size-4" /></span><span>{e.label}<span className="block text-xs font-normal text-ink-3 sm:hidden">{formatDate(e.date)} · {e.category}</span></span></span></th>
                      <td className="hidden py-3 text-ink-2 sm:table-cell"><time dateTime={e.date}>{formatDate(e.date)}</time></td>
                      <td className="hidden py-3 capitalize text-ink-2 sm:table-cell">{e.category}</td>
                      <td className={`whitespace-nowrap py-3 text-right font-semibold ${e.category === "income" ? "text-success" : ""}`}>{e.category === "income" ? "+" : "−"}<MoneyText value={e.amount} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-ink-3">VAAKYA does not connect to your bank. Entries come from what you type or confirm from uploaded documents.</p>
        </Card>
      </div>
      <p className="lit-detail mt-6 text-center text-sm"><Link href="/assistant" className="inline-flex items-center gap-1 font-semibold text-primary">{tr(lang, "home.ask")} <ArrowRight aria-hidden className="size-4" /></Link></p>
    </>
  );
}
