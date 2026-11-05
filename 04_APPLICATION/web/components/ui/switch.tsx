"use client";
import { useId } from "react";
import { cn } from "@/lib/cn";

export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="font-semibold text-ink">{label}</label>
        {description ? <p id={`${id}-d`} className="text-sm text-ink-3">{description}</p> : null}
      </div>
      <button id={id} type="button" role="switch" aria-checked={checked} aria-describedby={description ? `${id}-d` : undefined}
        onClick={() => onChange(!checked)}
        className={cn("relative inline-flex h-8 w-14 shrink-0 items-center rounded-full ring-1 ring-inset transition-colors", checked ? "bg-primary ring-primary" : "bg-surface-2 ring-line")}>
        <span aria-hidden className={cn("inline-block size-6 rounded-full bg-surface shadow-card transition-transform", checked ? "translate-x-7" : "translate-x-1")} />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}
