import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

// Primary and secondary are the cardboard push buttons from Explorar (copper / ink paper on a
// thick edge that sinks when pressed), so every tab shares the same physical buttons.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "ckepi-push ckepi-push-copper",
  secondary: "ckepi-push ckepi-push-ink",
  ghost:
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold bg-transparent text-content-muted border border-transparent hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
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
      className={`ckepi-button min-w-11 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
