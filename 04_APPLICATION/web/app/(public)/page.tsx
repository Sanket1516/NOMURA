import Link from "next/link";
import { config } from "@/lib/server/config";
import { ArrowRight, Mic, Accessibility, Lock, Scale, Sparkles } from "lucide-react";
import { AGENTS } from "@/components/ai/agent";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { AgentId } from "@/lib/types";
import { uiLang } from "@/lib/server/data";
import { tr, type PageKey } from "@/lib/i18n/pages";

const PILLARS: AgentId[] = ["educator", "strategy", "sentinel", "connector"];

export default async function Landing() {
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-10 overflow-x-clip px-4 pb-14 pt-8 lg:grid-cols-[1.15fr_1fr] lg:pt-16">
        <div className="animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-accent"><Sparkles aria-hidden className="size-4" />{t("land.tag")}</p>
          <h1 className="mt-5 font-display text-[2.6rem] leading-[1.02] tracking-tight sm:text-[3.6rem]">
            {t("land.h1a")}<br />{t("land.h1b")}<span className="italic text-primary">{t("land.h1c")}</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-2">
            {t("land.p")}
            {" "}{t("land.p2")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }))}>{t("land.cta")} <ArrowRight aria-hidden className="size-5" /></Link>
            <Link href="/voice" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}><Mic aria-hidden className="size-5" />{t("land.voice")}</Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-2">
            <li className="flex items-center gap-2"><Lock aria-hidden className="size-4 text-primary" />{t("land.t1")}</li>
            <li className="flex items-center gap-2"><Scale aria-hidden className="size-4 text-primary" />{t("land.t2")}</li>
            <li className="flex items-center gap-2"><Accessibility aria-hidden className="size-4 text-primary" />{t("land.t3")}</li>
          </ul>
        </div>

        <div aria-hidden className="relative animate-rise [animation-delay:120ms]">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,var(--primary-soft),transparent_60%),radial-gradient(circle_at_80%_80%,var(--accent-soft),transparent_55%)]" />
          <div className="rounded-[1.75rem] border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink-2">{t("hero.cs")}</p>
              <span className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">{t("land.month")}</span>
            </div>
            <p className="mt-1 font-display text-6xl">63<span className="text-2xl text-ink-3">/100</span></p>
            <div className="mt-4 space-y-3">
              {[[t("land.d1"), 72], [t("land.d2"), 64], [t("land.d3"), 70]].map(([l, v]) => (
                <div key={String(l)}>
                  <div className="flex justify-between text-sm"><span>{l}</span><span className="tabular">{v}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-surface-2"><div className="h-2 rounded-full bg-primary" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-sentinel-soft p-4">
              <p className="text-sm font-bold text-sentinel">{t("land.sent")}</p>
              <p className="mt-1 text-sm">{t("land.sent.p")}</p>
            </div>
            <p className="mt-3 text-center text-xs text-ink-3">{t("land.illus")}</p>
          </div>
        </div>
      </section>

      <section aria-labelledby="agents-h" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 id="agents-h" className="font-display text-3xl">{t("land.agents.h")}</h2>
          <p className="mt-2 max-w-2xl text-ink-2">{t("land.agents.p")}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((agent) => {
              const a = AGENTS[agent];
              return (
                <li key={agent} className="rounded-2xl border border-line bg-paper p-5">
                  <span className={`grid size-11 place-items-center rounded-xl ${a.chip}`}><a.Icon aria-hidden className="size-5" /></span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-ink-3">{t(`ag.${agent}.role` as PageKey)}</p>
                  <h3 className="font-display text-xl">{a.name}</h3>
                  <p className="mt-2 text-sm text-ink-2">{t(`ag.${agent}.desc` as PageKey)}</p>
                  <p className="mt-3 text-sm italic text-ink">{t(`ag.${agent}.ex` as PageKey)}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-6 rounded-[1.75rem] bg-ink p-8 text-paper sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="font-display text-3xl">{t("land.built")}</h2>
            <p className="mt-3 opacity-85">{t("land.built.p")}</p>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "bg-paper text-ink")}>{t("land.free")}</Link>
            {config.previewEnabled ? <Link href="/login#preview" className="text-center font-semibold underline underline-offset-4">{t("land.orpreview")}</Link> : null}
          </div>
        </div>
      </section>
    </>
  );
}
