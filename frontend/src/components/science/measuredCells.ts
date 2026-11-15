import { useEffect, useState } from "react";

import { getJezeroComparison } from "../../api/localData";
import type { SiteComparisonResponse } from "../../types/analog";

/**
 * Earth windows measured against Jezero at a common 30 m scale (real DEMs), read from the static
 * snapshot (frontend/public/data/local). One row per H3 cell; this is the whole "important zones"
 * list shown to the scientist — nothing is padded with synthetic cells.
 */
export interface MeasuredCell {
  h3: string;
  lat: number;
  lon: number;
  boundary: [number, number][];
  w1Deg: number;
  w1CiDeg: [number, number];
  ks: number;
  earthMedianDeg: number;
  jezeroMedianDeg: number;
  reliefW1M: number;
  /** W₁ at 60 m and 90 m (scale sensitivity). */
  w1At: { m60: number | null; m90: number | null };
  yungayW1Deg: number;
  resolutionM: number;
  earthDem: string;
  marsDem: string;
  comparison: SiteComparisonResponse;
}

/** Classic control analog (Yungay, Atacama). Coordinates from backend/app/engine/known_analogs.py. */
export const YUNGAY_CONTROL = { lat: -24.08, lon: -69.91 } as const;

const META_URL = "/data/local/meta.json";

function toCell(comparison: SiteComparisonResponse): MeasuredCell | null {
  const terrain = comparison.statistical_distribution;
  if (!terrain) return null;
  const at = (m: number) => terrain.scale_sensitivity.find((p) => p.resolution_m === m) ?? null;
  const p30 = at(30) ?? terrain.scale_sensitivity[0];
  const slope = terrain.slope_distribution;
  return {
    h3: comparison.match.earth_cell_h3,
    lat: comparison.match.coordinates.lat,
    lon: comparison.match.coordinates.lon,
    boundary: comparison.match.h3_boundary.map(([lon, lat]) => [lon, lat] as [number, number]),
    w1Deg: slope.wasserstein_distance,
    w1CiDeg: slope.w1_ci_95,
    ks: slope.ks_statistic,
    earthMedianDeg: p30.earth_slope_median_deg,
    jezeroMedianDeg: p30.planetary_slope_median_deg,
    reliefW1M: terrain.relief_distribution.wasserstein_distance,
    w1At: { m60: at(60)?.slope_wasserstein_deg ?? null, m90: at(90)?.slope_wasserstein_deg ?? null },
    yungayW1Deg: slope.control_yungay_w1,
    resolutionM: terrain.common_resolution_m,
    earthDem: terrain.earth_dem_source,
    marsDem: terrain.planetary_dem_source,
    comparison,
  };
}

type State = { status: "loading" } | { status: "error" } | { status: "ready"; cells: MeasuredCell[] };

/** Loads every measured cell listed in the snapshot, sorted by W₁ (closest to Jezero first). */
export function useMeasuredCells(attempt: number): State {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    (async () => {
      const res = await fetch(META_URL, { signal: controller.signal });
      if (!res.ok) throw new Error("meta");
      const meta = (await res.json()) as { cells?: unknown };
      const ids = Array.isArray(meta.cells) ? meta.cells.filter((c): c is string => typeof c === "string") : [];
      const comparisons = await Promise.all(ids.map((id) => getJezeroComparison(id, controller.signal)));
      const cells = comparisons.map(toCell).filter((c): c is MeasuredCell => c !== null);
      cells.sort((a, b) => a.w1Deg - b.w1Deg);
      if (cells.length === 0) throw new Error("empty");
      setState({ status: "ready", cells });
    })().catch(() => {
      if (!controller.signal.aborted) setState({ status: "error" });
    });
    return () => controller.abort();
  }, [attempt]);

  return state;
}
