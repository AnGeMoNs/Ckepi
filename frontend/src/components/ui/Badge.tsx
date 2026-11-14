import type { ReactNode } from "react";

type BadgeVariant = "default" | "valid" | "warn" | "break" | "mars" | "moon" | "accent";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-surface-muted/80 text-content-muted border-border-subtle",
  valid: "bg-status-valid/15 text-status-valid border-status-valid/30",
  warn: "bg-status-warn/15 text-status-warn border-status-warn/30",
  break: "bg-status-break/15 text-status-break border-status-break/30",
  mars: "bg-planet-mars/15 text-planet-mars border-planet-mars/30",
  moon: "bg-planet-moon/15 text-planet-moon border-planet-moon/30",
  accent: "bg-accent/15 text-accent border-accent/30",
};

export function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold tracking-tight ${BADGE_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
