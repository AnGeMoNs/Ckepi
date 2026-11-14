import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface NumberTickerProps {
  value: number;
  format: (value: number) => string;
  className?: string;
}

/**
 * Counts up to `value` the first time it scrolls into view (pattern popularised by
 * "Number Ticker" components on 21st.dev; implemented here from scratch with framer-motion).
 * Screen readers always get the final value.
 */
export function NumberTicker({ value, format, className = "" }: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(reduceMotion ? value : 0);

  useEffect(() => {
    if (reduceMotion || !inView) {
      if (reduceMotion) setShown(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setShown,
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      <span aria-hidden="true">{format(shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
