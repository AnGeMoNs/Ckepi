import { motion, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import type { PlanetarySite } from "../../types/analog";
import { Expedition } from "../expedition/Expedition";
import { PaperPlanetImage } from "../ui/PaperPlanetImage";
import { PushButton } from "../ui/PushButton";
import { Pictogram } from "../worlds/Pictograms";

interface SteamMissionProps {
  sites: PlanetarySite[];
  onOpenScience: () => void;
  /** Opens the "three worlds" lab tab (the warm-up before the mission). */
  onOpenWorlds: () => void;
}

/**
 * STEAM landing — "Cadet mission": one promise, two ways in (warm up in the three-worlds lab,
 * or start the mission), then the gamified expedition with real 30 m data.
 */
export function SteamMission({ sites, onOpenScience, onOpenWorlds }: SteamMissionProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const missionRef = useRef<HTMLDivElement | null>(null);

  const startMission = () => {
    window.requestAnimationFrame(() => missionRef.current?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
  };

  return (
    <div className="space-y-8">
      <motion.section
        aria-labelledby="steam-hero-title"
        className="ckepi-liquid overflow-hidden rounded-[2rem] p-6 sm:p-10"
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 150, damping: 22 }}
      >
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="text-center lg:text-left">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-accent">{t("steam.hero.kicker")}</p>
            <h1 id="steam-hero-title" className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{t("steam.hero.title")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-content-muted sm:text-xl lg:mx-0">{t("steam.hero.lead")}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <PushButton tone="copper" onClick={startMission} className="min-h-16 px-7 text-lg">
                <Pictogram name="rover" className="h-6 w-6" />
                {t("steam.hero.start")}
              </PushButton>
              <PushButton tone="ink" onClick={onOpenWorlds} className="min-h-16 px-7 text-lg">
                <Pictogram name="globe" className="h-6 w-6" />
                {t("steam.hero.lab")}
              </PushButton>
            </div>
          </div>

          {/* Earth → Moon → Mars as the trip of the mission. */}
          <div aria-hidden="true" className="relative mx-auto flex h-44 w-full max-w-md items-end justify-between sm:h-56">
            <span className="absolute left-8 right-8 top-1/2 border-t-2 border-dashed border-content-muted/40" />
            {(["earth", "moon", "mars"] as const).map((world, i) => (
              <motion.span
                key={world}
                className={i === 1 ? "self-start" : "self-end"}
                initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.2 + i * 0.15, type: "spring", stiffness: 160, damping: 14 }}
              >
                <PaperPlanetImage planet={world} className={i === 1 ? "h-20 w-20 sm:h-24 sm:w-24" : "h-24 w-24 sm:h-32 sm:w-32"} />
              </motion.span>
            ))}
          </div>
        </div>
      </motion.section>


      <div ref={missionRef} className="scroll-mt-4">
        <Expedition sites={sites} onOpenScience={onOpenScience} />
      </div>
    </div>
  );
}
