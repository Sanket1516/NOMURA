import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/logo";
import { getViewer } from "@/lib/server/session";
import { uiLang } from "@/lib/server/data";
import { tr } from "@/lib/i18n/pages";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  const lang = await uiLang();
  return (
    <div className="min-h-dvh">
      {viewer?.mode === "preview" ? <p className="bg-demo px-4 py-2 text-center text-sm text-white">{tr(lang, "onb.preview")}</p> : null}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="VAAKYA home"><Wordmark /></Link>
        <Link href="/settings/accessibility" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">{tr(lang, "accessibility.title")}</Link>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-16">{children}</main>
    </div>
  );
}
