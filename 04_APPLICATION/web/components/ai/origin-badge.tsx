import { FlaskConical, Database } from "lucide-react";
import type { DataOrigin } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import type { Lang } from "@/lib/types";
import { tr } from "@/lib/i18n/pages";

/** Every data view states where its numbers come from. */
export function OriginBadge({ origin, lang = "en" }: { origin: DataOrigin; lang?: Lang }) {
  return origin === "demo" ? (
    <Badge tone="demo" title={tr(lang, "origin.sample.t")}>
      <FlaskConical aria-hidden className="size-3.5" /> {tr(lang, "origin.sample")}
    </Badge>
  ) : (
    <Badge tone="primary" title={tr(lang, "origin.own.t")}>
      <Database aria-hidden className="size-3.5" /> {tr(lang, "origin.own")}
    </Badge>
  );
}
