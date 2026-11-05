import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock, CheckCircle2 } from "lucide-react";
import { loadDashboard } from "@/lib/server/data";
import { PageHeader } from "@/components/layout/page-header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Learn" };

export default async function LearnPage() {
  const d = await loadDashboard();
  const done = d.learning.filter((m) => m.progress_pct === 100).length;
  return (
    <>
      <PageHeader title="Learning Academy" origin={d.origin} description={`${done} of ${d.learning.length} core lessons complete. Short lessons, simple words, with a quiz at the end.`} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.learning.map((m) => (
          <li key={m.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center justify-between">
              <Badge tone="educator">{m.topic}</Badge>
              <span className="flex items-center gap-1 text-sm text-ink-3"><Clock aria-hidden className="size-3.5" />{m.minutes} min</span>
            </div>
            <h2 className="mt-3 font-display text-xl">{m.title}</h2>
            <Progress value={m.progress_pct} label={`${m.title}: ${m.progress_pct}% complete`} className="mt-4" tone={m.progress_pct === 100 ? "primary" : "accent"} />
            <p className="mt-2 text-sm text-ink-3">{m.progress_pct === 100 ? <span className="flex items-center gap-1 text-success"><CheckCircle2 aria-hidden className="size-4" />Complete</span> : m.progress_pct ? `${m.progress_pct}% done` : "Not started"}</p>
            <Link href={`/assistant?agent=educator&q=${encodeURIComponent(`Teach me: ${m.title}`)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-primary-soft px-4 font-semibold text-primary">
              <BookOpen aria-hidden className="size-4" />{m.progress_pct === 100 ? "Review" : m.progress_pct ? "Continue" : "Start"}<span className="sr-only"> {m.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink-3">Lessons are written for VAAKYA and are reviewed for accuracy before publication. Quizzes count towards your Financial literacy and Scam awareness scores.</p>
    </>
  );
}
