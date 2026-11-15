import { useTranslation } from "react-i18next";

import { useNumberFormat } from "./format";
import { PracticeShell } from "./PracticeShell";
import { TerrainSource } from "./TerrainSource";
import type { ExpeditionData, Level } from "./types";

const W = 320;
const H = 90;

/** Turns an elevation profile into a filled paper strip, heights relative to its own lowest point. */
function stripPath(distances: number[], elevations: number[], maxRelief: number) {
  const min = Math.min(...elevations);
  const maxX = distances[distances.length - 1] || 1;
  const points = elevations.map((z, i) => {
    const x = (distances[i] / maxX) * W;
    const y = H - ((z - min) / maxRelief) * (H - 10);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return `M0,${H} L${points.join(" L")} L${W},${H} Z`;
}

const relief = (elevations: number[]) => Math.max(...elevations) - Math.min(...elevations);

interface ObservePracticeProps {
  data: ExpeditionData;
  level: Level;
}

/** Look: two real 6 km cuts side by side, at the same vertical scale. */
export function ObservePractice({ data, level }: ObservePracticeProps) {
  const { t } = useTranslation();
  const fmt = useNumberFormat();
  const terrain = data.candidateTerrain;
  const pampaRelief = relief(terrain.earth_profile_elev_m);
  const jezeroRelief = relief(terrain.planetary_profile_elev_m);
  // Same vertical scale for both strips, so the eye compares like with like.
  const scale = Math.max(pampaRelief, jezeroRelief, 1);

  const strips = [
    { key: "pampa", label: t("expedition.steps.observe.pampa"), elev: terrain.earth_profile_elev_m, fill: "fill-ckepi-copper", r: pampaRelief },
    { key: "jezero", label: t("expedition.steps.observe.jezero"), elev: terrain.planetary_profile_elev_m, fill: "fill-planet-mars", r: jezeroRelief },
  ];

  return (
    <PracticeShell id="observe" level={level} pictogram="observe" source={<TerrainSource terrain={terrain} />}>
      <div className="grid gap-4 md:grid-cols-2">
        {strips.map((strip) => (
          <figure key={strip.key} className="ckepi-paper-card rounded-2xl p-4">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full" role="img" aria-label={`${strip.label}: ${t("expedition.steps.observe.peak", { m: fmt(strip.r, 0) })}`}>
              <path d={stripPath(terrain.profile_distance_m, strip.elev, scale)} className={strip.fill} />
              <path d={`M0,${H} H${W}`} className="stroke-content/40" strokeWidth="2" />
            </svg>
            <figcaption className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-base font-semibold">{strip.label}</span>
              <span className="text-sm tabular-nums text-content-muted">{t("expedition.steps.observe.peak", { m: fmt(strip.r, 0) })}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-3 text-sm text-content-muted">{t("expedition.steps.observe.scale")}</p>
    </PracticeShell>
  );
}
