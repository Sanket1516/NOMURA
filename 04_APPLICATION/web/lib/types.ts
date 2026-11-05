// Types mirror 02_ARCHITECTURE/API_DESIGN.md. When the API exists, these are replaced by types
// generated from its OpenAPI document (FRONTEND_ARCHITECTURE §6).

export type Lang = "en" | "hi" | "mr" | "kn";
export type AgentId = "educator" | "strategy" | "sentinel" | "connector";
export type IncomeType = "salaried" | "variable" | "seasonal";
export type PersonaId = "priya" | "rajesh" | "kisan" | "divya";

/** Where a piece of data came from. Every screen shows this, so demo data is never mistaken for real data. */
export type DataOrigin = "demo" | "live";

export interface Money {
  paise: number;
  display: string;
  spoken?: string;
}

export interface Citation {
  id: string;
  title: string;
  publisher: string;
  url: string;
  effective_date?: string;
}

export interface AiMeta {
  agents: AgentId[];
  notice: string;
  citations: Citation[];
  request_id?: string;
  llm_used?: boolean;
}

export interface Profile {
  user_id: string;
  display_name: string;
  persona?: PersonaId;
  birth_year?: number;
  occupation: string;
  state: string;
  district: string;
  rural: boolean;
  preferred_lang: Lang;
  income_type: IncomeType;
  literacy_level: "standard" | "low";
  dependents: number;
  disability?: string | null;
}

export type ScoreBand = "Excellent" | "Good" | "Fair" | "Building";

export interface ScoreDimension {
  key: "literacy" | "safety" | "goal_planning" | "scheme_awareness" | "savings_discipline" | "debt_awareness";
  label: string;
  score: number;
  explanation: string;
}

export interface Score {
  overall: number;
  band: ScoreBand;
  formula_version: string;
  computed_at: string;
  change_30d: number;
  dimensions: ScoreDimension[];
  actions: { text: string; estimated_points: number; href: string }[];
  history: { month: string; overall: number }[];
  text_equivalent: string;
}

export interface Goal {
  id: string;
  type: "emergency_fund" | "education" | "home" | "retirement" | "equipment" | "other";
  title: string;
  target: Money;
  saved: Money;
  target_date: string;
  monthly_plan: Money;
  on_track: boolean;
  progress_pct: number;
}

export interface FinancialEntry {
  id: string;
  date: string;
  label: string;
  category: "income" | "expense" | "saving" | "loan";
  amount: Money;
  source: "typed" | "document" | "demo";
}

export interface AgentActivity {
  id: string;
  agent: AgentId;
  at: string;
  text: string;
  href: string;
}

export interface Recommendation {
  id: string;
  agent: AgentId;
  title: string;
  why: string;
  href: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface ScamAlert {
  id: string;
  at: string;
  level: RiskLevel;
  summary: string;
}

export interface LearningModule {
  id: string;
  title: string;
  minutes: number;
  progress_pct: number;
  topic: string;
}

export interface Notification {
  id: string;
  at: string;
  kind: "goal" | "scheme" | "scam" | "learning" | "review" | "system";
  title: string;
  body: string;
  read: boolean;
  href?: string;
}

export interface SchemeSummary {
  id: string;
  name: string;
  category: "agriculture" | "insurance" | "pension" | "credit" | "savings" | "disability";
  authority: string;
  summary: string;
  status: "likely_eligible" | "needs_info" | "not_eligible";
  last_verified_at: string | null;
  verification: "verified" | "unverified_draft";
  source_url: string;
}

export interface Dashboard {
  origin: DataOrigin;
  profile: Profile;
  score: Score;
  snapshot: { monthly_income: Money; monthly_expenses: Money; emergency_fund_months: number; savings_rate_pct: number };
  savings: { saved_this_month: Money; planned_this_month: Money; trend: { month: string; saved_paise: number }[] };
  goals: Goal[];
  entries: FinancialEntry[];
  activity: AgentActivity[];
  recommendations: Recommendation[];
  scam_alerts: ScamAlert[];
  learning: LearningModule[];
  notifications: Notification[];
  schemes: SchemeSummary[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  at: string;
  agent?: AgentId;
  ai?: AiMeta;
  attachment?: { kind: "image" | "audio"; name: string };
  audio_url?: string;
  status?: "sending" | "done" | "error";
  error?: string;
}

export interface SentinelReason {
  signal: string;
  severity: "low" | "medium" | "high" | "critical";
  evidence: string;
  explanation: string;
}

export interface SentinelVerdict {
  id: string;
  risk_level: RiskLevel;
  risk_indicator: number;
  indicator_label: string;
  reasons: SentinelReason[];
  actions: string[];
  ai: AiMeta;
}

/** RFC 9457 problem details, as returned by the API. */
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  request_id?: string;
}
