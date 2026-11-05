import Link from "next/link";
import { AudioLines, ShieldCheck } from "lucide-react";
import type { Dashboard, Lang } from "@/lib/types";
import { tr, trf } from "@/lib/i18n/pages";
import { Progress } from "@/components/ui/progress";
import { MoneyText } from "@/components/finance/money";

/** Home for low-literacy mode (FR-LNG-04): few numbers, short words, big targets. Rendered next to the full dashboard and shown by CSS
 *  (`data-literacy="low"`), so it works with server rendering and the no-flash boot script. All figures come from the same data as the full view. */
export function SimpleHome({ d, lang }: { d: Dashboard; lang: Lang }) {
  const goal = d.goals[0];
  const next = d.recommendations[0];
  const big = "flex min-h-20 items-center gap-4 rounded-2xl border border-line bg-surface p-5 text-xl font-semibold shadow-card hover:bg-surface-2";
  return (
    <section className="lit-simple space-y-5" aria-labelledby="simple-h">
      <h2 id="simple-h" className="font-display text-2xl">{tr(lang, "lit.title")}</h2>

      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-lg text-ink-2">{tr(lang, "lit.saved")}</p>
        <p className="mt-1 font-display text-4xl"><MoneyText value={d.savings.saved_this_month} /></p>
      </div>

      {goal ? (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="text-lg text-ink-2">{tr(lang, "lit.goal")}</p>
          <p className="mt-1 text-2xl font-semibold">{goal.title}</p>
          <Progress value={goal.progress_pct} label={`${goal.title} ${goal.progress_pct}%`} className="mt-3 h-3" />
          <p className="mt-2 text-lg">{trf(lang, "lit.done", { n: goal.progress_pct })}</p>
        </div>
      ) : null}

      {next ? (
        <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <p className="text-lg text-ink-2">{tr(lang, "lit.next")}</p>
          <p className="mt-1 text-xl font-semibold"><Link href={next.href} className="underline-offset-4 hover:underline">{next.title}</Link></p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/voice" className={big}><AudioLines aria-hidden className="size-9 shrink-0 text-primary" />{tr(lang, "lit.voice")}</Link>
        <Link href="/shield" className={big}><ShieldCheck aria-hidden className="size-9 shrink-0 text-primary" />{tr(lang, "lit.shield")}</Link>
      </div>
    </section>
  );
}
