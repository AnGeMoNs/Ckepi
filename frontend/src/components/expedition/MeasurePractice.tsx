import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CardboardButton } from "../ui/CardboardButton";
import { useNumberFormat } from "./format";
import { PracticeShell } from "./PracticeShell";
import { TerrainSource } from "./TerrainSource";
import type { ExpeditionData, Level } from "./types";

const MAX_DEG = 20;

interface MeasurePracticeProps {
  data: ExpeditionData;
  level: Level;
}

/** Measure: tilt a cardboard plank to feel what a slope in degrees means, then snap to the real medians. */
export function MeasurePractice({ data, level }: MeasurePracticeProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const point = data.candidateTerrain.scale_sensitivity.find((p) => p.resolution_m === 30) ?? data.candidateTerrain.scale_sensitivity[0];
  const jezero = point.planetary_slope_median_deg;
  const pampa = point.earth_slope_median_deg;
  const [deg, setDeg] = useState(jezero);
  // Rise in centimetres for every metre walked: tan(angle) × 100.
  const riseCm = Math.tan((deg * Math.PI) / 180) * 100;

  return (
    <PracticeShell
      id="measure"
      level={level}
      pictogram="measure"
      params={{ jezero: fmt(jezero), pampa: fmt(pampa) }}
      source={<TerrainSource terrain={data.candidateTerrain} />}
    >
      <div className="ckepi-paper-card grid gap-5 rounded-2xl p-4 md:grid-cols-[1.2fr_1fr] md:items-center sm:p-6">
        <svg viewBox="0 0 300 140" className="h-40 w-full" aria-hidden="true">
          {/* Ground line and the plank pivoting on its left end */}
          <path d="M10 120 H290" className="stroke-content/40" strokeWidth="3" strokeLinecap="round" />
          <g transform={`rotate(${-deg} 30 120)`}>
            <rect x="30" y="108" width="250" height="12" rx="3" className="fill-ckepi-copper" />
            <rect x="30" y="108" width="250" height="4" rx="2" className="fill-ckepi-salt" opacity="0.5" />
            <circle cx="250" cy="100" r="8" className="fill-ckepi-sulfur" />
          </g>
          <circle cx="30" cy="120" r="6" className="fill-content" />
        </svg>
        <div className="flex flex-col gap-3">
          <label htmlFor="expedition-slope" className="text-lg font-semibold">
            {t("expedition.steps.measure.angle", { deg: fmt(deg, 1) })}
          </label>
          <input
            id="expedition-slope"
            type="range"
            min={0}
            max={MAX_DEG}
            step={0.1}
            value={deg}
            onChange={(event) => setDeg(Number(event.target.value))}
            className="h-11 w-full accent-accent"
          />
          <p className="text-base text-content-muted">{t("expedition.steps.measure.rise", { cm: fmt(riseCm, 1) })}</p>
          <div className="flex flex-wrap gap-2">
            <CardboardButton tone={deg === jezero ? "active" : "card"} onClick={() => setDeg(jezero)}>
              {t("expedition.steps.measure.snapJezero", { deg: fmt(jezero) })}
            </CardboardButton>
            <CardboardButton tone={deg === pampa ? "active" : "card"} onClick={() => setDeg(pampa)}>
              {t("expedition.steps.measure.snapPampa", { deg: fmt(pampa) })}
            </CardboardButton>
          </div>
          <p className="text-sm text-content-muted">{t("expedition.steps.measure.medianNote")}</p>
        </div>
      </div>
    </PracticeShell>
  );
}
