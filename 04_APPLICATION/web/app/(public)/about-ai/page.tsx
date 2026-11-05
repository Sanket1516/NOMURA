import type { Metadata } from "next";
import { uiLang } from "@/lib/server/data";
import { tr, type PageKey } from "@/lib/i18n/pages";

export const metadata: Metadata = { title: "How VAAKYA uses AI" };

export default async function AboutAi() {
  const lang = await uiLang();
  const rows = ([1, 2, 3, 4, 5, 6] as const).map((n) => [tr(lang, `ai.k${n}` as PageKey), tr(lang, `ai.v${n}` as PageKey)]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl">{tr(lang, "ai.title")}</h1>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {rows.map(([k, v]) => <div key={k} className="grid gap-1 p-5 sm:grid-cols-[180px_1fr]"><dt className="font-semibold">{k}</dt><dd className="text-ink-2">{v}</dd></div>)}
      </dl>
    </div>
  );
}
