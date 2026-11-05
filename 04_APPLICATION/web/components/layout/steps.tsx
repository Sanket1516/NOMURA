import { cn } from "@/lib/cn";

export function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <nav aria-label="Progress" className="mb-6">
      <p className="text-sm font-semibold text-ink-2">Step {current} of {labels.length}: {labels[current - 1]}</p>
      <ol className="mt-2 flex gap-1.5" aria-hidden>
        {labels.map((l, i) => <li key={l} className={cn("h-1.5 flex-1 rounded-full", i < current ? "bg-primary" : "bg-surface-2")} />)}
      </ol>
    </nav>
  );
}
export const ONBOARDING_STEPS = ["Consent", "Who you are like", "About you", "Your money"];
