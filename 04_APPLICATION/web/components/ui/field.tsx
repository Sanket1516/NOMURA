import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const control = "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink placeholder:text-ink-3 min-h-11 focus-visible:border-focus";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(control, className)} {...p} />
));
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cn(control, "resize-y", className)} {...p} />
));
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...p }, ref) => (
  <select ref={ref} className={cn(control, "appearance-auto", className)} {...p} />
));
Select.displayName = "Select";

/** Label + control + hint + error, wired with aria-describedby. */
export function Field({ label, hint, error, children }: {
  label: ReactNode; hint?: ReactNode; error?: ReactNode;
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {hint ? <p id={hintId} className="text-sm text-ink-3">{hint}</p> : null}
      {error ? <p id={errId} className="text-sm font-semibold text-danger">{error}</p> : null}
    </div>
  );
}
