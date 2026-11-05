import Link from "next/link";
import { GraduationCap, Home, LifeBuoy, PiggyBank, Sprout, Wrench } from "lucide-react";
import type { Goal } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MoneyText } from "./money";

const ICON = { emergency_fund: LifeBuoy, education: GraduationCap, home: Home, retirement: PiggyBank, equipment: Wrench, other: Sprout };

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const Icon = ICON[goal.type];
  return (
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Icon aria-hidden className="lit-icon size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-ink"><Link href={`/goals#${goal.id}`} className="hover:underline">{goal.title}</Link></h3>
            <Badge tone={goal.on_track ? "success" : "warning"}>{goal.on_track ? "On track" : "Needs attention"}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-2">
            <MoneyText value={goal.saved} /> of <MoneyText value={goal.target} /> · by {formatDate(goal.target_date, { month: "short", year: "numeric" })}
          </p>
          <Progress className="mt-3" value={goal.progress_pct} label={`${goal.title}: ${goal.progress_pct}% saved`} />
          {!compact ? <p className="mt-2 text-sm text-ink-3">Plan: <MoneyText value={goal.monthly_plan} /> a month</p> : null}
        </div>
      </div>
    </article>
  );
}
