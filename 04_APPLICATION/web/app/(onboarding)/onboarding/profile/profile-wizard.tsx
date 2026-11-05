"use client";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useAnnounce } from "@/components/a11y/live-region";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { IncomeType, Lang, PersonaId, Problem } from "@/lib/types";

interface Form {
  display_name: string; birth_year: string; occupation: string; state: string; district: string; rural: boolean;
  preferred_lang: Lang; income_type: IncomeType; dependents: string; literacy_level: "standard" | "low"; disability: string;
  income_min: string; income_max: string; expenses: string; emi: string; savings: string; risk: "low" | "medium" | "high"; goal: string;
}

// Starting answers only. Every value can be changed by the user.
const TEMPLATES: Record<PersonaId, Partial<Form>> = {
  priya: { occupation: "Teacher", state: "Maharashtra", income_type: "salaried", preferred_lang: "mr", dependents: "2", goal: "emergency_fund" },
  rajesh: { occupation: "Gig / delivery work", state: "Maharashtra", income_type: "variable", preferred_lang: "hi", dependents: "0", goal: "emergency_fund" },
  kisan: { occupation: "Farmer", state: "Karnataka", income_type: "seasonal", preferred_lang: "kn", rural: true, literacy_level: "low", dependents: "3", goal: "other" },
  divya: { occupation: "Writer", state: "Maharashtra", income_type: "salaried", preferred_lang: "en", disability: "visual", dependents: "0", goal: "emergency_fund" },
};

const EMPTY: Form = { display_name: "", birth_year: "", occupation: "", state: "", district: "", rural: false, preferred_lang: "en", income_type: "salaried",
  dependents: "0", literacy_level: "standard", disability: "", income_min: "", income_max: "", expenses: "", emi: "0", savings: "0", risk: "low", goal: "emergency_fund" };

const toPaise = (v: string) => Math.round(Number(v.replace(/[,\s₹]/g, "")) * 100);

export function ProfileWizard({ persona }: { persona: PersonaId | null }) {
  const announce = useAnnounce();
  const [part, setPart] = useState<1 | 2>(1);
  const [f, setF] = useState<Form>({ ...EMPTY, ...(persona ? TEMPLATES[persona] : {}) });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  // Move focus to the new step heading after it renders (keyboard and screen-reader users).
  useEffect(() => { if (part === 2) heading.current?.focus(); }, [part]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  function validate(p: 1 | 2) {
    const e: typeof errors = {};
    const year = Number(f.birth_year);
    if (p === 1) {
      if (!f.display_name.trim()) e.display_name = "Enter the name VAAKYA should use";
      if (!year || year < 1930 || year > new Date().getFullYear() - 16) e.birth_year = "Enter a birth year, for example 1994";
      if (!f.state.trim()) e.state = "Enter your state";
    } else {
      const lo = Number(f.income_min), hi = f.income_type === "salaried" ? lo : Number(f.income_max);
      if (!(lo > 0)) e.income_min = "Enter an amount in rupees";
      if (f.income_type !== "salaried" && !(hi >= lo)) e.income_max = "Must be at least the lowest month";
      if (!(Number(f.expenses) >= 0) || f.expenses === "") e.expenses = "Enter an amount in rupees";
    }
    setErrors(e);
    if (Object.keys(e).length) announce(`${Object.keys(e).length} fields need attention`, "assertive");
    return !Object.keys(e).length;
  }

  async function saveProfile() {
    if (!validate(1)) return;
    setBusy(true);
    const res = await api("/v1/me/profile", { method: "PUT", json: {
      display_name: f.display_name.trim(), birth_year: Number(f.birth_year), occupation: f.occupation, state: f.state, district: f.district,
      rural: f.rural, preferred_lang: f.preferred_lang, income_type: f.income_type, literacy_level: f.literacy_level,
      dependents: Number(f.dependents), disability: f.disability || null, persona,
    } });
    setBusy(false);
    if (!res.ok) { if (isPreviewProblem(res.problem)) setPreview(true); else { setProblem(res.problem); return; } }
    setPart(2);
  }

  async function finish() {
    if (!validate(2)) return;
    setBusy(true);
    const min = toPaise(f.income_min), max = f.income_type === "salaried" ? min : toPaise(f.income_max);
    const answers = [
      { question_id: "monthly_income", value: { min_paise: min, max_paise: max } },
      { question_id: "monthly_expenses", value: { paise: toPaise(f.expenses) } },
      { question_id: "loan_emi", value: { paise: toPaise(f.emi || "0") } },
      { question_id: "savings", value: { paise: toPaise(f.savings || "0") } },
      { question_id: "risk_preference", value: f.risk },
      { question_id: "primary_goal", value: f.goal },
    ].map((a) => ({ ...a, source: "typed" }));
    const r1 = await api("/v1/assessment/answers", { method: "POST", json: { answers } });
    const r2 = r1.ok ? await api("/v1/assessment/complete", { method: "POST", json: {} }) : r1;
    setBusy(false);
    if (!r2.ok && !isPreviewProblem(r2.problem)) { setProblem(r2.problem); return; }
    // Full navigation: the client router may hold the earlier /home → /onboarding redirect in its cache.
    window.location.assign("/home");
  }

  const err = (k: keyof Form) => errors[k];
  return (
    <div>
      {preview ? <Alert tone="info" role="status" title="Preview mode: answers are not saved" className="mb-4">Sign in with an account to save your profile and get your real score.</Alert> : null}
      {problem ? <Alert tone="danger" role="alert" title={problem.title} className="mb-4">{problem.detail}</Alert> : null}
      {part === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); void saveProfile(); }} noValidate className="space-y-5">
          <h1 className="font-display text-4xl">About you</h1>
          <p className="text-ink-2">Only what VAAKYA needs. Exact address, ID numbers and bank details are never asked.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What should we call you?" error={err("display_name")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} autoComplete="given-name" value={f.display_name} onChange={(e) => set("display_name", e.target.value)} />}</Field>
            <Field label="Year of birth" hint="Used for age-based schemes" error={err("birth_year")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.birth_year} onChange={(e) => set("birth_year", e.target.value)} />}</Field>
            <Field label="Work">{(a) => <Input id={a.id} value={f.occupation} onChange={(e) => set("occupation", e.target.value)} />}</Field>
            <Field label="How does your income arrive?">{(a) => (
              <Select id={a.id} value={f.income_type} onChange={(e) => set("income_type", e.target.value as IncomeType)}>
                <option value="salaried">Same amount every month</option><option value="variable">Changes every month</option><option value="seasonal">Mostly at harvest or season</option>
              </Select>)}</Field>
            <Field label="State" error={err("state")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} value={f.state} onChange={(e) => set("state", e.target.value)} />}</Field>
            <Field label="District" hint="Optional">{(a) => <Input id={a.id} aria-describedby={a.describedBy} value={f.district} onChange={(e) => set("district", e.target.value)} />}</Field>
            <Field label="Preferred language">{(a) => (
              <Select id={a.id} value={f.preferred_lang} onChange={(e) => set("preferred_lang", e.target.value as Lang)}>
                <option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option><option value="kn">ಕನ್ನಡ</option>
              </Select>)}</Field>
            <Field label="People who depend on your income">{(a) => <Input id={a.id} inputMode="numeric" value={f.dependents} onChange={(e) => set("dependents", e.target.value)} />}</Field>
            <Field label="Disability" hint="Optional. Used only to find relevant schemes and adjust the app.">{(a) => (
              <Select id={a.id} aria-describedby={a.describedBy} value={f.disability} onChange={(e) => set("disability", e.target.value)}>
                <option value="">Prefer not to say / none</option><option value="visual">Visual</option><option value="hearing">Hearing</option><option value="locomotor">Locomotor</option><option value="other">Other</option>
              </Select>)}</Field>
            <Field label="Explanations">{(a) => (
              <Select id={a.id} value={f.literacy_level} onChange={(e) => set("literacy_level", e.target.value as Form["literacy_level"])}>
                <option value="standard">Standard</option><option value="low">Very simple words, more voice</option>
              </Select>)}</Field>
          </div>
          <label className="flex items-center gap-3"><input type="checkbox" className="size-5" checked={f.rural} onChange={(e) => set("rural", e.target.checked)} />I live in a village or rural area</label>
          <Button type="submit" size="lg" disabled={busy}>{busy ? "Saving…" : "Continue"}</Button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void finish(); }} noValidate className="space-y-5">
          <h1 ref={heading} tabIndex={-1} className="font-display text-4xl">Your money</h1>
          <p className="text-ink-2">Round numbers are fine. Step 4 of 4.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.income_type === "salaried" ? "Monthly income (₹)" : "Income in a lean month (₹)"} error={err("income_min")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.income_min} onChange={(e) => set("income_min", e.target.value)} />}</Field>
            {f.income_type !== "salaried" ? <Field label="Income in a good month (₹)" error={err("income_max")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.income_max} onChange={(e) => set("income_max", e.target.value)} />}</Field> : null}
            <Field label="Monthly spending (₹)" error={err("expenses")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.expenses} onChange={(e) => set("expenses", e.target.value)} />}</Field>
            <Field label="Loan EMIs per month (₹)" hint="0 if none">{(a) => <Input id={a.id} aria-describedby={a.describedBy} inputMode="numeric" value={f.emi} onChange={(e) => set("emi", e.target.value)} />}</Field>
            <Field label="Savings you can reach quickly (₹)">{(a) => <Input id={a.id} inputMode="numeric" value={f.savings} onChange={(e) => set("savings", e.target.value)} />}</Field>
            <Field label="If an investment fell 10% in a month, you would…">{(a) => (
              <Select id={a.id} value={f.risk} onChange={(e) => set("risk", e.target.value as Form["risk"])}>
                <option value="low">Worry and want my money back</option><option value="medium">Wait and see</option><option value="high">Stay calm, it is long-term</option>
              </Select>)}</Field>
            <Field label="Most important goal">{(a) => (
              <Select id={a.id} value={f.goal} onChange={(e) => set("goal", e.target.value)}>
                <option value="emergency_fund">Emergency fund</option><option value="education">Children&apos;s education</option><option value="home">Home</option><option value="equipment">Equipment or vehicle</option><option value="retirement">Retirement</option><option value="other">Next season or other</option>
              </Select>)}</Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" size="lg" onClick={() => setPart(1)}>Back</Button>
            <Button type="submit" size="lg" disabled={busy}>{busy ? "Calculating…" : "See my score"}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
