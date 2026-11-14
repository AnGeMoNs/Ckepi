import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

/** Glass card that rises in like a paper layer the first time it scrolls into view. */
export function Card({ children, className = "" }: CardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={`ckepi-glass rounded-xl border border-border-subtle ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 170, damping: 26 }}
    >
      {children}
    </motion.section>
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
