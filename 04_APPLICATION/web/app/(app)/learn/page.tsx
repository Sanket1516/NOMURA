import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { PageHeader } from "@/components/layout/page-header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";
import { SaveOffline } from "@/components/layout/save-offline";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  const done = d.learning.filter((m) => m.progress_pct === 100).length;
  return (
    <>
      <PageHeader tk="learn" title="Learning Academy" origin={d.origin} description={trf(lang, "learn.progress", { done, n: d.learning.length })} />
      <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.learning.map((m) => (
          <li key={m.id} className="lift flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <Badge tone="educator">{m.topic}</Badge>
              <span className="flex items-center gap-1 text-sm text-ink-3"><Clock aria-hidden className="size-3.5" />{m.minutes} {t("learn.min")}</span>
            </div>
            <h2 className="mt-3 font-display text-xl">{m.title}</h2>
            <Progress value={m.progress_pct} label={`${m.title}: ${m.progress_pct}% complete`} className="mt-4" tone={m.progress_pct === 100 ? "primary" : "accent"} />
            <p className="mt-2 text-sm text-ink-3">{m.progress_pct === 100 ? <span className="flex items-center gap-1 text-success"><CheckCircle2 aria-hidden className="size-4" />{t("learn.complete")}</span> : m.progress_pct ? trf(lang, "learn.pct.done", { n: m.progress_pct }) : t("learn.notstarted")}</p>
            <Link href={`/learn/${m.id}`} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-primary-soft px-4 font-semibold text-primary">
              <BookOpen aria-hidden className="size-4" />{m.progress_pct === 100 ? t("learn.review") : m.progress_pct ? t("learn.continue") : t("learn.start")}<span className="sr-only"> {m.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <SaveOffline ids={d.learning.map((m) => m.id)} lang={lang} />
      <p className="mt-6 text-sm text-ink-3">{t("learn.note")}</p>
    </>
  );
}
