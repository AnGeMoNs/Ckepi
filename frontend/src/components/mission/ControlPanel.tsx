import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Pictogram } from "../worlds/Pictograms";

import { formatPercent } from "../../i18n";
import type {
  AnalogSearchResponse,
  DecompositionModelType,
  DistanceMetricType,
  PlanetarySite,
  TestProfileType,
} from "../../types/analog";
import { InfoTooltip } from "../ui/InfoTooltip";
import { Select } from "../ui/Select";
import { Slider } from "../ui/Slider";
import { Switch } from "../ui/Switch";
import { ProfilePicker } from "../explore/ProfilePicker";
import { ManualVariableControls } from "./ManualVariableControls";
import { PresetProfileInspector } from "./PresetProfileInspector";

interface ControlPanelProps {
  layout?: "horizontal" | "vertical";
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
  layout = "vertical",
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
  const reduceMotion = Boolean(useReducedMotion());

  const isHorizontal = layout === "horizontal";

  return (
    <div className="space-y-4 sm:space-y-5">
      <ProfilePicker value={testProfile} onChange={onChangeTestProfile} />

      <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-2">
        {/* Discovery mode: a whole card is the switch, so it is easy to find and to press. */}
        <motion.button
          id="discovery-mode-toggle"
          type="button"
          role="switch"
          aria-checked={excludeBenchmarks}
          onClick={() => onChangeExcludeBenchmarks(!excludeBenchmarks)}
          whileHover={reduceMotion ? undefined : { y: -3 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className={`ckepi-liquid flex min-h-[6rem] items-center gap-4 rounded-3xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${excludeBenchmarks ? "ckepi-liquid-glow" : ""}`}
        >
          <motion.img
            src="/img/science-accessories/ckepi-pin-location.webp"
            alt=""
            width={64}
            height={64}
            draggable={false}
            className="h-14 w-14 shrink-0 object-contain drop-shadow-ckepi-logo"
            animate={reduceMotion ? undefined : { y: excludeBenchmarks ? -4 : 0, rotate: excludeBenchmarks ? -8 : 0, scale: excludeBenchmarks ? 1.08 : 0.94 }}
            transition={{ type: "spring", stiffness: 300, damping: 16 }}
          />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold leading-snug text-content">{t("controls.discoveryOnly")}</span>
            <span className="mt-0.5 block text-sm leading-snug text-content-muted">{t("explore.mission.discoveryHint")}</span>
          </span>
          <span className="flex shrink-0 flex-col items-center gap-1">
            <span aria-hidden="true" className={`flex h-9 w-16 items-center rounded-full border p-1 shadow-inner transition-colors ${excludeBenchmarks ? "justify-end border-accent/60 bg-accent/80" : "justify-start border-border-subtle bg-ckepi-space/70"}`}>
              <motion.span layout transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30 }} className="ckepi-cardboard h-7 w-7 rounded-full" />
            </span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-content-muted">{excludeBenchmarks ? t("explore.mission.on") : t("explore.mission.off")}</span>
          </span>
        </motion.button>

        <motion.button
          type="button"
          onClick={onToggleAdvanced}
          aria-expanded={showAdvanced}
          whileHover={reduceMotion ? undefined : { y: -3 }}
          whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          className={`ckepi-liquid flex min-h-[6rem] items-center gap-4 rounded-3xl p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${showAdvanced ? "ckepi-liquid-glow" : ""}`}
        >
          <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
            <Pictogram name="tune" className="h-8 w-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold leading-snug text-content">{t("controls.advancedToggle")}</span>
            <span className="mt-0.5 block text-sm leading-snug text-content-muted">{t("explore.mission.advancedHint")}</span>
          </span>
          <Pictogram name="chevronDown" className={`h-6 w-6 shrink-0 text-content-muted transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
        </motion.button>
      </div>

      {testProfile !== "manual_custom" && searchResult && (
        <PresetProfileInspector
          testProfile={testProfile}
          weightsUsed={searchResult.causal_weights_used}
          targetIndependent={activeSite?.variables.independent ?? {}}
          targetDependent={activeSite?.variables.dependent ?? {}}
          variableProvenance={activeSite?.confidence?.variable_provenance}
          onCloneToManual={onClonePresetToManual}
        />
      )}

      {testProfile === "manual_custom" && (
        <ManualVariableControls
          layout={layout}
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

      {showAdvanced && (
        <div
          className={
            isHorizontal
              ? "grid grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-6"
              : "grid grid-cols-1 gap-3"
          }
        >
          {/* Every setting is the same glass box: a fixed-height title row, then its control,
              so all controls sit on one line whatever the title length. */}
          <div className={`${ADVANCED_CELL} xl:col-span-2`}>
            <div className={ADVANCED_HEAD}>
              <span>{t("controls.modelType")}</span>
              <InfoTooltip label={t("controls.modelType")} text={t("controls.modelTypeHint")} />
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
              <p className="text-xs leading-relaxed text-status-warn">{t("controls.modelOverriddenNote")}</p>
            )}
          </div>

          <div className={`${ADVANCED_CELL} xl:col-span-2`}>
            <div className={ADVANCED_HEAD}>
              <span>{t("controls.distanceMetric")}</span>
              <InfoTooltip label={t("controls.distanceMetric")} text={t("controls.distanceMetricHint")} />
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

          <div className={`${ADVANCED_CELL} xl:col-span-2`}>
            <Switch
              id="penalize-estimated-toggle"
              checked={penalizeEstimated}
              onChange={onChangePenalizeEstimated}
              label={t("controls.penalizeEstimated")}
              className="h-full items-start border-0 bg-transparent px-0 py-0 text-sm"
            />
          </div>
          <div className={`${ADVANCED_CELL} xl:col-span-3`}>
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
          </div>

          <div className={`${ADVANCED_CELL} xl:col-span-3`}>
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
              tooltip={<InfoTooltip label={t("controls.minSDep")} text={t("controls.minSDepHelp")} />}
            />
          </div>

        </div>
      )}

    </div>
  );
}

const ADVANCED_CELL = "ckepi-liquid flex h-full min-w-0 flex-col gap-2 rounded-2xl p-4";
const ADVANCED_HEAD = "flex min-h-[2.75rem] items-start justify-between gap-2 text-sm font-semibold leading-snug text-content";
