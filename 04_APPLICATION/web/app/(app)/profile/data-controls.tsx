"use client";
import { useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, isPreviewProblem } from "@/lib/client/api";
import type { Lang } from "@/lib/types";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

export function DataControls({ lang = "en" }: { lang?: Lang }) {
  const t = (k: PageKey) => tr(lang, k);
  const dialog = useRef<HTMLDialogElement>(null);
  const [msg, setMsg] = useState<{ tone: "info" | "danger" | "success"; text: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function exportData() {
    const r = await api<{ export_id: string }>("/v1/me/export", { method: "POST", json: {} });
    setMsg(r.ok ? { tone: "success", text: t("dc.export.ok") } : { tone: isPreviewProblem(r.problem) ? "info" : "danger", text: isPreviewProblem(r.problem) ? t("dc.export.preview") : r.problem.title });
  }
  async function deleteAll() {
    dialog.current?.close();
    const r = await api<{ complete_by: string }>("/v1/me", { method: "DELETE" });
    setMsg(r.ok ? { tone: "success", text: trf(lang, "dc.delete.ok", { date: r.data.complete_by }) } : { tone: isPreviewProblem(r.problem) ? "info" : "danger", text: isPreviewProblem(r.problem) ? t("dc.delete.preview") : r.problem.title });
  }

  return (
    <div className="space-y-4">
      <p className="text-ink-2">{t("dc.intro")}</p>
      {msg ? <Alert tone={msg.tone} role="status" title={msg.text} /> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => void exportData()}><Download aria-hidden className="size-4" />{t("dc.export")}</Button>
        <Button variant="danger" onClick={() => { setConfirmText(""); dialog.current?.showModal(); }}><Trash2 aria-hidden className="size-4" />{t("dc.delete")}</Button>
      </div>
      <dialog ref={dialog} aria-labelledby="del-h" className="m-auto max-w-md rounded-2xl bg-surface p-6 text-ink backdrop:bg-ink/50">
        <h2 id="del-h" className="font-display text-2xl">{t("dc.dlg.title")}</h2>
        <p className="mt-2 text-ink-2">{t("dc.dlg.body")}</p>
        <label className="mt-4 block text-sm font-semibold" htmlFor="del-confirm">{t("dc.dlg.type")}</label>
        <input id="del-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2" autoComplete="off" />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => dialog.current?.close()}>{t("dc.cancel")}</Button>
          <Button variant="danger" disabled={confirmText !== "DELETE"} onClick={() => void deleteAll()}>{t("dc.permanent")}</Button>
        </div>
      </dialog>
    </div>
  );
}
