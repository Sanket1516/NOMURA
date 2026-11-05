import type { Money } from "@/lib/types";
import { cn } from "@/lib/cn";

/** Shows "₹1,56,000"; screen readers hear "one lakh fifty six thousand rupees" (NFR-I18N-02). */
export function MoneyText({ value, className }: { value: Money; className?: string }) {
  return (
    <span className={cn("tabular", className)}>
      <span aria-hidden>{value.display}</span>
      <span className="sr-only">{value.spoken ?? value.display}</span>
    </span>
  );
}
