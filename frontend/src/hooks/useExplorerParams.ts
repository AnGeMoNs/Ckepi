import { useCallback, useEffect, useState } from "react";

import {
  MANUAL_DV_KEYS,
  MANUAL_IV_KEYS,
} from "../components/mission/ManualVariableControls";
import type {
  DecompositionModelType,
  PlanetaryBody,
  PlanetarySite,
  TestProfileType,
} from "../types/analog";

const VALID_PROFILES: ReadonlySet<string> = new Set([
  "causal_auto",
  "navigation_landing",
  "rover_mobility",
  "isru_ice_drilling",
  "lava_tube_habitat",
  "solar_power_thermal",
  "manual_custom",
]);

const VALID_MODELS: ReadonlySet<string> = new Set(["ridge", "random_forest"]);

function roundThreshold(value: number): number {
  return Math.round(value * 20) / 20;
}

function parseNumericParam(
  params: URLSearchParams | null,
  key: string,
  fallback: number,
  min: number,
  max: number
): number {
  if (!params) return fallback;
  const raw = params.get(key);
  if (raw === null) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return roundThreshold(Math.min(max, Math.max(min, parsed)));
}

export function useExplorerParams() {
  const initialParams =
    typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;

  const rawProfile = initialParams?.get("profile") ?? "causal_auto";
  const initialProfile: TestProfileType = VALID_PROFILES.has(rawProfile)
    ? (rawProfile as TestProfileType)
    : "causal_auto";

  const rawModel = initialParams?.get("model") ?? "ridge";
  const initialModel: DecompositionModelType = VALID_MODELS.has(rawModel)
    ? (rawModel as DecompositionModelType)
    : "ridge";

  const [selectedBody, setSelectedBody] = useState<PlanetaryBody>("mars");
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    initialParams?.get("site") || "mars_jezero_crater"
  );
  const [customProbedSite, setCustomProbedSite] = useState<PlanetarySite | null>(null);
  const [modelType, setModelType] = useState<DecompositionModelType>(initialModel);
  const [testProfile, setTestProfile] = useState<TestProfileType>(initialProfile);
  const [minSInd, setMinSInd] = useState<number>(() =>
    parseNumericParam(initialParams, "minInd", 0.2, 0, 0.85)
  );
  const [minSDep, setMinSDep] = useState<number>(() =>
    parseNumericParam(initialParams, "minDep", 0.0, 0, 0.85)
  );
  const [excludeBenchmarks, setExcludeBenchmarks] = useState<boolean>(
    initialParams?.get("discovery") === "1"
  );
  const [penalizeEstimated, setPenalizeEstimated] = useState<boolean>(
    initialParams?.get("penalize") === "1"
  );
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [customIvWeights, setCustomIvWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(MANUAL_IV_KEYS.map((k) => [k, 1]))
  );
  const [customDvWeights, setCustomDvWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries(MANUAL_DV_KEYS.map((k) => [k, 1]))
  );
  const [customMinSimilarity, setCustomMinSimilarity] = useState<Record<string, number>>(() =>
    Object.fromEntries([...MANUAL_IV_KEYS, ...MANUAL_DV_KEYS].map((k) => [k, 0]))
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("site", selectedSiteId);
    url.searchParams.set("profile", testProfile);
    if (modelType !== "ridge") url.searchParams.set("model", modelType);
    else url.searchParams.delete("model");

    const roundedMinInd = roundThreshold(minSInd);
    if (roundedMinInd !== 0.2) url.searchParams.set("minInd", roundedMinInd.toFixed(2));
    else url.searchParams.delete("minInd");

    const roundedMinDep = roundThreshold(minSDep);
    if (roundedMinDep !== 0) url.searchParams.set("minDep", roundedMinDep.toFixed(2));
    else url.searchParams.delete("minDep");

    if (excludeBenchmarks) url.searchParams.set("discovery", "1");
    else url.searchParams.delete("discovery");

    if (penalizeEstimated) url.searchParams.set("penalize", "1");
    else url.searchParams.delete("penalize");

    window.history.replaceState({}, "", url.toString());
  }, [
    selectedSiteId,
    testProfile,
    modelType,
    minSInd,
    minSDep,
    excludeBenchmarks,
    penalizeEstimated,
  ]);

  const clonePresetToManual = useCallback((weights: Record<string, number>) => {
    const nextIv = Object.fromEntries(
      MANUAL_IV_KEYS.map((k) => [k, Math.round((weights[k] ?? 0) * 20) / 20])
    );
    const nextDv = Object.fromEntries(MANUAL_DV_KEYS.map((k) => [k, 1]));
    const nextMin = Object.fromEntries(
      [...MANUAL_IV_KEYS, ...MANUAL_DV_KEYS].map((k) => [k, 0])
    );
    setCustomIvWeights(nextIv);
    setCustomDvWeights(nextDv);
    setCustomMinSimilarity(nextMin);
    setTestProfile("manual_custom");
  }, []);

  const clearGlobalThresholds = useCallback(() => {
    setMinSInd(0);
    setMinSDep(0);
  }, []);

  const applyManualVariables = useCallback(
    (
      nextIvWeights: Record<string, number>,
      nextDvWeights: Record<string, number>,
      nextMinSim: Record<string, number>
    ) => {
      setCustomIvWeights(nextIvWeights);
      setCustomDvWeights(nextDvWeights);
      setCustomMinSimilarity(nextMinSim);
    },
    []
  );

  return {
    selectedBody,
    setSelectedBody,
    selectedSiteId,
    setSelectedSiteId,
    customProbedSite,
    setCustomProbedSite,
    modelType,
    setModelType,
    testProfile,
    setTestProfile,
    minSInd,
    setMinSInd,
    minSDep,
    setMinSDep,
    excludeBenchmarks,
    setExcludeBenchmarks,
    penalizeEstimated,
    setPenalizeEstimated,
    showAdvanced,
    setShowAdvanced,
    customIvWeights,
    customDvWeights,
    customMinSimilarity,
    clonePresetToManual,
    clearGlobalThresholds,
    applyManualVariables,
  };
}
