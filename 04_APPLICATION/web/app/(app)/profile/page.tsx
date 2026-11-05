import type { Metadata } from "next";
import Link from "next/link";
import { loadDashboard } from "@/lib/server/data";
import { LANG_NAMES } from "@/lib/i18n/nav";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { DataControls } from "./data-controls";

export const metadata: Metadata = { title: "Profile" };

const INCOME = { salaried: "Same amount every month", variable: "Changes every month", seasonal: "Seasonal" };

export default async function ProfilePage() {
  const d = await loadDashboard();
  const p = d.profile;
  const rows: [string, string][] = [
    ["Name", p.display_name], ["Work", p.occupation], ["Place", [p.district, p.state].filter(Boolean).join(", ") + (p.rural ? " (rural)" : "")],
    ["Income", INCOME[p.income_type]], ["Language", LANG_NAMES[p.preferred_lang]], ["Dependants", String(p.dependents)],
    ["Explanations", p.literacy_level === "low" ? "Very simple words" : "Standard"], ["Disability", p.disability ? p.disability : "Not stated"],
  ];
  return (
    <>
      <PageHeader title="Profile" origin={d.origin} description="What VAAKYA knows about you. Nothing else is collected." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="about-h">
          <CardHeader id="about-h" eyebrow="About you" title={p.display_name} action={<Link href="/onboarding/profile" className="text-sm font-semibold text-primary hover:underline">Edit</Link>} />
          <dl className="divide-y divide-line">{rows.map(([k, v]) => <div key={k} className="grid grid-cols-[140px_1fr] gap-3 py-2.5"><dt className="text-ink-3">{k}</dt><dd>{v}</dd></div>)}</dl>
        </Card>
        <Card aria-labelledby="data-h">
          <CardHeader id="data-h" eyebrow="Privacy" title="Your data controls" />
          <DataControls />
        </Card>
        <Card aria-labelledby="set-h">
          <CardHeader id="set-h" eyebrow="Settings" title="Make VAAKYA work for you" />
          <ul className="space-y-2">
            <li><Link href="/settings/accessibility" className="font-semibold text-primary underline">Accessibility: text size, contrast, motion, voice-first</Link></li>
            <li><Link href="/notifications" className="font-semibold text-primary underline">Notifications</Link></li>
            <li><Link href="/about-ai" className="font-semibold text-primary underline">How VAAKYA uses AI</Link></li>
          </ul>
          <form action="/api/auth/logout" method="post" className="mt-5"><button className="min-h-11 rounded-full px-5 font-semibold ring-1 ring-line hover:bg-surface-2">Sign out</button></form>
        </Card>
      </div>
    </>
  );
}
