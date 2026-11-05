import type { Money } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** "₹1,56,000" from whole rupees. Indian digit grouping (NFR-I18N-02). */
export function formatINR(rupees: number): string {
  return inr.format(Math.round(rupees));
}

const ONES = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve",
  "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return [TENS[Math.floor(n / 10)], ONES[n % 10]].filter(Boolean).join(" ");
}
function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} hundred` : "", r ? belowHundred(r) : ""].filter(Boolean).join(" ");
}

/** Spoken English in the Indian system: 156000 → "one lakh fifty six thousand rupees". */
export function spokenINR(rupees: number): string {
  let n = Math.round(Math.abs(rupees));
  if (n === 0) return "zero rupees";
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  const parts = [
    crore ? `${belowThousand(crore)} crore` : "",
    lakh ? `${belowHundred(lakh)} lakh` : "",
    thousand ? `${belowHundred(thousand)} thousand` : "",
    n ? belowThousand(n) : "",
  ].filter(Boolean);
  return `${rupees < 0 ? "minus " : ""}${parts.join(" ")} rupees`;
}

export function money(rupees: number): Money {
  return { paise: Math.round(rupees * 100), display: formatINR(rupees), spoken: spokenINR(rupees) };
}

export function rupeesOf(m: Money): number {
  return m.paise / 100;
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat("en-IN", { ...opts, timeZone: "Asia/Kolkata" }).format(new Date(iso));
}

export function formatMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function bandOf(score: number): "Excellent" | "Good" | "Fair" | "Building" {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Building";
}
