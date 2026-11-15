import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import type { PlanetaryBody, PlanetarySite } from "../../types/analog";
import { PaperPlanetImage } from "../ui/PaperPlanetImage";

interface DestinationPickerProps {
  sites: PlanetarySite[];
  selectedSiteId: string;
  customProbedSite: PlanetarySite | null;
  activeSite?: PlanetarySite;
  onSelect: (siteId: string, body: PlanetaryBody) => void;
  /** Other tabs reuse the picker as their header: their own title, smaller worlds. */
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const WORLDS: PlanetaryBody[] = ["moon", "mars"];

/**
 * "Where are we going?" — readable in three seconds: one question, two big worlds, the places
 * on the chosen one. A glowing orbit marks the chosen world, a liquid lens the chosen place,
 * and the place's one-line context slides into a glass callout.
 */
export function DestinationPicker({ sites, selectedSiteId, customProbedSite, activeSite, onSelect, title, subtitle, compact = false }: DestinationPickerProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const spring = reduceMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 360, damping: 30 };
  const body: PlanetaryBody = activeSite?.body ?? sites.find((s) => s.site_id === selectedSiteId)?.body ?? "mars";
  const places = [...sites, ...(customProbedSite ? [customProbedSite] : [])].filter((s) => s.body === body);

  // "Marte — Cráter Jezero" → "Cráter Jezero" when the prefix just repeats the world's name.
  const placeName = (site: PlanetarySite) => {
    const name = t(site.name_key);
    const prefix = `${t(`bodies.${site.body}`)} — `;
    return name.startsWith(prefix) ? name.slice(prefix.length) : name;
  };

  const chooseWorld = (world: PlanetaryBody) => {
    if (world === body) return;
    const first = sites.find((s) => s.body === world);
    if (first) onSelect(first.site_id, world);
  };

  return (
    <motion.section
      aria-labelledby="destination-title"
      className={`ckepi-liquid rounded-[2rem] ${compact ? "p-4 sm:p-6" : "p-5 sm:p-8"}`}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 160, damping: 24 }}
    >
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,0.9fr)_auto_minmax(0,1.1fr)] lg:gap-10">
        <div className="text-center lg:text-left">
          <h2 id="destination-title" className="text-3xl font-bold leading-tight tracking-tight text-content sm:text-4xl">
            {title ?? t("explore.destination.title")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-base text-content-muted sm:text-lg lg:mx-0">{subtitle ?? t("explore.destination.subtitle")}</p>
        </div>

        <LayoutGroup id="destination-world">
          <div role="group" aria-label={t("explore.destination.worlds")} className="flex items-end justify-center gap-4 sm:gap-8">
            {WORLDS.map((world) => {
              const active = world === body;
              return (
                <motion.button
                  key={world}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseWorld(world)}
                  whileHover={reduceMotion ? undefined : { y: -6 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                  className="group relative flex flex-col items-center rounded-3xl px-2 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="relative grid place-items-center">
                    {active && (
                      <motion.span
                        layoutId="destination-orbit"
                        aria-hidden="true"
                        transition={spring}
                        className="absolute -inset-3 rounded-full border border-accent/50 bg-accent/10 shadow-ckepi-glow"
                      />
                    )}
                    <motion.span
                      className="relative"
                      animate={reduceMotion ? undefined : { scale: active ? 1 : 0.8, opacity: active ? 1 : 0.65 }}
                      transition={spring}
                    >
                      <PaperPlanetImage planet={world} floating={active} className={compact ? "h-16 w-16 sm:h-20 sm:w-20" : "h-24 w-24 sm:h-32 sm:w-32"} />
                    </motion.span>
                  </span>
                  <span className={`relative mt-3 text-lg font-bold ${active ? "text-content" : "text-content-muted group-hover:text-content"}`}>
                    {t(`bodies.${world}`)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>

        <div className="min-w-0">
          <LayoutGroup id="destination-place">
            <div role="group" aria-label={t("explore.destination.places")} className="flex flex-wrap justify-center gap-2 lg:justify-start">
              <AnimatePresence initial={false} mode="popLayout">
                {places.map((site, index) => {
                  const active = site.site_id === selectedSiteId;
                  const probed = customProbedSite?.site_id === site.site_id;
                  return (
                    <motion.button
                      key={site.site_id}
                      layout={!reduceMotion}
                      type="button"
                      aria-pressed={active}
                      onClick={() => onSelect(site.site_id, site.body)}
                      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: reduceMotion ? 0 : index * 0.05 } }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                      className={`relative min-h-12 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-base ${
                        active ? "text-content" : "ckepi-liquid text-content-muted hover:text-content"
                      }`}
                    >
                      {active && (
                        <motion.span layoutId="destination-place-lens" aria-hidden="true" transition={spring} className="ckepi-liquid ckepi-liquid-glow absolute inset-0 rounded-full border-accent/60" />
                      )}
                      <span className="relative">{probed ? t("explore.destination.probed") : placeName(site)}</span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          </LayoutGroup>

          <AnimatePresence mode="wait" initial={false}>
            {activeSite && !compact && (
              <motion.p
                key={activeSite.site_id}
                initial={reduceMotion ? false : { opacity: 0, y: 8, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="ckepi-liquid mt-4 rounded-2xl px-4 py-3 text-center text-base leading-relaxed text-content lg:text-left"
              >
                {t(activeSite.mission_context_key)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
