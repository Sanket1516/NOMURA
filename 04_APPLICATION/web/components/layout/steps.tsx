import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/types";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

export function Steps({ current, labels, lang = "en" }: { current: number; labels: string[]; lang?: Lang }) {
  const label = (i: number) => (lang === "en" ? labels[i] : tr(lang, `onb.step.${i}` as PageKey));
  return (
    <nav aria-label={tr(lang, "onb.progress")} className="mb-6">
      <p className="text-sm font-semibold text-ink-2">{trf(lang, "onb.stepof", { n: current, total: labels.length, label: label(current - 1) })}</p>
      <ol className="mt-2 flex gap-1.5" aria-hidden>
        {labels.map((l, i) => <li key={l} className={cn("h-1.5 flex-1 rounded-full", i < current ? "bg-primary" : "bg-surface-2")} />)}
      </ol>
    </nav>
  );
}
export const ONBOARDING_STEPS = ["Consent", "Who you are like", "About you", "Your money"];
