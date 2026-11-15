import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";

import { formatNumber, formatPercent } from "../../i18n";
import type {
  MultiAgencyCatalogResponse,
  SiteComparisonResponse,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { ParamIcon, type ParamIconName } from "../ui/ParamIcon";
import { ProgressBar } from "../ui/ProgressBar";

const DIMENSION_ART: Record<string, ParamIconName> = {
  geology: "soil", terrain: "slope", thermal: "temperature", water: "water",
  aeolian: "wind", biology: "vegetation", subsurface: "relief", operations: "gravity",
};

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
  const reducedMotion = useReducedMotion();
  const [expandedDimension, setExpandedDimension] = useState<string | null>(null);
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
        icon: "hexCell" as PictogramName,
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
        icon: "terrain" as PictogramName,
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
        icon: "temperature" as PictogramName,
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
        icon: "pressure" as PictogramName,
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
        icon: "pressure" as PictogramName,
        score: aeolianScore,
        processKey: "mission.dimensions.aeolianProcess",
        detail: t("mission.dimensions.aeolianDetail", {
          wind: formatNumber(eDv.surface_wind_ms ?? 0, lang, 1),
          dust: formatNumber(eDv.aeolian_dust_flux ?? 0, lang, 2),
        }),
      },
      {
        id: "biology",
        icon: "observe" as PictogramName,
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
        icon: "globe" as PictogramName,
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
        icon: "notSimilar" as PictogramName,
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
    <div className="space-y-3 rounded-2xl border border-border-subtle/50 bg-surface/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
            <Pictogram name="measure" className="h-4 w-4 text-accent" />
            <span>{t("mission.dimensions.title")}</span>
          </h3>
          <p className="text-xs text-content-muted">{t("mission.dimensions.subtitle")}</p>
        </div>
        <Badge variant="accent">{t("mission.dimensions.badge")}</Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {dimensions.map((dim) => {
          const pictogram = dim.icon;
          const badgeVariant =
            dim.score >= 0.7 ? "valid" : dim.score >= 0.45 ? "warn" : "break";
          const tone = dim.score >= 0.7 ? "valid" : dim.score >= 0.45 ? "warn" : "break";
          return (
            <motion.article
              key={dim.id}
              whileHover={reducedMotion ? undefined : { y: -3 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className={`measurement-card flex flex-col justify-between space-y-3 rounded-2xl border p-3 ${expandedDimension === dim.id ? "measurement-card-active" : ""}`}
            >
              <div className="space-y-1.5">
                <button type="button" aria-expanded={expandedDimension === dim.id} onClick={() => setExpandedDimension((current) => current === dim.id ? null : dim.id)} className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <span className="flex items-center gap-2 text-xs font-bold text-content">
                    <ParamIcon name={DIMENSION_ART[dim.id]} className="h-12 w-12" />
                    <span>{t(`mission.dimensions.items.${dim.id}.title`)}</span>
                  </span>
                  <Badge variant={badgeVariant}>{formatPercent(dim.score, lang)}</Badge>
                </button>

                <ProgressBar
                  value={dim.score}
                  tone={tone}
                  label={t(`mission.dimensions.items.${dim.id}.title`)}
                />

                <AnimatePresence initial={false}>{expandedDimension === dim.id && <motion.p className="flex items-start gap-1.5 overflow-hidden text-xs leading-relaxed text-accent" initial={reducedMotion ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reducedMotion ? undefined : { height: 0, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}><Pictogram name={pictogram} className="mt-0.5 h-4 w-4 shrink-0" />{t(dim.processKey)}</motion.p>}</AnimatePresence>
              </div>

              <p className="border-t border-border-subtle pt-2 text-xs leading-relaxed text-content-muted">
                {dim.detail}
              </p>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
