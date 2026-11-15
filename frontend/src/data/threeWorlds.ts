/**
 * Physical parameters of the three worlds for the Learn workshop, each with its source.
 * Rule: no number here is invented. Global values come from the NASA NSSDCA Planetary Fact
 * Sheets (Williams, 2024 — REFERENCES.md); radiation from Hassler et al. 2014 (Mars, measured),
 * Reitz et al. 2012 (Moon, simulated, solar minimum) and the UNSCEAR world average (Earth).
 * Local values (Antofagasta pampa, Jezero, Shackleton) are read at runtime from the static
 * snapshot (frontend/public/data/local) and are not duplicated here.
 */
export type WorldId = "earth" | "moon" | "mars";

export type SourceId = "nssdca" | "hassler2014" | "reitz2012" | "unscear" | "snapshot";

export interface SourcedValue {
  value: number;
  source: SourceId;
}

export interface WorldFacts {
  /** Surface gravity, m/s². */
  gravityMs2: SourcedValue;
  /** Mean surface pressure, mbar (hPa). */
  pressureMbar: SourcedValue;
  /** Surface ionizing dose, mSv per year. */
  radiationMsvYr: SourcedValue;
  /** Length of the solar day, hours. */
  solarDayH: SourcedValue;
}

export const STANDARD_G = 9.80665;

export const WORLD_FACTS: Record<WorldId, WorldFacts> = {
  earth: {
    gravityMs2: { value: 9.8, source: "nssdca" },
    pressureMbar: { value: 1014, source: "nssdca" },
    radiationMsvYr: { value: 2.4, source: "unscear" },
    solarDayH: { value: 24.0, source: "nssdca" },
  },
  moon: {
    gravityMs2: { value: 1.62, source: "nssdca" },
    // NSSDCA: ~3 × 10⁻¹⁵ bar at night — effectively vacuum.
    pressureMbar: { value: 3e-12, source: "nssdca" },
    radiationMsvYr: { value: 380, source: "reitz2012" },
    solarDayH: { value: 708.7, source: "nssdca" },
  },
  mars: {
    gravityMs2: { value: 3.71, source: "nssdca" },
    pressureMbar: { value: 6.36, source: "nssdca" },
    radiationMsvYr: { value: 230, source: "hassler2014" },
    solarDayH: { value: 24.66, source: "nssdca" },
  },
};

export const WORLDS: WorldId[] = ["earth", "moon", "mars"];
