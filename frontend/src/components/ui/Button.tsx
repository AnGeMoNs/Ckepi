import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:opacity-90 border border-transparent",
  secondary:
    "bg-surface-muted text-content border border-border-subtle hover:bg-surface-elevated",
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
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

