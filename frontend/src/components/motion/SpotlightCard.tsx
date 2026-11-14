import { motion, useMotionTemplate, useMotionValue, useReducedMotion } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

interface SpotlightCardProps {
  children: ReactNode;
  className?: string;
  /** Tailwind colour class used for the glow, e.g. "bg-world-mars". */
  glowClassName?: string;
}

/**
 * Glass card with a soft light that follows the pointer (spotlight-card pattern seen on
 * 21st.dev, written from scratch here). Purely decorative: no effect on keyboard or
 * screen readers, and no glow with reduced motion.
 */
export function SpotlightCard({ children, className = "", glowClassName = "bg-accent" }: SpotlightCardProps) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const mask = useMotionTemplate`radial-gradient(260px circle at ${x}px ${y}px, black, transparent 70%)`;

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  };

  return (
    <motion.div
      onMouseMove={reduceMotion ? undefined : onMove}
      onMouseLeave={() => {
        x.set(-400);
        y.set(-400);
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 170, damping: 26 }}
      className={`ckepi-glass group relative overflow-hidden rounded-2xl border border-border-subtle ${className}`}
    >
      {!reduceMotion && (
        <motion.div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20 ${glowClassName}`}
          style={{ WebkitMaskImage: mask, maskImage: mask }}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}
