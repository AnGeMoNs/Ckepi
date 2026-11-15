import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { STANDARD_G, WORLD_FACTS, WORLDS, type WorldId } from "../../data/threeWorlds";
import { useNumberFormat } from "../expedition/format";
import type { LocalWorlds } from "./useLocalWorlds";
import { UnitToggle } from "./UnitToggle";

export interface MetaphorProps {
  /** Increments each time the visitor triggers the experiment, so the animation replays. */
  run: number;
  selected: WorldId;
  local: LocalWorlds;
}

const EARTH_JUMP_CM = 50;
const BACKPACK_KG = 10;

/** Three columns, one per world; the chosen world is lifted like a card picked from the table. */
function Columns({ selected, render }: { selected: WorldId; render: (world: WorldId) => ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {WORLDS.map((world) => (
        <div
          key={world}
          className={`flex flex-col items-center gap-2 rounded-2xl p-2 text-center sm:p-3 ${
            world === selected ? "ckepi-paper-card-salt -translate-y-1" : "ckepi-paper-card"
          }`}
        >
          <span className="text-sm font-bold sm:text-base">{t(`lab.worlds.${world}.name`)}</span>
          {render(world)}
        </div>
      ))}
    </div>
  );
}

/** Gravity: the same 50 cm jump on each world (height ∝ 1/g) and the felt weight of a backpack. */
export function GravityMetaphor({ run, selected }: MetaphorProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = useReducedMotion();
  const [unit, setUnit] = useState<"g" | "ms2">("g");
  const gEarth = WORLD_FACTS.earth.gravityMs2.value;
  const heights = Object.fromEntries(WORLDS.map((w) => [w, (EARTH_JUMP_CM * gEarth) / WORLD_FACTS[w].gravityMs2.value])) as Record<WorldId, number>;
  const maxH = Math.max(...Object.values(heights));

  return (
    <div className="flex flex-col gap-4">
      <UnitToggle units={["g", "ms2"] as const} value={unit} onChange={setUnit} />
      <Columns
        selected={selected}
        render={(world) => {
          const ms2 = WORLD_FACTS[world].gravityMs2.value;
          const px = (heights[world] / maxH) * 150;
          return (
            <>
              <p className="font-mono text-lg font-bold tabular-nums">
                {unit === "g" ? `${fmt(ms2 / STANDARD_G, 2)} g` : `${fmt(ms2, 2)} m/s²`}
              </p>
              <svg viewBox="0 0 60 180" className="h-40 w-14" aria-hidden="true">
                <path d="M6 172 H54" className="stroke-current opacity-50" strokeWidth="3" strokeLinecap="round" />
                <path d={`M30 ${166 - px} V166`} className="stroke-current opacity-25" strokeWidth="1.5" strokeDasharray="3 4" />
                <motion.circle
                  key={run}
                  cx="30"
                  cy="160"
                  r="10"
                  className="fill-ckepi-copper"
                  initial={{ y: 0 }}
                  animate={reduceMotion || run === 0 ? { y: -px } : { y: [0, -px, 0, -px] }}
                  transition={{ duration: 0.6 + (heights[world] / maxH) * 1.8, ease: "easeInOut", times: [0, 0.4, 0.8, 1] }}
                />
              </svg>
              <p className="text-sm">{t("lab.params.gravity.jump", { cm: fmt(heights[world], 0) })}</p>
              <p className="text-sm opacity-80">
                {t("lab.params.gravity.backpack", { kg: fmt((BACKPACK_KG * ms2) / gEarth, 1) })}
              </p>
            </>
          );
        }}
      />
    </div>
  );
}

const MBAR_PER: Record<"kpa" | "mbar" | "atm", number> = { kpa: 10, mbar: 1, atm: 1013.25 };

/** Air: a balloon filled at Earth's pressure, carried to each world (Boyle's law, same temperature). */
export function AirMetaphor({ run, selected, local }: MetaphorProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = useReducedMotion();
  const [unit, setUnit] = useState<"kpa" | "mbar" | "atm">("kpa");
  const earth = WORLD_FACTS.earth.pressureMbar.value;
  const show = (mbar: number) => {
    const v = mbar / MBAR_PER[unit];
    const digits = v === 0 ? 0 : v < 0.01 ? 5 : v < 1 ? 3 : v < 10 ? 2 : 0;
    return `${fmt(v, digits)} ${t(`lab.units.${unit}`)}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <UnitToggle units={["kpa", "mbar", "atm"] as const} value={unit} onChange={setUnit} />
      <Columns
        selected={selected}
        render={(world) => {
          const mbar = WORLD_FACTS[world].pressureMbar.value;
          const ratio = earth / mbar;
          const vacuum = world === "moon";
          const bursts = ratio > 4;
          // Radius grows with the cube root of the volume; bursting balloons tear apart.
          const r = Math.min(14 * Math.cbrt(ratio), 40);
          return (
            <>
              <p className="font-mono text-lg font-bold tabular-nums">{vacuum ? `≈ 0 ${t(`lab.units.${unit}`)}` : show(mbar)}</p>
              <svg viewBox="0 0 100 110" className="h-32 w-24" aria-hidden="true">
                <path d="M50 108 V80" className="stroke-current opacity-50" strokeWidth="1.5" />
                {bursts ? (
                  <motion.g
                    key={run}
                    initial={{ scale: 0.4, opacity: 1 }}
                    animate={reduceMotion || run === 0 ? { scale: 1 } : { scale: [0.4, 1.2, 1], rotate: [0, 8, -4] }}
                    transition={{ duration: 0.9 }}
                    className="origin-center"
                  >
                    {[0, 72, 144, 216, 288].map((a) => (
                      <path key={a} d="M50 50 L58 30 L50 36 L44 24 Z" className="fill-planet-mars" transform={`rotate(${a} 50 50)`} />
                    ))}
                  </motion.g>
                ) : (
                  <motion.ellipse
                    key={run}
                    cx="50"
                    cy={80 - r}
                    rx={r * 0.85}
                    ry={r}
                    className="fill-ckepi-copper"
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 120, damping: 10 }}
                  />
                )}
              </svg>
              <p className="text-sm">
                {vacuum
                  ? t("lab.params.air.vacuum")
                  : world === "earth"
                    ? t("lab.params.air.reference")
                    : t("lab.params.air.balloon", { x: fmt(ratio, ratio < 10 ? 1 : 0) })}
              </p>
              {world === "earth" && local.pampaPressureMbar !== null && (
                <p className="text-sm opacity-80">{t("lab.params.air.pampa", { v: show(local.pampaPressureMbar) })}</p>
              )}
            </>
          );
        }}
      />
    </div>
  );
}

/** Radiation: each dot is one Earth-year of natural dose; dots fill like a dosimeter. */
export function RadiationMetaphor({ run, selected }: MetaphorProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = useReducedMotion();
  const [unit, setUnit] = useState<"msvYr" | "msvDay">("msvYr");
  const unitDose = WORLD_FACTS.earth.radiationMsvYr.value;

  return (
    <div className="flex flex-col gap-4">
      <UnitToggle units={["msvYr", "msvDay"] as const} value={unit} onChange={setUnit} />
      <Columns
        selected={selected}
        render={(world) => {
          const dose = WORLD_FACTS[world].radiationMsvYr.value;
          const dots = Math.round(dose / unitDose);
          const value = unit === "msvYr" ? dose : dose / 365.25;
          return (
            <>
              <p className="font-mono text-lg font-bold tabular-nums">
                {`${fmt(value, unit === "msvYr" ? (value < 10 ? 1 : 0) : value < 0.1 ? 3 : 2)} ${t(`lab.units.${unit}`)}`}
              </p>
              <div key={run} className="grid w-full max-w-[9rem] grid-cols-10 gap-[3px]" aria-hidden="true">
                {Array.from({ length: dots }, (_, i) => (
                  <motion.span
                    key={i}
                    className="aspect-square rounded-full bg-status-warn"
                    initial={reduceMotion || run === 0 ? false : { opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: reduceMotion ? 0 : i * 0.012, duration: 0.2 }}
                  />
                ))}
              </div>
              <p className="text-sm">{t("lab.params.radiation.count", { n: dots })}</p>
            </>
          );
        }}
      />
      <p className="text-sm opacity-80">{t("lab.params.radiation.dots")}</p>
    </div>
  );
}

/** Day–night swing at each site: a thermometer whose column spans the swing. */
export function SwingMetaphor({ run, selected, local }: MetaphorProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = useReducedMotion();
  const [unit, setUnit] = useState<"c" | "f">("c");
  const values = WORLDS.map((w) => local.swing[w]?.k ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="flex flex-col gap-4">
      <UnitToggle units={["c", "f"] as const} value={unit} onChange={setUnit} />
      <Columns
        selected={selected}
        render={(world) => {
          const swing = local.swing[world];
          if (!swing) return null;
          // A temperature difference: 1 K = 1 °C = 1.8 °F.
          const v = unit === "c" ? swing.k : swing.k * 1.8;
          const h = (swing.k / max) * 130;
          return (
            <>
              <p className="font-mono text-lg font-bold tabular-nums">{`${fmt(v, 0)} ${t(`lab.units.${unit}`)}`}</p>
              <svg viewBox="0 0 40 160" className="h-36 w-10" aria-hidden="true">
                <rect x="14" y="10" width="12" height="136" rx="6" className="fill-current opacity-15" />
                <motion.rect
                  key={run}
                  x="14"
                  width="12"
                  rx="6"
                  className="fill-status-break"
                  initial={reduceMotion || run === 0 ? { y: 146 - h, height: h } : { y: 146, height: 0 }}
                  animate={{ y: 146 - h, height: h }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                />
                <circle cx="20" cy="148" r="10" className="fill-status-break" />
              </svg>
              <p className="text-sm">
                {t("lab.params.swing.range", { v: `${fmt(v, 0)} ${t(`lab.units.${unit}`)}` })}{" "}
                <span className="opacity-70">{swing.measured ? t("lab.params.swing.measured") : t("lab.params.swing.model")}</span>
              </p>
            </>
          );
        }}
      />
    </div>
  );
}

/** Length of the solar day: a strip of paper that unrolls for as long as one day lasts. */
export function DayMetaphor({ run, selected }: MetaphorProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const reduceMotion = useReducedMotion();
  const [unit, setUnit] = useState<"h" | "days">("h");
  const max = Math.max(...WORLDS.map((w) => WORLD_FACTS[w].solarDayH.value));

  return (
    <div className="flex flex-col gap-4">
      <UnitToggle units={["h", "days"] as const} value={unit} onChange={setUnit} />
      <ul className="flex flex-col gap-3">
        {WORLDS.map((world) => {
          const hours = WORLD_FACTS[world].solarDayH.value;
          const v = unit === "h" ? hours : hours / 24;
          const label = `${fmt(v, unit === "h" ? (hours < 100 ? 1 : 0) : 1)} ${t(`lab.units.${unit}`)}`;
          return (
            <li
              key={world}
              className={`flex flex-col gap-1 rounded-2xl p-3 ${world === selected ? "ckepi-paper-card-salt" : "ckepi-paper-card"}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-bold">{t(`lab.worlds.${world}.name`)}</span>
                <span className="font-mono font-bold tabular-nums">{t("lab.params.day.length", { v: label })}</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-black/20">
                <motion.div
                  key={run}
                  className="h-full origin-left rounded-full bg-ckepi-sulfur"
                  initial={reduceMotion || run === 0 ? { scaleX: hours / max } : { scaleX: 0 }}
                  animate={{ scaleX: hours / max }}
                  transition={{ duration: 0.4 + (hours / max) * 1.6, ease: "linear" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
