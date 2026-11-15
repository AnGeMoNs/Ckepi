import type { AnalogMatchItem } from "../types/analog";

export type AnalogCategoryFilter = "all" | "discovery" | "benchmark";
export type AnalogSortKey = "combined" | "s_ind" | "s_dep" | "lowest_breakage";

export interface FilterAnalogOptions {
  matches: AnalogMatchItem[];
  drilldownChildIds?: string[] | null;
  searchQuery: string;
  category: AnalogCategoryFilter;
  sortBy: AnalogSortKey;
  translate: (key: string) => string;
}

/**
 * Filter Earth H3 analog matches by drilldown subset, discovery/benchmark category,
 * and free-text query across localized region, biome, country, known analog, or H3 index.
 */
export function filterAndSortMatches({
  matches,
  drilldownChildIds,
  searchQuery,
  category,
  sortBy,
  translate,
}: FilterAnalogOptions): AnalogMatchItem[] {
  const childSet = drilldownChildIds ? new Set(drilldownChildIds) : null;
  const query = searchQuery.trim().toLowerCase();

  const filtered = matches.filter((m) => {
    if (childSet && !childSet.has(m.earth_cell_h3)) return false;
    if (category === "discovery" && m.is_benchmark) return false;
    if (category === "benchmark" && !m.is_benchmark) return false;
    if (!query) return true;

    const regionLabel = translate(m.region_key).toLowerCase();
    const biomeLabel = translate(m.biome_key).toLowerCase();
    const knownLabel = (m.known_analog_name ?? "").toLowerCase();
    return (
      regionLabel.includes(query) ||
      biomeLabel.includes(query) ||
      knownLabel.includes(query) ||
      m.country_code.toLowerCase().includes(query) ||
      m.earth_cell_h3.toLowerCase().includes(query)
    );
  });

  if (sortBy === "combined") {
    return filtered;
  }

  return [...filtered].sort((a, b) => {
    if (sortBy === "s_ind") return b.s_ind - a.s_ind;
    if (sortBy === "s_dep") return b.s_dep - a.s_dep;
    return a.r_break_overall - b.r_break_overall;
  });
}
