import { useState } from "react";
import { useTranslation } from "react-i18next";

import { CardboardButton } from "../ui/CardboardButton";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";
import { useNumberFormat } from "./format";
import { PracticeShell } from "./PracticeShell";
import { MOON_SITE, type ExpeditionData, type Level } from "./types";

type World = "mars" | "moon";

const BACKPACK_KG = 10;

interface DifferentPracticeProps {
  data: ExpeditionData;
  level: Level;
}

/** What is NOT similar: the irreducible physical gap, plus a terrain counter-example. */
export function DifferentPractice({ data, level }: DifferentPracticeProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const [world, setWorld] = useState<World>("mars");
  const base = "expedition.steps.different";

  const mars = data.candidate.site.variables;
  const moon = data.sites.find((s) => s.site_id === MOON_SITE)?.variables ?? null;
  const earth = data.candidate.match.earth_variables;
  const target = world === "mars" ? mars : moon;

  // No hard-coded constants: if the Moon site has not loaded yet, the card shows only its sourced label.
  const gravity = target?.breakage.gravity_g;
  const dtWorld = target?.dependent.diurnal_temp_amplitude_k;
  const dtEarth = earth.dependent.diurnal_temp_amplitude_k;

  const cards: { key: string; pictogram: PictogramName; value: string; why: string }[] = [
    {
      key: "gravity",
      pictogram: "gravity",
      value: t(`${base}.gravity.${world}`),
      why: gravity === undefined ? "" : t(`${base}.gravity.why`, { kg: fmt(BACKPACK_KG * gravity, 1) }),
    },
    {
      key: "pressure",
      pictogram: "pressure",
      value: t(`${base}.pressure.${world}`),
      // Earth cell pressure in mbar → kPa.
      why: t(`${base}.pressure.why`, { kpa: fmt(earth.breakage.atm_pressure_mbar / 10, 0) }),
    },
    {
      key: "radiation",
      pictogram: "radiation",
      value: t(`${base}.radiation.${world}`),
      why: t(`${base}.radiation.why`, { msv: fmt(earth.breakage.radiation_msv_yr, 1) }),
    },
  ];
  if (dtWorld !== undefined && dtEarth !== undefined) {
    // A temperature difference is the same number in K and in °C.
    cards.push({
      key: "thermal",
      pictogram: "thermalSwing",
      // The Moon value comes from a model in the catalogue; Mars is measured (REMS/MEDA).
      value: t(world === "moon" ? `${base}.thermal.valueModel` : `${base}.thermal.value`, { dt: fmt(dtWorld, 0) }),
      why: t(`${base}.thermal.why`, { dt: fmt(dtEarth, 0) }),
    });
  }

  const negative = data.negativeTerrain?.scale_sensitivity.find((p) => p.resolution_m === 30) ?? null;

  return (
    <PracticeShell id="different" level={level} pictogram="notSimilar">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t(`${base}.worldLabel`)}>
          {(["mars", "moon"] as const).map((key) => (
            <CardboardButton key={key} tone={world === key ? "active" : "card"} aria-pressed={world === key} onClick={() => setWorld(key)}>
              {t(`${base}.${key}`)}
            </CardboardButton>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {cards.map((card) => (
            <li key={card.key} className="ckepi-paper-card-salt flex gap-3 rounded-2xl p-4">
              <Pictogram name={card.pictogram} className="h-9 w-9 shrink-0 text-planet-mars" />
              <div>
                <p className="text-base font-semibold">
                  {card.key === "thermal" ? t(`${base}.thermal.label`) : t(`${base}.${card.key}.label`)}
                </p>
                <p className="text-lg font-bold leading-snug">{card.value}</p>
                {card.why && <p className="text-base opacity-80">{card.why}</p>}
              </div>
            </li>
          ))}
        </ul>
        <p className="text-base font-semibold">{t(`${base}.lab`)}</p>

        {negative && (
          <div className="ckepi-paper-card rounded-2xl border-l-4 border-status-break p-4">
            <p className="text-lg font-bold">{t(`${base}.terrainTitle`)}</p>
            <p className="mt-1 text-base">
              {t(`${base}.terrain`, {
                median: fmt(negative.earth_slope_median_deg),
                jezero: fmt(negative.planetary_slope_median_deg),
                w1: fmt(negative.slope_wasserstein_deg),
                lo: fmt(negative.slope_w1_ci_low),
                hi: fmt(negative.slope_w1_ci_high),
              })}
            </p>
          </div>
        )}
      </div>
    </PracticeShell>
  );
}
