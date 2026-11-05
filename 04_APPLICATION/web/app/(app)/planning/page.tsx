import type { Metadata } from "next";
import Link from "next/link";
import { Calculator, Info } from "lucide-react";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { apiFetch } from "@/lib/server/api";
import { formatINR, formatDate } from "@/lib/format";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoneyText } from "@/components/finance/money";
import { ChartText } from "@/components/a11y/chart-text";

export const metadata: Metadata = { title: "Financial planning" };

const RULE_EN: Record<string, { title: string; body: string }> = {
  salaried: { title: "Fixed monthly transfer", body: "Your income is steady, so a fixed amount moved on payday works best." },
  variable: { title: "Percentage of every payout, with a floor", body: "Your income changes, so you save a share of each payout and never less than a small floor in lean months." },
  seasonal: { title: "Set aside at harvest", body: "Most income arrives at harvest, so money for the next season and lean months is split off the day it arrives." },
};

export default async function PlanningPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  const inc = d.snapshot.monthly_income.paise / 100;
  const exp = d.snapshot.monthly_expenses.paise / 100;
  const plan = d.savings.planned_this_month.paise / 100;
  const rk = d.profile.income_type;
  const rule = lang === "en" ? RULE_EN[rk] : { title: t(`plan.rule.${rk}.title` as PageKey), body: t(`plan.rule.${rk}.body` as PageKey) };
  const left = Math.max(inc - exp - plan, 0);
  const segments = [
    { label: t("plan.seg.spending"), value: exp, cls: "bg-accent" },
    { label: t("plan.seg.saving"), value: plan, cls: "bg-primary" },
    { label: t("plan.seg.unplanned"), value: left, cls: "bg-surface-2" },
  ];
  const top = d.goals[0];
  // Live: the plan's own inputs, formula, assumptions and limits from the Strategy Builder's calculators.
  type Plan = { feasibility: string; formula: string; assumptions: string[]; limitations: string[]; next_steps: string[]; figures: Record<string, unknown> };
  const goalPlan = d.origin === "live" && top ? await apiFetch<Plan>(`/v1/goals/${top.id}/plan`).catch(() => null) : null;
  const remaining = top ? (top.target.paise - top.saved.paise) / 100 : 0;
  const perMonth = top ? top.monthly_plan.paise / 100 : 0;
  return (
    <>
      <PageHeader tk="planning" title="Financial planning" origin={d.origin} description="A budget that fits how your income arrives, and a plan for your priority goal." />
      <div className="stagger grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" aria-labelledby="budget-h">
          <CardHeader id="budget-h" eyebrow={t("plan.budget.eyebrow")} title={<>{t("plan.where.pre")}<MoneyText value={d.snapshot.monthly_income} />{t("plan.where.post")}</>}
            action={d.profile.income_type !== "salaried" ? <Badge tone="warning">{t("plan.avg")}</Badge> : undefined} />
          <ChartText lang={lang} summary={trf(lang, "plan.chart.summary", { inc: formatINR(inc), exp: formatINR(exp), plan: formatINR(plan), left: formatINR(left) })}
            tableLabel={t("plan.table")} columns={[t("plan.col.part"), t("plan.col.amount"), t("plan.col.share")]}
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
          <CardHeader id="rule-h" eyebrow={t("plan.rule.eyebrow")} title={rule.title} />
          <p className="text-ink-2">{rule.body}</p>
          <p className="mt-3 rounded-xl bg-primary-soft p-3 text-sm"><strong>{t("plan.thismonth")}</strong> <MoneyText value={d.savings.saved_this_month} /> {t("plan.saved.mid")} <MoneyText value={d.savings.planned_this_month} /> {t("plan.saved.post")}</p>
        </Card>
        {top ? (
          <Card className="lg:col-span-12" aria-labelledby="why-h">
            <CardHeader id="why-h" eyebrow={t("plan.priority")} title={top.title} action={<Link href="/goals" className="text-sm font-semibold text-primary hover:underline">{t("plan.allgoals")}</Link>} />
            <div className="grid gap-5 md:grid-cols-2">
              <dl className="grid grid-cols-2 gap-3">
                {[[t("plan.k.target"), <MoneyText key="t" value={top.target} />], [t("plan.k.saved"), <MoneyText key="s" value={top.saved} />], [t("plan.k.monthly"), <MoneyText key="m" value={top.monthly_plan} />], [t("plan.k.date"), formatDate(top.target_date, { month: "short", year: "numeric" })]].map(([k, v]) => (
                  <div key={String(k)} className="rounded-xl bg-surface-2 p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-ink-3">{k}</dt><dd className="mt-1 font-display text-xl">{v}</dd></div>
                ))}
              </dl>
              <details className="rounded-xl border border-line p-4" open>
                <summary className="flex cursor-pointer items-center gap-2 font-semibold"><Calculator aria-hidden className="size-4" />{t("plan.why")}</summary>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-ink-2">
                  <li>{trf(lang, "plan.still", { t: formatINR(top.target.paise / 100), s: formatINR(top.saved.paise / 100), r: formatINR(remaining) })}</li>
                  {perMonth > 0 ? <li>{trf(lang, "plan.months", { m: formatINR(perMonth), r: formatINR(remaining), n: Math.ceil(remaining / perMonth) })}</li> : <li>{t("plan.nomonthly")}</li>}
                  {goalPlan ? <li>{t("plan.formula")} {goalPlan.formula}</li> : null}
                </ol>
                <p className="mt-3 text-sm font-semibold">{t("plan.assumptions")}</p>
                <ul className="list-disc pl-5 text-sm text-ink-2">{(goalPlan?.assumptions ?? [t("plan.assume.default")]).map((a) => <li key={a}>{a}</li>)}</ul>
                <p className="mt-2 text-sm font-semibold">{t("plan.limits")}</p>
                <ul className="list-disc pl-5 text-sm text-ink-2">{(goalPlan?.limitations ?? [t("plan.limit.default")]).map((a) => <li key={a}>{a}</li>)}</ul>
                {goalPlan?.next_steps.length ? <><p className="mt-2 text-sm font-semibold">{t("plan.next")}</p><p className="text-sm text-ink-2">{goalPlan.next_steps[0]}</p></> : null}
                <p className="mt-3 flex items-start gap-2 text-xs text-ink-3"><Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />{t("plan.code")}{goalPlan ? ` ${t("plan.verdict")}: ${goalPlan.feasibility.replace(/_/g, " ")}.` : ""}</p>
              </details>
            </div>
            <p className="mt-4 text-sm"><Link href="/assistant?agent=strategy&q=Help+me+improve+my+savings+plan" className="font-semibold text-primary underline">{t("plan.ask")}</Link></p>
          </Card>
        ) : null}
      </div>
    </>
  );
}
