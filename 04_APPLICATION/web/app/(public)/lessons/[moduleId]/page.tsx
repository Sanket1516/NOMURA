import type { Metadata } from "next";
import { uiLang } from "@/lib/server/data";
import { publicGet, type LessonText } from "@/lib/server/public-api";
import { tr } from "@/lib/i18n/pages";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Lesson" };

export default async function PublicLesson({ params }: { params: Promise<{ moduleId: string }> }) {
  const { moduleId } = await params;
  const lang = await uiLang();
  const m = await publicGet<LessonText>(`/lessons/${encodeURIComponent(moduleId)}`);
  if (!m) return <div className="mx-auto max-w-3xl px-4 py-8"><p className="rounded-xl bg-surface-2 p-4">{tr(lang, "ls.unavailable")}</p></div>;
  return (
    <article className="mx-auto max-w-3xl px-4 py-8" data-lesson-content="true">
      <p className="text-sm font-semibold text-primary">{m.topic} · {m.minutes} {tr(lang, "learn.min")}</p>
      <h1 className="mt-1 font-display text-4xl">{m.title}</h1>
      {m.content_status !== "approved" ? <div className="mt-3"><Badge tone="warning">{tr(lang, "les.draft")}</Badge></div> : null}
      <ol className="mt-6 space-y-6">
        {m.sections.map((s, i) => (
          <li key={s.heading} className="flex gap-4">
            <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-educator-soft font-display text-educator">{i + 1}</span>
            <div><h2 className="font-display text-xl">{s.heading}</h2><p className="mt-1 leading-relaxed text-ink-2">{s.body}</p></div>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-sm text-ink-2">{tr(lang, "ls.quiznote")}</p>
      <p className="mt-4"><a href="/lessons" className="font-semibold text-primary underline">{tr(lang, "les.back")}</a></p>
    </article>
  );
}
