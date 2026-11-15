import { Activity, BarChart3, Layers, Scale, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type {
  DistributionHistogram,
  PlanetaryBody,
  TerrainDistributionComparison,
} from "../../types/analog";
import { Badge } from "../ui/Badge";

interface TerrainDistributionPanelProps {
  distribution: TerrainDistributionComparison;
  body: PlanetaryBody;
  targetName: string;
  earthName: string;
}

function OverlappingHistogramSvg({
  histogram,
  body,
  lang,
  unit,
  targetLabel,
  earthLabel,
  controlLabel,
  earthP50,
  targetP50,
  earthP90,
  targetP90,
}: {
  histogram: DistributionHistogram;
  body: PlanetaryBody;
  lang: string;
  unit: string;
  targetLabel: string;
  earthLabel: string;
  controlLabel: string;
  earthP50?: number;
  targetP50?: number;
  earthP90?: number;
  targetP90?: number;
}) {
  const binCount = histogram.planetary_density.length;
  const maxDensity = Math.max(
    0.05,
    ...histogram.planetary_density,
    ...histogram.earth_density,
    ...histogram.control_yungay_density
  );

  const svgWidth = 640;
  const svgHeight = 180;
  const padTop = 14;
  const padBottom = 28;
  const padLeft = 28;
  const padRight = 12;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;
  const groupW = plotW / Math.max(1, binCount);
  const barW = Math.max(2, (groupW - 4) / 3);

  const targetFill = body === "mars" ? "fill-planet-mars" : "fill-planet-moon";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-content-muted">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-medium text-content">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-sm ${
                body === "mars" ? "bg-planet-mars" : "bg-planet-moon"
              }`}
            />
            {targetLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-content">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-status-valid" />
            {earthLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-content">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-status-warn" />
            {controlLabel}
          </span>
        </div>
        {typeof earthP50 === "number" &&
          typeof targetP50 === "number" &&
          typeof earthP90 === "number" &&
          typeof targetP90 === "number" && (
            <span className="tabular-nums">
              P50: {formatNumber(earthP50, lang, 2)}
              {unit} vs {formatNumber(targetP50, lang, 2)}
              {unit} · P90: {formatNumber(earthP90, lang, 2)}
              {unit} vs {formatNumber(targetP90, lang, 2)}
              {unit}
            </span>
          )}
      </div>

      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label={`${targetLabel} vs ${earthLabel}`}
        className="h-44 w-full rounded border border-border-subtle bg-surface-elevated p-1"
      >
        {/* Horizontal reference lines */}
        {[0.25, 0.5, 0.75, 1].map((frac) => {
          const y = padTop + plotH * (1 - frac);
          return (
            <line
              key={frac}
              x1={padLeft}
              y1={y}
              x2={svgWidth - padRight}
              y2={y}
              className="stroke-border-subtle"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}

        {/* Grouped histogram bars per bin */}
        {histogram.planetary_density.map((tDens, idx) => {
          const eDens = histogram.earth_density[idx] ?? 0;
          const cDens = histogram.control_yungay_density[idx] ?? 0;
          const xBase = padLeft + idx * groupW + 2;

          const tH = Math.max(1, (tDens / maxDensity) * plotH);
          const eH = Math.max(1, (eDens / maxDensity) * plotH);
          const cH = Math.max(1, (cDens / maxDensity) * plotH);

          const showTick = idx % 3 === 0 || idx === binCount - 1;
          const edgeVal = histogram.bin_centers[idx] ?? 0;

          return (
            <g key={idx}>
              <rect
                x={xBase}
                y={padTop + plotH - tH}
                width={barW}
                height={tH}
                rx="1"
                className={`${targetFill} opacity-85`}
              />
              <rect
                x={xBase + barW + 0.5}
                y={padTop + plotH - eH}
                width={barW}
                height={eH}
                rx="1"
                className="fill-status-valid opacity-90"
              />
              <rect
                x={xBase + 2 * (barW + 0.5)}
                y={padTop + plotH - cH}
                width={barW}
                height={cH}
                rx="1"
                className="fill-status-warn opacity-75"
              />
              {showTick && (
                <text
                  x={xBase + groupW / 2}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  className="fill-content-muted text-[10px]"
                >
                  {formatNumber(edgeVal, lang, 1)}
                  {unit}
                </text>
              )}
            </g>
          );
        })}

        {/* Baseline axis */}
        <line
          x1={padLeft}
          y1={padTop + plotH}
          x2={svgWidth - padRight}
          y2={padTop + plotH}
          className="stroke-border-subtle"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}

function TransectProfileSvg({
  targetProfile,
  earthProfile,
  body,
  targetLabel,
  earthLabel,
}: {
  targetProfile: number[];
  earthProfile: number[];
  body: PlanetaryBody;
  targetLabel: string;
  earthLabel: string;
}) {
  const n = Math.min(targetProfile.length, earthProfile.length);
  if (n < 2) return null;

  const allVals = [...targetProfile.slice(0, n), ...earthProfile.slice(0, n)];
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(minVal + 1, ...allVals);

  const svgWidth = 640;
  const svgHeight = 120;
  const padX = 24;
  const padY = 14;
  const plotW = svgWidth - 2 * padX;
  const plotH = svgHeight - 2 * padY;

  const toPoints = (arr: number[]) =>
    arr
      .slice(0, n)
      .map((val, i) => {
        const x = padX + (i / (n - 1)) * plotW;
        const y = padY + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const targetStroke = body === "mars" ? "stroke-planet-mars" : "stroke-planet-moon";

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      role="img"
      aria-label={`${targetLabel} vs ${earthLabel}`}
      className="h-28 w-full rounded border border-border-subtle bg-surface-elevated p-1"
    >
      <line
        x1={padX}
        y1={padY + plotH}
        x2={svgWidth - padX}
        y2={padY + plotH}
        className="stroke-border-subtle"
        strokeWidth="1"
      />
      <polyline
        fill="none"
        points={toPoints(targetProfile)}
        className={targetStroke}
        strokeWidth="2"
      />
      <polyline
        fill="none"
        points={toPoints(earthProfile)}
        className="stroke-status-valid"
        strokeWidth="2"
      />
    </svg>
  );
}

export function TerrainDistributionPanel({
  distribution,
  body,
  targetName,
  earthName,
}: TerrainDistributionPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [activeMetric, setActiveMetric] = useState<"slope" | "relief">("slope");

  const slopeDist = distribution.slope_distribution;
  const reliefDist = distribution.relief_distribution;
  const activeHist = activeMetric === "slope" ? slopeDist : reliefDist;
  const activeUnit = activeMetric === "slope" ? "°" : " m";

  const scale30 = distribution.scale_sensitivity[0];
  const samplePixels = Math.round(
    Math.pow((distribution.window_size_km * 1000) / distribution.common_resolution_m, 2)
  );

  return (
    <div className="rounded border border-border-subtle bg-surface p-4 space-y-4">
      {/* Header & Common Scale Badges */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-content sm:text-base">
            <BarChart3 className="h-4 w-4 text-accent" aria-hidden="true" />
            {t("distribution.title")}
          </h3>
          <p className="text-xs text-content-muted">
            {t("distribution.subtitle", {
              spacing: formatNumber(distribution.common_resolution_m, lang, 0),
              samples: formatNumber(samplePixels, lang, 0),
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="accent">
            {t("distribution.commonScaleBadge", {
              spacing: formatNumber(distribution.common_resolution_m, lang, 0),
            })}
          </Badge>
          <Badge variant="default">
            {t("distribution.bootstrapBadge", {
              iterations: formatNumber(distribution.bootstrap_iterations, lang, 0),
              blockSize: formatNumber(distribution.block_bootstrap_size_px, lang, 0),
            })}
          </Badge>
        </div>
      </div>

      {/* Provenance Strip for DEMs */}
      <div className="grid grid-cols-1 gap-2 rounded border border-border-subtle bg-surface-elevated p-3 text-xs sm:grid-cols-3">
        <div>
          <span className="font-semibold text-content">{t("distribution.targetDemLabel")}: </span>
          <span className="text-content-muted">{distribution.planetary_dem_source}</span>
        </div>
        <div>
          <span className="font-semibold text-content">{t("distribution.earthDemLabel")}: </span>
          <span className="text-content-muted">{distribution.earth_dem_source}</span>
        </div>
        <div>
          <span className="font-semibold text-content">{t("distribution.controlDemLabel")}: </span>
          <span className="text-content-muted">{distribution.control_benchmark_name}</span>
        </div>
      </div>

      {/* Formal Quantitative Statements with 95% Block-Bootstrap CIs */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded border border-accent/30 bg-accent/5 p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("distribution.slopeCardTitle")}
            </span>
            <Badge variant={slopeDist.wasserstein_distance <= 1.8 ? "valid" : "default"}>
              W₁ = {formatNumber(slopeDist.wasserstein_distance, lang, 2)}°
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-content">
            {t("distribution.slopeStatement", {
              earthSite: earthName,
              targetSite: targetName,
              w1: formatNumber(slopeDist.wasserstein_distance, lang, 2),
              ciLow: formatNumber(slopeDist.w1_ci_95[0], lang, 2),
              ciHigh: formatNumber(slopeDist.w1_ci_95[1], lang, 2),
              ks: formatNumber(slopeDist.ks_statistic, lang, 3),
              controlW1: formatNumber(slopeDist.control_yungay_w1, lang, 2),
            })}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2 text-[11px] text-content-muted tabular-nums">
            <span>
              IC 95% (Bootstrap 2D): [{formatNumber(slopeDist.w1_ci_95[0], lang, 2)}° –{" "}
              {formatNumber(slopeDist.w1_ci_95[1], lang, 2)}°]
            </span>
            <span>
              KS D = {formatNumber(slopeDist.ks_statistic, lang, 3)} (IC 95%:{" "}
              {formatNumber(slopeDist.ks_ci_95[0], lang, 3)}–
              {formatNumber(slopeDist.ks_ci_95[1], lang, 3)})
            </span>
          </div>
        </div>

        <div className="rounded border border-border-subtle bg-surface-elevated p-3.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-content">
              {t("distribution.reliefCardTitle")}
            </span>
            <Badge variant={reliefDist.wasserstein_distance <= 12.0 ? "valid" : "default"}>
              W₁ = {formatNumber(reliefDist.wasserstein_distance, lang, 2)} m
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-content">
            {t("distribution.reliefStatement", {
              earthSite: earthName,
              targetSite: targetName,
              w1: formatNumber(reliefDist.wasserstein_distance, lang, 2),
              ciLow: formatNumber(reliefDist.w1_ci_95[0], lang, 2),
              ciHigh: formatNumber(reliefDist.w1_ci_95[1], lang, 2),
              ks: formatNumber(reliefDist.ks_statistic, lang, 3),
              controlW1: formatNumber(reliefDist.control_yungay_w1, lang, 2),
            })}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-2 text-[11px] text-content-muted tabular-nums">
            <span>
              IC 95% (Bootstrap 2D): [{formatNumber(reliefDist.w1_ci_95[0], lang, 2)} m –{" "}
              {formatNumber(reliefDist.w1_ci_95[1], lang, 2)} m]
            </span>
            <span>
              KS D = {formatNumber(reliefDist.ks_statistic, lang, 3)} (IC 95%:{" "}
              {formatNumber(reliefDist.ks_ci_95[0], lang, 3)}–
              {formatNumber(reliefDist.ks_ci_95[1], lang, 3)})
            </span>
          </div>
        </div>
      </div>

      {/* Overlapping Histogram Selector & SVG */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-content-muted">
            {t("distribution.histogramTitle")}
          </h4>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveMetric("slope")}
              className={`min-h-11 rounded border px-3 py-1 text-xs font-medium transition ${
                activeMetric === "slope"
                  ? "border-accent bg-accent text-white"
                  : "border-border-subtle bg-surface-elevated text-content-muted hover:text-content"
              }`}
            >
              {t("distribution.toggleSlope")}
            </button>
            <button
              type="button"
              onClick={() => setActiveMetric("relief")}
              className={`min-h-11 rounded border px-3 py-1 text-xs font-medium transition ${
                activeMetric === "relief"
                  ? "border-accent bg-accent text-white"
                  : "border-border-subtle bg-surface-elevated text-content-muted hover:text-content"
              }`}
            >
              {t("distribution.toggleRelief")}
            </button>
          </div>
        </div>

        <OverlappingHistogramSvg
          histogram={activeHist}
          body={body}
          lang={lang}
          unit={activeUnit}
          targetLabel={targetName}
          earthLabel={earthName}
          controlLabel={t("distribution.controlYungayLabel")}
          earthP50={activeMetric === "slope" ? scale30?.earth_slope_median_deg : undefined}
          targetP50={activeMetric === "slope" ? scale30?.planetary_slope_median_deg : undefined}
          earthP90={activeMetric === "slope" ? scale30?.earth_slope_p90_deg : undefined}
          targetP90={activeMetric === "slope" ? scale30?.planetary_slope_p90_deg : undefined}
        />
      </div>

      {/* Topographic Transect Profile (3.6 km @ 30 m) */}
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-content">
            <Activity className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {t("distribution.transectTitle")}
          </span>
          <span className="text-content-muted">{t("distribution.transectSubtitle")}</span>
        </div>
        <TransectProfileSvg
          targetProfile={distribution.planetary_profile_elev_m}
          earthProfile={distribution.earth_profile_elev_m}
          body={body}
          targetLabel={targetName}
          earthLabel={earthName}
        />
      </div>

      {/* Multi-Scale Sensitivity Analysis Table (30 m · 60 m · 90 m) */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-content">
            <Scale className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {t("distribution.scaleTableTitle")}
          </h4>
          <span className="text-xs text-content-muted">{t("distribution.scaleTableHint")}</span>
        </div>

        <div className="overflow-x-auto rounded border border-border-subtle">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-surface-muted uppercase text-content-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">{t("distribution.colScale")}</th>
                <th className="px-3 py-2 font-semibold">{t("distribution.colSlopeW1")}</th>
                <th className="px-3 py-2 font-semibold">{t("distribution.colSlopeKs")}</th>
                <th className="px-3 py-2 font-semibold">{t("distribution.colReliefW1")}</th>
                <th className="px-3 py-2 font-semibold">{t("distribution.colSlopeP50")}</th>
                <th className="px-3 py-2 font-semibold">{t("distribution.colSlopeP90")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-surface-elevated tabular-nums">
              {distribution.scale_sensitivity.map((pt) => (
                <tr key={pt.resolution_m}>
                  <td className="px-3 py-2 font-semibold text-content">
                    {formatNumber(pt.resolution_m, lang, 0)} m
                  </td>
                  <td className="px-3 py-2 text-accent font-medium">
                    {formatNumber(pt.slope_wasserstein_deg, lang, 2)}°
                  </td>
                  <td className="px-3 py-2 text-content">
                    {formatNumber(pt.slope_ks_stat, lang, 3)}
                  </td>
                  <td className="px-3 py-2 text-content">
                    {formatNumber(pt.relief_wasserstein_m, lang, 2)} m
                  </td>
                  <td className="px-3 py-2 text-content-muted">
                    {formatNumber(pt.earth_slope_median_deg, lang, 2)}° vs{" "}
                    {formatNumber(pt.planetary_slope_median_deg, lang, 2)}°
                  </td>
                  <td className="px-3 py-2 text-content-muted">
                    {formatNumber(pt.earth_slope_p90_deg, lang, 2)}° vs{" "}
                    {formatNumber(pt.planetary_slope_p90_deg, lang, 2)}°
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scientific Rigor & Irreducible Gap Notes (UCN / UA Jury) */}
      <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-3">
        <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-content">
            <Layers className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            {t("distribution.noteStatTitle")}
          </p>
          <p className="text-[11px] leading-relaxed text-content-muted">
            {t("distribution.noteStatBody")}
          </p>
        </div>

        <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-content">
            <ShieldAlert className="h-3.5 w-3.5 text-status-break" aria-hidden="true" />
            {t("distribution.noteRadTitle")}
          </p>
          <p className="text-[11px] leading-relaxed text-content-muted">
            {t("distribution.noteRadBody")}
          </p>
        </div>

        <div className="rounded border border-border-subtle bg-surface-elevated p-3 space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-content">
            <Activity className="h-3.5 w-3.5 text-status-valid" aria-hidden="true" />
            {t("distribution.noteBioTitle")}
          </p>
          <p className="text-[11px] leading-relaxed text-content-muted">
            {t("distribution.noteBioBody")}
          </p>
        </div>
      </div>
    </div>
  );
}
