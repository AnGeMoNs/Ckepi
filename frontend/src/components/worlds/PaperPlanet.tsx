import { motion, useReducedMotion } from "framer-motion";

export type WorldKey = "earth" | "moon" | "mars";

/**
 * A planet drawn by code as stacked paper layers (no image, no AI): Moon grey with craters,
 * Mars rust with a delta-fan crater, Earth as Antofagasta's coast and desert. It floats slowly.
 */
const LAYERS: Record<WorldKey, { base: string; shade: string; details: JSX.Element }> = {
  moon: {
    base: "#C9C6BC",
    shade: "#8F8C84",
    details: (
      <>
        <circle cx="38" cy="40" r="9" fill="#A9A69D" />
        <circle cx="64" cy="62" r="6" fill="#A9A69D" />
        <circle cx="52" cy="30" r="4" fill="#B5B2A8" />
        <circle cx="30" cy="66" r="5" fill="#B5B2A8" />
      </>
    ),
  },
  mars: {
    base: "#C8613F",
    shade: "#8E3B25",
    details: (
      <>
        <circle cx="56" cy="44" r="12" fill="#A94A2E" />
        {/* Jezero-like delta fan entering the crater */}
        <path d="M46 40 Q50 44 47 50 Q53 47 56 52 Q57 46 52 42 Z" fill="#E8A080" />
        <path d="M22 62 Q40 56 60 70" stroke="#E8A080" strokeWidth="3" fill="none" opacity="0.6" />
      </>
    ),
  },
  earth: {
    base: "#2E6E8E",
    shade: "#1C4A61",
    details: (
      <>
        {/* South America's Pacific edge with the Atacama in sand colour */}
        <path d="M44 14 Q58 22 56 38 Q54 52 48 62 Q44 74 46 86 Q36 74 38 58 Q40 44 36 30 Z" fill="#D9A066" />
        <path d="M45 40 Q47 48 44 56" stroke="#FFF2D7" strokeWidth="2" fill="none" />
        <path d="M16 30 Q30 24 40 28" stroke="#FFF2D7" strokeWidth="3" fill="none" opacity="0.7" />
        <path d="M58 70 Q72 64 84 68" stroke="#FFF2D7" strokeWidth="3" fill="none" opacity="0.7" />
      </>
    ),
  },
};

interface PaperPlanetProps {
  world: WorldKey;
  className?: string;
  /** Float animation on/off (e.g. off inside small chips). */
  floating?: boolean;
}

export function PaperPlanet({ world, className = "h-32 w-32", floating = true }: PaperPlanetProps) {
  const reduceMotion = useReducedMotion();
  const layer = LAYERS[world];
  const clipId = `ckepi-planet-${world}`;
  return (
    <motion.svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={className}
      animate={floating && !reduceMotion ? { y: [0, -6, 0], rotate: [0, 2, 0] } : undefined}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="50" cy="50" r="40" />
        </clipPath>
        <filter id={`${clipId}-paper`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="black" floodOpacity="0.45" />
        </filter>
      </defs>
      {/* Back paper layer offset like a cut-out pasted on card */}
      <circle cx="53" cy="54" r="40" fill={layer.shade} />
      <g filter={`url(#${clipId}-paper)`}>
        <circle cx="50" cy="50" r="40" fill={layer.base} />
        <g clipPath={`url(#${clipId})`}>
          {layer.details}
          {/* Terminator shadow: night side as a darker paper layer */}
          <path d="M70 0 Q100 50 70 100 H110 V0 Z" fill="black" opacity="0.22" />
        </g>
      </g>
    </motion.svg>
  );
}
