import type { Metadata } from "next";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { RiskBadge } from "@/components/finance/risk";
import { ShieldCheck as Phone } from "lucide-react";
import { tr } from "@/lib/i18n/pages";
import { ScamCheck } from "./scam-check";

export const metadata: Metadata = { title: "Scam Shield" };

export default async function ShieldPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  return (
    <>
      <PageHeader tk="shield" title="Scam Shield" origin={d.origin} description="Check a message, offer, link or screenshot before you act. Sentinel never opens links or runs files you send." />
      <div className="stagger grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" aria-labelledby="check-h">
          <CardHeader id="check-h" eyebrow={tr(lang, "shield.check.eyebrow")} title={tr(lang, "shield.check.title")} />
          <ScamCheck lang={lang} />
        </Card>
        <div className="space-y-5 lg:col-span-5">
          <Card aria-labelledby="hist-h">
            <CardHeader id="hist-h" eyebrow={tr(lang, "shield.hist.eyebrow")} title={tr(lang, "shield.hist.title")} />
            {d.scam_alerts.length ? (
              <ul className="space-y-3">{d.scam_alerts.map((a) => (
                <li key={a.id} className="rounded-xl bg-surface-2 p-3">
                  <div className="flex items-center justify-between"><RiskBadge level={a.level} lang={lang} /><time className="text-xs text-ink-3" dateTime={a.at}>{formatDate(a.at)}</time></div>
                  <p className="mt-2 text-sm">{a.summary}</p>
                </li>))}
              </ul>
            ) : <p className="text-ink-2">{tr(lang, "shield.hist.empty")}</p>}
          </Card>
          <Card aria-labelledby="report-h">
            <CardHeader id="report-h" eyebrow={tr(lang, "shield.report.eyebrow")} title={tr(lang, "shield.report.title")} />
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><span>{tr(lang, "shield.report.call")} <a href="tel:1930" className="font-bold underline">1930</a> {tr(lang, "shield.report.call.after")}</span></li>
              <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><span>{tr(lang, "shield.report.online")} <a href="https://cybercrime.gov.in" className="font-semibold underline" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>.</span></li>
              <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><span>{tr(lang, "shield.report.bank")}</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
