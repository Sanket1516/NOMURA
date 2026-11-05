import Link from "next/link";
import { uiLang } from "@/lib/server/data";
import { tr } from "@/lib/i18n/pages";
export default async function NotFound() {
  const lang = await uiLang();
  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-4xl">{tr(lang, "nf.title")}</h1>
      <p className="mt-3 text-ink-2">{tr(lang, "nf.body")}</p>
      <Link href="/home" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-6 font-semibold text-primary-ink">{tr(lang, "nf.home")}</Link>
    </main>
  );
}
