import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`rounded-2xl border border-border-subtle/90 bg-surface-elevated/95 shadow-sm backdrop-blur-sm transition-shadow duration-200 hover:shadow-md ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div
      className={`border-b border-border-subtle/80 bg-surface-muted/20 px-3.5 py-3 sm:px-5 sm:py-3.5 rounded-t-2xl ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h2 className={`text-sm font-bold tracking-tight text-content sm:text-base ${className}`}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-3.5 sm:p-5 ${className}`}>{children}</div>;
}
