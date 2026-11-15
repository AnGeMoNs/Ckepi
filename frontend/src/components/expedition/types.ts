import type { PlanetarySite, SiteComparisonResponse, TerrainDistributionComparison } from "../../types/analog";

export type Level = "kid" | "teen" | "adult";

/** The three stages promised in the pitch; each groups one or more practices. */
export type Stage = "look" | "compare" | "investigate";

export type PracticeId = "observe" | "measure" | "compare" | "different" | "decide";

/** One screen of the expedition. `questions` closes the Investigate stage. */
export type ScreenId = PracticeId | "questions";

/** Real snapshot data shared by every practice (frontend/public/data/local). */
export interface ExpeditionData {
  /** Jezero vs. cell 83b224 (the closest window in slope). */
  candidate: SiteComparisonResponse;
  candidateTerrain: TerrainDistributionComparison;
  /** Jezero vs. cell 83b221 (negative case: much steeper). Optional: the lesson still works without it. */
  negativeTerrain: TerrainDistributionComparison | null;
  /** Catalogue sites, for the Moon's physical gap (Shackleton). */
  sites: PlanetarySite[];
}

export const CANDIDATE_CELL = "83b224fffffffff";
export const NEGATIVE_CELL = "83b221fffffffff";
export const MOON_SITE = "moon_shackleton_pole";
