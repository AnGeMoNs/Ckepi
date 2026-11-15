import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Expedition } from "../components/expedition/Expedition";
import { WorldLab } from "../components/lab/WorldLab";
import { CardboardButton } from "../components/ui/CardboardButton";
import { AppBackdrop } from "../components/ui/AppBackdrop";
import type { PlanetarySite } from "../types/analog";

const LANGS = ["es", "pt", "en"] as const;

type Section = "lab" | "mission";

interface LocalExplorePageProps {
  sites: PlanetarySite[];
  onOpenScience: () => void;
}

/**
 * Learn mode (STEAM): a scientific-literacy expedition in the three steps of the pitch
 * (Look, Compare, Investigate) on the real Jezero ↔ Antofagasta comparison at 30 m.
 */
export function LocalExplorePage({ sites, onOpenScience }: LocalExplorePageProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.slice(0, 2);
  const reduceMotion = Boolean(useReducedMotion());
  const [section, setSection] = useState<Section>("lab");
  const open = (next: Section) => {
    setSection(next);
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="relative isolate min-h-[100svh] overflow-x-hidden text-content">
      <AppBackdrop />

      {/* Header without boxes: logo, cardboard language discs and the science-mode link. */}
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
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

      <main id="main-content" className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-2 sm:px-8">
        {/* Two moments of the same learning path: explore the worlds, then the analog mission. */}
        <nav aria-label={t("lab.tabs.label")} className="mb-6 flex flex-wrap gap-2">
          {(["lab", "mission"] as const).map((key) => (
            <CardboardButton
              key={key}
              tone={section === key ? "active" : "card"}
              aria-current={section === key ? "page" : undefined}
              onClick={() => open(key)}
              size="lg"
              className="font-bold"
            >
              {t(`lab.tabs.${key}`)}
            </CardboardButton>
          ))}
        </nav>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={section}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: section === "mission" ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {section === "lab" ? (
              <WorldLab sites={sites} onStartMission={() => open("mission")} />
            ) : (
              <Expedition sites={sites} onOpenScience={onOpenScience} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
