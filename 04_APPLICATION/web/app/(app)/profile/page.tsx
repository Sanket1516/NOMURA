import type { Metadata } from "next";
import Link from "next/link";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { LANG_NAMES } from "@/lib/i18n/nav";
import { tr, type PageKey } from "@/lib/i18n/pages";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { DataControls } from "./data-controls";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  const p = d.profile;
  const rows: [string, string][] = [
    [t("prof.name"), p.display_name], [t("prof.work"), p.occupation], [t("prof.place"), [p.district, p.state].filter(Boolean).join(", ") + (p.rural ? ` (${t("prof.rural")})` : "")],
    [t("prof.income"), t(`prof.inc.${p.income_type}` as PageKey)], [t("prof.language"), LANG_NAMES[p.preferred_lang]], [t("prof.dependants"), String(p.dependents)],
    [t("prof.explain"), p.literacy_level === "low" ? t("prof.simple") : t("prof.standard")], [t("prof.disability"), p.disability ? p.disability : t("prof.notstated")],
  ];
  return (
    <>
      <PageHeader tk="profile" title="Profile" origin={d.origin} description="What VAAKYA knows about you. Nothing else is collected." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card aria-labelledby="about-h">
          <CardHeader id="about-h" eyebrow={t("prof.about")} title={p.display_name} action={<Link href="/onboarding/profile" className="text-sm font-semibold text-primary hover:underline">{t("prof.edit")}</Link>} />
          <dl className="divide-y divide-line">{rows.map(([k, v], i) => <div key={i} className="grid grid-cols-[140px_1fr] gap-3 py-2.5"><dt className="text-ink-3">{k}</dt><dd>{v}</dd></div>)}</dl>
        </Card>
        <Card aria-labelledby="data-h">
          <CardHeader id="data-h" eyebrow={t("prof.privacy")} title={t("prof.controls")} />
          <DataControls lang={lang} />
        </Card>
        <Card aria-labelledby="set-h">
          <CardHeader id="set-h" eyebrow={t("prof.settings")} title={t("prof.work4you")} />
          <ul className="space-y-2">
            <li><Link href="/settings/accessibility" className="font-semibold text-primary underline">{t("prof.link.a11y")}</Link></li>
            <li><Link href="/notifications" className="font-semibold text-primary underline">{tr(lang, "notifications.title")}</Link></li>
            <li><Link href="/about-ai" className="font-semibold text-primary underline">{t("prof.link.ai")}</Link></li>
          </ul>
          <form action="/api/auth/logout" method="post" className="mt-5"><button className="min-h-11 rounded-full px-5 font-semibold ring-1 ring-line hover:bg-surface-2">{t("nav.signout")}</button></form>
        </Card>
      </div>
    </>
  );
}
