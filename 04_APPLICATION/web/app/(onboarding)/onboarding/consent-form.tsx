"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { Problem } from "@/lib/types";

const ITEMS = [
  { purpose: "ai_processing", required: true, title: "Use my answers to give me guidance", body: "Needed for your score, plans and answers. Identifiers are removed before the reasoning model sees your question." },
  { purpose: "document_storage", required: false, title: "Store documents I upload", body: "Encrypted and kept until you delete them. Only needed if you upload salary slips or statements." },
  { purpose: "voice_processing", required: false, title: "Process my voice", body: "Audio is turned into text on VAAKYA's server and then deleted. Not stored." },
] as const;

export const CONSENT_VERSION = "2026-11";

export function ConsentForm() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({ ai_processing: false, document_storage: false, voice_processing: false });
  const [problem, setProblem] = useState<Problem | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!checked.ai_processing) { setProblem({ type: "validation", title: "One permission is needed to continue", status: 422, detail: "VAAKYA cannot give guidance without processing your answers." }); return; }
    setBusy(true);
    const res = await api("/v1/me/consents", { method: "PUT", json: { grants: ITEMS.map((i) => ({ purpose: i.purpose, version: CONSENT_VERSION, granted: checked[i.purpose] })) } });
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
            <span className="font-semibold">{i.title}</span> {i.required ? <span className="text-sm text-danger">(required)</span> : <span className="text-sm text-ink-3">(optional)</span>}
            <span id={`${i.purpose}-d`} className="mt-1 block text-sm text-ink-2">{i.body}</span>
          </span>
        </label>
      ))}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">{busy ? "Saving…" : "Agree and continue"}</Button>
    </form>
  );
}
