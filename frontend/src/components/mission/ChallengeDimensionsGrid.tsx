import {
  Activity,
  Compass,
  Droplets,
  Layers,
  Microscope,
  Mountain,
  ShieldAlert,
  Thermometer,
  Wind,
} from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type {
  MultiAgencyCatalogResponse,
  SiteComparisonResponse,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";

interface ChallengeDimensionsGridProps {
  comparison: SiteComparisonResponse;
  catalog: MultiAgencyCatalogResponse | null;
}

function meanScore(values: Array<number | undefined>): number {
  const valid = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (valid.length === 0) return 0;
  return valid.reduce((acc, v) => acc + v, 0) / valid.length;
}

export function ChallengeDimensionsGrid({
  comparison,
  catalog,
}: ChallengeDimensionsGridProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { match } = comparison;
  const iv = match.iv_similarity_breakdown;
  const dv = match.dv_similarity_breakdown;
  const eIv = match.earth_variables.independent;
  const eDv = match.earth_variables.dependent;

  const dimensions = useMemo(() => {
    const geologyScore = catalog?.regolith_simulant
      ? meanScore([iv.surface_albedo, iv.thermal_inertia, catalog.regolith_simulant.affinity_score])
      : meanScore([iv.surface_albedo, iv.thermal_inertia]);

    const terrainScore = meanScore([iv.slope_deg, iv.topographic_roughness]);
    const thermalScore = meanScore([
      dv.mean_surface_temp_k,
      dv.diurnal_temp_amplitude_k,
      dv.nocturnal_cooling_k_hr,
      iv.solar_flux_wm2,
      iv.uv_irradiance_index,
    ]);
    const waterScore = meanScore([
      iv.subsurface_ice_frac,
      dv.ice_sublimation_rate,
      iv.aridity_index,
      iv.relative_humidity_pct,
    ]);
    const aeolianScore = meanScore([dv.aeolian_dust_flux, dv.surface_wind_ms]);
    const bioScore = catalog?.habitability
      ? meanScore([iv.vegetation_lai_proxy, 1.0 - catalog.habitability.habitability_index * 0.35])
      : iv.vegetation_lai_proxy ?? 0;
    const subsurfaceScore = catalog?.subsurface?.has_lava_tubes_or_caves
      ? Math.min(1, meanScore([iv.surface_albedo, iv.topographic_roughness, 0.85]))
      : meanScore([iv.surface_albedo, iv.topographic_roughness]);
    const opsScore = Math.max(0, 1.0 - match.r_break_overall);

    const w1Slope = comparison.statistical_distribution?.slope_distribution.wasserstein_distance;

    return [
      {
        id: "geology",
        icon: Layers,
        score: geologyScore,
        processKey: "mission.dimensions.geologyProcess",
        detail: catalog?.geology
          ? `${catalog.geology.lithology}${
              catalog.regolith_simulant
                ? ` · ${catalog.regolith_simulant.recommended_code} (${formatPercent(
                    catalog.regolith_simulant.affinity_score,
                    lang
                  )})`
                : ""
            }`
          : t("mission.dimensions.geologyFallback", {
              albedo: formatNumber(eIv.surface_albedo ?? 0, lang, 2),
              ti: formatNumber(eIv.thermal_inertia ?? 0, lang, 0),
            }),
      },
      {
        id: "terrain",
        icon: Mountain,
        score: terrainScore,
        processKey: "mission.dimensions.terrainProcess",
        detail: t("mission.dimensions.terrainDetail", {
          slope: formatNumber(eIv.slope_deg ?? 0, lang, 1),
          rough: formatNumber(eIv.topographic_roughness ?? 0, lang, 2),
          scale: formatNumber(match.effective_scale_km ?? 59.8, lang, 1),
          w1: w1Slope !== undefined ? ` · W1 ${formatNumber(w1Slope, lang, 2)}°` : "",
        }),
      },
      {
        id: "thermal",
        icon: Thermometer,
        score: thermalScore,
        processKey: "mission.dimensions.thermalProcess",
        detail: t("mission.dimensions.thermalDetail", {
          tempC: formatNumber((eDv.mean_surface_temp_k ?? 273.15) - 273.15, lang, 1),
          ampK: formatNumber(eDv.diurnal_temp_amplitude_k ?? 0, lang, 1),
          solar: formatNumber(eIv.solar_flux_wm2 ?? 0, lang, 0),
        }),
      },
      {
        id: "water",
        icon: Droplets,
        score: waterScore,
        processKey: "mission.dimensions.waterProcess",
        detail: t("mission.dimensions.waterDetail", {
          ice: formatPercent(eIv.subsurface_ice_frac ?? 0, lang),
          aridity: formatNumber(eIv.aridity_index ?? 0, lang, 2),
          rh: formatNumber(eIv.relative_humidity_pct ?? 0, lang, 0),
        }),
      },
      {
        id: "aeolian",
        icon: Wind,
        score: aeolianScore,
        processKey: "mission.dimensions.aeolianProcess",
        detail: t("mission.dimensions.aeolianDetail", {
          wind: formatNumber(eDv.surface_wind_ms ?? 0, lang, 1),
          dust: formatNumber(eDv.aeolian_dust_flux ?? 0, lang, 2),
        }),
      },
      {
        id: "biology",
        icon: Microscope,
        score: bioScore,
        processKey: "mission.dimensions.biologyProcess",
        detail: catalog?.habitability
          ? `${t(catalog.habitability.regime_key)} · ${formatPercent(
              catalog.habitability.habitability_index,
              lang
            )}`
          : t("mission.dimensions.biologyFallback", {
              lai: formatNumber(eIv.vegetation_lai_proxy ?? 0, lang, 2),
            }),
      },
      {
        id: "subsurface",
        icon: Compass,
        score: subsurfaceScore,
        processKey: "mission.dimensions.subsurfaceProcess",
        detail: catalog?.subsurface
          ? catalog.subsurface.has_lava_tubes_or_caves
            ? catalog.subsurface.nearest_feature ?? t("subsurface.detectedBadge")
            : t("subsurface.surfaceOnlyBadge")
          : t("mission.dimensions.subsurfaceFallback"),
      },
      {
        id: "operations",
        icon: ShieldAlert,
        score: opsScore,
        processKey: "mission.dimensions.operationsProcess",
        detail: t("mission.dimensions.operationsDetail", {
          valid: String(match.engineering_recommendations.valid_tests.length),
          invalid: String(match.engineering_recommendations.invalid_tests.length),
          rbreak: formatPercent(match.r_break_overall, lang),
        }),
      },
    ];
  }, [catalog, comparison.statistical_distribution, eDv, eIv, iv, dv, lang, match, t]);

  return (
    <div className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
            <Activity className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>{t("mission.dimensions.title")}</span>
          </h3>
          <p className="text-xs text-content-muted">{t("mission.dimensions.subtitle")}</p>
        </div>
        <Badge variant="accent">{t("mission.dimensions.badge")}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dimensions.map((dim) => {
          const Icon = dim.icon;
          const badgeVariant =
            dim.score >= 0.7 ? "valid" : dim.score >= 0.45 ? "warn" : "break";
          const tone = dim.score >= 0.7 ? "valid" : dim.score >= 0.45 ? "warn" : "break";
          return (
            <div
              key={dim.id}
              className="flex flex-col justify-between space-y-2 rounded-lg border border-border-subtle bg-surface-elevated p-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-content">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                    <span>{t(`mission.dimensions.items.${dim.id}.title`)}</span>
                  </span>
                  <Badge variant={badgeVariant}>{formatPercent(dim.score, lang)}</Badge>
                </div>

                <ProgressBar
                  value={dim.score}
                  tone={tone}
                  label={t(`mission.dimensions.items.${dim.id}.title`)}
                />

                <p className="text-[11px] font-medium text-accent">{t(dim.processKey)}</p>
              </div>

              <p className="border-t border-border-subtle pt-1.5 text-[11px] leading-snug text-content-muted">
                {dim.detail}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
