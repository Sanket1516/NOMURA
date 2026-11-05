import Link from "next/link";
import type { Metadata } from "next";
import { Check, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { config, liveEnabled } from "@/lib/server/config";
import { cn } from "@/lib/cn";
import { uiLang } from "@/lib/server/data";
import { tr, type PageKey } from "@/lib/i18n/pages";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const live = liveEnabled();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <section aria-labelledby="reg-h" className="rounded-[1.75rem] border border-line bg-surface p-7 shadow-card sm:p-10">
        <h1 id="reg-h" className="font-display text-4xl">{t("reg.title")}</h1>
        <p className="mt-2 text-ink-2">{t("reg.intro")}</p>
        <ol className="mt-6 space-y-3">
          {(["reg.s1", "reg.s2", "reg.s3", "reg.s4"] as PageKey[]).map((k, i) => { const s = t(k); return (
            <li key={s} className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{i + 1}</span><span>{s}</span></li>
          ); })}
        </ol>
        <ul className="mt-6 grid gap-2 rounded-2xl bg-surface-2 p-4 text-sm sm:grid-cols-2">
          {(["reg.b1", "reg.b2", "reg.b3", "reg.b4"] as PageKey[]).map((k) => (
            <li key={k} className="flex items-center gap-2"><Check aria-hidden className="size-4 text-success" />{t(k)}</li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-3">
          {live ? (
            <a href="/api/auth/login?register=1" className={cn(buttonVariants({ size: "lg" }))}><UserPlus aria-hidden className="size-5" />{t("reg.btn")}</a>
          ) : (
            <Alert tone="warning" title={t("reg.notconf")}>{t("reg.notconf.body")}</Alert>
          )}
          {config.previewEnabled ? <Link href="/login#preview" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}>{t("login.preview.title")}</Link> : null}
        </div>
        <p className="mt-6 text-sm text-ink-3">{t("reg.already")} <Link href="/login" className="font-semibold text-primary underline">{t("pub.signin")}</Link></p>
      </section>
    </div>
  );
}
