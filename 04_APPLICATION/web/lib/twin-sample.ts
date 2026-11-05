import type { Dashboard, Twin, TwinNode } from "./types";

/** Preview only: a small graph built from the sample dashboard, labelled "sample". Live mode reads Neo4j via /v1/twin. */
export function sampleTwin(d: Dashboard): Twin {
  const nodes: TwinNode[] = [
    { id: "inc", type: "Income", label: `${d.profile.income_type} income, ${d.snapshot.monthly_income.display} a month` },
    { id: "exp", type: "Expense", label: `Household spending, ${d.snapshot.monthly_expenses.display} a month` },
    ...d.goals.map((g) => ({ id: g.id, type: "Goal", label: `${g.title}: ${g.progress_pct}% saved` })),
    ...d.schemes.filter((s) => s.status === "likely_eligible").map((s) => ({ id: s.id, type: "Scheme", label: s.name ?? s.id })),
    ...d.learning.filter((m) => m.progress_pct === 100).map((m) => ({ id: m.id, type: "LearningModule", label: m.title })),
    ...d.recommendations.slice(0, 2).map((r) => ({ id: r.id, type: "Recommendation", label: r.title })),
  ];
  if (d.snapshot.emergency_fund_months < 3) nodes.push({ id: "risk-ef", type: "Risk", label: "Less than three months of expenses saved" });
  const edges = nodes.map((n) => ({ from: "user", to: n.id, type: n.type }));
  const ef = d.goals.find((g) => g.type === "emergency_fund");
  if (ef && nodes.some((n) => n.id === "risk-ef")) edges.push({ from: "risk-ef", to: ef.id, type: "MITIGATED_BY" });
  const groups = ["Income", "Expense", "Goal", "Risk", "Scheme", "LearningModule", "Recommendation"];
  const names: Record<string, string> = { Income: "Income", Expense: "Spending", Goal: "Goals", Risk: "Risks", Scheme: "Schemes", LearningModule: "Lessons completed", Recommendation: "Recommendations" };
  return {
    nodes, edges, source: "sample",
    outline: groups.filter((g) => nodes.some((n) => n.type === g)).map((g) => ({ group: names[g], items: nodes.filter((n) => n.type === g).map((n) => n.label) })),
    insights: d.recommendations.slice(0, 2).map((r) => ({ text: r.why, agent: r.agent })),
  };
}
