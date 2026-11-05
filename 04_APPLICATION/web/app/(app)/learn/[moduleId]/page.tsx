import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadDashboard } from "@/lib/server/data";
import { apiFetch, ApiError } from "@/lib/server/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Quiz, type QuizQuestion } from "./quiz";

export const metadata: Metadata = { title: "Lesson" };

interface Lesson { id: string; title: string; topic: string; minutes: number; sections: { heading: string; body: string }[]; quiz: QuizQuestion[]; progress_pct: number; content_status: string }

export default async function LessonPage({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const d = await loadDashboard();
  if (d.origin !== "live") {
    const m = d.learning.find((x) => x.id === moduleId);
    if (!m) notFound();
    return (
      <>
        <PageHeader title={m.title} origin={d.origin} />
        <Alert tone="info" title="Lessons and quizzes need an account">In preview you can see your sample progress ({m.progress_pct}%). Sign in to read the lesson and take the quiz, which counts towards your score.</Alert>
        <Link href="/learn" className="mt-4 inline-block font-semibold text-primary underline">Back to lessons</Link>
      </>
    );
  }
  let lesson: Lesson;
  try {
    lesson = await apiFetch<Lesson>(`/v1/learning/modules/${encodeURIComponent(moduleId)}`);
  } catch (e) {
    if (e instanceof ApiError && e.problem.status === 404) notFound();
    throw e;
  }
  return (
    <>
      <PageHeader eyebrow={`${lesson.topic} · ${lesson.minutes} min`} title={lesson.title} origin={d.origin}
        action={lesson.content_status !== "approved" ? <Badge tone="warning">Draft, under review</Badge> : undefined} />
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card aria-label="Lesson">
          <ol className="stagger space-y-6">
            {lesson.sections.map((s, i) => (
              <li key={s.heading} className="flex gap-4">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-educator-soft font-display text-educator">{i + 1}</span>
                <div><h2 className="font-display text-xl">{s.heading}</h2><p className="mt-1 leading-relaxed text-ink-2">{s.body}</p></div>
              </li>
            ))}
          </ol>
        </Card>
        <Card aria-labelledby="quiz-h">
          <h2 id="quiz-h" className="font-display text-2xl">Check yourself</h2>
          <p className="mt-1 text-sm text-ink-3">{lesson.quiz.length} questions. Your answers count towards your Confidence Score.</p>
          <Quiz moduleId={lesson.id} questions={lesson.quiz} />
        </Card>
      </div>
    </>
  );
}
