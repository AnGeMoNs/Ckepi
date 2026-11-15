import { Check, ChevronDown, ChevronUp, RotateCcw, Sliders } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import type { VariableOrigin } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { InfoTooltip } from "../ui/InfoTooltip";

export const MANUAL_IV_KEYS = [
  "topographic_roughness",
  "slope_deg",
  "thermal_inertia",
  "surface_albedo",
  "solar_flux_wm2",
  "subsurface_ice_frac",
  "aridity_index",
  "relative_humidity_pct",
  "uv_irradiance_index",
  "vegetation_lai_proxy",
] as const;

export const MANUAL_DV_KEYS = [
  "diurnal_temp_amplitude_k",
  "nocturnal_cooling_k_hr",
  "mean_surface_temp_k",
  "surface_wind_ms",
  "aeolian_dust_flux",
  "ice_sublimation_rate",
] as const;

interface ManualVariableControlsProps {
  layout?: "horizontal" | "vertical";
  targetIndependent: Record<string, number>;
  targetDependent: Record<string, number>;
  variableProvenance?: Record<string, VariableOrigin>;
  appliedIvWeights: Record<string, number>;
  appliedDvWeights: Record<string, number>;
  appliedMinSim: Record<string, number>;
  minSInd?: number;
  minSDep?: number;
  onClearGlobalThresholds?: () => void;
  onApply: (
    ivWeights: Record<string, number>,
    dvWeights: Record<string, number>,
    minSim: Record<string, number>
  ) => void;
}

export function ManualVariableControls({
  layout = "vertical",
  targetIndependent,
  targetDependent,
  variableProvenance,
  appliedIvWeights,
  appliedDvWeights,
  appliedMinSim,
  minSInd = 0,
  minSDep = 0,
  onClearGlobalThresholds,
  onApply,
}: ManualVariableControlsProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [expanded, setExpanded] = useState(true);
  const [draftIvWeights, setDraftIvWeights] = useState<Record<string, number>>(appliedIvWeights);
  const [draftDvWeights, setDraftDvWeights] = useState<Record<string, number>>(appliedDvWeights);
  const [draftMinSim, setDraftMinSim] = useState<Record<string, number>>(appliedMinSim);

  const activeWeightCount =
    MANUAL_IV_KEYS.filter((k) => (draftIvWeights[k] ?? 0) > 0).length +
    MANUAL_DV_KEYS.filter((k) => (draftDvWeights[k] ?? 0) > 0).length;
  const activeFilterCount = [...MANUAL_IV_KEYS, ...MANUAL_DV_KEYS].filter(
    (k) => (draftMinSim[k] ?? 0) > 0
  ).length;

  useEffect(() => {
    setDraftIvWeights(appliedIvWeights);
  }, [appliedIvWeights]);

  useEffect(() => {
    setDraftDvWeights(appliedDvWeights);
  }, [appliedDvWeights]);

  useEffect(() => {
    setDraftMinSim(appliedMinSim);
  }, [appliedMinSim]);

  const handleResetAll = () => {
    const zeroIv = Object.fromEntries(MANUAL_IV_KEYS.map((k) => [k, 0]));
    const zeroDv = Object.fromEntries(MANUAL_DV_KEYS.map((k) => [k, 0]));
    const zeroMin = Object.fromEntries([...MANUAL_IV_KEYS, ...MANUAL_DV_KEYS].map((k) => [k, 0]));
    setDraftIvWeights(zeroIv);
    setDraftDvWeights(zeroDv);
    setDraftMinSim(zeroMin);
    onApply(zeroIv, zeroDv, zeroMin);
  };

  const handleEqualize = () => {
    const equalIv = Object.fromEntries(MANUAL_IV_KEYS.map((k) => [k, 1]));
    const equalDv = Object.fromEntries(MANUAL_DV_KEYS.map((k) => [k, 1]));
    const zeroMin = Object.fromEntries([...MANUAL_IV_KEYS, ...MANUAL_DV_KEYS].map((k) => [k, 0]));
    setDraftIvWeights(equalIv);
    setDraftDvWeights(equalDv);
    setDraftMinSim(zeroMin);
    onApply(equalIv, equalDv, zeroMin);
  };

  const renderVariableCard = (
    varKey: string,
    targetVal: number | undefined,
    weight: number,
    onWeightChange: (val: number) => void
  ) => {
    const minSim = draftMinSim[varKey] ?? 0;
    return (
      <div
        key={varKey}
        className="space-y-2.5 rounded border border-border-subtle bg-surface-elevated p-3"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-content">
              {t(`variables.${varKey}.label`)}
            </span>
            <InfoTooltip
              label={t(`variables.${varKey}.label`)}
              text={t(`variables.${varKey}.hint`)}
            />
            {variableProvenance?.[varKey] && (
              <Badge
                variant={
                  variableProvenance[varKey] === "measured"
                    ? "valid"
                    : variableProvenance[varKey] === "model"
                    ? "warn"
                    : "default"
                }
              >
                {t(`confidence.origins.${variableProvenance[varKey]}`)}
              </Badge>
            )}
          </div>
          {typeof targetVal === "number" && (
            <span className="shrink-0 tabular-nums text-xs text-content-muted">
              {t("manualMode.targetValue")}:{" "}
              <strong className="text-content">
                {formatNumber(targetVal, lang, 2)} {t(`variables.${varKey}.unit`)}
              </strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-content-muted">
              <label htmlFor={`weight-${varKey}`}>{t("manualMode.weightLabel")}</label>
              <span className="tabular-nums font-semibold text-content">
                {formatPercent(weight, lang)}
              </span>
            </div>
            <input
              id={`weight-${varKey}`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={weight}
              onChange={(e) => onWeightChange(Number(e.target.value))}
              className="min-h-11 w-full cursor-pointer accent-accent"
            />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs text-content-muted">
              <label htmlFor={`minsim-${varKey}`}>{t("manualMode.minSimLabel")}</label>
              <span className="tabular-nums font-semibold text-content">
                {formatPercent(minSim, lang)}
              </span>
            </div>
            <input
              id={`minsim-${varKey}`}
              type="range"
              min={0}
              max={0.95}
              step={0.05}
              value={minSim}
              onChange={(e) =>
                setDraftMinSim((prev) => ({
                  ...prev,
                  [varKey]: Number(e.target.value),
                }))
              }
              className="min-h-11 w-full cursor-pointer accent-accent"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 rounded border border-accent/30 bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <Sliders className="h-4 w-4 text-accent" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-content">{t("manualMode.title")}</h3>
            <Badge variant="accent">{t("manualMode.badge")}</Badge>
          </div>
          <p className="text-xs text-content-muted">
            {expanded
              ? t("manualMode.subtitle")
              : t("manualMode.activeSummary", {
                  weights: activeWeightCount,
                  filters: activeFilterCount,
                })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {expanded && (
            <>
              <Button variant="secondary" onClick={handleEqualize}>
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{t("manualMode.resetEqual")}</span>
              </Button>
              <Button variant="secondary" onClick={handleResetAll}>
                <span>{t("manualMode.zeroAll")}</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => onApply(draftIvWeights, draftDvWeights, draftMinSim)}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                <span>{t("manualMode.apply")}</span>
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
          >
            <span>{expanded ? t("manualMode.collapse") : t("manualMode.expand")}</span>
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          {(minSInd > 0 || minSDep > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-content-muted">
              <span>
                {t("manualMode.globalFilterActive", {
                  sInd: formatPercent(minSInd, lang),
                  sDep: formatPercent(minSDep, lang),
                })}
              </span>
              {onClearGlobalThresholds && (
                <Button variant="secondary" onClick={onClearGlobalThresholds}>
                  {t("manualMode.clearGlobalFilters")}
                </Button>
              )}
            </div>
          )}

          {/* Independent Variables (X) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("manualMode.independentGroup")}
            </h4>
            <div
              className={
                layout === "horizontal"
                  ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "grid grid-cols-1 gap-3"
              }
            >
              {MANUAL_IV_KEYS.map((varKey) =>
                renderVariableCard(
                  varKey,
                  targetIndependent[varKey],
                  draftIvWeights[varKey] ?? 0,
                  (val) => setDraftIvWeights((prev) => ({ ...prev, [varKey]: val }))
                )
              )}
            </div>
          </div>

          {/* Dependent Variables (Y) */}
          <div className="space-y-2.5 border-t border-border-subtle pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t("manualMode.dependentGroup")}
            </h4>
            <div
              className={
                layout === "horizontal"
                  ? "grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  : "grid grid-cols-1 gap-3"
              }
            >
              {MANUAL_DV_KEYS.map((varKey) =>
                renderVariableCard(
                  varKey,
                  targetDependent[varKey],
                  draftDvWeights[varKey] ?? 0,
                  (val) => setDraftDvWeights((prev) => ({ ...prev, [varKey]: val }))
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
