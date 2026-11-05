import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", {
  variants: {
    tone: {
      neutral: "bg-surface-2 text-ink-2 ring-line",
      success: "bg-success-soft text-success ring-success/30",
      warning: "bg-warning-soft text-warning ring-warning/30",
      danger: "bg-danger-soft text-danger ring-danger/30",
      primary: "bg-primary-soft text-primary ring-primary/30",
      demo: "bg-demo-soft text-demo ring-demo/40",
      educator: "bg-educator-soft text-educator ring-educator/30",
      strategy: "bg-strategy-soft text-strategy ring-strategy/30",
      sentinel: "bg-sentinel-soft text-sentinel ring-sentinel/30",
      connector: "bg-connector-soft text-connector ring-connector/30",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
