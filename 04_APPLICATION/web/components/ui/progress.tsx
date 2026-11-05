import { cn } from "@/lib/cn";

/** Native semantics via role=progressbar with a text label; the bar is decorative. */
export function Progress({ value, label, tone = "primary", className }: { value: number; label: string; tone?: "primary" | "accent" | "danger"; className?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const fill = tone === "accent" ? "bg-accent" : tone === "danger" ? "bg-danger" : "bg-primary";
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label={label}
      className={cn("ring-line h-2.5 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset", className)}>
      <div className={cn("grow-x h-full rounded-full", fill)} style={{ width: `${v}%` }} />
    </div>
  );
}
