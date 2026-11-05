"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Counts up to `value` once on mount. The server render shows the final value, so screen readers and
 * no-JS users always get the real number; motion is skipped under reduced-motion settings.
 */
const FORMATS = {
  int: (n: number) => String(Math.round(n)),
  inr: (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.round(n)),
  decimal1: (n: number) => n.toFixed(1),
};

export function AnimatedNumber({ value, kind = "int", suffix = "", duration = 900 }: {
  value: number; kind?: keyof typeof FORMATS; suffix?: string; duration?: number;
}) {
  const format = (n: number) => FORMATS[kind](n) + suffix;
  const [shown, setShown] = useState(value);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
    if (reduce || value === 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    setShown(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <>
      <span aria-hidden>{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
