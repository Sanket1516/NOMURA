"use client";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useAnnounce } from "@/components/a11y/live-region";
import { api } from "@/lib/client/api";
import { cn } from "@/lib/cn";
import type { Problem } from "@/lib/types";

export interface QuizQuestion { id: string; q: string; options: string[] }
interface Result { correct: number; total: number; results: Record<string, boolean>; explanations: Record<string, string>; score_overall: number }

export function Quiz({ moduleId, questions }: { moduleId: string; questions: QuizQuestion[] }) {
  const router = useRouter();
  const announce = useAnnounce();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(answers).length < questions.length) { setProblem({ type: "validation", title: "Answer every question", status: 422 }); return; }
    setBusy(true); setProblem(null);
    await api(`/v1/learning/modules/${moduleId}/complete`, { method: "POST", json: {} });
    const r = await api<Result>(`/v1/learning/modules/${moduleId}/quiz-attempts`, { method: "POST", json: { answers } });
    setBusy(false);
    if (!r.ok) { setProblem(r.problem); return; }
    setResult(r.data);
    announce(`${r.data.correct} of ${r.data.total} correct. Your score is now ${r.data.score_overall}.`, "assertive");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-5">
      {questions.map((q, qi) => (
        <fieldset key={q.id} className="rounded-xl border border-line p-4">
          <legend className="px-1 font-semibold">{qi + 1}. {q.q}</legend>
          <div className="mt-2 space-y-2">
            {q.options.map((o, oi) => {
              const verdict = result && answers[q.id] === oi ? result.results[q.id] : null;
              return (
                <label key={o} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 has-[:checked]:bg-primary-soft",
                  verdict === true && "ring-2 ring-success", verdict === false && "ring-2 ring-danger")}>
                  <input type="radio" name={q.id} className="size-5" checked={answers[q.id] === oi} disabled={Boolean(result)}
                    onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                  <span className="flex-1">{o}</span>
                  {verdict === true ? <CheckCircle2 aria-label="Correct" className="size-5 text-success" /> : verdict === false ? <XCircle aria-label="Not correct" className="size-5 text-danger" /> : null}
                </label>
              );
            })}
          </div>
          {result && !result.results[q.id] ? <p className="mt-2 text-sm text-ink-2"><strong>Answer:</strong> {result.explanations[q.id]}</p> : null}
        </fieldset>
      ))}
      {problem ? <Alert tone="danger" role="alert" title={problem.title}>{problem.detail}</Alert> : null}
      {result ? (
        <Alert tone="success" role="status" title={`${result.correct} of ${result.total} correct`}>Your Confidence Score is now {result.score_overall}.</Alert>
      ) : <Button type="submit" disabled={busy} className="w-full">{busy ? "Checking…" : "Submit answers"}</Button>}
    </form>
  );
}
