import type { AnalogMatchItem, PlanetarySite } from "../types/analog";

function downloadBlob(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportMatchesToCsv(
  matches: AnalogMatchItem[],
  siteId: string,
  translate: (key: string) => string
): void {
  const headers = [
    "rank",
    "h3_index",
    "region",
    "country_code",
    "lat",
    "lon",
    "is_benchmark",
    "s_ind",
    "s_dep",
    "combined_score",
    "confidence_adjusted_score",
    "score_uncertainty",
    "r_break_overall",
    "viability_tier",
  ];
  const rows = matches.map((m, idx) =>
    [
      idx + 1,
      m.earth_cell_h3,
      `"${translate(m.region_key).replace(/"/g, '""')}"`,
      m.country_code,
      m.coordinates.lat,
      m.coordinates.lon,
      m.is_benchmark,
      m.s_ind,
      m.s_dep,
      m.combined_score,
      m.confidence_adjusted_score ?? m.combined_score,
      m.score_uncertainty ?? 0,
      m.r_break_overall,
      m.engineering_recommendations.viability_tier,
    ].join(",")
  );
  downloadBlob(
    `ckepi_${siteId}_analogs.csv`,
    [headers.join(","), ...rows].join("\n"),
    "text/csv;charset=utf-8;"
  );
}

export function exportMatchesToGeoJson(
  matches: AnalogMatchItem[],
  siteId: string,
  translate: (key: string) => string
): void {
  const features = matches.map((m, idx) => ({
    type: "Feature",
    properties: {
      rank: idx + 1,
      h3_index: m.earth_cell_h3,
      region: translate(m.region_key),
      country_code: m.country_code,
      s_ind: m.s_ind,
      s_dep: m.s_dep,
      combined_score: m.combined_score,
      confidence_adjusted_score: m.confidence_adjusted_score ?? m.combined_score,
      r_break_overall: m.r_break_overall,
      viability_tier: m.engineering_recommendations.viability_tier,
    },
    geometry: {
      type: "Polygon",
      coordinates: [m.h3_boundary.map(([lon, lat]) => [lon, lat])],
    },
  }));
  const fc = { type: "FeatureCollection", features };
  downloadBlob(
    `ckepi_${siteId}_analogs.geojson`,
    JSON.stringify(fc, null, 2),
    "application/geo+json;charset=utf-8;"
  );
}

export function exportReportMarkdown(
  site: PlanetarySite,
  matches: AnalogMatchItem[],
  translate: (key: string) => string,
  selectedMatch?: AnalogMatchItem
): void {
  const focus = selectedMatch ?? matches[0];
  const top = matches.slice(0, 5);
  const lines = [
    `# Ckepi Report: ${translate(site.name_key)}`,
    ``,
    `- **Body:** ${site.body.toUpperCase()}`,
    `- **Coordinates:** (${site.coordinates.lat}, ${site.coordinates.lon})`,
    `- **Confidence Level:** ${site.confidence?.level ?? "unknown"} (${Math.round((site.confidence?.score ?? 0) * 100)}%)`,
    `- **Sources:** ${site.data_sources.join(", ")}`,
    ``,
  ];

  if (focus) {
    const allSims = [
      ...Object.entries(focus.iv_similarity_breakdown),
      ...Object.entries(focus.dv_similarity_breakdown),
    ]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const broken = focus.breakage_alerts.filter((b) => b.is_broken);
    const categoryLabel = focus.is_benchmark
      ? `Known Analog${focus.known_analog_name ? ` (${focus.known_analog_name})` : ""}`
      : "New Candidate";

    lines.push(
      `## Featured Analog: ${translate(focus.region_key)}`,
      ``,
      `- **H3 Index:** \`${focus.earth_cell_h3}\` (res ${focus.h3_resolution})`,
      `- **Coordinates:** (${focus.coordinates.lat.toFixed(3)}, ${focus.coordinates.lon.toFixed(3)})`,
      `- **Category:** ${categoryLabel}`,
      `- **Similarity:** S_ind ${(focus.s_ind * 100).toFixed(1)}% · S_dep ${(focus.s_dep * 100).toFixed(1)}% · Combined ${(focus.combined_score * 100).toFixed(1)}%`,
      ``,
      `### Why It Is Analogous (Strongest Drivers)`,
      ...allSims.map(([k, v]) => `- ${translate(`variables.${k}.label`)}: ${(v * 100).toFixed(1)}%`),
      ``,
      `### Where the Analogy Breaks (Earth's Limits)`,
      ...broken.map(
        (b) =>
          `- ${translate(`variables.${b.variable}.label`)}: Target ${b.planetary_value} vs Earth ${b.earth_baseline_value} (Breakage ${(b.breakage_index * 100).toFixed(1)}%)`
      ),
      ``,
      `### Recommended Exploration Use`,
      `**Valid field tests:**`,
      ...focus.engineering_recommendations.valid_tests.map((k) => `- ${translate(k)}`),
      ``,
      `**Cannot be tested on Earth (requires simulation/flight):**`,
      ...focus.engineering_recommendations.invalid_tests.map((k) => `- ${translate(k)}`),
      ``
    );
  }

  lines.push(
    `## Top Terrestrial Analogs`,
    ``,
    `| # | Region | Category | Country | S_ind | S_dep | Combined | R_break |`,
    `|---|---|---|---|---|---|---|---|`,
    ...top.map(
      (m, i) =>
        `| ${i + 1} | ${translate(m.region_key)}${m.known_analog_name ? ` (${m.known_analog_name})` : ""} | ${m.is_benchmark ? "Known" : "New"} | ${m.country_code} | ${(m.s_ind * 100).toFixed(1)}% | ${(m.s_dep * 100).toFixed(1)}% | ${(m.combined_score * 100).toFixed(1)}% | ${(m.r_break_overall * 100).toFixed(1)}% |`
    )
  );
  downloadBlob(
    `ckepi_${site.site_id}_report.md`,
    lines.join("\n"),
    "text/markdown;charset=utf-8;"
  );
}

