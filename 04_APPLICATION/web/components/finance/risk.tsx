import { ShieldAlert, ShieldCheck, ShieldQuestion, Siren } from "lucide-react";
import type { RiskLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/lib/types";
import { tr, type PageKey } from "@/lib/i18n/pages";

const MAP: Record<RiskLevel, { label: string; tone: "success" | "warning" | "danger"; Icon: typeof Siren }> = {
  low: { label: "Low risk", tone: "success", Icon: ShieldCheck },
  medium: { label: "Medium risk", tone: "warning", Icon: ShieldQuestion },
  high: { label: "High risk", tone: "danger", Icon: ShieldAlert },
  critical: { label: "Critical risk", tone: "danger", Icon: Siren },
};

/** Icon + text + colour: never colour alone (NFR-A11Y-03). */
export function RiskBadge({ level, lang = "en" }: { level: RiskLevel; lang?: Lang }) {
  const m = MAP[level];
  return <Badge tone={m.tone} className={level === "critical" ? "font-bold uppercase tracking-wide" : ""}><m.Icon aria-hidden className="size-3.5" />{tr(lang, `risk.${level}` as PageKey)}</Badge>;
}
