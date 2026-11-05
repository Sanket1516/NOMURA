import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/logo";
import { LanguagePicker } from "@/components/layout/language-picker";
import { uiLang } from "@/lib/server/data";
import { tr } from "@/lib/i18n/pages";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const lang = await uiLang();
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
        <Link href="/" aria-label="VAAKYA home"><Wordmark /></Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <LanguagePicker current={lang} />
          <Link href="/login" className="hidden min-h-11 items-center rounded-full px-4 font-semibold text-ink hover:bg-surface-2 sm:inline-flex">{tr(lang, "pub.signin")}</Link>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink-3">
        <p>{tr(lang, "pub.foot1")}</p>
        <p className="mt-1">{tr(lang, "pub.foot2")} <Link href="/about-ai" className="underline">{tr(lang, "pub.howai")}</Link></p>
      </footer>
    </div>
  );
}
