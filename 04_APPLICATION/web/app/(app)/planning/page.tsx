import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Info } from "lucide-react";
import { loadDashboard } from "@/lib/server/data";
import { formatINR, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyText } from "@/components/finance/money";
import { ChartText } from "@/components/a11y/chart-text";

export const metadata: Metadata = { title: "Financial planning" };

const RULE: Record<string, { title: string; body: string }> = {
  salaried: { title: "Fixed monthly transfer", body: "Your income is steady, so a fixed amount moved on payday works best." },
  variable: { title: "Percentage of every payout, with a floor", body: "Your income changes, so you save a share of each payout and never less than a small floor in lean months." },
  seasonal: { title: "Set aside at harvest", body: "Most income arrives at harvest, so money for the next season and lean months is split off the day it arrives." },
};

export default async function PlanningPage() {
  const d = await loadDashboard();
  const inc = d.snapshot.monthly_income.paise / 100;
  const exp = d.snapshot.monthly_expenses.paise / 100;
  const plan = d.savings.planned_this_month.paise / 100;
  const rule = RULE[d.profile.income_type];
  const left = Math.max(inc - exp - plan, 0);
  const segments = [
    { label: "Spending", value: exp, cls: "bg-accent" },
    { label: "Planned saving", value: plan, cls: "bg-primary" },
    { label: "Unplanned", value: left, cls: "bg-surface-2" },
  ];
  const top = d.goals[0];
  const remaining = top ? (top.target.paise - top.saved.paise) / 100 : 0;
  const perMonth = top ? top.monthly_plan.paise / 100 : 0;
  return (
    <>
      <PageHeader title="Financial planning" origin={d.origin} description="A budget that fits how your income arrives, and a plan for your priority goal." />
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" aria-labelledby="budget-h">
          <CardHeader id="budget-h" eyebrow="Monthly budget" title={<>Where <MoneyText value={d.snapshot.monthly_income} /> goes</>}
            action={d.profile.income_type !== "salaried" ? <Badge tone="warning">Average month</Badge> : undefined} />
          <ChartText summary={`Of ${formatINR(inc)}: ${formatINR(exp)} spending, ${formatINR(plan)} planned saving, ${formatINR(left)} unplanned.`}
            tableLabel="Monthly budget" columns={["Part", "Amount", "Share"]}
            rows={segments.map((s) => [s.label, formatINR(s.value), `${inc ? Math.round((s.value / inc) * 100) : 0}%`])}>
            <div className="flex h-5 overflow-hidden rounded-full ring-1 ring-line ring-inset">
              {segments.map((s) => <div key={s.label} className={s.cls} style={{ width: `${inc ? (s.value / inc) * 100 : 0}%` }} />)}
            </div>
            <ul className="mt-3 flex flex-wrap gap-4 text-sm">
              {segments.map((s) => <li key={s.label} className="flex items-center gap-2"><span className={`size-3 rounded-sm ring-1 ring-line ${s.cls}`} />{s.label} {formatINR(s.value)}</li>)}
            </ul>
          </ChartText>
        </Card>
        <Card className="lg:col-span-5" aria-labelledby="rule-h">
          <CardHeader id="rule-h" eyebrow="Your saving rule" title={rule.title} />
          <p className="text-ink-2">{rule.body}</p>
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm"><strong>This month:</strong> <MoneyText value={d.savings.saved_this_month} /> saved of <MoneyText value={d.savings.planned_this_month} /> planned.</p>
        </Card>
        {top ? (
          <Card className="lg:col-span-12" aria-labelledby="why-h">
            <CardHeader id="why-h" eyebrow="Priority goal" title={top.title} action={<Link href="/goals" className="text-sm font-semibold text-primary hover:underline">All goals</Link>} />
            <div className="grid gap-5 md:grid-cols-2">
              <dl className="grid grid-cols-2 gap-3">
                {[["Target", <MoneyText key="t" value={top.target} />], ["Saved", <MoneyText key="s" value={top.saved} />], ["Monthly plan", <MoneyText key="m" value={top.monthly_plan} />], ["Target date", formatDate(top.target_date, { month: "short", year: "numeric" })]].map(([k, v]) => (
                  <div key={String(k)} className="rounded-xl bg-surface-2 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">{k}</dt><dd className="mt-1 font-display text-xl">{v}</dd></div>
                ))}
              </dl>
              <details className="rounded-xl border border-line p-4" open>
                <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Calculator aria-hidden className="size-4" />Why this plan?</summary>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-2">
                  <li>Still needed: {formatINR(top.target.paise / 100)} − {formatINR(top.saved.paise / 100)} = <strong>{formatINR(remaining)}</strong></li>
                  {perMonth > 0 ? <li>At {formatINR(perMonth)} a month: {formatINR(remaining)} ÷ {formatINR(perMonth)} ≈ <strong>{Math.ceil(remaining / perMonth)} months</strong></li> : <li>No monthly amount is planned; money is set aside when income arrives.</li>}
                  <li>Assumes no interest or returns, so the real result can only be better if the money earns interest.</li>
                </ol>
                <p className="mt-3 flex items-start gap-2 text-xs text-ink-3"><Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />Calculated by VAAKYA&apos;s code, not by AI. Limitations: it does not predict income changes or emergencies.</p>
              </details>
            </div>
            <p className="mt-4 text-sm"><Link href="/assistant?agent=strategy&q=Help+me+improve+my+savings+plan" className="font-semibold text-primary underline">Ask the Strategy Builder to adjust this plan</Link></p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
