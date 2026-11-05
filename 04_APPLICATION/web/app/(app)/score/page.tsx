import type { Metadata } from "next";
import Link from "next/link";
import { loadDashboard } from "@/lib/server/data";
import { Card, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { ScoreRing } from "@/components/finance/score-ring";
import { ScoreLine } from "@/components/finance/charts";
import { VoiceSummary } from "@/components/voice/voice-summary";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Confidence Score" };

export default async function ScorePage() {
  const d = await loadDashboard();
  const s = d.score;
  return (
    <>
      <PageHeader title="Financial Confidence Score" origin={d.origin}
        description="How confident and protected you are with money. This is not a credit score and lenders never see it."
        action={<VoiceSummary text={s.text_equivalent} />} />
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-5" aria-labelledby="now-h">
          <CardHeader id="now-h" eyebrow={`Updated ${formatDate(s.computed_at)}`} title="Your score now" />
          <ScoreRing score={s} size={220} />
          <p className="mt-3 text-center text-sm text-ink-2">{s.change_30d >= 0 ? "Up" : "Down"} {Math.abs(s.change_30d)} points in 30 days</p>
        </Card>
        <Card className="lg:col-span-7" aria-labelledby="dims-h">
          <CardHeader id="dims-h" eyebrow="Six dimensions" title="What makes up your score" />
          <ul className="space-y-4">
            {s.dimensions.map((dim) => (
              <li key={dim.key}>
                <div className="flex items-baseline justify-between"><span className="font-semibold">{dim.label}</span><span className="tabular font-display text-xl">{dim.score}</span></div>
                <Progress value={dim.score} label={`${dim.label}: ${dim.score} out of 100`} className="mt-1.5" tone={dim.score < 50 ? "accent" : "primary"} />
                <p className="mt-1 text-sm text-ink-3">{dim.explanation}</p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-7" aria-labelledby="hist-h">
          <CardHeader id="hist-h" eyebrow="History" title="Your progress" />
          <ScoreLine data={s.history} />
        </Card>
        <Card className="lg:col-span-5" aria-labelledby="act-h">
          <CardHeader id="act-h" eyebrow="Next steps" title="Raise your score" />
          <ul className="space-y-3">
            {s.actions.map((a) => (
              <li key={a.text} className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 p-3">
                <Link href={a.href} className="font-medium hover:underline">{a.text}</Link>
                <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-sm font-semibold text-success">about +{a.estimated_points}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-3">Point estimates come from the scoring formula and are approximate.</p>
        </Card>
        <Card className="lg:col-span-12" aria-labelledby="how-h">
          <CardHeader id="how-h" eyebrow={`Formula ${s.formula_version}`} title="How it is calculated" />
          <p className="text-ink-2">Your score is the average of six dimensions, each from 0 to 100, calculated by code from what you do in VAAKYA: lessons and quizzes, scam checks, goals and saving, schemes you review and loan-cost checks. AI does not decide your score; it only explains it. Activity is capped so the score cannot be inflated by repetition, and income level is never counted.</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-4">
            {[["85–100", "Excellent"], ["70–84", "Good"], ["50–69", "Fair"], ["0–49", "Building"]].map(([r, b]) => (
              <div key={b} className="rounded-xl border border-line p-3"><dt className="font-semibold">{b}</dt><dd className="tabular text-ink-3">{r}</dd></div>
            ))}
          </dl>
        </Card>
      </div>
    </>
  );
}
