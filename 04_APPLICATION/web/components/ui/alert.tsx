import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";

const tones = {
  info: { cls: "bg-surface-2 text-ink ring-line", Icon: Info, label: "Information" },
  success: { cls: "bg-success-soft text-ink ring-success/40", Icon: CheckCircle2, label: "Success" },
  warning: { cls: "bg-warning-soft text-ink ring-warning/40", Icon: AlertTriangle, label: "Warning" },
  danger: { cls: "bg-danger-soft text-ink ring-danger/40", Icon: ShieldAlert, label: "Error" },
};

export function Alert({ tone = "info", title, children, role, className }: { tone?: keyof typeof tones; title: ReactNode; children?: ReactNode; role?: "alert" | "status"; className?: string }) {
  const t = tones[tone];
  return (
    <div role={role} className={cn("flex gap-3 rounded-xl p-4 ring-1 ring-inset", t.cls, className)}>
      <t.Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-semibold"><span className="sr-only">{t.label}: </span>{title}</p>
        {children ? <div className="mt-1 text-sm text-ink-2">{children}</div> : null}
      </div>
    </div>
  );
}
