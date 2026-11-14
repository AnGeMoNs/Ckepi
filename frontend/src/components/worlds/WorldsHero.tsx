import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { compareCellWithSite } from "../../api/client";
import { formatNumber } from "../../i18n";
import type { PlanetarySite, SiteComparisonResponse } from "../../types/analog";
import { NumberTicker } from "../motion/NumberTicker";
import { CrossingDialog } from "./CrossingDialog";
import { PaperPlanet, type WorldKey } from "./PaperPlanet";

/** Antofagasta cell whose real terrain best matches Jezero (docs/RESULTADOS_TERRENO_REALES.md). */
export const ANTOFAGASTA_CELL = "83b224fffffffff";

type Verdict = "match" | "partial" | "gap";

const VERDICT_STYLE: Record<Verdict, string> = {
  match: "border-status-valid/50 text-status-valid",
  partial: "border-status-warn/50 text-status-warn",
  gap: "border-status-break/50 text-status-break",
};

const CARD_ORDER: WorldKey[] = ["moon", "earth", "mars"];

interface WorldsHeroProps {
  sites: PlanetarySite[];
}

/** Main screen: the three worlds as living cards; each opens the interactive "crossing" with Antofagasta. */
export function WorldsHero({ sites }: WorldsHeroProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const reduceMotion = Boolean(useReducedMotion());
  const [open, setOpen] = useState<WorldKey | null>(null);
  const [marsCrossing, setMarsCrossing] = useState<SiteComparisonResponse | null>(null);

  const moon = sites.find((s) => s.site_id === "moon_shackleton_pole") ?? null;
  const mars = sites.find((s) => s.site_id === "mars_jezero_crater") ?? null;

  // The flagship real comparison: Jezero (Mars) ↔ Antofagasta cell 83b224, real DEMs at 30 m.
  useEffect(() => {
    const controller = new AbortController();
    compareCellWithSite(ANTOFAGASTA_CELL, "mars_jezero_crater", "ridge", { signal: controller.signal })
      .then(setMarsCrossing)
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const slopeW1 = marsCrossing?.statistical_distribution?.slope_distribution.wasserstein_distance ?? null;

  const cards: Record<WorldKey, { hook: number | null; hookFormat: (v: number) => string; verdicts: [string, Verdict][] }> = {
    moon: {
      hook: moon?.variables.breakage.gravity_g ?? null,
      hookFormat: (v) => `${formatNumber(v, lang, 2)} g`,
      verdicts: [
        ["worldsHero.verdict.dryness", "partial"],
        ["worldsHero.verdict.vacuum", "gap"],
        ["worldsHero.verdict.radiation", "gap"],
      ],
    },
    earth: {
      hook: 4,
      hookFormat: (v) => formatNumber(v, lang, 0),
      verdicts: [
        ["worldsHero.verdict.realDem", "match"],
        ["worldsHero.verdict.local", "match"],
        ["worldsHero.verdict.network", "partial"],
      ],
    },
    mars: {
      hook: slopeW1,
      hookFormat: (v) => `${formatNumber(v, lang, 2)}°`,
      verdicts: [
        ["worldsHero.verdict.terrain", slopeW1 !== null ? "match" : "partial"],
        ["worldsHero.verdict.cold", "partial"],
        ["worldsHero.verdict.gravityAirRadiation", "gap"],
      ],
    },
  };

  return (
    <section aria-labelledby="worlds-hero-title" className="space-y-5">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{t("worldsHero.kicker")}</p>
        <h1 id="worlds-hero-title" className="mt-1 text-3xl font-bold leading-tight text-content sm:text-4xl">
          {t("worldsHero.title")}
        </h1>
        <p className="mt-2 text-base text-content-muted sm:text-lg">{t("worldsHero.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {CARD_ORDER.map((world, index) => {
          const card = cards[world];
          const featured = world === "earth";
          return (
            <motion.button
              key={world}
              type="button"
              onClick={() => setOpen(world)}
              aria-haspopup="dialog"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 140, damping: 22, delay: reduceMotion ? 0 : index * 0.12 }}
              whileHover={reduceMotion ? undefined : { y: -6 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              className={`ckepi-glass group relative flex flex-col items-center overflow-hidden rounded-3xl border p-5 text-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent ${
                featured ? "border-accent/60 shadow-ckepi-glow" : "border-border-subtle"
              }`}
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-content-muted">
                {t(`worldsHero.${world}.tag`)}
              </span>
              <PaperPlanet world={world} className="my-3 h-28 w-28 sm:h-36 sm:w-36" />
              <h2 className="text-xl font-bold text-content">{t(`worldsHero.${world}.name`)}</h2>
              <p className="mt-1 min-h-[2.5rem] text-sm text-content-muted">{t(`worldsHero.${world}.question`)}</p>

              <div className="mt-3 flex items-baseline gap-2">
                {card.hook !== null ? (
                  <NumberTicker value={card.hook} format={card.hookFormat} className="font-mono text-3xl font-semibold text-accent" />
                ) : (
                  <span className="font-mono text-3xl text-content-muted">…</span>
                )}
              </div>
              <p className="text-xs text-content-muted">{t(`worldsHero.${world}.hookLabel`)}</p>

              <ul className="mt-4 flex w-full flex-col gap-1.5">
                {card.verdicts.map(([key, verdict]) => (
                  <li
                    key={key}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${VERDICT_STYLE[verdict]}`}
                  >
                    {t(`worldsHero.verdictLabel.${verdict}`)} · {t(key)}
                  </li>
                ))}
              </ul>

              <span className="mt-5 inline-flex min-h-11 items-center rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground transition group-hover:brightness-110">
                {t(`worldsHero.${world}.cta`)}
              </span>
            </motion.button>
          );
        })}
      </div>

      <CrossingDialog
        world={open}
        onClose={() => setOpen(null)}
        moon={moon}
        mars={mars}
        marsCrossing={marsCrossing}
      />
    </section>
  );
}
