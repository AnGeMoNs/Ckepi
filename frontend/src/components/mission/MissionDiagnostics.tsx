import {
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Globe2,
  Layers,
  Microscope,
  Mountain,
  Rocket,
  Satellite,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { fetchMultiAgencyDatasets } from "../../api/client";
import { formatNumber, formatPercent } from "../../i18n";
import type {
  MultiAgencyCatalogResponse,
  ReadingMode,
  SiteComparisonResponse,
} from "../../types/analog";
import { exportReportMarkdown } from "../../utils/exportResults";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { InfoTooltip } from "../ui/InfoTooltip";
import { ProgressBar } from "../ui/ProgressBar";

interface MissionDiagnosticsProps {
  comparison: SiteComparisonResponse;
  readingMode?: ReadingMode;
  onExported?: () => void;
}

export function MissionDiagnostics({
  comparison,
  readingMode = "mission",
  onExported,
}: MissionDiagnosticsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { match, variable_deltas: deltas } = comparison;
  const recs = match.engineering_recommendations;

  const [catalog, setCatalog] = useState<MultiAgencyCatalogResponse | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [layerFilter, setLayerFilter] = useState<"all" | "independent" | "dependent" | "breakage">("all");

  const filteredDeltas =
    layerFilter === "all" ? deltas : deltas.filter((d) => d.layer === layerFilter);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    fetchMultiAgencyDatasets(match.earth_cell_h3)
      .then((res) => {
        if (!cancelled) setCatalog(res);
      })
      .catch(() => {
        if (!cancelled) setCatalog(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });
    return () => {
      cancelled = true;
    };
  }, [match.earth_cell_h3]);

  const tierVariant =
    recs.viability_tier === "high"
      ? "valid"
      : recs.viability_tier === "moderate"
      ? "warn"
      : "break";

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-accent" aria-hidden="true" />
          <CardTitle>{t("mission.title")}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              exportReportMarkdown(comparison.site, [match], (k, p) => t(k, p), match, lang);
              onExported?.();
            }}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>{t("comparisonMatrix.exportReport")}</span>
          </Button>
          <Badge variant={tierVariant}>
            {t(`mission.viabilityTiers.${recs.viability_tier}`)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Executive Plain-Language Verdict */}
        <div className="rounded border border-accent/30 bg-accent/5 p-4 text-sm text-content">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-accent">
              {readingMode === "explorer"
                ? t("mission.explorerSummaryTitle")
                : t("mission.quickVerdictTitle")}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="default">
                {t("mission.uncertaintyLabel")}: ±
                {formatPercent(match.score_uncertainty ?? 0.05, lang)}
              </Badge>
              <Badge variant="default">
                {t("mission.scaleLabel")}: ~
                {formatNumber(match.effective_scale_km ?? 158, lang, 1)} km
              </Badge>
            </div>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-content sm:text-sm">
            {readingMode === "explorer"
              ? t("mission.explorerSummaryBody", {
                  earthSite: t(match.region_key),
                  score: formatPercent(match.combined_score, lang),
                  uncertainty: formatPercent(match.score_uncertainty ?? 0.05, lang),
                  scaleKm: formatNumber(match.effective_scale_km ?? 158, lang, 1),
                  brokenVars:
                    match.breakage_alerts
                      .filter((b) => b.is_broken)
                      .map((b) => t(`variables.${b.variable}.label`))
                      .join(", ") || t("mission.noneBroken"),
                })
              : t("mission.quickVerdictBody", {
                  earthSite: t(match.region_key),
                  score: formatPercent(match.combined_score, lang),
                  targetSite: t(comparison.site.name_key),
                  validCount: String(recs.valid_tests.length),
                  brokenVars:
                    match.breakage_alerts
                      .filter((b) => b.is_broken)
                      .map((b) => t(`variables.${b.variable}.label`))
                      .join(", ") || t("mission.noneBroken"),
                })}
          </p>
          <p className="mt-2 border-t border-border-subtle pt-2 text-[11px] text-content-muted">
            {t("mission.nasaAttribution")} · {t("mission.disclaimer")}
          </p>
        </div>

        {/* Selected Cell Header & Decoupled Metrics */}
        <div className="rounded border border-border-subtle bg-surface p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-content-muted">
                {t("mission.selectedCell")}
              </p>
              <h3 className="text-base font-bold text-content sm:text-lg">
                {match.known_analog_name ?? t(match.region_key)}
              </h3>
              {match.known_analog_name && (
                <p className="text-xs font-medium text-accent">
                  {t("mission.knownAnalogRef", { name: match.known_analog_name })}
                </p>
              )}
              <p className="text-xs text-content-muted">
                {t(match.biome_key)} · {t("mission.h3Index")}:{" "}
                <code className="font-mono text-content">{match.earth_cell_h3}</code> ·{" "}
                {t("mission.coordinates")}: {formatNumber(match.coordinates.lat, lang, 2)},{" "}
                {formatNumber(match.coordinates.lon, lang, 2)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {match.is_pareto_optimal && (
                <div className="inline-flex items-center gap-0.5">
                  <Badge variant="accent">{t("mission.paretoBadge")}</Badge>
                  <InfoTooltip label={t("mission.paretoBadge")} text={t("mission.paretoHelp")} />
                </div>
              )}
              {match.provenance.is_live_probed && (
                <Badge variant="accent">{t("provenance.liveProbed")}</Badge>
              )}
              <Badge variant={match.is_benchmark ? "default" : "valid"}>
                {match.is_benchmark ? t("map.benchmarkBadge") : t("map.discoveryBadge")}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-content-muted">
            <span className="font-semibold text-content">{t("provenance.title")}:</span>
            {match.provenance.source_apis.map((api) => (
              <Badge key={api} variant="default">
                {api}
              </Badge>
            ))}
            <span>· {match.provenance.observation_window}</span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-content-muted">{t("mission.sIndLabel")}</span>
                <InfoTooltip label={t("mission.sIndLabel")} text={t("controls.minSIndHelp")} />
              </div>
              <p className="text-lg font-bold tabular-nums text-accent">
                {formatPercent(match.s_ind, lang)}
              </p>
              <ProgressBar value={match.s_ind} tone="accent" label={t("mission.sIndLabel")} />
            </div>

            <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-content-muted">{t("mission.sDepLabel")}</span>
                <InfoTooltip label={t("mission.sDepLabel")} text={t("controls.minSDepHelp")} />
              </div>
              <p className="text-lg font-bold tabular-nums text-status-valid">
                {formatPercent(match.s_dep, lang)}
              </p>
              <ProgressBar value={match.s_dep} tone="valid" label={t("mission.sDepLabel")} />
            </div>

            <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs text-content-muted">{t("mission.rBreakLabel")}</span>
                <InfoTooltip label={t("mission.rBreakLabel")} text={t("mission.rBreakHelp")} />
              </div>
              <p className="text-lg font-bold tabular-nums text-status-break">
                {formatPercent(match.r_break_overall, lang)}
              </p>
              <ProgressBar
                value={match.r_break_overall}
                tone="break"
                label={t("mission.rBreakLabel")}
              />
            </div>

            <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1.5">
              <span className="text-xs text-content-muted">{t("mission.combinedLabel")}</span>
              <p className="text-lg font-bold tabular-nums text-content">
                {formatPercent(match.combined_score, lang)}
                {typeof match.score_uncertainty === "number" && match.score_uncertainty > 0 && (
                  <span className="ml-1.5 text-xs font-normal text-content-muted">
                    ± {formatPercent(match.score_uncertainty, lang)}
                  </span>
                )}
              </p>
              <ProgressBar
                value={match.combined_score}
                tone={match.combined_score >= 0.75 ? "valid" : "warn"}
                label={t("mission.combinedLabel")}
              />
            </div>
          </div>
        </div>

        {/* Engineering Valid vs Invalid Tests */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded border border-status-valid/60 bg-status-valid/15 p-4 space-y-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-status-valid">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("mission.validTestsTitle")}
            </h3>
            <ul className="space-y-2">
              {recs.valid_tests.map((testKey) => (
                <li key={testKey} className="flex items-start gap-2 text-sm text-content">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-status-valid"
                    aria-hidden="true"
                  />
                  <span>{t(testKey)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded border border-status-break/60 bg-status-break/15 p-4 space-y-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-status-break">
              <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("mission.invalidTestsTitle")}
            </h3>
            <ul className="space-y-2">
              {recs.invalid_tests.map((testKey) => (
                <li key={testKey} className="flex items-start gap-2 text-sm text-content">
                  <XCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-status-break"
                    aria-hidden="true"
                  />
                  <span>{t(testKey)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Earth's Limits & Exploration Connection */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded border border-border-subtle bg-surface p-4 space-y-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
              <Globe2 className="h-4 w-4 shrink-0 text-status-warn" aria-hidden="true" />
              {t("mission.earthLimitsTitle")}
            </h3>
            <p className="text-xs leading-relaxed text-content-muted">
              {t(
                comparison.site.body === "moon"
                  ? "mission.earthLimitsMoon"
                  : "mission.earthLimitsMars",
                {
                  gravity: formatNumber(
                    comparison.site.variables.breakage.gravity_g ?? 0,
                    lang,
                    2
                  ),
                  pressure: formatNumber(
                    comparison.site.variables.breakage.atm_pressure_mbar ?? 0,
                    lang,
                    2
                  ),
                  radiation: formatNumber(
                    comparison.site.variables.breakage.radiation_msv_yr ?? 0,
                    lang,
                    0
                  ),
                }
              )}
            </p>
          </div>

          <div className="rounded border border-accent/30 bg-accent/5 p-4 space-y-2.5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-accent">
              <Rocket className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t("mission.explorationUseTitle")}
            </h3>
            <p className="text-xs leading-relaxed text-content">
              {t("mission.explorationUseBody", {
                earthSite: match.known_analog_name ?? t(match.region_key),
                targetSite: t(comparison.site.name_key),
                status: match.is_benchmark
                  ? t("map.benchmarkBadge")
                  : t("map.discoveryBadge"),
                tests: recs.valid_tests.map((k) => t(k)).join("; "),
              })}
            </p>
          </div>
        </div>

        {/* Variable-by-Variable Comparison: Cards on mobile (<640px), Table on sm+ */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-content">
              {t("mission.comparisonTitle")} ({filteredDeltas.length})
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {(["all", "independent", "dependent", "breakage"] as const).map((layer) => (
                <button
                  key={layer}
                  type="button"
                  onClick={() => setLayerFilter(layer)}
                  className={`min-h-11 rounded border px-2.5 py-1 text-xs font-medium transition ${
                    layerFilter === layer
                      ? "border-accent bg-accent text-white"
                      : "border-border-subtle bg-surface text-content-muted hover:text-content"
                  }`}
                >
                  {layer === "all" ? t("mission.allLayers") : t(`layers.${layer}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="grid grid-cols-1 gap-2 sm:hidden">
            {filteredDeltas.map((d) => (
              <div
                key={d.variable}
                className="rounded border border-border-subtle bg-surface p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-content">
                    {t(`variables.${d.variable}.label`)}
                  </span>
                  <Badge variant={d.is_breakage ? "break" : d.similarity_score >= 0.7 ? "valid" : "default"}>
                    {d.is_breakage
                      ? t("mission.statusBroken")
                      : formatPercent(d.similarity_score, lang)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-content-muted">
                  <span>
                    {t(`layers.${d.layer}`)}
                    {typeof d.weight === "number" && d.weight > 0
                      ? ` · ${t("mission.weightCol")}: ${formatPercent(d.weight, lang)}`
                      : ""}
                  </span>
                  <span className="tabular-nums">
                    {formatNumber(d.planetary_value, lang, 3)} vs{" "}
                    {formatNumber(d.earth_value, lang, 3)} {t(`variables.${d.variable}.unit`)}
                  </span>
                </div>
                <ProgressBar
                  value={d.similarity_score}
                  tone={d.is_breakage ? "break" : d.similarity_score >= 0.7 ? "valid" : "warn"}
                  label={t(`variables.${d.variable}.label`)}
                />
              </div>
            ))}
          </div>

          {/* Desktop/Tablet Controlled Table */}
          <div className="hidden overflow-x-auto rounded border border-border-subtle sm:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase text-content-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("mission.variableCol")}</th>
                  <th className="px-4 py-3 font-semibold">{t("mission.layerCol")}</th>
                  <th className="px-4 py-3 font-semibold">{t("mission.weightCol")}</th>
                  <th className="px-4 py-3 font-semibold">{t("mission.planetaryCol")}</th>
                  <th className="px-4 py-3 font-semibold">{t("mission.earthCol")}</th>
                  <th className="px-4 py-3 font-semibold">{t("mission.similarityCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle bg-surface-elevated">
                {filteredDeltas.map((d) => (
                  <tr key={d.variable}>
                    <td className="px-4 py-2.5 font-medium text-content">
                      {t(`variables.${d.variable}.label`)}{" "}
                      <span className="text-xs text-content-muted">
                        ({t(`variables.${d.variable}.unit`)})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-content-muted">
                      {t(`layers.${d.layer}`)}
                    </td>
                    <td className="px-4 py-2.5 text-xs tabular-nums text-content-muted">
                      {typeof d.weight === "number" && d.weight > 0
                        ? formatPercent(d.weight, lang)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-content">
                      {formatNumber(d.planetary_value, lang, 3)}
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-content">
                      {formatNumber(d.earth_value, lang, 3)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            d.is_breakage
                              ? "break"
                              : d.similarity_score >= 0.7
                              ? "valid"
                              : d.similarity_score >= 0.45
                              ? "warn"
                              : "default"
                          }
                        >
                          {d.is_breakage
                            ? t("mission.statusBroken")
                            : formatPercent(d.similarity_score, lang)}
                        </Badge>
                        <div className="w-20">
                          <ProgressBar
                            value={d.similarity_score}
                            tone={d.is_breakage ? "break" : d.similarity_score >= 0.7 ? "valid" : "warn"}
                            label={t(`variables.${d.variable}.label`)}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Geology, Subsurface Caves/Lava Tubes & Extremophile Habitability */}
        {catalog && (catalog.geology || catalog.subsurface || catalog.habitability) && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded border border-border-subtle bg-surface p-4 space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
                <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
                {t("geology.title")}
              </h3>
              {catalog.geology ? (
                <div className="space-y-1 text-xs text-content-muted">
                  <p className="font-medium text-content">{catalog.geology.unit_name}</p>
                  <p>
                    {t("geology.lithology")}: <span className="text-content">{catalog.geology.lithology}</span>
                  </p>
                  <p>
                    {t("geology.age")}: {catalog.geology.age} · {catalog.geology.source}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-content-muted">{t("geology.unavailable")}</p>
              )}
            </div>

            <div className="rounded border border-border-subtle bg-surface p-4 space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
                <Mountain className="h-4 w-4 text-status-warn" aria-hidden="true" />
                {t("subsurface.title")}
              </h3>
              {catalog.subsurface && (
                <div className="space-y-1.5 text-xs text-content-muted">
                  <Badge variant={catalog.subsurface.has_lava_tubes_or_caves ? "valid" : "default"}>
                    {catalog.subsurface.has_lava_tubes_or_caves
                      ? t("subsurface.detectedBadge")
                      : t("subsurface.surfaceOnlyBadge")}
                  </Badge>
                  {catalog.subsurface.nearest_feature && (
                    <p className="font-medium text-content">{catalog.subsurface.nearest_feature}</p>
                  )}
                  <p>{t(catalog.subsurface.note_key)}</p>
                </div>
              )}
            </div>

            <div className="rounded border border-border-subtle bg-surface p-4 space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
                <Microscope className="h-4 w-4 text-status-valid" aria-hidden="true" />
                {t("habitability.title")}
              </h3>
              {catalog.habitability && (
                <div className="space-y-1.5 text-xs text-content-muted">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-content">
                      {t(catalog.habitability.regime_key)}
                    </span>
                    <Badge variant="accent">
                      {formatPercent(catalog.habitability.habitability_index, lang)}
                    </Badge>
                  </div>
                  <p>{t(catalog.habitability.biosignature_relevance_key)}</p>
                  <p className="text-content">
                    <span className="text-content-muted">{t("habitability.extremophilesLabel")}: </span>
                    <em>{catalog.habitability.extremophiles.join(", ")}</em>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NASA / ESA Regolith Simulant Affinity & ISRU / Astrobiological Purity */}
        {catalog?.regolith_simulant && (
          <div className="rounded border border-border-subtle bg-surface p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-accent" aria-hidden="true" />
                <h3 className="text-sm font-semibold text-content">{t("simulants.title")}</h3>
                <InfoTooltip label={t("simulants.title")} text={t("simulants.tooltip")} />
              </div>
              <Badge variant="valid">
                {t("simulants.recommendedLabel")}: {catalog.regolith_simulant.recommended_code} (
                {formatPercent(catalog.regolith_simulant.affinity_score, lang)})
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1">
                <span className="text-xs text-content-muted">{t("simulants.bestMatchTitle")}</span>
                <p className="text-sm font-bold text-content">
                  {t(catalog.regolith_simulant.recommended_name_key)}
                </p>
                <p className="text-xs text-content-muted">
                  {t(
                    catalog.regolith_simulant.candidates[0]?.mineralogy_key ??
                      "simulants.mgs1.mineralogy"
                  )}
                </p>
              </div>

              <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-content-muted">{t("simulants.isruIndexLabel")}</span>
                  <span className="font-semibold tabular-nums text-accent">
                    {formatPercent(catalog.regolith_simulant.isru_o2_index, lang)}
                  </span>
                </div>
                <ProgressBar
                  value={catalog.regolith_simulant.isru_o2_index}
                  tone="accent"
                  label={t("simulants.isruIndexLabel")}
                />
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-content-muted">{t("simulants.astroPurityLabel")}</span>
                  <span className="font-semibold tabular-nums text-status-valid">
                    {formatPercent(catalog.regolith_simulant.astrobiology_purity_index, lang)}
                  </span>
                </div>
                <ProgressBar
                  value={catalog.regolith_simulant.astrobiology_purity_index}
                  tone="valid"
                  label={t("simulants.astroPurityLabel")}
                />
              </div>

              <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1 text-xs text-content-muted">
                <span className="font-semibold text-content">{t("simulants.granulometryTitle")}</span>
                <p>
                  {t("simulants.sandClaySilt", {
                    sand: formatNumber(catalog.regolith_simulant.sand_pct, lang, 1),
                    silt: formatNumber(catalog.regolith_simulant.silt_pct, lang, 1),
                    clay: formatNumber(catalog.regolith_simulant.clay_pct, lang, 1),
                  })}
                </p>
                <p>
                  {t("simulants.densityAndSoc", {
                    bdod: formatNumber(catalog.regolith_simulant.bulk_density_g_cm3, lang, 2),
                    soc: formatNumber(catalog.regolith_simulant.organic_carbon_pct, lang, 2),
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Multi-Agency Space Catalog (NASA, ESA, CSA, JAXA) */}
        <div className="rounded border border-border-subtle bg-surface p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-content">
              <Satellite className="h-4 w-4 text-accent" aria-hidden="true" />
              {t("agencies.title")}
            </h3>
            <span className="text-xs text-content-muted">{t("agencies.subtitle")}</span>
          </div>

          {loadingCatalog ? (
            <p className="text-xs text-content-muted">{t("agencies.loading")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {catalog?.products.map((prod) => (
                <a
                  key={`${prod.agency}-${prod.mission}-${prod.product_id}`}
                  href={prod.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-11 items-center justify-between gap-2 rounded border border-border-subtle bg-surface-elevated p-3 text-xs transition hover:border-accent"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="accent">{prod.agency}</Badge>
                      <span className="truncate font-semibold text-content">{prod.mission}</span>
                    </div>
                    <p className="truncate text-content-muted">
                      {prod.product_id} · {prod.sensing_date}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 font-medium text-accent">
                    {t("agencies.openPortal")}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

