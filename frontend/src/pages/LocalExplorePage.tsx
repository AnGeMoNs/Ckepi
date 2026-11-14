import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AppBackdrop } from "../components/ui/AppBackdrop";
import { LearnDialog } from "../components/worlds/LearnDialog";
import { PaperPlanet, type WorldKey } from "../components/worlds/PaperPlanet";
import type { PlanetarySite } from "../types/analog";

const LANGS = ["es", "pt", "en"] as const;

// Floating positions on the right side; Earth (Antofagasta) is the largest, in the middle.
const PLANETS: { world: WorldKey; size: string; offset: string; delay: number }[] = [
  { world: "moon", size: "h-28 w-28 sm:h-36 sm:w-36", offset: "self-end mr-6 sm:mr-16", delay: 0 },
  { world: "earth", size: "h-40 w-40 sm:h-56 sm:w-56", offset: "self-start ml-2 sm:ml-6", delay: 0.6 },
  { world: "mars", size: "h-32 w-32 sm:h-44 sm:w-44", offset: "self-end mr-2 sm:mr-24", delay: 1.2 },
];

interface LocalExplorePageProps {
  sites: PlanetarySite[];
  onOpenScience: () => void;
}

/** Local mode: three cardboard worlds floating; tapping one opens a short, pictogram-first lesson. */
export function LocalExplorePage({ sites, onOpenScience }: LocalExplorePageProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [open, setOpen] = useState<WorldKey | null>(null);
  const lang = i18n.language.slice(0, 2);

  return (
    <div className="relative isolate min-h-[100svh] overflow-hidden text-content">
      <AppBackdrop />

      {/* Header without boxes: logo, cardboard language discs and the science-mode link. */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <img src="/img/ckepi/svg/ckepi-horizontal-vector-dark.svg" alt="CKEPI" width={180} height={56} className="h-10 w-auto sm:h-12" />
        <nav className="flex items-center gap-2" aria-label={t("local.language")}>
          {LANGS.map((code, i) => (
            <button
              key={code}
              type="button"
              onClick={() => void i18n.changeLanguage(code)}
              aria-pressed={lang === code}
              className={`ckepi-cardboard ${["-rotate-3", "rotate-0", "rotate-3"][i]} h-11 w-11 rounded-full text-sm font-bold uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                lang === code ? "ckepi-cardboard-active" : ""
              }`}
            >
              {code}
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenScience}
            className="ml-1 min-h-11 whitespace-nowrap rounded-full px-2 text-xs font-semibold text-content-muted underline-offset-4 sm:ml-2 sm:px-3 sm:text-sm hover:text-content hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("local.scienceMode")}
          </button>
        </nav>
      </header>

      <main id="main-content" className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 pb-16 pt-4 sm:px-8 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[1fr_1fr]">
        {/* Left: one question, one sentence, one instruction. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 22 }}
          className="max-w-xl"
        >
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">{t("local.title")}</h1>
          <p className="mt-4 text-lg leading-relaxed text-content-muted sm:text-xl">{t("local.lead")}</p>
          <p className="mt-6 inline-flex items-center gap-2 text-base font-semibold text-accent sm:text-lg">
            <motion.span
              aria-hidden="true"
              animate={reduceMotion ? undefined : { x: [0, 8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            >
              →
            </motion.span>
            {t("local.hint")}
          </p>
        </motion.div>

        {/* Right: the three cardboard worlds, no boxes, no text — just glints. */}
        <div className="flex flex-col gap-2 lg:gap-0">
          {PLANETS.map(({ world, size, offset, delay }) => (
            <motion.button
              key={world}
              type="button"
              onClick={() => setOpen(world)}
              aria-haspopup="dialog"
              aria-label={t(`local.open.${world}`)}
              className={`group relative rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent ${offset}`}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 14, delay: reduceMotion ? 0 : 0.2 + delay / 3 }}
              whileHover={reduceMotion ? undefined : { scale: 1.07 }}
              whileTap={reduceMotion ? undefined : { scale: 0.95 }}
            >
              <Sparkles delay={delay} />
              <PaperPlanet world={world} className={size} />
            </motion.button>
          ))}
        </div>
      </main>

      <LearnDialog world={open} sites={sites} onClose={() => setOpen(null)} />
    </div>
  );
}

/** Small paper stars that twinkle around a planet. */
function Sparkles({ delay }: { delay: number }) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  const stars = [
    { top: "4%", left: "78%", size: 10 },
    { top: "70%", left: "6%", size: 8 },
    { top: "18%", left: "2%", size: 6 },
  ];
  return (
    <>
      {stars.map((star, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 10 10"
          aria-hidden="true"
          className="pointer-events-none absolute text-ckepi-sulfur"
          style={{ top: star.top, left: star.left, width: star.size * 2, height: star.size * 2 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], rotate: [0, 45, 90] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: delay + i * 0.7 }}
        >
          <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill="currentColor" />
        </motion.svg>
      ))}
    </>
  );
}
