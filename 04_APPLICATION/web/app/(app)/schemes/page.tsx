import type { Metadata } from "next";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { apiFetch } from "@/lib/server/api";
import type { SchemeSummary } from "@/lib/types";
import { ALL_SCHEMES } from "@/lib/demo";
import { PageHeader } from "@/components/layout/page-header";
import { Alert } from "@/components/ui/alert";
import { tr } from "@/lib/i18n/pages";
import { SchemeExplorer } from "./scheme-explorer";

export const metadata: Metadata = { title: "Government schemes" };

export default async function SchemesPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const statusById = Object.fromEntries(d.schemes.map((s) => [s.id, s.status]));
  // Live: the Connector evaluates every scheme against the profile. Preview: sample statuses.
  const catalogue: SchemeSummary[] = d.origin === "live"
    ? await apiFetch<SchemeSummary[]>("/v1/schemes")
    : ALL_SCHEMES.map((s) => ({ ...s, status: statusById[s.id] ?? "needs_info" }));
  return (
    <>
      <PageHeader tk="schemes" title="Government schemes" origin={d.origin} description="Schemes that may fit you, why, and the steps to apply. Final eligibility is always decided by the scheme authority." />
      {catalogue.some((s) => s.verification !== "verified") ? (
        <Alert tone="warning" title={tr(lang, "schemes.warn.title")} className="mb-5">
          {tr(lang, "schemes.warn.body")}
        </Alert>
      ) : null}
      <SchemeExplorer schemes={catalogue} lang={lang} />
    </>
  );
}
