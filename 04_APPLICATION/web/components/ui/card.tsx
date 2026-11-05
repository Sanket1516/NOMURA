import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("card min-w-0 rounded-xl border border-line bg-surface p-5 shadow-card animate-rise", className)} {...props} />;
}

export function CardHeader({ title, eyebrow, action, id, level = 2 }: { title: ReactNode; eyebrow?: ReactNode; action?: ReactNode; id?: string; level?: 2 | 3 }) {
  const H = level === 2 ? "h2" : "h3";
  return (
    <header className="mb-4 flex items-start justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{eyebrow}</p> : null}
        <H id={id} className="font-display text-xl leading-tight text-ink">{title}</H>
      </div>
      {action}
    </header>
  );
}
