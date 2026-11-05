"use client";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { useAnnounce } from "@/components/a11y/live-region";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { IncomeType, Lang, PersonaId, Problem } from "@/lib/types";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

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

export function ProfileWizard({ persona, ui = "en" }: { persona: PersonaId | null; ui?: Lang }) {
  const t = (k: PageKey) => tr(ui, k);
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
      if (!f.display_name.trim()) e.display_name = t("w.err.name");
      if (!year || year < 1930 || year > new Date().getFullYear() - 16) e.birth_year = t("w.err.year");
      if (!f.state.trim()) e.state = t("w.err.state");
    } else {
      const lo = Number(f.income_min), hi = f.income_type === "salaried" ? lo : Number(f.income_max);
      if (!(lo > 0)) e.income_min = t("w.err.amount");
      if (f.income_type !== "salaried" && !(hi >= lo)) e.income_max = t("w.err.max");
      if (!(Number(f.expenses) >= 0) || f.expenses === "") e.expenses = t("w.err.amount");
    }
    setErrors(e);
    if (Object.keys(e).length) announce(trf(ui, "w.err.count", { n: Object.keys(e).length }), "assertive");
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
      {preview ? <Alert tone="info" role="status" title={t("w.preview.title")} className="mb-4">{t("w.preview.body")}</Alert> : null}
      {problem ? <Alert tone="danger" role="alert" title={problem.title} className="mb-4">{problem.detail}</Alert> : null}
      {part === 1 ? (
        <form onSubmit={(e) => { e.preventDefault(); void saveProfile(); }} noValidate className="space-y-5">
          <h1 className="font-display text-4xl">{t("w.about")}</h1>
          <p className="text-ink-2">{t("w.about.intro")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("w.name")} error={err("display_name")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} autoComplete="given-name" value={f.display_name} onChange={(e) => set("display_name", e.target.value)} />}</Field>
            <Field label={t("w.year")} hint={t("w.year.hint")} error={err("birth_year")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.birth_year} onChange={(e) => set("birth_year", e.target.value)} />}</Field>
            <Field label={t("w.work")}>{(a) => <Input id={a.id} value={f.occupation} onChange={(e) => set("occupation", e.target.value)} />}</Field>
            <Field label={t("w.incomehow")}>{(a) => (
              <Select id={a.id} value={f.income_type} onChange={(e) => set("income_type", e.target.value as IncomeType)}>
                <option value="salaried">{t("prof.inc.salaried")}</option><option value="variable">{t("prof.inc.variable")}</option><option value="seasonal">{t("w.inc.seasonal")}</option>
              </Select>)}</Field>
            <Field label={t("w.state")} error={err("state")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} value={f.state} onChange={(e) => set("state", e.target.value)} />}</Field>
            <Field label={t("w.district")} hint={t("w.optional")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} value={f.district} onChange={(e) => set("district", e.target.value)} />}</Field>
            <Field label={t("w.preflang")}>{(a) => (
              <Select id={a.id} value={f.preferred_lang} onChange={(e) => set("preferred_lang", e.target.value as Lang)}>
                <option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option><option value="kn">ಕನ್ನಡ</option>
              </Select>)}</Field>
            <Field label={t("w.dependents")}>{(a) => <Input id={a.id} inputMode="numeric" value={f.dependents} onChange={(e) => set("dependents", e.target.value)} />}</Field>
            <Field label={t("prof.disability")} hint={t("w.disability.hint")}>{(a) => (
              <Select id={a.id} aria-describedby={a.describedBy} value={f.disability} onChange={(e) => set("disability", e.target.value)}>
                <option value="">{t("w.dis.none")}</option><option value="visual">{t("w.dis.visual")}</option><option value="hearing">{t("w.dis.hearing")}</option><option value="locomotor">{t("w.dis.locomotor")}</option><option value="other">{t("w.dis.other")}</option>
              </Select>)}</Field>
            <Field label={t("w.explain")}>{(a) => (
              <Select id={a.id} value={f.literacy_level} onChange={(e) => set("literacy_level", e.target.value as Form["literacy_level"])}>
                <option value="standard">{t("prof.standard")}</option><option value="low">{t("w.explain.low")}</option>
              </Select>)}</Field>
          </div>
          <label className="flex items-center gap-3"><input type="checkbox" className="size-5" checked={f.rural} onChange={(e) => set("rural", e.target.checked)} />{t("w.rural")}</label>
          <Button type="submit" size="lg" disabled={busy}>{busy ? t("onb.saving") : t("onb.continue")}</Button>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void finish(); }} noValidate className="space-y-5">
          <h1 ref={heading} tabIndex={-1} className="font-display text-4xl">{t("w.money")}</h1>
          <p className="text-ink-2">{t("w.money.intro")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={f.income_type === "salaried" ? t("w.inc.monthly") : t("w.inc.lean")} error={err("income_min")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.income_min} onChange={(e) => set("income_min", e.target.value)} />}</Field>
            {f.income_type !== "salaried" ? <Field label={t("w.inc.good")} error={err("income_max")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.income_max} onChange={(e) => set("income_max", e.target.value)} />}</Field> : null}
            <Field label={t("w.spend")} error={err("expenses")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={f.expenses} onChange={(e) => set("expenses", e.target.value)} />}</Field>
            <Field label={t("w.emi")} hint={t("w.emi.hint")}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} inputMode="numeric" value={f.emi} onChange={(e) => set("emi", e.target.value)} />}</Field>
            <Field label={t("w.savings")}>{(a) => <Input id={a.id} inputMode="numeric" value={f.savings} onChange={(e) => set("savings", e.target.value)} />}</Field>
            <Field label={t("w.risk")}>{(a) => (
              <Select id={a.id} value={f.risk} onChange={(e) => set("risk", e.target.value as Form["risk"])}>
                <option value="low">{t("w.risk.low")}</option><option value="medium">{t("w.risk.medium")}</option><option value="high">{t("w.risk.high")}</option>
              </Select>)}</Field>
            <Field label={t("w.goal")}>{(a) => (
              <Select id={a.id} value={f.goal} onChange={(e) => set("goal", e.target.value)}>
                <option value="emergency_fund">{t("goal.t.emergency")}</option><option value="education">{t("w.goal.education")}</option><option value="home">{t("goal.t.home")}</option><option value="equipment">{t("goal.t.equipment")}</option><option value="retirement">{t("goal.t.retirement")}</option><option value="other">{t("w.goal.other")}</option>
              </Select>)}</Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="secondary" size="lg" onClick={() => setPart(1)}>{t("w.back")}</Button>
            <Button type="submit" size="lg" disabled={busy}>{busy ? t("w.calc") : t("w.seescore")}</Button>
          </div>
        </form>
      )}
    </div>
  );
}
