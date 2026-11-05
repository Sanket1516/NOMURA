import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55 min-h-11 min-w-11 select-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-ink shadow-card hover:brightness-110",
        secondary: "bg-surface text-ink ring-1 ring-line hover:bg-surface-2",
        ghost: "text-ink hover:bg-surface-2",
        danger: "bg-danger text-white hover:brightness-110",
        accent: "bg-ink text-paper hover:opacity-90",
      },
      size: {
        sm: "px-3.5 text-sm",
        md: "px-5 text-[0.95rem]",
        lg: "px-7 min-h-13 text-base",
        icon: "p-0 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = "Button";
