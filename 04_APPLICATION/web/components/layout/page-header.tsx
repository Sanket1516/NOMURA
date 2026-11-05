import type { ReactNode } from "react";
import type { DataOrigin } from "@/lib/types";
import { OriginBadge } from "@/components/ai/origin-badge";

export function PageHeader({ title, description, origin, eyebrow, action }: { title: ReactNode; description?: ReactNode; origin?: DataOrigin; eyebrow?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? <p className="text-sm font-semibold text-primary">{eyebrow}</p> : null}
        <h1 className="font-display text-[2rem] leading-[1.1] tracking-tight text-ink sm:text-[2.4rem]">{title}</h1>
        {description ? <p className="mt-2 text-ink-2">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">{origin ? <OriginBadge origin={origin} /> : null}{action}</div>
    </div>
  );
}
