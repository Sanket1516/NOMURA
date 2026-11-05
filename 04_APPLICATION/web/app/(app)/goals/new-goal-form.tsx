"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { Problem } from "@/lib/types";

export function NewGoalForm() {
  const router = useRouter();
  const [type, setType] = useState("emergency_fund");
  const [title, setTitle] = useState("Emergency fund");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<{ target?: string; date?: string }>({});
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    const t = Number(target.replace(/[,\s₹]/g, ""));
    if (!(t > 0)) errs.target = "Enter an amount in rupees";
    if (!date || new Date(date) <= new Date()) errs.date = "Choose a date in the future";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setProblem(null); setNotice(null);
    const res = await api<{ id: string }>("/v1/goals", { method: "POST", json: { type, title, target: { paise: Math.round(t * 100) }, target_date: date, priority: 1 }, headers: { "idempotency-key": crypto.randomUUID() } });
    setBusy(false);
    if (!res.ok) {
      if (isPreviewProblem(res.problem)) setNotice("Preview mode: the goal was not saved. Sign in to create real goals.");
      else setProblem(res.problem);
      return;
    }
    router.refresh();
    setTarget(""); setDate("");
    setNotice("Goal saved. Your plan is on the planning page.");
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {problem ? <Alert tone="danger" role="alert" title={problem.title}>{problem.detail}</Alert> : null}
      {notice ? <Alert tone="info" role="status" title={notice} /> : null}
      <Field label="Type">{(a) => (
        <Select id={a.id} value={type} onChange={(e) => { setType(e.target.value); setTitle(e.target.selectedOptions[0].text); }}>
          <option value="emergency_fund">Emergency fund</option><option value="education">Education</option><option value="home">Home</option>
          <option value="equipment">Equipment or vehicle</option><option value="retirement">Retirement</option><option value="other">Other</option>
        </Select>)}</Field>
      <Field label="Name">{(a) => <Input id={a.id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />}</Field>
      <Field label="Target amount (₹)" error={errors.target}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} inputMode="numeric" value={target} onChange={(e) => setTarget(e.target.value)} />}</Field>
      <Field label="Target date" error={errors.date}>{(a) => <Input id={a.id} aria-describedby={a.describedBy} aria-invalid={a.invalid} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}</Field>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save goal and build plan"}</Button>
    </form>
  );
}
