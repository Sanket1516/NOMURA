import type { Twin } from "@/lib/types";

const META: Record<string, { label: string; color: string }> = {
  Income: { label: "Income", color: "var(--success)" },
  Expense: { label: "Spending", color: "var(--accent)" },
  Goal: { label: "Goals", color: "var(--primary)" },
  Risk: { label: "Risks", color: "var(--danger)" },
  Scheme: { label: "Schemes", color: "var(--connector)" },
  SchemeToCheck: { label: "To check", color: "var(--warning)" },
  LearningModule: { label: "Lessons", color: "var(--educator)" },
  KnowledgeTopic: { label: "Topics", color: "var(--educator)" },
  Recommendation: { label: "Advice", color: "var(--strategy)" },
  ScamCheck: { label: "Scam checks", color: "var(--sentinel)" },
};
const ORDER = Object.keys(META);

/**
 * Hub-and-sector graph: the user at the centre, one labelled hub per category on the inner ring, and each item as a dot
 * in that category's sector (full text on hover). Decorative: the outline beside it is the accessible view.
 */
export function LifeGraph({ twin }: { twin: Twin }) {
  const W = 640, C = W / 2, HUB_R = 165, ITEM_R = 262;
  // Topics are listed in the outline; in the picture they would only repeat the lessons.
  const groups = ORDER.filter((t) => t !== "KnowledgeTopic").map((type) => ({ type, items: twin.nodes.filter((n) => n.type === type) })).filter((g) => g.items.length);
  const span = (Math.PI * 2) / Math.max(groups.length, 1);
  const pos = new Map<string, { x: number; y: number }>();
  const hubs = groups.map((g, gi) => {
    const a = gi * span - Math.PI / 2;
    const hub = { ...g, a, x: C + HUB_R * Math.cos(a), y: C + HUB_R * Math.sin(a) };
    g.items.forEach((n, i) => {
      const spread = Math.min(span * 0.8, 0.22 * g.items.length);
      const ia = a + (g.items.length > 1 ? -spread / 2 + (spread * i) / (g.items.length - 1) : 0);
      const r = ITEM_R + (i % 2 ? 22 : 0);
      pos.set(n.id, { x: C + r * Math.cos(ia), y: C + r * Math.sin(ia) });
    });
    return hub;
  });
  const cross = twin.edges.filter((e) => e.type === "MITIGATED_BY" || e.type === "ADDRESSES")
    .filter((e) => pos.has(e.from) && pos.has(e.to));
  return (
    <svg viewBox={`0 0 ${W} ${W}`} className="h-auto w-full" aria-hidden>
      <defs>
        <radialGradient id="lg-bg"><stop offset="0" stopColor="var(--primary-soft)" /><stop offset="1" stopColor="var(--surface)" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={C} cy={C} r={300} fill="url(#lg-bg)" />
      <circle cx={C} cy={C} r={HUB_R} fill="none" stroke="var(--line)" strokeDasharray="2 6" />
      <circle cx={C} cy={C} r={ITEM_R + 11} fill="none" stroke="var(--line)" strokeDasharray="2 6" />
      {hubs.map((h, hi) => (
        <g key={h.type}>
          <line x1={C} y1={C} x2={h.x} y2={h.y} stroke={META[h.type].color} strokeOpacity="0.35" strokeWidth="2" className="draw-line" style={{ animationDelay: `${hi * 60}ms` }} />
          {h.items.map((n) => {
            const p = pos.get(n.id)!;
            return <line key={n.id} x1={h.x} y1={h.y} x2={p.x} y2={p.y} stroke={META[h.type].color} strokeOpacity="0.25" strokeWidth="1.25" />;
          })}
        </g>
      ))}
      {cross.map((e, i) => {
        const a = pos.get(e.from)!, b = pos.get(e.to)!;
        return <path key={i} d={`M${a.x},${a.y} Q${C},${C} ${b.x},${b.y}`} fill="none" stroke="var(--danger)" strokeWidth="1.75" strokeDasharray="5 4" className="draw-line" />;
      })}
      {hubs.map((h, hi) => (
        <g key={`items-${h.type}`}>
          {h.items.map((n, i) => {
            const p = pos.get(n.id)!;
            return (
              <circle key={n.id} cx={p.x} cy={p.y} r="8" fill="var(--surface)" stroke={META[h.type].color} strokeWidth="3.5" className="grow-y"
                style={{ animationDelay: `${300 + hi * 50 + i * 25}ms` }}>
                <title>{n.label}</title>
              </circle>
            );
          })}
        </g>
      ))}
      {hubs.map((h, hi) => {
        const label = `${META[h.type].label} · ${h.items.length}`;
        const w = label.length * 7.4 + 22;
        return (
          <g key={`hub-${h.type}`} className="grow-y" style={{ animationDelay: `${150 + hi * 60}ms` }}>
            <rect x={h.x - w / 2} y={h.y - 15} width={w} height="30" rx="15" fill="var(--surface)" stroke={META[h.type].color} strokeWidth="2.5" />
            <text x={h.x} y={h.y + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--ink)">{label}</text>
          </g>
        );
      })}
      <circle cx={C} cy={C} r="40" fill="var(--ink)" className="grow-y" />
      <text x={C} y={C + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill="var(--paper)">You</text>
    </svg>
  );
}

export const LEGEND = ["Income", "Expense", "Goal", "Risk", "Scheme", "SchemeToCheck", "LearningModule", "Recommendation", "ScamCheck"]
  .map((k) => ({ key: k, label: META[k].label, color: META[k].color }));
