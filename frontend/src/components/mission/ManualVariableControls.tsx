import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { formatPercent } from "../../i18n";
import type { VariableOrigin } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Carousel3D } from "../explore/Carousel3D";
import { VariableCard } from "../explore/VariableCard";
import { PushButton } from "../ui/PushButton";
import { Pictogram } from "../worlds/Pictograms";
import { Button } from "../ui/Button";

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
  const [group, setGroup] = useState<"x" | "y">("x");
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
  ) => (
    <VariableCard
      key={varKey}
      varKey={varKey}
      target={targetVal}
      origin={variableProvenance?.[varKey]}
      weight={weight}
      onWeightChange={onWeightChange}
      minSim={draftMinSim[varKey] ?? 0}
      onMinSimChange={(v) => setDraftMinSim((prev) => ({ ...prev, [varKey]: v }))}
    />
  );

  // Column counts divide each group evenly on wide screens (10 X → 5 per row, 6 Y → 3 or 6), so no card is left alone.
  const groupGrid = (wideCols: string) => (layout === "horizontal" ? `grid grid-cols-1 gap-3 sm:grid-cols-2 ${wideCols}` : "grid grid-cols-1 gap-3");

  return (
    <div className="space-y-6 rounded-3xl border border-accent/30 bg-surface/20 p-4 sm:p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <h3 className="text-xl font-bold text-content sm:text-2xl">{t("manualMode.title")}</h3>
            <Badge variant="accent">{t("manualMode.badge")}</Badge>
          </div>
          <p className="max-w-2xl text-sm text-content-muted sm:text-base">
            {expanded
              ? t("manualMode.subtitle")
              : t("manualMode.activeSummary", {
                  weights: activeWeightCount,
                  filters: activeFilterCount,
                })}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {expanded && (
            <>
              <PushButton tone="salt" onClick={handleEqualize}>
                <Pictogram name="replay" className="h-5 w-5" />
                {t("manualMode.resetEqual")}
              </PushButton>
              <PushButton tone="salt" onClick={handleResetAll}>
                <Pictogram name="close" className="h-5 w-5" />
                {t("manualMode.zeroAll")}
              </PushButton>
              <PushButton tone="copper" onClick={() => onApply(draftIvWeights, draftDvWeights, draftMinSim)}>
                <Pictogram name="check" className="h-5 w-5" />
                {t("manualMode.apply")}
              </PushButton>
            </>
          )}
          <PushButton tone="ink" onClick={() => setExpanded((prev) => !prev)} aria-expanded={expanded}>
            {expanded ? t("manualMode.collapse") : t("manualMode.expand")}
            <Pictogram name="chevronDown" className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </PushButton>
        </div>
      </div>

      {expanded && (
        <>
          {(minSInd > 0 || minSDep > 0) && (
            <div className="flex flex-wrap items-center justify-between gap-2 ckepi-liquid rounded-2xl px-4 py-3 text-sm text-content-muted">
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

          {/* X and Y groups on a 3D turntable: one group faces the reader, the other waits beside it. */}
          <Carousel3D
            ariaLabel={t("explore.carousel.groups")}
            active={group}
            onChange={setGroup}
            panels={[
              {
                id: "x",
                title: t("manualMode.independentGroup"),
                meta: t("explore.carousel.active", { active: MANUAL_IV_KEYS.filter((k) => (draftIvWeights[k] ?? 0) > 0).length, total: MANUAL_IV_KEYS.length }),
                content: (
                  <div className={groupGrid("lg:grid-cols-5")}>
                    {MANUAL_IV_KEYS.map((varKey) =>
                      renderVariableCard(varKey, targetIndependent[varKey], draftIvWeights[varKey] ?? 0, (val) => setDraftIvWeights((prev) => ({ ...prev, [varKey]: val })))
                    )}
                  </div>
                ),
              },
              {
                id: "y",
                title: t("manualMode.dependentGroup"),
                meta: t("explore.carousel.active", { active: MANUAL_DV_KEYS.filter((k) => (draftDvWeights[k] ?? 0) > 0).length, total: MANUAL_DV_KEYS.length }),
                content: (
                  <div className={groupGrid("lg:grid-cols-3")}>
                    {MANUAL_DV_KEYS.map((varKey) =>
                      renderVariableCard(varKey, targetDependent[varKey], draftDvWeights[varKey] ?? 0, (val) => setDraftDvWeights((prev) => ({ ...prev, [varKey]: val })))
                    )}
                  </div>
                ),
              },
            ]}
          />
        </>
      )}
    </div>
  );
}
