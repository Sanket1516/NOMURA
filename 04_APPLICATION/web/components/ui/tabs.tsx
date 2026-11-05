"use client";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** WAI-ARIA tabs with roving tabindex and arrow-key navigation. */
export function Tabs({ tabs, label, initial = 0 }: { tabs: { id: string; label: ReactNode; panel: ReactNode }[]; label: string; initial?: number }) {
  const [active, setActive] = useState(initial);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    const n = tabs.length;
    const next = e.key === "ArrowRight" ? (active + 1) % n : e.key === "ArrowLeft" ? (active - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next >= 0) { e.preventDefault(); setActive(next); refs.current[next]?.focus(); }
  };
  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKey} className="relative flex gap-1 overflow-x-auto rounded-full bg-surface-2 p-1">
        {tabs.map((t, i) => (
          <button key={t.id} ref={(el) => { refs.current[i] = el; }} role="tab" id={`${base}-t-${t.id}`} aria-selected={i === active}
            aria-controls={`${base}-p-${t.id}`} tabIndex={i === active ? 0 : -1} onClick={() => setActive(i)}
            className={cn("min-h-11 whitespace-nowrap rounded-full px-4 text-sm font-semibold", i === active ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={t.id} role="tabpanel" id={`${base}-p-${t.id}`} aria-labelledby={`${base}-t-${t.id}`} hidden={i !== active} tabIndex={0} className="mt-4">
          {t.panel}
        </div>
      ))}
    </div>
  );
}
