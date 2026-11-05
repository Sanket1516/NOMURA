"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { Lang, Problem } from "@/lib/types";
import { tr, type PageKey } from "@/lib/i18n/pages";

const ITEMS = [
  { purpose: "ai_processing", required: true, key: "ai" },
  { purpose: "document_storage", required: false, key: "doc" },
  { purpose: "voice_processing", required: false, key: "voice" },
] as const;

export const CONSENT_VERSION = "2026-11";

export function ConsentForm({ lang = "en" }: { lang?: Lang }) {
  const t = (k: PageKey) => tr(lang, k);
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({ ai_processing: false, document_storage: false, voice_processing: false });
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!checked.ai_processing) { setProblem({ type: "validation", title: t("onb.c.err.title"), status: 422, detail: t("onb.c.err.body") }); return; }
    setBusy(true);
    const res = await api("/v1/me/consents", { method: "PUT", json: { grants: ITEMS.map((i) => ({ purpose: i.purpose, version: CONSENT_VERSION, granted: checked[i.purpose], lang })) } });
    setBusy(false);
    if (!res.ok && !isPreviewProblem(res.problem)) { setProblem(res.problem); return; }
    router.push("/onboarding/persona");
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
      {problem ? <Alert tone="danger" role="alert" title={problem.title}>{problem.detail}</Alert> : null}
      {ITEMS.map((i) => (
        <label key={i.purpose} className="flex cursor-pointer gap-4 rounded-2xl border border-line bg-surface p-5 has-[:checked]:border-primary">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--primary)]" checked={checked[i.purpose]} onChange={(e) => setChecked({ ...checked, [i.purpose]: e.target.checked })}
            aria-describedby={`${i.purpose}-d`} />
          <span>
            <span className="font-semibold">{t(`onb.c.${i.key}.title` as PageKey)}</span> {i.required ? <span className="text-sm text-danger">{t("onb.required")}</span> : <span className="text-sm text-ink-3">{t("onb.optional")}</span>}
            <span id={`${i.purpose}-d`} className="mt-1 block text-sm text-ink-2">{t(`onb.c.${i.key}.body` as PageKey)}</span>
          </span>
        </label>
      ))}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">{busy ? t("onb.saving") : t("onb.agree")}</Button>
    </form>
  );
}
