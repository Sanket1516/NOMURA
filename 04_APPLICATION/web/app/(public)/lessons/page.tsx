import type { Metadata } from "next";
import { uiLang } from "@/lib/server/data";
import { publicGet, type LessonSummary } from "@/lib/server/public-api";
import { tr } from "@/lib/i18n/pages";
import { SaveOffline } from "@/components/layout/save-offline";

export const metadata: Metadata = { title: "Lessons" };

/** Public lesson list (no sign-in, nothing personal). Plain links, not client navigation, so a saved copy also opens offline. */
export default async function LessonsPage() {
  const lang = await uiLang();
  const list = await publicGet<LessonSummary[]>("/lessons");
  return (
    <div className="mx-auto max-w-3xl px-4 py-8" {...(list ? { "data-lesson-content": "true" } : {})}>
      <h1 className="font-display text-4xl">{tr(lang, "ls.h1")}</h1>
      <p className="mt-2 text-ink-2">{tr(lang, "ls.intro")}</p>
      {list ? (
        <>
          <ul className="mt-6 grid gap-3">
            {list.map((m) => (
              <li key={m.id} className="rounded-2xl border border-line bg-surface p-4">
                <a href={`/lessons/${encodeURIComponent(m.id)}`} className="font-display text-xl underline-offset-4 hover:underline">{m.title}</a>
                <p className="text-sm text-ink-3">{m.topic} · {m.minutes} {tr(lang, "learn.min")}</p>
              </li>
            ))}
          </ul>
          <SaveOffline ids={list.map((m) => m.id)} lang={lang} />
        </>
      ) : <p className="mt-6 rounded-xl bg-surface-2 p-4">{tr(lang, "ls.unavailable")}</p>}
    </div>
  );
}
