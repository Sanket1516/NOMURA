import Link from "next/link";
import { ArrowUpRight, MessageCircle, Mic, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import type { Dashboard, Lang } from "@/lib/types";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";
import { formatDate } from "@/lib/format";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { OriginBadge } from "@/components/ai/origin-badge";

function greeting(hour: number, lang: Lang) {
  return tr(lang, hour < 12 ? "hero.morning" : hour < 17 ? "hero.afternoon" : "hero.evening");
}

/** Dashboard hero: greeting, live score badge, key numbers and the three most-used actions. */
export function DashboardHero({ d, lang = "en" }: { d: Dashboard; lang?: Lang }) {
  const t = (k: PageKey) => tr(lang, k);
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  const s = d.score;
  const up = s.change_30d >= 0;
  const stats = [
    { label: t("hero.stat.saved"), value: d.savings.saved_this_month.paise / 100, kind: "inr" as const, suffix: "" },
    { label: t("hero.stat.ef"), value: d.snapshot.emergency_fund_months, kind: "decimal1" as const, suffix: t("hero.stat.months") },
    { label: t("hero.stat.goals"), value: d.goals.filter((g) => g.on_track).length, kind: "int" as const, suffix: trf(lang, "hero.stat.of", { m: d.goals.length }) },
  ];
  return (
    <section aria-labelledby="hero-h" className="relative mb-6 overflow-hidden rounded-[1.75rem] border border-line bg-surface p-6 shadow-card sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary-soft blur-2xl float-slow" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-40 size-56 rounded-full bg-accent-soft blur-2xl float-slow [animation-delay:-6s]" />
      <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-primary">{formatDate(new Date().toISOString(), { weekday: "long", day: "numeric", month: "long" })}</p>
            <OriginBadge origin={d.origin} lang={lang} />
          </div>
          <h1 id="hero-h" className="mt-2 font-display text-[2.1rem] leading-[1.05] tracking-tight sm:text-[2.8rem]">
            {greeting(hour, lang)}, <span className="shimmer-text">{d.profile.display_name}</span>
          </h1>
          <p className="lit-detail mt-3 max-w-xl text-ink-2">
            {trf(lang, "hero.line", { overall: s.overall, band: tr(lang, `score.band.${s.band.toLowerCase()}` as PageKey) })}{" "}
            {s.change_30d !== 0 ? trf(lang, up ? "hero.up" : "hero.down", { n: Math.abs(s.change_30d) }) : t("hero.steady")}
          </p>
          <ul className="lit-detail mt-5 flex flex-wrap gap-2">
            {[{ href: "/assistant", label: t("hero.ask"), Icon: MessageCircle }, { href: "/shield", label: t("hero.check"), Icon: ShieldCheck },
              { href: "/voice", label: t("hero.talk"), Icon: Mic }].map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} className="lift inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm font-semibold hover:border-primary">
                  <Icon aria-hidden className="size-4 text-primary" />{label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="lit-detail grid gap-3">
          <Link href="/score" className="lift flex items-center justify-between rounded-2xl bg-ink p-5 text-paper">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{t("hero.cs")}</p>
              <p className="mt-1 font-display text-5xl leading-none"><AnimatedNumber value={s.overall} /><span className="text-xl opacity-60">/100</span></p>
            </div>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ${up ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>
              {up ? <TrendingUp aria-hidden className="size-4" /> : <TrendingDown aria-hidden className="size-4" />}{up ? "+" : "−"}{Math.abs(s.change_30d)}
              <span className="sr-only">{t("hero.points30")}</span>
            </span>
            <ArrowUpRight aria-hidden className="size-5 opacity-60" />
          </Link>
          <dl className="grid grid-cols-3 gap-2">
            {stats.map((x) => (
              <div key={x.label} className="rounded-2xl bg-surface-2 p-3">
                <dt className="text-[0.7rem] font-semibold uppercase leading-tight tracking-wide text-ink-3">{x.label}</dt>
                <dd className="mt-1 font-display text-lg leading-tight tabular"><AnimatedNumber value={x.value} kind={x.kind} suffix={x.suffix} /></dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
