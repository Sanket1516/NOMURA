import { describe, expect, it } from "vitest";
import { demoDashboard, PERSONAS } from "../lib/demo";
import { formatINR, spokenINR } from "../lib/format";

const monthsBetween = (fromIso: string, toIso: string) => {
  const a = new Date(fromIso), b = new Date(toIso);
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
};

describe("Indian formatting", () => {
  it("groups digits in lakhs", () => {
    expect(formatINR(156000)).toBe("₹1,56,000");
    expect(formatINR(12345678)).toBe("₹1,23,45,678");
  });
  it("speaks lakh and crore", () => {
    expect(spokenINR(156000)).toBe("one lakh fifty six thousand rupees");
    expect(spokenINR(12345678)).toBe("one crore twenty three lakh forty five thousand six hundred seventy eight rupees");
    expect(spokenINR(0)).toBe("zero rupees");
  });
});

describe.each(PERSONAS.map((p) => p.id))("demo data for %s is internally consistent", (id) => {
  const d = demoDashboard(id);
  it("is labelled demo", () => expect(d.origin).toBe("demo"));
  it("overall score is the rounded mean of the dimensions", () => {
    const mean = d.score.dimensions.reduce((s, x) => s + x.score, 0) / d.score.dimensions.length;
    expect(d.score.overall).toBe(Math.round(mean));
    expect(Math.abs(mean - Math.round(mean))).not.toBe(0.5); // avoid rounding-mode ambiguity with the API
    expect(d.score.history.at(-1)?.overall).toBe(d.score.overall);
    expect(d.score.change_30d).toBe(d.score.overall - d.score.history.at(-2)!.overall);
  });
  it("goal progress and dates match the monthly plan", () => {
    for (const g of d.goals) {
      expect(g.progress_pct).toBe(Math.round((g.saved.paise / g.target.paise) * 100));
      if (g.monthly_plan.paise > 0 && g.on_track) {
        const needed = Math.ceil((g.target.paise - g.saved.paise) / g.monthly_plan.paise);
        expect(monthsBetween("2026-11-01", g.target_date)).toBeGreaterThanOrEqual(needed);
      }
    }
  });
  it("this month's saving matches the trend", () => {
    expect(d.savings.trend.at(-1)?.saved_paise).toBe(d.savings.saved_this_month.paise);
  });
});
