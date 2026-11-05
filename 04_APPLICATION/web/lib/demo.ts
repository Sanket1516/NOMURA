// SYNTHETIC DEMONSTRATION DATA.
// The four personas come from the problem statement. Every figure here is invented for demonstration,
// and every screen that shows it carries the "Demo data" badge (DataOrigin = "demo").
// Scheme facts are summarised from official portals and are UNVERIFIED until T0.12 is done.
// Rule: arithmetic in this file must be internally consistent (checked by lib/demo.test.ts).

import { bandOf, money } from "./format";
import type {
  AgentActivity, Dashboard, FinancialEntry, Goal, LearningModule, Notification, PersonaId, Profile,
  Recommendation, ScamAlert, SchemeSummary, Score, ScoreDimension,
} from "./types";

export const DEMO_AS_OF = "2026-11-05T09:00:00+05:30";

function dims(v: [number, number, number, number, number, number]): ScoreDimension[] {
  const [literacy, safety, goal, scheme, savings, debt] = v;
  return [
    { key: "literacy", label: "Financial literacy", score: literacy, explanation: "Quiz accuracy and core lessons completed" },
    { key: "safety", label: "Scam awareness", score: safety, explanation: "Scam quiz accuracy, Digital Safety lesson and scam checks" },
    { key: "goal_planning", label: "Goal progress", score: goal, explanation: "A funded priority goal and goals on track" },
    { key: "scheme_awareness", label: "Scheme awareness", score: scheme, explanation: "Eligible schemes reviewed and applications started" },
    { key: "savings_discipline", label: "Savings behaviour", score: savings, explanation: "Months meeting your saving plan, of the last three" },
    { key: "debt_awareness", label: "Debt awareness", score: debt, explanation: "Loans lesson, loan-cost checks and a plan for costly debt" },
  ];
}

function score(v: [number, number, number, number, number, number], history: number[]): Score {
  const d = dims(v);
  const overall = Math.round(d.reduce((s, x) => s + x.score, 0) / d.length);
  const months = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"].slice(-history.length - 1);
  const hist = [...history, overall].map((o, i) => ({ month: months[i], overall: o }));
  const sorted = [...d].sort((a, b) => b.score - a.score);
  return {
    overall,
    band: bandOf(overall),
    formula_version: "fcs-1",
    computed_at: DEMO_AS_OF,
    change_30d: overall - history[history.length - 1],
    dimensions: d,
    actions: [
      { text: `Improve ${sorted[sorted.length - 1].label.toLowerCase()}`, estimated_points: 3, href: "/learn" },
      { text: "Review one scheme you may be eligible for", estimated_points: 2, href: "/schemes" },
      { text: "Check a suspicious message with Scam Shield", estimated_points: 1, href: "/shield" },
    ],
    history: hist,
    text_equivalent: `Score ${overall} out of 100, ${bandOf(overall)}. Strongest: ${sorted[0].label} ${sorted[0].score}. Weakest: ${sorted[sorted.length - 1].label} ${sorted[sorted.length - 1].score}.`,
  };
}

function goal(id: string, type: Goal["type"], title: string, target: number, saved: number, monthly: number, date: string, onTrack: boolean): Goal {
  return {
    id, type, title, target: money(target), saved: money(saved), monthly_plan: money(monthly), target_date: date,
    on_track: onTrack, progress_pct: Math.round((saved / target) * 100),
  };
}

const SCHEMES: Record<string, SchemeSummary> = {
  "pm-kisan": { id: "pm-kisan", name: "PM-KISAN", category: "agriculture", authority: "Ministry of Agriculture & Farmers Welfare",
    summary: "Income support of ₹6,000 a year, paid in three instalments, to eligible landholding farmer families.",
    status: "likely_eligible", last_verified_at: null, verification: "unverified_draft", source_url: "https://pmkisan.gov.in" },
  pmfby: { id: "pmfby", name: "Pradhan Mantri Fasal Bima Yojana", category: "agriculture", authority: "Ministry of Agriculture & Farmers Welfare",
    summary: "Crop insurance against yield loss for notified crops in notified areas.",
    status: "needs_info", last_verified_at: null, verification: "unverified_draft", source_url: "https://pmfby.gov.in" },
  kcc: { id: "kcc", name: "Kisan Credit Card", category: "credit", authority: "Banks, under RBI guidelines",
    summary: "Short-term credit for crop cultivation and allied activities through a bank.",
    status: "likely_eligible", last_verified_at: null, verification: "unverified_draft", source_url: "https://www.myscheme.gov.in" },
  pmjjby: { id: "pmjjby", name: "PM Jeevan Jyoti Bima Yojana", category: "insurance", authority: "Department of Financial Services",
    summary: "Life cover of ₹2 lakh for bank account holders aged 18 to 50.",
    status: "likely_eligible", last_verified_at: null, verification: "unverified_draft", source_url: "https://jansuraksha.gov.in" },
  pmsby: { id: "pmsby", name: "PM Suraksha Bima Yojana", category: "insurance", authority: "Department of Financial Services",
    summary: "Accident cover for bank account holders aged 18 to 70.",
    status: "likely_eligible", last_verified_at: null, verification: "unverified_draft", source_url: "https://jansuraksha.gov.in" },
  apy: { id: "apy", name: "Atal Pension Yojana", category: "pension", authority: "PFRDA",
    summary: "A guaranteed monthly pension from age 60 for subscribers who join between 18 and 40 and are not income-tax payers.",
    status: "needs_info", last_verified_at: null, verification: "unverified_draft", source_url: "https://www.pfrda.org.in" },
  udid: { id: "udid", name: "UDID card (Unique Disability ID)", category: "disability", authority: "Department of Empowerment of Persons with Disabilities",
    summary: "A single national disability ID that many disability benefits ask for.",
    status: "likely_eligible", last_verified_at: null, verification: "unverified_draft", source_url: "https://www.swavlambancard.gov.in" },
};
const schemes = (...ids: string[]) => ids.map((i) => SCHEMES[i]);

const LEARN = (p: [number, number, number, number, number, number]): LearningModule[] => [
  { id: "emergency-fund", title: "Emergency Fund", minutes: 6, topic: "Saving", progress_pct: p[0] },
  { id: "smart-budgeting", title: "Smart Budgeting", minutes: 7, topic: "Saving", progress_pct: p[1] },
  { id: "digital-safety", title: "Digital Safety", minutes: 8, topic: "Protection", progress_pct: p[2] },
  { id: "sip-basics", title: "SIP Basics", minutes: 8, topic: "Investing", progress_pct: p[3] },
  { id: "insurance-101", title: "Insurance 101", minutes: 9, topic: "Protection", progress_pct: p[4] },
  { id: "credit-score", title: "Loans and Credit Score", minutes: 7, topic: "Borrowing", progress_pct: p[5] },
];

function entry(id: string, date: string, label: string, category: FinancialEntry["category"], rupees: number): FinancialEntry {
  return { id, date, label, category, amount: money(rupees), source: "demo" };
}

interface PersonaSeed {
  profile: Profile;
  income: number;
  expenses: number;
  emergencySaved: number;
  savedThisMonth: number;
  plannedThisMonth: number;
  trend: number[];
  score: [number, number, number, number, number, number];
  history: number[];
  goals: Goal[];
  entries: FinancialEntry[];
  activity: AgentActivity[];
  recommendations: Recommendation[];
  scam: ScamAlert[];
  learning: LearningModule[];
  notifications: Notification[];
  schemes: SchemeSummary[];
}

const SEEDS: Record<PersonaId, PersonaSeed> = {
  priya: {
    profile: { user_id: "demo-priya", display_name: "Priya", persona: "priya", birth_year: 1994, occupation: "School teacher", state: "Maharashtra",
      district: "Thane", rural: false, preferred_lang: "mr", income_type: "salaried", literacy_level: "standard", dependents: 2 },
    income: 35000, expenses: 26000, emergencySaved: 42000, savedThisMonth: 5000, plannedThisMonth: 5000,
    trend: [3000, 4000, 4500, 5000, 5000, 5000],
    score: [72, 64, 58, 45, 70, 67], history: [51, 55, 58, 60, 60],
    goals: [
      goal("g-ef", "emergency_fund", "Emergency fund (6 months)", 156000, 42000, 5000, "2028-10-31", true),
      goal("g-edu", "education", "Children's education", 500000, 60000, 3000, "2036-06-30", false),
    ],
    entries: [
      entry("e1", "2026-11-01", "Salary credited", "income", 35000),
      entry("e2", "2026-11-02", "Rent", "expense", 11000),
      entry("e3", "2026-11-02", "Emergency fund transfer", "saving", 5000),
      entry("e4", "2026-11-03", "Groceries", "expense", 4200),
      entry("e5", "2026-11-04", "School fees, son", "expense", 2500),
    ],
    activity: [
      { id: "a1", agent: "educator", at: "2026-11-04T19:10:00+05:30", text: "Explained ULIP vs term insurance + mutual fund, with 3 sources", href: "/assistant" },
      { id: "a2", agent: "strategy", at: "2026-11-02T08:30:00+05:30", text: "Updated emergency-fund plan after your ₹5,000 transfer", href: "/goals" },
      { id: "a3", agent: "connector", at: "2026-10-28T18:00:00+05:30", text: "Found 2 insurance schemes you may be eligible for", href: "/schemes" },
    ],
    recommendations: [
      { id: "r1", agent: "strategy", title: "Keep the ₹5,000 monthly transfer for 23 more months", why: "Reaches 6 months of expenses (₹1,56,000) by Oct 2028 at the current rate", href: "/goals" },
      { id: "r2", agent: "educator", title: "Finish Insurance 101 before deciding on the ULIP offer", why: "Your last question was about a ULIP sold at school", href: "/learn" },
      { id: "r3", agent: "connector", title: "Review PMJJBY", why: "Age and bank account match the published criteria (unverified draft)", href: "/schemes" },
    ],
    scam: [{ id: "s1", at: "2026-10-30T21:00:00+05:30", level: "high", summary: "SMS asking to update KYC through a link" }],
    learning: LEARN([100, 100, 60, 40, 20, 0]),
    notifications: [
      { id: "n1", at: "2026-11-05T08:00:00+05:30", kind: "review", title: "October review is ready", body: "Your score rose 3 points.", read: false, href: "/score" },
      { id: "n2", at: "2026-11-02T08:31:00+05:30", kind: "goal", title: "Emergency fund on track", body: "₹42,000 of ₹1,56,000 saved.", read: false, href: "/goals" },
      { id: "n3", at: "2026-10-30T21:02:00+05:30", kind: "scam", title: "High-risk message checked", body: "Do not open KYC links sent by SMS.", read: true, href: "/shield" },
      { id: "n4", at: "2026-10-28T18:01:00+05:30", kind: "scheme", title: "2 schemes to review", body: "PMJJBY and PMSBY.", read: true, href: "/schemes" },
    ],
    schemes: schemes("pmjjby", "pmsby", "apy"),
  },
  rajesh: {
    profile: { user_id: "demo-rajesh", display_name: "Rajesh", persona: "rajesh", birth_year: 2002, occupation: "Delivery partner (gig)", state: "Maharashtra",
      district: "Mumbai", rural: false, preferred_lang: "hi", income_type: "variable", literacy_level: "standard", dependents: 0 },
    income: 26000, expenses: 19000, emergencySaved: 9500, savedThisMonth: 1800, plannedThisMonth: 3120,
    trend: [1800, 4200, 2500, 1800, 3600, 1800],
    score: [48, 41, 44, 30, 52, 35], history: [33, 36, 38, 40, 41],
    goals: [
      goal("g-ef", "emergency_fund", "Emergency fund (6 months)", 114000, 9500, 3120, "2029-09-30", false),
      goal("g-bike", "equipment", "Own e-bike (stop renting)", 65000, 6000, 2500, "2028-11-30", true),
    ],
    entries: [
      entry("e1", "2026-11-04", "Weekly payout", "income", 4100),
      entry("e2", "2026-11-03", "E-bike rent", "expense", 900),
      entry("e3", "2026-11-03", "Saved 12% of payout", "saving", 490),
      entry("e4", "2026-10-28", "Weekly payout", "income", 9200),
      entry("e5", "2026-10-25", "Phone EMI", "loan", 1600),
    ],
    activity: [
      { id: "a1", agent: "sentinel", at: "2026-11-03T22:40:00+05:30", text: "Rated an instant-loan app offer CRITICAL: asks for contact-list access", href: "/shield" },
      { id: "a2", agent: "strategy", at: "2026-11-01T09:00:00+05:30", text: "Built a 12%-of-income saving rule with a ₹1,800 lean-month floor", href: "/planning" },
    ],
    recommendations: [
      { id: "r1", agent: "strategy", title: "Save 12% of every payout, never less than ₹1,800 a month", why: "Your income varied from ₹15,000 to ₹40,000 a month; a percentage works in lean months", href: "/planning" },
      { id: "r2", agent: "sentinel", title: "Delete the instant-loan app", why: "It asked for contacts and offered loans with no lender named", href: "/shield" },
      { id: "r3", agent: "educator", title: "Start 'Loans and Credit Score'", why: "Debt awareness is your lowest dimension", href: "/learn" },
    ],
    scam: [
      { id: "s1", at: "2026-11-03T22:40:00+05:30", level: "critical", summary: "Instant loan app: no lender named, contact access, 'approval in 5 minutes'" },
      { id: "s2", at: "2026-10-20T14:00:00+05:30", level: "medium", summary: "WhatsApp 'part-time job' paying per like" },
    ],
    learning: LEARN([100, 50, 30, 0, 0, 10]),
    notifications: [
      { id: "n1", at: "2026-11-04T09:00:00+05:30", kind: "goal", title: "Lean month: floor reached", body: "₹1,800 saved this month. That keeps your plan alive.", read: false, href: "/goals" },
      { id: "n2", at: "2026-11-03T22:41:00+05:30", kind: "scam", title: "Critical risk found", body: "Do not install the loan app.", read: false, href: "/shield" },
    ],
    schemes: schemes("pmjjby", "pmsby", "apy"),
  },
  kisan: {
    profile: { user_id: "demo-kisan", display_name: "Kisan", persona: "kisan", birth_year: 1981, occupation: "Farmer, 3 acres", state: "Karnataka",
      district: "Dharwad", rural: true, preferred_lang: "kn", income_type: "seasonal", literacy_level: "low", dependents: 3 },
    income: 15000, expenses: 9000, emergencySaved: 18000, savedThisMonth: 0, plannedThisMonth: 0,
    trend: [0, 0, 0, 20000, 0, 0],
    score: [55, 50, 47, 62, 49, 51], history: [41, 45, 47, 50, 51],
    goals: [
      goal("g-seed", "other", "Next-season seeds and fertiliser", 35000, 35000, 0, "2027-05-31", true),
      goal("g-edu", "education", "Daughter's college", 300000, 25000, 2000, "2033-06-30", false),
    ],
    entries: [
      entry("e1", "2026-10-18", "Kharif harvest sale (soybean)", "income", 120000),
      entry("e2", "2026-10-19", "Set aside for next season", "saving", 35000),
      entry("e3", "2026-10-22", "Repaid input loan", "loan", 30000),
      entry("e4", "2026-11-01", "Household expenses", "expense", 9000),
    ],
    activity: [
      { id: "a1", agent: "connector", at: "2026-10-25T10:00:00+05:30", text: "Checked PM-KISAN, PMFBY and KCC, in Kannada", href: "/schemes" },
      { id: "a2", agent: "strategy", at: "2026-10-19T08:00:00+05:30", text: "Split harvest money: next season, household months, school fees", href: "/planning" },
    ],
    recommendations: [
      { id: "r1", agent: "connector", title: "Answer one question for crop insurance", why: "PMFBY depends on whether your crop is notified in your area", href: "/schemes" },
      { id: "r2", agent: "strategy", title: "₹35,000 is set aside for June sowing", why: "Keep it separate so you avoid a high-interest input loan next season", href: "/goals" },
    ],
    scam: [],
    learning: LEARN([60, 40, 20, 0, 30, 0]),
    notifications: [
      { id: "n1", at: "2026-10-25T10:01:00+05:30", kind: "scheme", title: "3 farm schemes checked", body: "1 needs one answer from you.", read: false, href: "/schemes" },
    ],
    schemes: schemes("pm-kisan", "pmfby", "kcc", "pmsby"),
  },
  divya: {
    profile: { user_id: "demo-divya", display_name: "Divya", persona: "divya", birth_year: 1998, occupation: "Content writer", state: "Maharashtra",
      district: "Pune", rural: false, preferred_lang: "en", income_type: "salaried", literacy_level: "standard", dependents: 0, disability: "visual" },
    income: 25000, expenses: 17000, emergencySaved: 51000, savedThisMonth: 4000, plannedThisMonth: 4000,
    trend: [3500, 4000, 4000, 4000, 3000, 4000],
    score: [68, 74, 61, 52, 65, 60], history: [55, 57, 60, 61, 62],
    goals: [
      goal("g-ef", "emergency_fund", "Emergency fund (6 months)", 102000, 51000, 4000, "2027-12-31", true),
      goal("g-device", "equipment", "Braille display", 90000, 30000, 3000, "2028-07-31", true),
    ],
    entries: [
      entry("e1", "2026-11-01", "Salary credited", "income", 25000),
      entry("e2", "2026-11-01", "Shared flat rent", "expense", 8000),
      entry("e3", "2026-11-02", "Emergency fund transfer", "saving", 4000),
      entry("e4", "2026-11-03", "Screen-reader licence renewal", "expense", 1200),
    ],
    activity: [
      { id: "a1", agent: "connector", at: "2026-11-01T11:00:00+05:30", text: "Explained the UDID card and the documents it needs", href: "/schemes" },
      { id: "a2", agent: "educator", at: "2026-10-29T20:00:00+05:30", text: "Voice summary of your score, read aloud", href: "/score" },
    ],
    recommendations: [
      { id: "r1", agent: "connector", title: "Apply for a UDID card", why: "Many disability benefits ask for it", href: "/schemes" },
      { id: "r2", agent: "strategy", title: "Emergency fund is half done", why: "₹51,000 of ₹1,02,000; 13 months to go at ₹4,000", href: "/goals" },
    ],
    scam: [{ id: "s1", at: "2026-10-12T12:00:00+05:30", level: "low", summary: "Bank newsletter email with no links to act on" }],
    learning: LEARN([100, 100, 100, 50, 40, 20]),
    notifications: [
      { id: "n1", at: "2026-11-01T11:01:00+05:30", kind: "scheme", title: "UDID card steps saved", body: "4 steps, with the document list.", read: false, href: "/schemes" },
    ],
    schemes: schemes("udid", "pmjjby", "pmsby", "apy"),
  },
};

export const PERSONAS: { id: PersonaId; name: string; tagline: string; lang: string }[] = [
  { id: "priya", name: "Priya", tagline: "32, school teacher, Thane. Salaried. Marathi.", lang: "मराठी" },
  { id: "rajesh", name: "Rajesh", tagline: "24, delivery partner, Mumbai. Income changes every month.", lang: "हिन्दी" },
  { id: "kisan", name: "Kisan", tagline: "45, farmer with 3 acres, Karnataka. Seasonal income.", lang: "ಕನ್ನಡ" },
  { id: "divya", name: "Divya", tagline: "28, content writer, Pune. Uses a screen reader.", lang: "English" },
];

export function isPersona(x: string | undefined | null): x is PersonaId {
  return x === "priya" || x === "rajesh" || x === "kisan" || x === "divya";
}

export function demoDashboard(id: PersonaId): Dashboard {
  const s = SEEDS[id];
  const months = ["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"];
  return {
    origin: "demo",
    profile: s.profile,
    score: score(s.score, s.history),
    snapshot: {
      monthly_income: money(s.income),
      monthly_expenses: money(s.expenses),
      emergency_fund_months: Math.round((s.emergencySaved / s.expenses) * 10) / 10,
      savings_rate_pct: Math.round((s.plannedThisMonth / s.income) * 100),
    },
    savings: {
      saved_this_month: money(s.savedThisMonth),
      planned_this_month: money(s.plannedThisMonth),
      trend: s.trend.map((r, i) => ({ month: months[i], saved_paise: r * 100 })),
    },
    goals: s.goals,
    entries: s.entries,
    activity: s.activity,
    recommendations: s.recommendations,
    scam_alerts: s.scam,
    learning: s.learning,
    notifications: s.notifications,
    schemes: s.schemes,
  };
}

export const ALL_SCHEMES: SchemeSummary[] = Object.values(SCHEMES);
