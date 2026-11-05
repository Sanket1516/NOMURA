import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/logo";
import { getViewer } from "@/lib/server/session";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  return (
    <div className="min-h-dvh">
      {viewer?.mode === "preview" ? <p className="bg-demo px-4 py-2 text-center text-sm text-white"><strong>Preview.</strong> Answers are not saved.</p> : null}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" aria-label="VAAKYA home"><Wordmark /></Link>
        <Link href="/settings/accessibility" className="text-sm font-semibold text-primary underline-offset-4 hover:underline">Accessibility</Link>
      </header>
      <main id="main" className="mx-auto max-w-3xl px-4 pb-16">{children}</main>
    </div>
  );
}
