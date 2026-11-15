import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";

import { STANDARD_G, WORLD_FACTS, WORLDS, type SourceId, type WorldId } from "../../data/threeWorlds";
import type { PlanetarySite } from "../../types/analog";
import { useNumberFormat } from "../expedition/format";
import { AnatomyFigure, useFigureAvailable, type FigureName } from "../ui/AnatomyFigure";
import { CardboardButton } from "../ui/CardboardButton";
import { LearnCutout, type CutoutName } from "../ui/LearnCutout";
import { ParamIcon, type ParamIconName } from "../ui/ParamIcon";
import { PaperPlanetImage } from "../ui/PaperPlanetImage";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";
import {
  AirMetaphor,
  DayMetaphor,
  GravityMetaphor,
  RadiationMetaphor,
  SwingMetaphor,
  type MetaphorProps,
} from "./Metaphors";
import { useLocalWorlds } from "./useLocalWorlds";

type ParamId = "gravity" | "air" | "radiation" | "swing" | "day";

/** Interactive Anatomy figure per parameter; until it exists, the animated metaphor stands in. */
const FIGURE: Partial<Record<ParamId, FigureName>> = {
  gravity: "gravity-bench",
  air: "pressure-chamber",
  radiation: "weather-station",
  swing: "weather-station",
};

const ICON: Record<ParamId, ParamIconName> = {
  gravity: "gravity",
  air: "atmosphere",
  radiation: "radiation",
  swing: "temperature",
  day: "solar",
};

const CUTOUT: Record<ParamId, CutoutName> = {
  gravity: "learn-backpack-scale",
  air: "learn-balloon",
  radiation: "learn-dosimeter",
  swing: "learn-thermometer",
  day: "learn-sundial",
};

const PARAMS: { id: ParamId; pictogram: PictogramName; Metaphor: ComponentType<MetaphorProps>; sources: SourceId[]; choices: WorldId[] }[] = [
  { id: "gravity", pictogram: "gravity", Metaphor: GravityMetaphor, sources: ["nssdca"], choices: WORLDS },
  { id: "air", pictogram: "pressure", Metaphor: AirMetaphor, sources: ["nssdca", "snapshot"], choices: WORLDS },
  { id: "radiation", pictogram: "radiation", Metaphor: RadiationMetaphor, sources: ["unscear", "hassler2014", "reitz2012"], choices: ["moon", "mars"] },
  { id: "swing", pictogram: "thermalSwing", Metaphor: SwingMetaphor, sources: ["snapshot"], choices: WORLDS },
  { id: "day", pictogram: "sun", Metaphor: DayMetaphor, sources: ["nssdca"], choices: WORLDS },
];

interface WorldLabProps {
  sites?: PlanetarySite[];
  onStartMission: () => void;
}

const EMPTY_SITES: PlanetarySite[] = [];

/**
 * Learn workshop: three cardboard worlds on the table. Tapping one opens its card; each value
 * is then crossed with the other two worlds through a predict → observe → explain experiment.
 */
export function WorldLab({ sites = EMPTY_SITES, onStartMission }: WorldLabProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = Boolean(useReducedMotion());
  const local = useLocalWorlds(sites);
  const [world, setWorld] = useState<WorldId>("mars");
  const [param, setParam] = useState<ParamId>("gravity");
  const [prediction, setPrediction] = useState<WorldId | null>(null);
  const [run, setRun] = useState(0);

  const current = PARAMS.find((p) => p.id === param) ?? PARAMS[0];
  const figure = FIGURE[param];
  const figureReady = useFigureAvailable(figure ?? "slope-machine") && figure !== undefined;
  const answer = t(`lab.params.${param}.answer`) as WorldId;
  const revealed = prediction !== null;

  const chooseParam = (next: ParamId) => {
    setParam(next);
    setPrediction(null);
  };
  const predict = (choice: WorldId) => {
    setPrediction(choice);
    setRun((n) => n + 1);
  };

  // The world card: one line per parameter, in a readable default unit.
  const facts = WORLD_FACTS[world];
  const swing = local.swing[world];
  const card: { id: ParamId; pictogram: PictogramName; value: string }[] = [
    { id: "gravity", pictogram: "gravity", value: `${fmt(facts.gravityMs2.value / STANDARD_G, 2)} g` },
    {
      id: "air",
      pictogram: "pressure",
      value: world === "moon" ? `≈ 0 ${t("lab.units.kpa")}` : `${fmt(facts.pressureMbar.value / 10, facts.pressureMbar.value < 100 ? 2 : 0)} ${t("lab.units.kpa")}`,
    },
    { id: "radiation", pictogram: "radiation", value: `${fmt(facts.radiationMsvYr.value, facts.radiationMsvYr.value < 10 ? 1 : 0)} ${t("lab.units.msvYr")}` },
    { id: "swing", pictogram: "thermalSwing", value: swing ? `${fmt(swing.k, 0)} ${t("lab.units.c")}` : "" },
    { id: "day", pictogram: "sun", value: `${fmt(facts.solarDayH.value, facts.solarDayH.value < 100 ? 1 : 0)} ${t("lab.units.h")}` },
  ];

  return (
    <section className="flex flex-col gap-6" aria-labelledby="lab-title">
      <header className="flex flex-col gap-2">
        <h1 id="lab-title" className="text-3xl font-bold leading-tight sm:text-5xl">
          {t("lab.title")}
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-content-muted sm:text-xl">{t("lab.lead")}</p>
      </header>

      {/* The table: three cardboard worlds. The chosen one comes forward. */}
      <LayoutGroup>
        <ul className="ckepi-paper-table grid grid-cols-3 items-end gap-2 rounded-3xl px-2 pb-4 pt-6 sm:gap-6 sm:px-6">
          {WORLDS.map((id) => {
            const active = id === world;
            return (
              <li key={id} className="flex justify-center">
                <motion.button
                  type="button"
                  onClick={() => setWorld(id)}
                  aria-pressed={active}
                  aria-label={`${t(`lab.worlds.${id}.name`)}: ${t(`lab.worlds.${id}.place`)}`}
                  className="group flex flex-col items-center gap-2 rounded-3xl p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent"
                  animate={{ scale: active ? 1 : 0.8, opacity: active ? 1 : 0.85 }}
                  whileHover={reduceMotion ? undefined : { scale: active ? 1.04 : 0.86 }}
                  whileTap={reduceMotion ? undefined : { scale: active ? 0.97 : 0.78 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <PaperPlanetImage planet={id} className="h-24 w-24 sm:h-40 sm:w-40 lg:h-48 lg:w-48" floating={active} />
                  <span className={`rounded-full px-3 py-1 text-sm font-bold sm:text-lg ${active ? "ckepi-cardboard ckepi-cardboard-active" : "ckepi-cardboard"}`}>
                    {t(`lab.worlds.${id}.name`)}
                  </span>
                  {active && (
                    <motion.span layoutId="lab-place" className="text-xs font-semibold text-content-muted sm:text-sm">
                      {t(`lab.worlds.${id}.place`)}
                    </motion.span>
                  )}
                </motion.button>
              </li>
            );
          })}
        </ul>
      </LayoutGroup>

      {/* The world's card: tap a value to cross it with the other worlds. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={world}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, rotate: -0.6 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h2 className="mb-3 text-xl font-bold sm:text-2xl">{t("lab.factsTitle", { world: t(`lab.worlds.${world}.name`) })}</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3">
            {card.map((item) => (
              <li key={item.id}>
                <CardboardButton
                  tone={item.id === param ? "active" : "card"}
                  onClick={() => chooseParam(item.id)}
                  aria-label={t("lab.openParam", { param: t(`lab.params.${item.id}.tab`) })}
                  className="h-full min-h-20 w-full flex-col gap-1 rounded-2xl py-2"
                >
                  <ParamIcon name={ICON[item.id]} className="h-10 w-10" />
                  <span className="text-sm">{t(`lab.params.${item.id}.tab`)}</span>
                  <span className="font-mono text-base font-bold tabular-nums">{item.value}</span>
                </CardboardButton>
              </li>
            ))}
          </ul>
        </motion.div>
      </AnimatePresence>

      {/* Predict → observe → explain, on the cardboard workbench. */}
      <div className="ckepi-paper-card ckepi-paper-frame rounded-3xl p-4 sm:p-8">
        <div className="flex items-center gap-3">
          <ParamIcon name={ICON[param]} className="h-14 w-14 sm:h-16 sm:w-16" />
          <h2 className="flex-1 text-2xl font-bold leading-tight sm:text-3xl">{t(`lab.params.${param}.tab`)}</h2>
          <LearnCutout name={CUTOUT[param]} className="h-20 w-20 sm:h-28 sm:w-28" />
        </div>

        <p className="mt-4 text-base font-semibold text-accent">{t("lab.predict.label")}</p>
        <p className="mt-1 text-lg leading-relaxed sm:text-xl">{t(`lab.params.${param}.question`)}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={t(`lab.params.${param}.question`)}>
          {current.choices.map((choice) => (
            <CardboardButton
              key={choice}
              tone={prediction === choice ? "active" : "card"}
              aria-pressed={prediction === choice}
              onClick={() => predict(choice)}
              size="lg"
            >
              {t(`lab.worlds.${choice}.name`)}
            </CardboardButton>
          ))}
        </div>

        <AnimatePresence>
          {revealed && (
            <motion.div
              key={`${param}-result`}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 flex flex-col gap-4"
            >
              <p aria-live="polite" className={`text-lg font-bold ${prediction === answer ? "text-status-valid" : "text-status-warn"}`}>
                {prediction === answer ? t("lab.predict.right") : t("lab.predict.wrong")}
              </p>
              {figureReady && figure ? (
                <AnatomyFigure name={figure} world={world} title={t(`lab.params.${param}.tab`)} />
              ) : (
                <current.Metaphor run={run} selected={world} local={local} />
              )}
              <div className="flex flex-wrap gap-2">
                <CardboardButton onClick={() => setRun((n) => n + 1)}>
                  <Pictogram name="replay" className="h-5 w-5" />
                  {t(`lab.params.${param}.action`)}
                </CardboardButton>
                <CardboardButton onClick={() => setPrediction(null)}>{t("lab.predict.again")}</CardboardButton>
              </div>
              <p className="ckepi-paper-strip pt-5 text-lg leading-relaxed">{t(`lab.params.${param}.why`)}</p>
              <p className="text-sm text-content-muted">
                {t("lab.sources.label")}: {current.sources.map((s) => t(`lab.sources.${s}`)).join("; ")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bridge to the solution: from the three worlds to finding an analog in Antofagasta. */}
      <div className="ckepi-paper-card-salt flex flex-col items-start gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <p className="text-lg font-bold sm:text-xl">{t("lab.missionCta")}</p>
        <CardboardButton tone="primary" size="lg" onClick={onStartMission} className="shrink-0 font-bold">
          {t("lab.missionButton")}
        </CardboardButton>
      </div>
    </section>
  );
}
