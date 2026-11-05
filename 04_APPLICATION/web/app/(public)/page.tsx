import Link from "next/link";
import { ArrowRight, Mic, Accessibility, Lock, Scale, Sparkles } from "lucide-react";
import { AGENTS } from "@/components/ai/agent";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AgentId } from "@/lib/types";

const PILLARS: { agent: AgentId; example: string }[] = [
  { agent: "educator", example: "“Is a ULIP the same as insurance?”" },
  { agent: "strategy", example: "“I earn ₹15,000 to ₹40,000. How do I save?”" },
  { agent: "sentinel", example: "“Is this loan app safe?”" },
  { agent: "connector", example: "“Which farm schemes can I get?”" },
];

export default function Landing() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 overflow-x-clip px-4 pb-14 pt-8 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent"><Sparkles aria-hidden className="size-4" />AI Financial Guardian</p>
          <h1 className="mt-5 font-display text-[2.6rem] leading-[1.02] tracking-tight sm:text-[3.6rem]">
            Money decisions,<br />with a guardian <span className="italic text-primary">by your side.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-2">
            Four AI agents help you learn, plan, stay safe from scams and find the government schemes you qualify for.
            In English, हिन्दी, मराठी and ಕನ್ನಡ, by voice or text.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>Start your financial check-up <ArrowRight aria-hidden className="size-5" /></Link>
            <Link href="/voice" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}><Mic aria-hidden className="size-5" />Try voice mode</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            <li className="flex items-center gap-2"><Lock aria-hidden className="size-4 text-primary" />Processed on VAAKYA&apos;s own server</li>
            <li className="flex items-center gap-2"><Scale aria-hidden className="size-4 text-primary" />Educational, you decide</li>
            <li className="flex items-center gap-2"><Accessibility aria-hidden className="size-4 text-primary" />Built for screen readers</li>
          </ul>
        </div>

        <div aria-hidden className="relative animate-rise [animation-delay:120ms]">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,var(--primary-soft),transparent_60%),radial-gradient(circle_at_80%_80%,var(--accent-soft),transparent_55%)]" />
          <div className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-2">Confidence Score</p>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">+3 this month</span>
            </div>
            <p className="mt-1 font-display text-6xl">63<span className="text-2xl text-ink-3">/100</span></p>
            <div className="mt-4 space-y-3">
              {[["Financial literacy", 72], ["Scam awareness", 64], ["Savings behaviour", 70]].map(([l, v]) => (
                <div key={String(l)}>
                  <div className="flex justify-between text-sm"><span>{l}</span><span className="tabular">{v}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-surface-2"><div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-sentinel-soft p-4">
              <p className="text-sm font-bold text-sentinel">Sentinel · High risk</p>
              <p className="mt-1 text-sm">“Your KYC expires today, click here” asks you to act fast and open a link. Banks do not do this.</p>
            </div>
            <p className="mt-3 text-center text-xs text-ink-3">Illustration with sample figures</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="agents-h" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="agents-h" className="font-display text-3xl">Learn. Plan. Protect. Grow.</h2>
          <p className="mt-2 max-w-2xl text-ink-2">Each agent does specialised work. Money calculations and scheme eligibility are done by tested code, not guessed by AI.</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ agent, example }) => {
              const a = AGENTS[agent];
              return (
                <li key={agent} className="rounded-2xl border border-line bg-paper p-5">
                  <span className={`grid size-11 place-items-center rounded-xl ${a.chip}`}><a.Icon aria-hidden className="size-5" /></span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-ink-3">{a.role}</p>
                  <h3 className="font-display text-xl">{a.name}</h3>
                  <p className="mt-2 text-sm text-ink-2">{a.description}</p>
                  <p className="mt-3 text-sm italic text-ink">{example}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 rounded-[1.75rem] bg-ink p-8 text-paper sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-3xl">Built for Priya, Rajesh, Kisan and Divya</h2>
            <p className="mt-3 opacity-85">A teacher comparing products she is sold. A gig worker whose income changes every month. A farmer planning around harvests. A writer who uses a screen reader. VAAKYA adapts to each of them.</p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "bg-paper text-ink")}>Create a free account</Link>
            <Link href="/login#preview" className="text-center font-semibold underline underline-offset-4">Or preview with sample data</Link>
          </div>
        </div>
      </section>
    </>
  );
}
