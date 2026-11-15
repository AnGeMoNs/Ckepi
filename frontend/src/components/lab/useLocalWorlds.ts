import { useEffect, useState } from "react";

import { getJezeroComparison } from "../../api/localData";
import type { PlanetarySite } from "../../types/analog";
import type { WorldId } from "../../data/threeWorlds";

/** Local (site-level) values for the workshop, read from the static snapshot. */
export interface LocalWorlds {
  /** Surface pressure at the Antofagasta candidate cell, mbar (its altitude lowers it). */
  pampaPressureMbar: number | null;
  /** Day–night temperature swing per site, K (= °C difference) and whether it is measured. */
  swing: Record<WorldId, { k: number; measured: boolean } | null>;
}

const EMPTY: LocalWorlds = { pampaPressureMbar: null, swing: { earth: null, moon: null, mars: null } };

const CANDIDATE_CELL = "83b224fffffffff";
const MOON_SITE = "moon_shackleton_pole";

export function useLocalWorlds(sites: PlanetarySite[]): LocalWorlds {
  const [data, setData] = useState<LocalWorlds>(EMPTY);

  useEffect(() => {
    const controller = new AbortController();
    getJezeroComparison(CANDIDATE_CELL, controller.signal)
      .then((comparison) => {
        const earth = comparison.match.earth_variables;
        const mars = comparison.site.variables;
        const moon = sites.find((s) => s.site_id === MOON_SITE)?.variables ?? null;
        const marsProvenance = comparison.site.provenance;
        setData({
          pampaPressureMbar: earth.breakage.atm_pressure_mbar,
          swing: {
            earth: { k: earth.dependent.diurnal_temp_amplitude_k, measured: true },
            // Jezero: REMS/MEDA telemetry (curated site); Shackleton: catalogue model.
            mars: { k: mars.dependent.diurnal_temp_amplitude_k, measured: !marsProvenance.is_live_probed },
            moon: moon ? { k: moon.dependent.diurnal_temp_amplitude_k, measured: false } : null,
          },
        });
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [sites]);

  return data;
}
