import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

interface SectionCardProps extends CardProps {
  /** "frame": cardboard-framed glass (default). "liquid": layered liquid glass used in Explorar. */
  variant?: "frame" | "liquid";
}

/** Glass card that rises in like a paper layer the first time it scrolls into view. */
export function Card({ children, className = "", variant = "liquid" }: SectionCardProps) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className={`${variant === "liquid" ? "ckepi-liquid rounded-[2rem]" : "ckepi-glass ckepi-product-card rounded-xl border border-border-subtle"} ${className}`}
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
    <div
      className={`px-5 pb-2 pt-5 sm:px-6 sm:pt-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: CardProps) {
  return (
    <h2 className={`text-lg font-bold tracking-tight text-content sm:text-xl ${className}`}>
      {children}
    </h2>
  );
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}
