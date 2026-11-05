import type { Metadata } from "next";
import { loadDashboard, uiLang } from "@/lib/server/data";
import { apiFetch } from "@/lib/server/api";
import { sampleTwin } from "@/lib/twin-sample";
import type { Twin } from "@/lib/types";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentBadge } from "@/components/ai/agent";
import { LEGEND, LifeGraph } from "@/components/finance/life-graph";
import { tr, trf, type PageKey } from "@/lib/i18n/pages";

export const metadata: Metadata = { title: "Life Graph" };

export default async function LifeGraphPage() {
  const d = await loadDashboard();
  const lang = await uiLang();
  const t = (k: PageKey) => tr(lang, k);
  const twin = d.origin === "live" ? await apiFetch<Twin>("/v1/twin") : sampleTwin(d);
  return (
    <>
      <PageHeader tk="lifegraph" title="Your Financial Life Graph" origin={d.origin}
        description="How your income, spending, goals, risks, schemes and learning connect. Amounts are shown as ranges." />
      <div className="stagger grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <Card aria-labelledby="graph-h">
          <CardHeader id="graph-h" eyebrow={twin.source === "neo4j" ? t("lg.live") : t("lg.sample")} title={t("lg.picture")}
            action={<Badge tone={twin.source === "neo4j" ? "primary" : "demo"}>{trf(lang, "lg.connections", { n: twin.nodes.length })}</Badge>} />
          <LifeGraph twin={twin} />
          <ul className="mt-3 flex flex-wrap gap-3 text-sm" aria-label={t("lg.legend")}>
            {LEGEND.map((l) => <li key={l.key} className="flex items-center gap-1.5"><span aria-hidden className="size-3 rounded-full border-[3px]" style={{ borderColor: l.color }} />{t(`lg.k.${l.key}` as PageKey)}</li>)}
          </ul>
          <p className="mt-2 text-sm text-ink-3">{t("lg.textnote")}</p>
        </Card>
        <div className="space-y-5">
          <Card aria-labelledby="ins-h">
            <CardHeader id="ins-h" eyebrow={t("lg.insights.eyebrow")} title={t("lg.insights.title")} />
            {twin.insights.length ? (
              <ul className="space-y-3">{twin.insights.map((i) => <li key={i.text} className="rounded-xl bg-surface-2 p-3"><AgentBadge agent={i.agent} /><p className="mt-1.5 text-sm">{i.text}</p></li>)}</ul>
            ) : <p className="text-ink-2">{t("lg.nogaps")}</p>}
          </Card>
          <Card aria-labelledby="out-h">
            <CardHeader id="out-h" eyebrow={t("lg.outline.eyebrow")} title={t("lg.outline.title")} />
            <div className="space-y-4">
              {twin.outline.map((g) => (
                <section key={g.group} aria-label={g.group}>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-3">{g.group}</h3>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">{g.items.map((x) => <li key={x}>{x}</li>)}</ul>
                </section>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
