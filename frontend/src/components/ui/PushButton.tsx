import type { ButtonHTMLAttributes, ReactNode } from "react";

interface PushButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** copper = main action, salt = secondary, ink = quiet/toggle. */
  tone?: "copper" | "salt" | "ink";
  children: ReactNode;
}

/** Cardboard push button (56 px tall, 16 px bold label) that sinks onto its edge when pressed. */
export function PushButton({ tone = "salt", className = "", children, ...rest }: PushButtonProps) {
  return (
    <button type="button" className={`ckepi-push ckepi-push-${tone} ${className}`} {...rest}>
      {children}
    </button>
  );
}
