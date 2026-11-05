import { FlaskConical, Database } from "lucide-react";
import type { DataOrigin } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

/** Every data view states where its numbers come from. */
export function OriginBadge({ origin }: { origin: DataOrigin }) {
  return origin === "demo" ? (
    <Badge tone="demo" title="Synthetic sample data for demonstration. Nothing here is saved or real.">
      <FlaskConical aria-hidden className="size-3.5" /> Sample data
    </Badge>
  ) : (
    <Badge tone="primary" title="Your saved data">
      <Database aria-hidden className="size-3.5" /> Your data
    </Badge>
  );
}
