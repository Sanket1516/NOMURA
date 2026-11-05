import { PERSONAS } from "@/lib/demo";
import { cn } from "@/lib/cn";

/** Radio-card persona picker that posts a form. Works without JavaScript. */
export function PersonaPicker({ action, next, submitLabel, name = "persona", legend = "Choose a person", defaultValue = "priya" }: {
  action: string; next?: string; submitLabel: string; name?: string; legend?: string; defaultValue?: string;
}) {
  return (
    <form action={action} method="post" className="mt-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <fieldset>
        <legend className="sr-only">{legend}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <label key={p.id} className={cn("group relative flex cursor-pointer flex-col rounded-2xl border border-line bg-surface p-4 transition-shadow",
              "has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus")}>
              <input type="radio" name={name} value={p.id} defaultChecked={p.id === defaultValue} className="sr-only" />
              <span className="flex items-center justify-between">
                <span className="font-display text-xl">{p.name}</span>
                <span className="text-sm text-ink-3">{p.lang}</span>
              </span>
              <span className="mt-1 text-sm text-ink-2">{p.tagline}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-demo px-6 font-semibold text-white hover:brightness-110">{submitLabel} selected person</button>
    </form>
  );
}
