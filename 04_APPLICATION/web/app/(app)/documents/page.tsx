import type { Metadata } from "next";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { apiFetch } from "@/lib/server/api";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { tr } from "@/lib/i18n/pages";
import { DocumentHub, type Doc } from "./document-hub";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const docs = d.origin === "live" ? await apiFetch<Doc[]>("/v1/documents") : [];
  return (
    <>
      <PageHeader tk="documents" title="Your documents" origin={d.origin}
        description="Upload a salary slip or bank statement. VAAKYA reads it on its own server, shows you what it found, and uses nothing until you confirm." />
      {d.origin !== "live" ? <Alert tone="info" title={tr(lang, "doc.needacct")} className="mb-5">{tr(lang, "doc.needacct.body")}</Alert> : null}
      <DocumentHub initial={docs} live={d.origin === "live"} lang={lang} />
    </>
  );
}
