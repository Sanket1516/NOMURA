import type { Metadata } from "next";
import { loadDashboard } from "@/lib/server/data";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { RiskBadge } from "@/components/finance/risk";
import { ShieldCheck as Phone } from "lucide-react";
import { ScamCheck } from "./scam-check";

export const metadata: Metadata = { title: "Scam Shield" };

export default async function ShieldPage() {
  const d = await loadDashboard();
  return (
    <>
      <PageHeader title="Scam Shield" origin={d.origin} description="Check a message, offer, link or screenshot before you act. Sentinel never opens links or runs files you send." />
      <div className="grid gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-7" aria-labelledby="check-h">
          <CardHeader id="check-h" eyebrow="Sentinel" title="Check something suspicious" />
          <ScamCheck />
        </Card>
        <div className="space-y-5 lg:col-span-5">
          <Card aria-labelledby="hist-h">
            <CardHeader id="hist-h" eyebrow="History" title="Your recent checks" />
            {d.scam_alerts.length ? (
              <ul className="space-y-3">{d.scam_alerts.map((a) => (
                <li key={a.id} className="rounded-xl bg-surface-2 p-3">
                  <div className="flex items-center justify-between"><RiskBadge level={a.level} /><time className="text-xs text-ink-3" dateTime={a.at}>{formatDate(a.at)}</time></div>
                  <p className="mt-2 text-sm">{a.summary}</p>
                </li>))}
              </ul>
            ) : <p className="text-ink-2">No checks yet.</p>}
          </Card>
          <Card aria-labelledby="report-h">
            <CardHeader id="report-h" eyebrow="If you lost money" title="Report it quickly" />
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><span>Call the national cyber crime helpline <a href="tel:1930" className="font-bold underline">1930</a> as soon as possible.</span></li>
              <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><span>Report online at <a href="https://cybercrime.gov.in" className="font-semibold underline" target="_blank" rel="noopener noreferrer">cybercrime.gov.in</a>.</span></li>
              <li className="flex gap-2"><Phone aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" /><span>Call your bank using the number printed on your card or passbook and ask to block the transaction.</span></li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
