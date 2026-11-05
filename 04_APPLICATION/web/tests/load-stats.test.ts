import { describe, expect, it } from "vitest";
import { percentile, summarise } from "../scripts/load_test.mjs";

describe("load test statistics", () => {
  it("nearest-rank percentiles", () => {
    const s = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(percentile(s, 50)).toBe(50);
    expect(percentile(s, 95)).toBe(95);
    expect(percentile(s, 99)).toBe(99);
    expect(percentile([7], 99)).toBe(7);
    expect(percentile([], 50)).toBeNaN();
  });
  it("counts status codes and uses only successful requests for latency", () => {
    const r = summarise([{ status: 200, ms: 10 }, { status: 200, ms: 30 }, { status: 429, ms: 500 }, { status: 0, ms: 9000 }], 2);
    expect(r).toMatchObject({ requests: 4, rps: 2, ok: 2, codes: { 200: 2, 429: 1, 0: 1 }, p50: 10, max: 30 });
  });
});
