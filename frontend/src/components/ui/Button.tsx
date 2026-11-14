import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground shadow-sm shadow-accent/20 hover:opacity-95 active:scale-[0.98] border border-transparent",
  secondary:
    "bg-surface-muted/90 text-content border border-border-subtle hover:bg-surface-elevated active:scale-[0.98]",
  ghost:
    "bg-transparent text-content-muted border border-transparent hover:bg-surface-muted hover:text-content",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 sm:min-h-11 min-w-10 sm:min-w-11 items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-3 py-2 sm:px-4 text-xs font-semibold uppercase tracking-wider transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
