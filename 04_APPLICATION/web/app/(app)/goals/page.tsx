import type { Metadata } from "next";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { PageHeader } from "@/components/layout/page-header";
import { GoalCard } from "@/components/finance/goal-card";
import { Card, CardHeader } from "@/components/ui/card";
import { tr } from "@/lib/i18n/pages";
import { NewGoalForm } from "./new-goal-form";

export const metadata: Metadata = { title: "Goals" };

export default async function GoalsPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  return (
    <>
      <PageHeader tk="goals" title="Your goals" origin={d.origin} description="Each plan comes from VAAKYA's calculators. Open “Why this plan?” on the planning page to see the inputs." />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="list-h">
          <h2 id="list-h" className="sr-only">{tr(lang, "goals.current")}</h2>
          {d.goals.length ? <div className="grid gap-3">{d.goals.map((g) => <div key={g.id} id={g.id}><GoalCard goal={g} lang={lang} /></div>)}</div>
            : <p className="rounded-xl border border-dashed border-line p-6 text-ink-2">{tr(lang, "goals.empty")}</p>}
        </section>
        <Card aria-labelledby="new-h">
          <CardHeader id="new-h" eyebrow={tr(lang, "goals.studio")} title={tr(lang, "goals.add")} />
          <NewGoalForm lang={lang} />
        </Card>
      </div>
    </>
  );
}
