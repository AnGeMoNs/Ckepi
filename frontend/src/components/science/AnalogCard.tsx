import { useTranslation } from "react-i18next";

import { STANDARD_G, WORLD_FACTS } from "../../data/threeWorlds";
import { CopernicusNotice } from "../ui/CopernicusNotice";
import { ParamIcon } from "../ui/ParamIcon";
import type { MeasuredCell } from "./measuredCells";

interface AnalogCardProps {
  cell: MeasuredCell;
  rank: number;
  format: (value: number, digits?: number) => string;
}

const W = 240;
const H = 56;

/** Tiny paired histogram: Jezero (rust) vs. this cell (sulfur). The shape is the visual parameter. */
function SlopeShape({ cell }: { cell: MeasuredCell }) {
  const slope = cell.comparison.statistical_distribution?.slope_distribution;
  if (!slope) return null;
  const max = Math.max(...slope.planetary_density, ...slope.earth_density, 1e-9);
  const slot = W / slope.bin_centers.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-14 w-full" aria-hidden="true">
      {slope.bin_centers.map((_, i) => {
        const m = (slope.planetary_density[i] / max) * (H - 2);
        const e = (slope.earth_density[i] / max) * (H - 2);
        return (
          <g key={i}>
            <rect x={i * slot + 1} y={H - m} width={slot / 2 - 1} height={m} className="fill-planet-mars" />
            <rect x={i * slot + slot / 2} y={H - e} width={slot / 2 - 1} height={e} className="fill-ckepi-sulfur" />
          </g>
        );
      })}
    </svg>
  );
}

/** The single card: where, how similar, compared with the classic, and what breaks — each with source. */
export function AnalogCard({ cell, rank, format }: AnalogCardProps) {
  const { t } = useTranslation();
  const closer = cell.w1Deg < cell.yungayW1Deg;
  const mars = WORLD_FACTS.mars;

  return (
    <article className="ckepi-paper-card flex flex-col gap-4 rounded-3xl p-5 sm:p-6" aria-labelledby="analog-card-title">
      <header>
        <p className="text-sm font-semibold text-content-muted">{t("science.card.rank", { n: rank })}</p>
        <h2 id="analog-card-title" className="font-mono text-xl font-bold sm:text-2xl">
          {cell.h3}
        </h2>
        <p className="text-sm text-content-muted">
          {t("science.card.coords", { lat: format(Math.abs(cell.lat), 2), lon: format(Math.abs(cell.lon), 2) })}
        </p>
      </header>

      {/* Row 1 — what matches, how much */}
      <section className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <ParamIcon name="slope" className="h-14 w-14" />
          <div>
            <p className="text-base font-semibold">{t("dashboard.metric.slope")}</p>
            <p className="font-mono text-5xl font-bold leading-none tabular-nums">
              {format(cell.w1Deg)}
              <span className="text-2xl">°</span>
            </p>
          </div>
        </div>
        <p className="text-sm text-content-muted">
          {t("science.card.w1", { lo: format(cell.w1CiDeg[0]), hi: format(cell.w1CiDeg[1]), ks: format(cell.ks) })}
        </p>
        <SlopeShape cell={cell} />
        <p className="text-xs text-content-muted">{t("science.card.shapeLegend")}</p>
      </section>

      {/* Row 2 — against the classic analog */}
      <section className={`rounded-2xl p-3 ${closer ? "ckepi-paper-card-salt" : "border border-status-warn/60"}`}>
        <p className="text-base font-bold">{closer ? t("science.card.closer") : t("science.card.farther")}</p>
        <p className="text-sm">{t("science.card.classic", { w1: format(cell.yungayW1Deg) })}</p>
      </section>

      {/* Row 3 — what does not match (irreducible gap) */}
      <section className="flex flex-col gap-1">
        <p className="text-base font-semibold">{t("science.card.breaks")}</p>
        <ul className="grid grid-cols-3 gap-2">
          {[
            { icon: "gravity" as const, label: t("lab.params.gravity.tab"), value: `${format(mars.gravityMs2.value / STANDARD_G)} g` },
            { icon: "atmosphere" as const, label: t("lab.params.air.tab"), value: `${format(mars.pressureMbar.value / 10)} kPa` },
            { icon: "radiation" as const, label: t("lab.params.radiation.tab"), value: `${format(mars.radiationMsvYr.value, 0)} ${t("lab.units.msvYr")}` },
          ].map((item) => (
            <li key={item.icon} className="flex flex-col items-center gap-1 rounded-2xl bg-black/15 p-2 text-center">
              <ParamIcon name={item.icon} className="h-10 w-10" />
              <span className="text-xs text-content-muted">{item.label}</span>
              <span className="font-mono text-sm font-bold tabular-nums">{item.value}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm text-content-muted">{t("science.card.breaksWhy")}</p>
      </section>

      <details className="text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-accent underline-offset-4 hover:underline">
          {t("science.card.details")}
        </summary>
        <ul className="mt-2 space-y-1 text-content-muted">
          <li>{t("science.card.medians", { earth: format(cell.earthMedianDeg), jezero: format(cell.jezeroMedianDeg) })}</li>
          <li>
            {t("science.card.scale", {
              m60: cell.w1At.m60 === null ? "—" : format(cell.w1At.m60),
              m90: cell.w1At.m90 === null ? "—" : format(cell.w1At.m90),
            })}
          </li>
          <li>{t("science.card.relief", { m: format(cell.reliefW1M, 1) })}</li>
          <li>{t("science.card.limits")}</li>
        </ul>
      </details>

      <footer className="flex flex-col gap-1 border-t border-border-subtle/40 pt-3 text-xs text-content-muted">
        <details>
          <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-accent">{t("expedition.sourceLabel")}</summary>
          <p lang="en" className="[overflow-wrap:anywhere]">{cell.marsDem}</p>
          <p lang="en" className="[overflow-wrap:anywhere]">{cell.earthDem}</p>
          <p>{t("science.card.gapSource")}</p>
        </details>
        <CopernicusNotice />
      </footer>
    </article>
  );
}
