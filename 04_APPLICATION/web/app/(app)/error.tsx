"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { tr, type PageKey } from "@/lib/i18n/pages";
import type { Lang } from "@/lib/types";

function cookieLang(): Lang {
  const m = typeof document !== "undefined" ? document.cookie.match(/(?:^|; )vaakya_lang=(hi|mr|kn)/) : null;
  return (m?.[1] as Lang | undefined) ?? "en";
}

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = cookieLang();
  const t = (k: PageKey) => tr(lang, k);
  return (
    <div className="mx-auto max-w-xl space-y-4 py-10">
      <h1 className="font-display text-3xl">{t("err.title")}</h1>
      <Alert tone="danger" role="alert" title={t("err.alert")}>{error.digest ? <>{t("err.ref")} <code>{error.digest}</code></> : t("err.retry")}</Alert>
      <Button onClick={reset}>{t("err.btn")}</Button>
    </div>
  );
}
