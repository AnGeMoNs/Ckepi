import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <section
      className={`ckepi-glass rounded-xl border border-border-subtle ${className}`}
    >
      {children}
    </section>
  );
}

export function CardHeader({ children, className = "" }: CardProps) {
  return (
    <div className={`border-b border-border-subtle px-4 py-3 sm:px-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return <h2 className={`text-base font-semibold text-content ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

