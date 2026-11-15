import { compareCellWithSite, fetchPlanetarySites } from "./client";
import type { PlanetarySite, SiteComparisonResponse } from "../types/analog";

/**
 * Local "Explore" mode data: static snapshot first (frontend/public/data/local, written by
 * backend/scripts/export_local_static_data.py) so it works without a backend; live API as fallback.
 */
const BASE = "/data/local";

async function readStatic<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${path}`, { signal });
    if (!res.ok || !res.headers.get("content-type")?.includes("json")) return null;
    return (await res.json()) as T;
  } catch (err) {
    if (signal?.aborted) throw err;
    return null;
  }
}

export async function getLocalSites(signal?: AbortSignal): Promise<PlanetarySite[]> {
  return (await readStatic<PlanetarySite[]>("sites.json", signal)) ?? fetchPlanetarySites();
}

export async function getJezeroComparison(h3Index: string, signal?: AbortSignal): Promise<SiteComparisonResponse> {
  return (
    (await readStatic<SiteComparisonResponse>(`compare-${h3Index}.json`, signal)) ??
    compareCellWithSite(h3Index, "mars_jezero_crater", "ridge", { signal })
  );
}
