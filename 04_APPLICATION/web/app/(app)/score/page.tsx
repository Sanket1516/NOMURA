import type { Metadata } from "next";
import Link from "next/link";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreRing } from "@/components/finance/score-ring";
import { ScoreLine } from "@/components/finance/charts";
import { VoiceSummary } from "@/components/voice/voice-summary";
import { formatDate } from "@/lib/format";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

export const metadata: Metadata = { title: "Confidence Score" };

export default async function ScorePage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  const s = d.score;
  return (
    <>
      <PageHeader tk="score" title="Financial Confidence Score" origin={d.origin}
        description="How confident and protected you are with money. This is not a credit score and lenders never see it."
        action={<VoiceSummary text={s.text_equivalent} server={d.origin === "live"} lang={d.profile.preferred_lang} />} />
      <div className="stagger grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-5" aria-labelledby="now-h">
          <CardHeader id="now-h" eyebrow={trf(lang, "score.updated", { date: formatDate(s.computed_at) })} title={t("score.now")} />
          <ScoreRing score={s} size={220} lang={lang} />
          <p className="mt-3 text-center text-sm text-ink-2">{trf(lang, s.change_30d >= 0 ? "score.up" : "score.down", { n: Math.abs(s.change_30d) })}</p>
        </Card>
        <Card className="lg:col-span-7" aria-labelledby="dims-h">
          <CardHeader id="dims-h" eyebrow={t("score.dims.eyebrow")} title={t("score.dims.title")} />
          <ul className="space-y-4">
            {s.dimensions.map((dim) => (
              <li key={dim.key}>
                <div className="flex items-baseline justify-between"><span className="font-semibold">{dim.label}</span><span className="tabular font-display text-xl">{dim.score}</span></div>
                <Progress value={dim.score} label={trf(lang, "score.out", { label: dim.label, n: dim.score })} className="mt-1.5" tone={dim.score < 50 ? "accent" : "primary"} />
                <p className="mt-1 text-sm text-ink-3">{dim.explanation}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-7" aria-labelledby="hist-h">
          <CardHeader id="hist-h" eyebrow={t("score.hist.eyebrow")} title={t("score.hist.title")} />
          <ScoreLine data={s.history} lang={lang} />
        </Card>
        <Card className="lg:col-span-5" aria-labelledby="act-h">
          <CardHeader id="act-h" eyebrow={t("score.next.eyebrow")} title={t("score.next.title")} />
          <ul className="space-y-3">
            {s.actions.map((a) => (
              <li key={a.text} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3">
                <Link href={a.href} className="font-medium hover:underline">{a.text}</Link>
                <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-sm font-semibold text-success">{trf(lang, "score.about", { n: a.estimated_points })}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">{t("score.approx")}</p>
        </Card>
        <Card className="lg:col-span-12" aria-labelledby="how-h">
          <CardHeader id="how-h" eyebrow={trf(lang, "score.formula", { v: s.formula_version })} title={t("score.how")} />
          <p className="text-ink-2">{t("score.how.body")}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
            {[["85–100", t("score.band.excellent")], ["70–84", t("score.band.good")], ["50–69", t("score.band.fair")], ["0–49", t("score.band.building")]].map(([r, b]) => (
              <div key={b} className="rounded-xl border border-line p-3"><dt className="font-semibold">{b}</dt><dd className="tabular text-ink-3">{r}</dd></div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
