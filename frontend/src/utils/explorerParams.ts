import type { PlanetaryBody, TestProfileType } from "../types/analog";

export type ExplorerTab = "start" | "mission" | "compare" | "results" | "analysis" | "learn" | "plan" | "evidence";

const PROFILES: readonly TestProfileType[] = [
  "causal_auto", "navigation_landing", "rover_mobility", "isru_ice_drilling",
  "lava_tube_habitat", "solar_power_thermal", "manual_custom",
];

/** URL parameters are untrusted; resolve the actual site/body against the API catalog later. */
export function readExplorerParams(search: string) {
  const params = new URLSearchParams(search);
  const tab = params.get("tab");
  const profile = params.get("profile") as TestProfileType;
  const siteId = params.get("site")?.trim().slice(0, 160) || "mars_jezero_crater";
  return {
    tab: (["start", "mission", "results", "analysis", "learn", "plan", "evidence"].includes(tab ?? "") ? tab : "compare") as ExplorerTab,
    siteId,
    body: (/^(moon_|probe_moon_)/.test(siteId) ? "moon" : "mars") as PlanetaryBody,
    profile: PROFILES.includes(profile) ? profile : "causal_auto",
    discovery: params.get("discovery") === "1",
    penalize: params.get("penalize") === "1",
  };
}
