import Link from "next/link";
import type { Metadata } from "next";
import { Check, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { config, liveEnabled } from "@/lib/server/config";
import { cn } from "@/lib/cn";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  const live = liveEnabled();
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <section aria-labelledby="reg-h" className="rounded-[1.75rem] border border-line bg-surface p-7 shadow-card sm:p-10">
        <h1 id="reg-h" className="font-display text-4xl">Create your VAAKYA account</h1>
        <p className="mt-2 text-ink-2">It takes about two minutes. Then a short check-up builds your Financial Confidence Score.</p>
        <ol className="mt-6 space-y-3">
          {["Create an account with your email (or Google)", "Agree to how your data is used. Each item is separate and you can withdraw it", "Choose who you are most like, then answer a few questions, by voice if you prefer", "See your score and your first plan"].map((s, i) => (
            <li key={s} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{i + 1}</span><span>{s}</span></li>
          ))}
        </ol>
        <ul className="mt-6 grid gap-2 rounded-2xl bg-surface-2 p-4 text-sm sm:grid-cols-2">
          {["No bank login needed", "Free and open-source software", "Delete your data any time", "Processed on VAAKYA's own server"].map((t) => (
            <li key={t} className="flex items-center gap-2"><Check aria-hidden className="size-4 text-success" />{t}</li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          {live ? (
            <a href="/api/auth/login?register=1" className={cn(buttonVariants({ size: "lg" }))}><UserPlus aria-hidden className="size-5" />Create account</a>
          ) : (
            <Alert tone="warning" title="Registration is not configured on this server">You can preview VAAKYA with sample data instead.</Alert>
          )}
          {config.previewEnabled ? <Link href="/login#preview" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}>Preview with sample data</Link> : null}
        </div>
        <p className="mt-6 text-sm text-ink-3">Already registered? <Link href="/login" className="font-semibold text-primary underline">Sign in</Link></p>
      </section>
    </div>
  );
}
