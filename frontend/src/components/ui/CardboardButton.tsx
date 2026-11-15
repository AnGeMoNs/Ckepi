import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type Tone = "card" | "active" | "primary";

interface CardboardButtonProps extends Omit<HTMLMotionProps<"button">, "type"> {
  tone?: Tone;
  /** Visual size: "md" = 44 px touch target, "lg" = 48 px. */
  size?: "md" | "lg";
}

const TONE: Record<Tone, string> = {
  card: "ckepi-cardboard",
  active: "ckepi-cardboard ckepi-cardboard-active",
  primary: "ckepi-cardboard ckepi-cardboard-active",
};

/**
 * A cut-cardboard button. Its motion answers the person's action: it lifts and tilts a little
 * under the pointer (like picking up a piece of card) and presses flat when tapped.
 * With reduced motion it keeps only the colour change.
 */
export const CardboardButton = forwardRef<HTMLButtonElement, CardboardButtonProps>(function CardboardButton(
  { tone = "card", size = "md", className = "", children, ...rest },
  ref
) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      ref={ref}
      type="button"
      className={`${TONE[tone]} ${size === "lg" ? "min-h-12 px-6" : "min-h-11 px-4"} inline-flex items-center justify-center gap-2 rounded-full text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40 ${className}`}
      whileHover={reduceMotion ? undefined : { y: -2, rotate: -1 }}
      whileTap={reduceMotion ? undefined : { y: 2, scale: 0.97, rotate: 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
});
