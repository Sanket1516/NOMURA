import { ChartText } from "@/components/a11y/chart-text";
import { formatINR, formatMonth } from "@/lib/format";

/** Bars of monthly saving against a planned line. Clean, no gridline clutter. */
export function SavingsBars({ data, plannedPaise }: { data: { month: string; saved_paise: number }[]; plannedPaise: number }) {
  const W = 560, H = 190, pad = 28;
  const max = Math.max(plannedPaise, ...data.map((d) => d.saved_paise), 1);
  const bw = (W - pad * 2) / data.length;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const met = data.filter((d) => d.saved_paise >= plannedPaise && plannedPaise > 0).length;
  return (
    <ChartText
      summary={`Saved in the last ${data.length} months. ${plannedPaise ? `Met the ${formatINR(plannedPaise / 100)} plan in ${met} of ${data.length} months.` : ""}`}
      tableLabel="Monthly savings" columns={["Month", "Saved"]}
      rows={data.map((d) => [formatMonth(d.month), formatINR(d.saved_paise / 100)])}>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
        {data.map((d, i) => {
          const h = H - pad - y(d.saved_paise);
          const ok = plannedPaise > 0 && d.saved_paise >= plannedPaise;
          return (
            <g key={d.month}>
              <rect x={pad + i * bw + bw * 0.18} y={y(d.saved_paise)} width={bw * 0.64} height={Math.max(h, 1.5)} rx="6"
                fill={ok ? "var(--primary)" : "var(--accent)"} opacity={i === data.length - 1 ? 1 : 0.78}
                className="grow-y" style={{ animationDelay: `${i * 70}ms` }} />
              <text x={pad + i * bw + bw / 2} y={H - 6} textAnchor="middle" fontSize="17" fill="var(--ink-3)">{formatMonth(d.month).split(" ")[0]}</text>
            </g>
          );
        })}
        {plannedPaise > 0 ? (
          <g>
            <line x1={pad} x2={W - pad} y1={y(plannedPaise)} y2={y(plannedPaise)} stroke="var(--ink-2)" strokeDasharray="4 4" strokeWidth="1.25" />
            <text x={W - pad} y={y(plannedPaise) - 6} textAnchor="end" fontSize="15" fill="var(--ink-2)">plan</text>
          </g>
        ) : null}
      </svg>
    </ChartText>
  );
}

/** Line of score history with an end label. */
export function ScoreLine({ data }: { data: { month: string; overall: number }[] }) {
  const W = 560, H = 170, pad = 26;
  const xs = (i: number) => pad + (i * (W - pad * 2)) / Math.max(data.length - 1, 1);
  const ys = (v: number) => H - pad - (v / 100) * (H - pad * 2);
  const path = data.map((d, i) => `${i ? "L" : "M"}${xs(i)},${ys(d.overall)}`).join(" ");
  const area = `${path} L${xs(data.length - 1)},${H - pad} L${xs(0)},${H - pad} Z`;
  const first = data[0], last = data[data.length - 1];
  return (
    <ChartText
      summary={`Score went from ${first.overall} in ${formatMonth(first.month)} to ${last.overall} in ${formatMonth(last.month)}.`}
      tableLabel="Confidence score history" columns={["Month", "Score"]} rows={data.map((d) => [formatMonth(d.month), d.overall])}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.22" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#scoreFill)" />
        <path d={path} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" className="draw-line" />
        {data.map((d, i) => <circle key={d.month} cx={xs(i)} cy={ys(d.overall)} r={i === data.length - 1 ? 4.5 : 2.5} fill="var(--primary)" />)}
        <text x={xs(data.length - 1)} y={ys(last.overall) - 10} textAnchor="end" fontSize="17" fontWeight="700" fill="var(--ink)">{last.overall}</text>
        {data.map((d, i) => <text key={`l${d.month}`} x={xs(i)} y={H - 4} textAnchor="middle" fontSize="15" fill="var(--ink-3)">{formatMonth(d.month).split(" ")[0]}</text>)}
      </svg>
    </ChartText>
  );
}
