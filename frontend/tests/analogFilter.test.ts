import assert from "node:assert/strict";
import test from "node:test";
import type { AnalogMatchItem } from "../src/types/analog";
import { filterAndSortMatches } from "../src/utils/analogFilter";

function makeMatch(overrides: Partial<AnalogMatchItem>): AnalogMatchItem {
  return {
    earth_cell_h3: "82b227fffffffff",
    h3_resolution: 2,
    coordinates: { lat: -24.1, lon: -69.9 },
    h3_boundary: [],
    region_key: "regions.atacama_yungay",
    country_code: "CL",
    biome_key: "biomes.hyperarid_desert",
    is_benchmark: true,
    known_analog_name: "Atacama (Yungay)",
    s_ind: 0.85,
    s_dep: 0.72,
    combined_score: 0.798,
    confidence_adjusted_score: 0.78,
    score_uncertainty: 0.04,
    confidence_interval: [0.75, 0.84],
    effective_scale_km: 158.2,
    r_break_overall: 0.74,
    iv_similarity_breakdown: {},
    dv_similarity_breakdown: {},
    breakage_alerts: [],
    engineering_recommendations: {
      viability_tier: "high",
      valid_tests: [],
      invalid_tests: [],
    },
    earth_variables: { independent: {}, dependent: {}, breakage: {} },
    provenance: {
      source_apis: ["NASA POWER"],
      observation_window: "2024",
      fetched_at: "2026-01-01T00:00:00Z",
      is_live_probed: false,
    },
    ...overrides,
  };
}

const fakeTranslate = (key: string) =>
  ({
    "regions.atacama_yungay": "Atacama Yungay",
    "regions.lut_desert": "Lut Desert",
    "biomes.hyperarid_desert": "Hyperarid Desert",
  })[key] ?? key;

test("filterAndSortMatches filters by query across localized region, country, and category", () => {
  const matches = [
    makeMatch({ earth_cell_h3: "cell-cl", is_benchmark: true, country_code: "CL" }),
    makeMatch({
      earth_cell_h3: "cell-ir",
      region_key: "regions.lut_desert",
      known_analog_name: null,
      country_code: "IR",
      is_benchmark: false,
      combined_score: 0.76,
    }),
  ];

  const discoveryOnly = filterAndSortMatches({
    matches,
    searchQuery: "",
    category: "discovery",
    sortBy: "combined",
    translate: fakeTranslate,
  });
  assert.deepEqual(discoveryOnly.map((m) => m.earth_cell_h3), ["cell-ir"]);

  const byText = filterAndSortMatches({
    matches,
    searchQuery: "lut",
    category: "all",
    sortBy: "combined",
    translate: fakeTranslate,
  });
  assert.deepEqual(byText.map((m) => m.earth_cell_h3), ["cell-ir"]);
});

test("filterAndSortMatches sorts by s_ind, s_dep, and lowest_breakage cleanly", () => {
  const matches = [
    makeMatch({ earth_cell_h3: "a", s_ind: 0.6, s_dep: 0.9, r_break_overall: 0.8 }),
    makeMatch({ earth_cell_h3: "b", s_ind: 0.95, s_dep: 0.5, r_break_overall: 0.5 }),
  ];

  assert.deepEqual(
    filterAndSortMatches({
      matches,
      searchQuery: "",
      category: "all",
      sortBy: "s_ind",
      translate: fakeTranslate,
    }).map((m) => m.earth_cell_h3),
    ["b", "a"]
  );

  assert.deepEqual(
    filterAndSortMatches({
      matches,
      searchQuery: "",
      category: "all",
      sortBy: "lowest_breakage",
      translate: fakeTranslate,
    }).map((m) => m.earth_cell_h3),
    ["b", "a"]
  );
});
