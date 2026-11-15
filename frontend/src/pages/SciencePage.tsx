import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { useNumberFormat } from "../components/expedition/format";
import { AnalogCard } from "../components/science/AnalogCard";
import { downloadCsv, downloadGeoJson } from "../components/science/exportMeasured";
import { MeasuredMap } from "../components/science/MeasuredMap";
import { MeasuredRanking } from "../components/science/MeasuredRanking";
import { useMeasuredCells } from "../components/science/measuredCells";
import { AnatomyFigure } from "../components/ui/AnatomyFigure";
import { AppBackdrop } from "../components/ui/AppBackdrop";
import { CardboardButton } from "../components/ui/CardboardButton";
import { Pictogram } from "../components/worlds/Pictograms";
import { STANDARD_G, WORLD_FACTS } from "../data/threeWorlds";

const LANGS = ["es", "pt", "en"] as const;
type Target = "mars" | "moon";

interface SciencePageProps {
  onOpenLearn: () => void;
  onOpenAdvanced: () => void;
}

/**
 * Science mode, static: choose a target → see only the measured zones on a map → read one card
 * (what matches, how much, against the classic, what breaks) → download CSV/GeoJSON with sources.
 * Works from the snapshot, without a backend.
 */
export function SciencePage({ onOpenLearn, onOpenAdvanced }: SciencePageProps) {
  const { t, i18n } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = Boolean(useReducedMotion());
  const lang = i18n.language.slice(0, 2);
  const [attempt, setAttempt] = useState(0);
  const state = useMeasuredCells(attempt);
  const [target, setTarget] = useState<Target>("mars");
  const [selected, setSelected] = useState<string>("");

  useEffect(() => {
    if (state.status === "ready" && !selected) setSelected(state.cells[0].h3);
  }, [state, selected]);

  const cells = state.status === "ready" ? state.cells : [];
  const cellIndex = cells.findIndex((c) => c.h3 === selected);
  const cell = cellIndex >= 0 ? cells[cellIndex] : null;
  const moon = WORLD_FACTS.moon;

  return (
    <div className="relative isolate min-h-[100svh] overflow-x-hidden text-content">
      <AppBackdrop />
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <img src="/img/ckepi/svg/ckepi-horizontal-vector-dark.svg" alt="CKEPI" width={180} height={56} className="h-10 w-auto sm:h-12" />
        <nav className="flex flex-wrap items-center gap-2" aria-label={t("local.language")}>
          {LANGS.map((code) => (
            <CardboardButton
              key={code}
              tone={lang === code ? "active" : "card"}
              aria-pressed={lang === code}
              onClick={() => void i18n.changeLanguage(code)}
              className="w-11 px-0 text-sm font-bold uppercase"
            >
              {code}
            </CardboardButton>
          ))}
          <CardboardButton onClick={onOpenLearn} className="text-sm">
            <Pictogram name="learn" className="h-5 w-5" />
            {t("science.toLearn")}
          </CardboardButton>
        </nav>
      </header>

      <main id="main-content" className="relative z-10 mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 sm:px-8">
        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{t("science.title")}</h1>
          <p className="max-w-3xl text-lg text-content-muted sm:text-xl">{t("science.lead")}</p>
        </section>

        {/* Step 1 — target */}
        <section aria-labelledby="target-title" className="flex flex-col gap-2">
          <h2 id="target-title" className="text-base font-semibold">
            {t("science.target.label")}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:max-w-xl">
            {(["mars", "moon"] as const).map((key) => (
              <motion.button
                key={key}
                type="button"
                aria-pressed={target === key}
                onClick={() => setTarget(key)}
                className={`group relative overflow-hidden rounded-2xl text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent ${
                  target === key ? "ring-4 ring-ckepi-copper" : "opacity-80"
                }`}
                whileHover={reduceMotion ? undefined : { y: -3, rotate: -0.5 }}
                whileTap={reduceMotion ? undefined : { y: 1, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 22 }}
              >
                <img
                  src={`/img/terrain-art/ckepi-map-${key}.webp`}
                  alt=""
                  width={768}
                  height={512}
                  decoding="async"
                  className="aspect-[3/2] w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ckepi-space/95 to-transparent px-3 pb-2 pt-6 text-base font-bold text-ckepi-salt sm:text-lg">
                  {t(`science.target.${key}`)}
                </span>
              </motion.button>
            ))}
          </div>
          <p className="text-xs text-content-muted">{t("science.target.conceptual")}</p>
        </section>

        <AnimatePresence mode="wait" initial={false}>
          {target === "moon" ? (
            <motion.section
              key="moon"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ckepi-paper-card flex flex-col gap-3 rounded-3xl p-6"
              aria-labelledby="moon-title"
            >
              <h2 id="moon-title" className="text-2xl font-bold">
                {t("science.moon.title")}
              </h2>
              <p className="text-lg">{t("science.moon.lead")}</p>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {`${fmt(moon.gravityMs2.value / STANDARD_G)} g · ≈ 0 kPa · ${fmt(moon.radiationMsvYr.value, 0)} ${t("lab.units.msvYr")}`}
              </p>
              <p className="text-base text-content-muted">{t("science.moon.next")}</p>
              <p className="text-xs text-content-muted">{t("science.card.gapSource")}</p>
            </motion.section>
          ) : (
            <motion.div
              key="mars"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-6"
            >
              {state.status === "loading" && (
                <p className="ckepi-paper-card rounded-2xl p-6 text-lg" role="status">
                  {t("science.loading")}
                </p>
              )}
              {state.status === "error" && (
                <div className="ckepi-paper-card flex flex-wrap items-center gap-4 rounded-2xl p-6" role="alert">
                  <p className="text-lg">{t("science.error")}</p>
                  <CardboardButton onClick={() => setAttempt((n) => n + 1)}>{t("expedition.retry")}</CardboardButton>
                </div>
              )}
              {state.status === "ready" && cell && (
                <>
                  {/* Steps 2 and 3 — map with only the measured zones, and the single card */}
                  <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <div className="flex flex-col gap-2">
                      <MeasuredMap cells={cells} selected={selected} onSelect={setSelected} format={fmt} />
                      <p className="text-xs text-content-muted">{t("science.map.legend")}</p>
                    </div>
                    <AnalogCard cell={cell} rank={cellIndex + 1} format={fmt} />
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                    <MeasuredRanking cells={cells} selected={selected} onSelect={setSelected} format={fmt} />
                    {/* Step 4 — download */}
                    <section aria-labelledby="download-title" className="ckepi-paper-card-salt flex flex-col gap-3 rounded-3xl p-5">
                      <h2 id="download-title" className="flex items-center gap-2 text-xl font-bold">
                        <Pictogram name="hexCell" className="h-6 w-6" />
                        {t("science.download.title")}
                      </h2>
                      <p className="text-base">{t("science.download.lead")}</p>
                      <div className="flex flex-wrap gap-2">
                        <CardboardButton tone="primary" size="lg" onClick={() => downloadCsv(cells)} className="font-bold">
                          {t("science.download.csv")}
                        </CardboardButton>
                        <CardboardButton size="lg" onClick={() => downloadGeoJson(cells)} className="font-bold">
                          {t("science.download.geojson")}
                        </CardboardButton>
                      </div>
                      <p className="text-xs">{t("science.download.note")}</p>
                    </section>
                  </div>

                  {/* How the number is made: the Anatomy slope machine (code-drawn, interactive). */}
                  <section aria-labelledby="machine-title" className="flex flex-col gap-3">
                    <h2 id="machine-title" className="text-xl font-bold sm:text-2xl">
                      {t("science.machine.title")}
                    </h2>
                    <p className="text-base text-content-muted">{t("science.machine.lead")}</p>
                    <AnatomyFigure name="slope-machine" title={t("science.machine.title")} />
                  </section>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle/40 pt-4 text-sm text-content-muted">
          <p>{t("science.footer")}</p>
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="min-h-11 rounded-full px-3 font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t("science.advanced")}
          </button>
        </footer>
      </main>
    </div>
  );
}
