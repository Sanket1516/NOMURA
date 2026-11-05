import { ChartText } from "@/components/a11y/chart-text";
import type { Score } from "@/lib/types";

const bandColor: Record<Score["band"], string> = {
  Excellent: "var(--success)", Good: "var(--primary)", Fair: "var(--accent)", Building: "var(--danger)",
};

export function ScoreRing({ score, size = 168, withTable = true }: { score: Score; size?: number; withTable?: boolean }) {
  const r = 70, c = 2 * Math.PI * r, arc = 0.75; // 270° gauge
  const filled = (score.overall / 100) * c * arc;
  const ring = (
    <svg viewBox="0 0 180 180" width={size} height={size} className="mx-auto block">
      <g transform="rotate(135 90 90)">
        <circle cx="90" cy="90" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="14" strokeLinecap="round" strokeDasharray={`${c * arc} ${c}`} />
        <circle cx="90" cy="90" r={r} fill="none" stroke={bandColor[score.band]} strokeWidth="14" strokeLinecap="round"
          strokeDasharray={`${filled} ${c}`} style={{ transition: "stroke-dasharray 900ms cubic-bezier(.2,.7,.2,1)" }} />
      </g>
      <text x="90" y="92" textAnchor="middle" className="font-display" fontSize="46" fill="var(--ink)">{score.overall}</text>
      <text x="90" y="118" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink-2)">{score.band}</text>
      <text x="90" y="150" textAnchor="middle" fontSize="11" fill="var(--ink-3)">out of 100</text>
    </svg>
  );
  if (!withTable) return <div role="img" aria-label={score.text_equivalent}>{ring}</div>;
  return (
    <ChartText summary={score.text_equivalent} tableLabel="Confidence score by dimension"
      columns={["Dimension", "Score"]} rows={score.dimensions.map((d) => [d.label, d.score])}>
      {ring}
    </ChartText>
  );
}
