import type { Metadata } from "next";
import { Steps, ONBOARDING_STEPS } from "@/components/layout/steps";
import { PERSONAS } from "@/lib/demo";

export const metadata: Metadata = { title: "Who are you most like?" };

export default function PersonaPage() {
  return (
    <>
      <Steps current={2} labels={ONBOARDING_STEPS} />
      <h1 className="font-display text-4xl">Who are you most like?</h1>
      <p className="mt-2 text-ink-2">This sets sensible starting questions. It does not copy anyone&apos;s data, and you can change every answer next.</p>
      <form action="/onboarding/profile" method="get" className="mt-6">
        <fieldset>
          <legend className="sr-only">Choose the person most like you</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {PERSONAS.map((p) => (
              <label key={p.id} className="flex cursor-pointer flex-col rounded-2xl border border-line bg-surface p-5 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus">
                <input type="radio" name="persona" value={p.id} defaultChecked={p.id === "priya"} className="sr-only" />
                <span className="flex justify-between"><span className="font-display text-2xl">{p.name}</span><span className="text-sm text-ink-3">{p.lang}</span></span>
                <span className="mt-1 text-ink-2">{p.tagline}</span>
              </label>
            ))}
            <label className="flex cursor-pointer flex-col rounded-2xl border border-dashed border-line bg-surface p-5 has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary">
              <input type="radio" name="persona" value="none" className="sr-only" />
              <span className="font-display text-2xl">None of these</span>
              <span className="mt-1 text-ink-2">Start with blank questions.</span>
            </label>
          </div>
        </fieldset>
        <button className="mt-6 inline-flex min-h-13 items-center rounded-full bg-primary px-7 font-semibold text-primary-ink">Continue</button>
      </form>
    </>
  );
}
