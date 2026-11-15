import { useState } from "react";
import { useTranslation } from "react-i18next";

import { AnatomyFigure } from "../ui/AnatomyFigure";
import { CardboardButton } from "../ui/CardboardButton";
import { useNumberFormat } from "./format";
import { PracticeShell } from "./PracticeShell";
import { TerrainSource } from "./TerrainSource";
import type { ExpeditionData, Level } from "./types";

type Earth = "pampa" | "yungay";

const W = 320;
const H = 120;

interface ComparePracticeProps {
  data: ExpeditionData;
  level: Level;
}

/** Compare: two "piles" of slopes (real histograms); W₁ says how many degrees separate them. */
export function ComparePractice({ data, level }: ComparePracticeProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const [earth, setEarth] = useState<Earth>("pampa");
  const slope = data.candidateTerrain.slope_distribution;
  const earthDensity = earth === "pampa" ? slope.earth_density : slope.control_yungay_density;
  const maxDensity = Math.max(...slope.planetary_density, ...slope.earth_density, ...slope.control_yungay_density, 1e-9);
  const n = slope.bin_centers.length;
  const slot = W / n;
  const bar = slot * 0.4;
  const [lo, hi] = slope.w1_ci_95;

  const params = {
    w1: fmt(slope.wasserstein_distance),
    lo: fmt(lo),
    hi: fmt(hi),
    yungay: fmt(slope.control_yungay_w1),
  };

  return (
    <PracticeShell id="compare" level={level} pictogram="compare" params={params} source={<TerrainSource terrain={data.candidateTerrain} />}>
      <div className="ckepi-paper-card rounded-2xl p-4 sm:p-6">
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("expedition.steps.compare.legendEarth")}>
          {(["pampa", "yungay"] as const).map((key) => (
            <CardboardButton key={key} tone={earth === key ? "active" : "card"} aria-pressed={earth === key} onClick={() => setEarth(key)}>
              {t(`expedition.steps.compare.${key}`)}
            </CardboardButton>
          ))}
        </div>

        <svg viewBox={`0 0 ${W} ${H + 4}`} className="mt-4 h-44 w-full" aria-hidden="true">
          {slope.bin_centers.map((_, i) => {
            const mh = (slope.planetary_density[i] / maxDensity) * H;
            const eh = (earthDensity[i] / maxDensity) * H;
            const x = i * slot + slot * 0.1;
            return (
              <g key={i}>
                <rect x={x} y={H - mh} width={bar} height={mh} rx="1.5" className="fill-planet-mars" />
                <rect x={x + bar} y={H - eh} width={bar} height={eh} rx="1.5" className="fill-ckepi-sulfur" />
              </g>
            );
          })}
          <path d={`M0 ${H + 1} H${W}`} className="stroke-content/40" strokeWidth="2" />
        </svg>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-sm text-content-muted">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm bg-planet-mars" />
            {t("expedition.steps.compare.legendJezero")}
            <span aria-hidden="true" className="ml-3 inline-block h-3 w-3 rounded-sm bg-ckepi-sulfur" />
            {t(`expedition.steps.compare.${earth}`)}
          </span>
          <span>{t("expedition.steps.compare.axis")}</span>
        </div>

        <p className="mt-4 font-mono text-xl font-semibold" aria-live="polite">
          {earth === "pampa"
            ? t("expedition.steps.compare.result", params)
            : t("expedition.steps.compare.resultNoCi", { w1: params.yungay })}
        </p>
        <p className="text-base text-content-muted">{t("expedition.steps.compare.closer")}</p>
        <p className="mt-3 text-lg font-semibold text-accent">{t("expedition.steps.compare.winner")}</p>
      </div>
      <div className="mt-6">
        <AnatomyFigure name="slope-machine" title={t("science.machine.title")} />
      </div>
    </PracticeShell>
  );
}
