import Link from "next/link";
import type { Metadata } from "next";
import { LogIn, UserPlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PersonaPicker } from "@/components/layout/persona-picker";
import { liveEnabled, config } from "@/lib/server/config";
import { cn } from "@/lib/cn";
import { uiLang } from "@/lib/server/data";
import { tr, type PageKey } from "@/lib/i18n/pages";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS = ["not_configured", "state_mismatch", "token_exchange", "invalid_callback", "preview_unavailable"];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const live = liveEnabled();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  return (
    <div className={`mx-auto grid max-w-5xl gap-8 px-4 py-8 ${config.previewEnabled ? "lg:grid-cols-2" : "max-w-xl"}`}>
      <section aria-labelledby="signin-h" className="rounded-[1.75rem] border border-line bg-surface p-7 shadow-card">
        <h1 id="signin-h" className="font-display text-4xl">{t("login.title")}</h1>
        <p className="mt-2 text-ink-2">{t("login.intro")}</p>
        {error ? <Alert tone="danger" role="alert" title={t("login.problem")} className="mt-5">{ERRORS.includes(error) ? t(`login.err.${error}` as PageKey) : t("login.err.default")}</Alert> : null}
        <div className="mt-6 flex flex-col gap-3">
          {live ? (
            <>
              <a href="/api/auth/login" className={cn(buttonVariants({ size: "lg" }))}><LogIn aria-hidden className="size-5" />{t("pub.signin")}</a>
              <Link href="/register" className={cn(buttonVariants({ size: "lg", variant: "secondary" }))}><UserPlus aria-hidden className="size-5" />{t("login.create")}</Link>
            </>
          ) : (
            <Alert tone="warning" title={t("login.noacct")}>{t("login.noacct.body")}</Alert>
          )}
        </div>
        <p className="mt-6 text-sm text-ink-3">{t("login.note")}</p>
      </section>

      {config.previewEnabled ? <section id="preview" aria-labelledby="preview-h" className="rounded-[1.75rem] border border-dashed border-demo/60 bg-demo-soft/40 p-7">
        <h2 id="preview-h" className="font-display text-3xl">{t("login.preview.title")}</h2>
        <p className="mt-2 text-ink-2">{t("login.preview.body")}</p>
        <PersonaPicker next={next ?? "/home"} action="/api/auth/preview" submitLabel="Preview as" />
      </section> : null}
    </div>
  );
}
