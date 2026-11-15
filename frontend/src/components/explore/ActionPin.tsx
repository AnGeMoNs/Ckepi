import { motion, useReducedMotion } from "framer-motion";

interface ActionPinProps {
  label: string;
  onClick: () => void;
  /** The main next step pulses a little stronger. */
  primary?: boolean;
}

/**
 * Key actions as the hexagonal cardboard pin (same piece as the map zoom buttons), with just
 * the word on its paper face. A soft halo breathes behind it; only opacity and scale animate.
 */
export function ActionPin({ label, onClick, primary = false }: ActionPinProps) {
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={reduceMotion ? undefined : { y: -6, rotate: primary ? 2 : -2 }}
      whileTap={reduceMotion ? undefined : { y: 3, scale: 0.96 }}
      className="group relative grid h-[7.5rem] w-32 place-items-center rounded-[2rem] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/60 sm:h-[8.6rem] sm:w-[9.4rem]"
    >
      <motion.span
        aria-hidden="true"
        className={`absolute inset-2 rounded-full blur-2xl ${primary ? "bg-accent/50" : "bg-accent/25"}`}
        animate={reduceMotion ? undefined : { opacity: [0.4, 0.9, 0.4], scale: [0.92, 1.05, 0.92] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span aria-hidden="true" className="ckepi-hex-pin absolute inset-0" />
      <span className="relative -mt-[18%] px-5 text-center text-base font-bold leading-tight text-ckepi-ink sm:text-lg">{label}</span>
    </motion.button>
  );
}
