import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  compareCellWithSite,
  clearApiCache,
  fetchPlanetarySites,
  probeEarthCoordinate,
  probePlanetaryLocation,
  refineAnalogCell,
  runDecomposition,
  searchAnalogs,
} from "../api/client";
import type {
  AnalogSearchResponse,
  DecompositionModelType,
  DecompositionResponse,
  DistanceMetricType,
  PlanetaryBody,
  PlanetarySite,
  SiteComparisonResponse,
  TestProfileType,
} from "../types/analog";
import { useApiError } from "./useApiError";

interface UseAnalogAnalysisParams {
  selectedSiteId: string;
  setSelectedSiteId: (id: string) => void;
  setSelectedBody: (body: PlanetaryBody) => void;
  customProbedSite: PlanetarySite | null;
  setCustomProbedSite: (site: PlanetarySite | null) => void;
  modelType: DecompositionModelType;
  distanceMetric: DistanceMetricType;
  testProfile: TestProfileType;
  minSInd: number;
  minSDep: number;
  excludeBenchmarks: boolean;
  penalizeEstimated: boolean;
  customIvWeights: Record<string, number>;
  customDvWeights: Record<string, number>;
  customMinSimilarity: Record<string, number>;
}

export function useAnalogAnalysis({
  selectedSiteId,
  setSelectedSiteId,
  setSelectedBody,
  customProbedSite,
  setCustomProbedSite,
  modelType,
  distanceMetric,
  testProfile,
  minSInd,
  minSDep,
  excludeBenchmarks,
  penalizeEstimated,
  customIvWeights,
  customDvWeights,
  customMinSimilarity,
}: UseAnalogAnalysisParams) {
  const { errorState, captureError, clearError } = useApiError();
  const {
    errorState: catalogErrorState,
    captureError: captureCatalogError,
    clearError: clearCatalogError,
  } = useApiError();

  const [sites, setSites] = useState<PlanetarySite[]>([]);
  const [decomposition, setDecomposition] = useState<DecompositionResponse | null>(null);
  const [searchResult, setSearchResult] = useState<AnalogSearchResponse | null>(null);
  const [selectedH3, setSelectedH3] = useState<string | null>(null);
  const [comparison, setComparison] = useState<SiteComparisonResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  // Start with a bounded payload; the complete globe remains an explicit map option.
  const [earthDensity, setEarthDensity] = useState<"global" | "top">("top");
  const [drilldownState, setDrilldownState] = useState<{
    parentH3: string;
    parentH3s?: string[];
    childIds: string[];
  } | null>(null);
  const [hiddenParentH3s, setHiddenParentH3s] = useState<string[]>([]);
  const [probingCoords, setProbingCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [probingPlanetCoords, setProbingPlanetCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const selectedSiteIdRef = useRef(selectedSiteId);
  selectedSiteIdRef.current = selectedSiteId;

  // Never show the previous site's measurements while the new site is loading.
  const previousSiteIdRef = useRef(selectedSiteId);
  useEffect(() => {
    if (previousSiteIdRef.current === selectedSiteId) return;
    previousSiteIdRef.current = selectedSiteId;
    setDecomposition(null);
    setSearchResult(null);
    setSelectedH3(null);
    setComparison(null);
  }, [selectedSiteId]);

  const loadSites = useCallback(async (): Promise<PlanetarySite[]> => {
    const list = await fetchPlanetarySites();
    setSites(list);
    clearCatalogError();
    return list;
  }, [clearCatalogError]);

  // Load the catalog once on mount. Validating the initial site here (and not on every
  // selectedSiteId change) keeps custom probed sites from being reverted to the first one.
  useEffect(() => {
    let cancelled = false;
    loadSites()
      .then((list) => {
        if (cancelled || list.length === 0) return;
        const found = list.find((s) => s.site_id === selectedSiteIdRef.current);
        if (found) {
          setSelectedBody(found.body);
        } else {
          setSelectedSiteId(list[0].site_id);
          setSelectedBody(list[0].body);
        }
      })
      .catch((err) => {
        if (!cancelled) captureCatalogError(err);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = useCallback(
    async (signal?: AbortSignal): Promise<boolean> => {
      if (!selectedSiteId) return false;
      if (customProbedSite && customProbedSite.site_id === selectedSiteId) {
        return true;
      }
      setIsLoading(true);
      clearError();

      try {
        // Retry a failed catalog load without allowing another request to erase its error.
        if (sites.length === 0) await loadSites();
        const [decompRes, analogsRes] = await Promise.all([
          runDecomposition(selectedSiteId, modelType, signal).then((result) => {
            if (!signal?.aborted) setDecomposition(result);
            return result;
          }),
          searchAnalogs({
            siteId: selectedSiteId,
            modelType,
            distanceMetric,
            testProfile,
            minSInd,
            minSDep,
            excludeBenchmarks,
            penalizeEstimated,
            limit: earthDensity === "global" ? 25000 : 250,
            compactTail: true,
            customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
            customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
            customMinSimilarity: testProfile === "manual_custom" ? customMinSimilarity : undefined,
            signal,
          }),
        ]);

        if (signal?.aborted) return false;
        setDecomposition(decompRes);
        setSearchResult(analogsRes);
        setDrilldownState(null);
        setHiddenParentH3s([]);
        setLastUpdated(new Date());

        if (analogsRes.matches.length > 0) {
          const stillPresent = analogsRes.matches.some((m) => m.earth_cell_h3 === selectedH3);
          const nextH3 =
            stillPresent && selectedH3 ? selectedH3 : analogsRes.matches[0].earth_cell_h3;
          setSelectedH3(nextH3);
        } else {
          setSelectedH3(null);
          setComparison(null);
        }
        return true;
      } catch (err) {
        if (signal?.aborted) return false;
        captureError(err);
        return false;
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [
      selectedSiteId,
      modelType,
      distanceMetric,
      testProfile,
      minSInd,
      minSDep,
      excludeBenchmarks,
      penalizeEstimated,
      earthDensity,
      selectedH3,
      customIvWeights,
      customDvWeights,
      customMinSimilarity,
      customProbedSite,
      sites.length,
      loadSites,
      clearError,
      captureError,
    ]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void runAnalysis(controller.signal);
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // Trigger analysis when parameters change (excluding selectedH3 changes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSiteId,
    modelType,
    distanceMetric,
    testProfile,
    minSInd,
    minSDep,
    excludeBenchmarks,
    penalizeEstimated,
    earthDensity,
    customIvWeights,
    customDvWeights,
    customMinSimilarity,
  ]);

  // The comparison must use the same mission profile and weights as the ranking (angemon a29a57a).
  const manualWeights = useMemo(
    () =>
      testProfile === "manual_custom"
        ? { customIvWeights, customDvWeights }
        : { customIvWeights: undefined, customDvWeights: undefined },
    [testProfile, customIvWeights, customDvWeights]
  );
  const compareKey = useCallback(
    (h3Index: string, siteId: string) =>
      `${siteId}|${h3Index}|${modelType}|${testProfile}|${penalizeEstimated ? 1 : 0}|${JSON.stringify(manualWeights)}`,
    [modelType, testProfile, penalizeEstimated, manualWeights]
  );
  // Set when a probe/refine response already carries the comparison, to skip a duplicate request.
  const preloadedComparisonKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedH3 || !selectedSiteId) return;
    if (preloadedComparisonKeyRef.current === compareKey(selectedH3, selectedSiteId)) {
      preloadedComparisonKeyRef.current = null;
      return;
    }
    const controller = new AbortController();
    compareCellWithSite(selectedH3, selectedSiteId, modelType, {
      signal: controller.signal,
      testProfile,
      penalizeEstimated,
      ...manualWeights,
    })
      .then((res) => {
        if (!controller.signal.aborted) setComparison(res);
      })
      .catch((err) => {
        if (!controller.signal.aborted) captureError(err);
      });
    return () => controller.abort();
  }, [selectedH3, selectedSiteId, modelType, testProfile, penalizeEstimated, manualWeights, compareKey, captureError]);

  const handleProbeCoordinate = useCallback(
    async (lat: number, lon: number) => {
      setProbingCoords({ lat, lon });
      clearError();
      try {
        const res = await probeEarthCoordinate(lat, lon, selectedSiteId, modelType, {
          testProfile,
          penalizeEstimated,
          ...manualWeights,
        });
        preloadedComparisonKeyRef.current = compareKey(res.match.earth_cell_h3, selectedSiteId);
        setComparison(res);
        setSelectedH3(res.match.earth_cell_h3);
        setSearchResult((prev) => {
          if (!prev) return prev;
          const filtered = prev.matches.filter(
            (m) => m.earth_cell_h3 !== res.match.earth_cell_h3
          );
          return {
            ...prev,
            total_evaluated:
              prev.total_evaluated + (filtered.length === prev.matches.length ? 1 : 0),
            matches: [res.match, ...filtered],
          };
        });
      } catch (err) {
        captureError(err);
      } finally {
        setProbingCoords(null);
      }
    },
    [selectedSiteId, modelType, testProfile, penalizeEstimated, manualWeights, compareKey, clearError, captureError]
  );

  const handleRefineCell = useCallback(
    async (h3Index: string) => {
      setIsRefining(true);
      clearError();
      try {
        const res = await refineAnalogCell(
          h3Index,
          selectedSiteId,
          modelType,
          penalizeEstimated,
          testProfile,
          manualWeights.customIvWeights,
          manualWeights.customDvWeights,
          1
        );
        if (res.matches.length > 0) {
          const childIdList = res.matches.map((m) => m.earth_cell_h3);
          const refinedParents =
            res.refined_parents && res.refined_parents.length > 0
              ? res.refined_parents
              : [h3Index];
          setSearchResult((prev) => {
            if (!prev) return prev;
            const childIds = new Set(childIdList);
            const existingIds = new Set(prev.matches.map((m) => m.earth_cell_h3));
            const newlyAdded = res.matches.filter((m) => !existingIds.has(m.earth_cell_h3)).length;
            const remaining = prev.matches.filter((m) => !childIds.has(m.earth_cell_h3));
            const merged = [...res.matches, ...remaining].sort(
              (a, b) => b.combined_score - a.combined_score
            );
            return {
              ...prev,
              total_evaluated: prev.total_evaluated + newlyAdded,
              returned_count: merged.length,
              matches: merged,
            };
          });
          setDrilldownState({
            parentH3: h3Index,
            parentH3s: refinedParents,
            childIds: childIdList,
          });
          setHiddenParentH3s((prev) => Array.from(new Set([...prev, ...refinedParents])));
          if (res.top_comparison) {
            preloadedComparisonKeyRef.current = compareKey(res.matches[0].earth_cell_h3, selectedSiteId);
            setComparison(res.top_comparison);
          }
          setSelectedH3(res.matches[0].earth_cell_h3);
        }
      } catch (err) {
        captureError(err);
      } finally {
        setIsRefining(false);
      }
    },
    [selectedSiteId, modelType, penalizeEstimated, testProfile, manualWeights, compareKey, clearError, captureError]
  );

  const handleRefreshApis = useCallback(async () => {
    setIsRefreshing(true);
    clearError();
    try {
      clearApiCache();
      await loadSites();
      return await runAnalysis();
    } catch (err) {
      captureError(err);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSites, runAnalysis, clearError, captureError]);

  const handleProbePlanet = useCallback(
    async (body: PlanetaryBody, lat: number, lon: number) => {
      setProbingPlanetCoords({ lat, lon });
      clearError();
      try {
        const res = await probePlanetaryLocation({
          body,
          lat,
          lon,
          modelType,
          distanceMetric,
          testProfile,
          minSInd,
          minSDep,
          excludeBenchmarks,
          limit: earthDensity === "global" ? 25000 : 250,
          customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
          customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
          customMinSimilarity: testProfile === "manual_custom" ? customMinSimilarity : undefined,
        });
        setSelectedBody(body);
        setCustomProbedSite(res.site);
        setSelectedSiteId(res.site.site_id);
        setDecomposition(res.decomposition);
        setSearchResult(res.analogs);
        setDrilldownState(null);
        setHiddenParentH3s([]);
        setComparison(res.top_comparison);
        setSelectedH3(res.analogs.matches[0]?.earth_cell_h3 ?? null);
        setLastUpdated(new Date());
      } catch (err) {
        captureError(err);
      } finally {
        setProbingPlanetCoords(null);
      }
    },
    [
      modelType,
      distanceMetric,
      testProfile,
      minSInd,
      minSDep,
      excludeBenchmarks,
      earthDensity,
      customIvWeights,
      customDvWeights,
      customMinSimilarity,
      setSelectedBody,
      setCustomProbedSite,
      setSelectedSiteId,
      clearError,
      captureError,
    ]
  );

  const handleSelectBody = useCallback(
    (body: PlanetaryBody) => {
      setSelectedBody(body);
      setCustomProbedSite(null);
      const firstForBody = sites.find((s) => s.body === body);
      if (firstForBody) {
        setSelectedSiteId(firstForBody.site_id);
      }
    },
    [sites, setSelectedBody, setCustomProbedSite, setSelectedSiteId]
  );

  return {
    sites,
    decomposition,
    searchResult,
    selectedH3,
    setSelectedH3,
    comparison,
    isLoading,
    isRefreshing,
    isRefining,
    earthDensity,
    setEarthDensity,
    drilldownState,
    setDrilldownState,
    hiddenParentH3s,
    probingCoords,
    probingPlanetCoords,
    lastUpdated,
    errorState: errorState ?? catalogErrorState,
    catalogErrorState,
    runAnalysis,
    handleProbeCoordinate,
    handleRefineCell,
    handleRefreshApis,
    handleProbePlanet,
    handleSelectBody,
  };
}
