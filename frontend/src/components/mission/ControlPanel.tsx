import { ChevronDown, ChevronUp, SlidersHorizontal, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatPercent } from "../../i18n";
import type {
  AnalogSearchResponse,
  DecompositionModelType,
  DistanceMetricType,
  PlanetaryBody,
  PlanetarySite,
  TestProfileType,
} from "../../types/analog";
import { Button } from "../ui/Button";
import { InfoTooltip } from "../ui/InfoTooltip";
import { Select } from "../ui/Select";
import { Slider } from "../ui/Slider";
import { Switch } from "../ui/Switch";
import { ManualVariableControls } from "./ManualVariableControls";
import { PresetProfileInspector } from "./PresetProfileInspector";

interface ControlPanelProps {
  sites: PlanetarySite[];
  selectedSiteId: string;
  customProbedSite: PlanetarySite | null;
  activeSite?: PlanetarySite;
  testProfile: TestProfileType;
  modelType: DecompositionModelType;
  distanceMetric: DistanceMetricType;
  minSInd: number;
  minSDep: number;
  excludeBenchmarks: boolean;
  penalizeEstimated: boolean;
  showAdvanced: boolean;
  searchResult: AnalogSearchResponse | null;
  customIvWeights: Record<string, number>;
  customDvWeights: Record<string, number>;
  customMinSimilarity: Record<string, number>;
  onSelectSite: (siteId: string, body?: PlanetaryBody) => void;
  onChangeTestProfile: (profile: TestProfileType) => void;
  onChangeModelType: (model: DecompositionModelType) => void;
  onChangeDistanceMetric: (metric: DistanceMetricType) => void;
  onChangeMinSInd: (value: number) => void;
  onChangeMinSDep: (value: number) => void;
  onChangeExcludeBenchmarks: (checked: boolean) => void;
  onChangePenalizeEstimated: (checked: boolean) => void;
  onToggleAdvanced: () => void;
  onClonePresetToManual: (weights: Record<string, number>) => void;
  onClearGlobalThresholds: () => void;
  onApplyManualVariables: (
    nextIv: Record<string, number>,
    nextDv: Record<string, number>,
    nextMin: Record<string, number>
  ) => void;
}

export function ControlPanel({
  sites,
  selectedSiteId,
  customProbedSite,
  activeSite,
  testProfile,
  modelType,
  distanceMetric,
  minSInd,
  minSDep,
  excludeBenchmarks,
  penalizeEstimated,
  showAdvanced,
  searchResult,
  customIvWeights,
  customDvWeights,
  customMinSimilarity,
  onSelectSite,
  onChangeTestProfile,
  onChangeModelType,
  onChangeDistanceMetric,
  onChangeMinSInd,
  onChangeMinSDep,
  onChangeExcludeBenchmarks,
  onChangePenalizeEstimated,
  onToggleAdvanced,
  onClonePresetToManual,
  onClearGlobalThresholds,
  onApplyManualVariables,
}: ControlPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const siteOptions = [
    ...sites.map((s) => ({
      value: s.site_id,
      label: t(s.name_key),
    })),
    ...(customProbedSite
      ? [
          {
            value: customProbedSite.site_id,
            label: customProbedSite.planetary_feature
              ? `${customProbedSite.planetary_feature.feature_name} (${customProbedSite.coordinates.lat}°, ${customProbedSite.coordinates.lon}°)`
              : `${t(customProbedSite.name_key)} (${customProbedSite.coordinates.lat}, ${customProbedSite.coordinates.lon})`,
          },
        ]
      : []),
  ];
  const effectiveOptions =
    siteOptions.length > 0
      ? siteOptions
      : [{ value: selectedSiteId, label: t("controls.loading") }];
  const effectiveValue = effectiveOptions.some((o) => o.value === selectedSiteId)
    ? selectedSiteId
    : effectiveOptions[0].value;

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <Select
          id="target-site-select"
          label={t("controls.targetSite")}
          value={effectiveValue}
          onChange={(e) => {
            const nextId = e.target.value;
            const found = sites.find((s) => s.site_id === nextId);
            onSelectSite(nextId, found?.body);
          }}
          options={effectiveOptions}
        />

        <Select
          id="test-profile-select"
          label={t("controls.testProfile")}
          value={testProfile}
          onChange={(e) => onChangeTestProfile(e.target.value as TestProfileType)}
          options={[
            { value: "causal_auto", label: t("controls.profiles.causal_auto") },
            { value: "navigation_landing", label: t("controls.profiles.navigation_landing") },
            { value: "rover_mobility", label: t("controls.profiles.rover_mobility") },
            { value: "isru_ice_drilling", label: t("controls.profiles.isru_ice_drilling") },
            { value: "lava_tube_habitat", label: t("controls.profiles.lava_tube_habitat") },
            { value: "solar_power_thermal", label: t("controls.profiles.solar_power_thermal") },
            { value: "manual_custom", label: t("controls.profiles.manual_custom") },
          ]}
        />
      </div>

      {testProfile !== "manual_custom" && searchResult && (
        <PresetProfileInspector
          testProfile={testProfile}
          weightsUsed={searchResult.causal_weights_used}
          onCloneToManual={onClonePresetToManual}
        />
      )}

      {testProfile === "manual_custom" && (
        <ManualVariableControls
          targetIndependent={activeSite?.variables.independent ?? {}}
          targetDependent={activeSite?.variables.dependent ?? {}}
          variableProvenance={activeSite?.confidence?.variable_provenance}
          appliedIvWeights={customIvWeights}
          appliedDvWeights={customDvWeights}
          appliedMinSim={customMinSimilarity}
          minSInd={minSInd}
          minSDep={minSDep}
          onClearGlobalThresholds={onClearGlobalThresholds}
          onApply={onApplyManualVariables}
        />
      )}

      <div className="space-y-2.5 border-t border-border-subtle pt-3">
        <Switch
          id="discovery-mode-toggle"
          checked={excludeBenchmarks}
          onChange={onChangeExcludeBenchmarks}
          label={t("controls.discoveryOnly")}
          icon={<Sparkles className="h-4 w-4 text-status-valid" aria-hidden="true" />}
          trailing={
            <InfoTooltip label={t("controls.discoveryOnly")} text={t("controls.discoveryHint")} />
          }
        />

        <Button
          variant="secondary"
          onClick={onToggleAdvanced}
          aria-expanded={showAdvanced}
          className="w-full justify-between"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>{t("controls.advancedToggle")}</span>
          </span>
          {showAdvanced ? (
            <ChevronUp className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {showAdvanced && (
        <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-3.5">
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-content-muted">
                {t("controls.modelType")}
              </span>
              <InfoTooltip
                label={t("controls.modelType")}
                text={t("controls.modelTypeHint")}
              />
            </div>
            <Select
              id="model-type-select"
              label=""
              value={modelType}
              onChange={(e) => onChangeModelType(e.target.value as DecompositionModelType)}
              options={[
                { value: "ridge", label: t("controls.ridge") },
                { value: "random_forest", label: t("controls.randomForest") },
              ]}
            />
            {testProfile !== "causal_auto" && (
              <p className="text-xs text-status-warn">{t("controls.modelOverriddenNote")}</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-medium text-content-muted">
                {t("controls.distanceMetric")}
              </span>
              <InfoTooltip
                label={t("controls.distanceMetric")}
                text={t("controls.distanceMetricHint")}
              />
            </div>
            <Select
              id="distance-metric-select"
              label=""
              value={distanceMetric}
              onChange={(e) => onChangeDistanceMetric(e.target.value as DistanceMetricType)}
              options={[
                { value: "euclidean", label: t("controls.metricEuclidean") },
                { value: "mahalanobis", label: t("controls.metricMahalanobis") },
              ]}
            />
          </div>

          <Slider
            id="min-sind-range"
            label={t("controls.minSInd")}
            value={minSInd}
            min={0}
            max={0.85}
            step={0.05}
            formattedValue={formatPercent(minSInd, lang)}
            onChange={onChangeMinSInd}
            helpText={t("controls.minSIndHelp")}
            tooltip={<InfoTooltip label={t("controls.minSInd")} text={t("controls.minSIndHelp")} />}
          />

          <Slider
            id="min-sdep-range"
            label={t("controls.minSDep")}
            value={minSDep}
            min={0}
            max={0.85}
            step={0.05}
            formattedValue={formatPercent(minSDep, lang)}
            onChange={onChangeMinSDep}
            helpText={t("controls.minSDepHelp")}
          />

          <Switch
            id="penalize-estimated-toggle"
            checked={penalizeEstimated}
            onChange={onChangePenalizeEstimated}
            label={t("controls.penalizeEstimated")}
            className="bg-surface-elevated text-xs"
          />
        </div>
      )}

      {activeSite && (
        <p className="rounded-lg border border-border-subtle bg-surface p-3 text-xs leading-relaxed text-content-muted">
          {t(activeSite.mission_context_key)}
        </p>
      )}
    </div>
  );
}
