import { formatNumber, formatPercent, formatTimestamp } from "../i18n";
import type {
  AnalogMatchItem,
  MissionAiAnalysisResponse,
  PlanetarySite,
  TerrainDistributionComparison,
} from "../types/analog";

type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

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
  translate: TranslateFn
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
  translate: TranslateFn
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
  translate: TranslateFn,
  selectedMatch?: AnalogMatchItem,
  lang = "es",
  aiAnalysis?: MissionAiAnalysisResponse | null,
  statisticalDistribution?: TerrainDistributionComparison | null
): void {
  const focus = selectedMatch ?? matches[0];
  const top = matches.slice(0, 5);
  const confidenceScore = formatPercent(site.confidence?.score ?? 0, lang);
  const confidenceLevel = site.confidence?.level ?? translate("export.unknown");

  const lines = [
    `# ${translate("export.reportTitle")}: ${translate(site.name_key)}`,
    ``,
    `- **${translate("export.body")}:** ${site.body.toUpperCase()}`,
    `- **${translate("export.coordinates")}:** (${formatNumber(site.coordinates.lat, lang, 3)}, ${formatNumber(site.coordinates.lon, lang, 3)})`,
    `- **${translate("export.confidenceLevel")}:** ${confidenceLevel} (${confidenceScore})`,
    `- **${translate("export.sources")}:** ${site.data_sources.join(", ")}`,
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
      ? `${translate("export.knownAnalog")}${focus.known_analog_name ? ` (${focus.known_analog_name})` : ""}`
      : translate("export.newCandidate");

    lines.push(
      `## ${translate("export.featuredAnalog")}: ${translate(focus.region_key)}`,
      ``,
      `- **${translate("export.h3Index")}:** \`${focus.earth_cell_h3}\` (res ${focus.h3_resolution})`,
      `- **${translate("export.coordinates")}:** (${formatNumber(focus.coordinates.lat, lang, 3)}, ${formatNumber(focus.coordinates.lon, lang, 3)})`,
      `- **${translate("export.category")}:** ${categoryLabel}`,
      `- **${translate("export.similarity")}:** S_ind ${formatPercent(focus.s_ind, lang)} · S_dep ${formatPercent(focus.s_dep, lang)} · ${translate("export.combined")} ${formatPercent(focus.combined_score, lang)}`,
      ``,
      `### ${translate("export.whyAnalogous")}`,
      ...allSims.map(
        ([k, v]) => `- ${translate(`variables.${k}.label`)}: ${formatPercent(v, lang)}`
      ),
      ``,
      `### ${translate("export.whereBreaks")}`,
      ...broken.map(
        (b) =>
          `- ${translate(`variables.${b.variable}.label`)}: ${translate("export.targetVsEarth", {
            target: formatNumber(b.planetary_value, lang, 2),
            earth: formatNumber(b.earth_baseline_value, lang, 2),
          })} (${translate("export.breakageLabel")} ${formatPercent(b.breakage_index, lang)})`
      ),
      ``,
      `### ${translate("export.recommendedUse")}`,
      `**${translate("export.validTests")}**`,
      ...focus.engineering_recommendations.valid_tests.map((k) => `- ${translate(k)}`),
      ``,
      `**${translate("export.invalidTests")}**`,
      ...focus.engineering_recommendations.invalid_tests.map((k) => `- ${translate(k)}`),
      ``
    );

    if (statisticalDistribution) {
      const sDist = statisticalDistribution.slope_distribution;
      const rDist = statisticalDistribution.relief_distribution;
      lines.push(
        `### Common-Scale (30 m) Terrain Distribution Analysis (Wasserstein-1 & KS)`,
        `- **Target DEM Source:** ${statisticalDistribution.planetary_dem_source}`,
        `- **Earth DEM Source:** ${statisticalDistribution.earth_dem_source}`,
        `- **Control Benchmark DEM:** ${statisticalDistribution.control_benchmark_name}`,
        `- **Slope Distribution Distance (30 m):** W₁ = ${sDist.wasserstein_distance.toFixed(2)}° (95% 2D Block-Bootstrap CI: ${sDist.w1_ci_95[0].toFixed(2)}°–${sDist.w1_ci_95[1].toFixed(2)}°), KS D = ${sDist.ks_statistic.toFixed(3)} (vs Yungay Control W₁ = ${sDist.control_yungay_w1.toFixed(2)}°)`,
        `- **Local Relief Distance (300x300 m window):** W₁ = ${rDist.wasserstein_distance.toFixed(2)} m (95% 2D Block-Bootstrap CI: ${rDist.w1_ci_95[0].toFixed(2)}–${rDist.w1_ci_95[1].toFixed(2)} m), KS D = ${rDist.ks_statistic.toFixed(3)}`,
        `- **Multi-Scale Sensitivity (30 m / 60 m / 90 m):**`,
        ...statisticalDistribution.scale_sensitivity.map(
          (pt) =>
            `  - **${pt.resolution_m} m scale:** Slope W₁ = ${pt.slope_wasserstein_deg.toFixed(2)}°, KS D = ${pt.slope_ks_stat.toFixed(3)}, Relief W₁ = ${pt.relief_wasserstein_m.toFixed(2)} m, Earth P50/P90 = ${pt.earth_slope_median_deg.toFixed(2)}°/${pt.earth_slope_p90_deg.toFixed(2)}°`
        ),
        ``
      );
    }

    lines.push(
      `### Territorial Impact (Antofagasta & Caja La Araucana — UN SDGs)`,
      `- **La Araucana Strategic Alignment:** (1) Democratizing frontier science, (2) STEAM employability & open data science, (3) Local application in Antofagasta Region, (4) Interregional innovation lattice.`,
      `- **Verified UN SDG Targets:** ODS 4.3, 4.4 (STEAM & technical education), ODS 8 & 9.5 (scientific research & innovation), ODS 10 (territorial equity), ODS 17.3, 17.16, 17.17 (multi-stakeholder partnerships).`,
      ``
    );
  }

  if (
    aiAnalysis &&
    aiAnalysis.site_id === site.site_id &&
    (!focus || aiAnalysis.earth_cell_h3 === focus.earth_cell_h3)
  ) {
    lines.push(
      `## ${translate("export.aiSectionTitle")}`,
      ``,
      `- **${translate("export.aiModelMeta")}:** ${aiAnalysis.model_used} (${aiAnalysis.provider})`,
      `- **${translate("export.aiGeneratedMeta")}:** ${formatTimestamp(new Date(aiAnalysis.generated_at), lang)}`,
      ``,
      `### ${translate("export.aiExecutiveTitle")}`,
      aiAnalysis.executive_synthesis,
      ``,
      `### ${translate("export.aiViabilityTitle")}`,
      aiAnalysis.viability_assessment,
      ``,
      `### ${translate("export.aiScaleConfidenceTitle")}`,
      aiAnalysis.confidence_and_scale_note,
      ``,
      `### ${translate("export.aiStrengthsTitle")}`,
      ...aiAnalysis.key_strengths.map((s) => `- **${s.title}:** ${s.detail}`),
      ``,
      `### ${translate("export.aiLimitationsTitle")}`,
      ...aiAnalysis.physical_limitations_and_gaps.map((g) => `- **${g.title}:** ${g.detail}`),
      ``,
      `### ${translate("export.aiMitigationsTitle")}`,
      ...aiAnalysis.breakage_mitigation_plan.map(
        (m) =>
          `- **${m.variable}:** ${m.earth_gap_impact} → *${m.recommended_facility_or_protocol}*`
      ),
      ``,
      `### ${translate("export.aiConsiderationsTitle")}`,
      ...aiAnalysis.field_campaign_considerations.map((c) => `- ${c}`),
      ``,
      `### ${translate("export.aiNextStepsTitle")}`,
      ...aiAnalysis.recommended_next_steps.map((n) => `- ${n}`),
      ``,
      `> ${translate("mission.ai.disclaimer")}`,
      ``
    );
  }

  lines.push(
    `## ${translate("export.topAnalogs")}`,
    ``,
    `| ${translate("export.rankCol")} | ${translate("export.regionCol")} | ${translate("export.categoryCol")} | ${translate("export.countryCol")} | S_ind | S_dep | ${translate("export.combined")} | R_break |`,
    `|---|---|---|---|---|---|---|---|`,
    ...top.map(
      (m, i) =>
        `| ${i + 1} | ${translate(m.region_key)}${m.known_analog_name ? ` (${m.known_analog_name})` : ""} | ${m.is_benchmark ? translate("export.knownShort") : translate("export.newShort")} | ${m.country_code} | ${formatPercent(m.s_ind, lang)} | ${formatPercent(m.s_dep, lang)} | ${formatPercent(m.combined_score, lang)} | ${formatPercent(m.r_break_overall, lang)} |`
    )
  );
  downloadBlob(
    `ckepi_${site.site_id}_report.md`,
    lines.join("\n"),
    "text/markdown;charset=utf-8;"
  );
}
