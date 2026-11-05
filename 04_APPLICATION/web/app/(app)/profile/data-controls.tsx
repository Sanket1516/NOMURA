"use client";
import { useRef, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { api, isPreviewProblem } from "@/lib/client/api";

export function DataControls() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [msg, setMsg] = useState<{ tone: "info" | "danger" | "success"; text: string } | null>(null);
  const [confirmText, setConfirmText] = useState("");

  async function exportData() {
    const r = await api<{ export_id: string }>("/v1/me/export", { method: "POST", json: {} });
    setMsg(r.ok ? { tone: "success", text: "Your export is being prepared. It will appear here when ready." } : { tone: isPreviewProblem(r.problem) ? "info" : "danger", text: isPreviewProblem(r.problem) ? "Preview mode has no saved data to export." : r.problem.title });
  }
  async function deleteAll() {
    dialog.current?.close();
    const r = await api<{ complete_by: string }>("/v1/me", { method: "DELETE" });
    setMsg(r.ok ? { tone: "success", text: `Deletion started. Everything will be erased by ${r.data.complete_by}.` } : { tone: isPreviewProblem(r.problem) ? "info" : "danger", text: isPreviewProblem(r.problem) ? "Preview mode has no saved data to delete." : r.problem.title });
  }

  return (
    <div className="space-y-4">
      <p className="text-ink-2">Download everything VAAKYA stores about you, or erase it from every database and file store.</p>
      {msg ? <Alert tone={msg.tone} role="status" title={msg.text} /> : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => void exportData()}><Download aria-hidden className="size-4" />Export my data</Button>
        <Button variant="danger" onClick={() => { setConfirmText(""); dialog.current?.showModal(); }}><Trash2 aria-hidden className="size-4" />Delete my account</Button>
      </div>
      <dialog ref={dialog} aria-labelledby="del-h" className="m-auto max-w-md rounded-2xl bg-surface p-6 text-ink backdrop:bg-ink/50">
        <h2 id="del-h" className="font-display text-2xl">Delete everything?</h2>
        <p className="mt-2 text-ink-2">This erases your profile, documents, goals, conversations and score history. It cannot be undone.</p>
        <label className="mt-4 block text-sm font-semibold" htmlFor="del-confirm">Type DELETE to confirm</label>
        <input id="del-confirm" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2" autoComplete="off" />
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => dialog.current?.close()}>Cancel</Button>
          <Button variant="danger" disabled={confirmText !== "DELETE"} onClick={() => void deleteAll()}>Delete permanently</Button>
        </div>
      </dialog>
    </div>
  );
}
