import { ChartText } from "@/components/a11y/chart-text";
import type { Lang, Score } from "@/lib/types";
import { tr, type PageKey } from "@/lib/i18n/pages";

const bandColor: Record<Score["band"], string> = {
  Excellent: "var(--success)", Good: "var(--primary)", Fair: "var(--accent)", Building: "var(--danger)",
};

export function ScoreRing({ score, size = 168, withTable = true, lang = "en" }: { score: Score; size?: number; withTable?: boolean; lang?: Lang }) {
  const r = 70, c = 2 * Math.PI * r, arc = 0.75; // 270° gauge
  const filled = (score.overall / 100) * c * arc;
  const ring = (
    <svg viewBox="0 0 180 180" width={size} height={size} className="mx-auto block">
      <g transform="rotate(135 90 90)">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c * arc} ${c}`} />
        <circle cx="90" cy="90" r={r} fill="none" stroke={bandColor[score.band]} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`} className="ring-draw" />
      </g>
      <text x="90" y="92" textAnchor="middle" className="font-display" fontSize="46" fill="var(--ink)">{score.overall}</text>
      <circle cx={90 + r * Math.cos(((135 + 270 * score.overall / 100) * Math.PI) / 180)} cy={90 + r * Math.sin(((135 + 270 * score.overall / 100) * Math.PI) / 180)}
        r="9" fill="var(--surface)" stroke={bandColor[score.band]} strokeWidth="4" className="grow-y" />
      <text x="90" y="118" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink-2)">{tr(lang, `score.band.${score.band.toLowerCase()}` as PageKey)}</text>
      <text x="90" y="150" textAnchor="middle" fontSize="11" fill="var(--ink-3)">{tr(lang, "ring.out")}</text>
    </svg>
  );
  if (!withTable) return <div role="img" aria-label={score.text_equivalent}>{ring}</div>;
  return (
    <ChartText lang={lang} summary={score.text_equivalent} tableLabel={tr(lang, "ring.table")}
      columns={[tr(lang, "ring.col.dim"), tr(lang, "ring.col.score")]} rows={score.dimensions.map((d) => [d.label, d.score])}>
      {ring}
    </ChartText>
  );
}
