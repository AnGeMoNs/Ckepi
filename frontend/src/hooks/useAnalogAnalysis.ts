import { useCallback, useEffect, useState } from "react";

import {
  compareCellWithSite,
  fetchPlanetarySites,
  probeEarthCoordinate,
  probePlanetaryLocation,
  refineAnalogCell,
  refreshDatasets,
  runDecomposition,
  searchAnalogs,
} from "../api/client";
import type {
  AnalogSearchResponse,
  DecompositionModelType,
  DecompositionResponse,
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

  const [sites, setSites] = useState<PlanetarySite[]>([]);
  const [decomposition, setDecomposition] = useState<DecompositionResponse | null>(null);
  const [searchResult, setSearchResult] = useState<AnalogSearchResponse | null>(null);
  const [selectedH3, setSelectedH3] = useState<string | null>(null);
  const [comparison, setComparison] = useState<SiteComparisonResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [drilldownState, setDrilldownState] = useState<{
    parentH3: string;
    childIds: string[];
  } | null>(null);
  const [probingCoords, setProbingCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [probingPlanetCoords, setProbingPlanetCoords] = useState<{
    lat: number;
    lon: number;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSites = useCallback(async () => {
    try {
      const list = await fetchPlanetarySites();
      setSites(list);
      if (list.length > 0 && !list.some((s) => s.site_id === selectedSiteId)) {
        setSelectedSiteId(list[0].site_id);
      }
    } catch (err) {
      captureError(err);
    }
  }, [selectedSiteId, setSelectedSiteId, captureError]);

  useEffect(() => {
    void loadSites();
  }, [loadSites]);

  const runAnalysis = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedSiteId) return;
      if (customProbedSite && customProbedSite.site_id === selectedSiteId) {
        return;
      }
      setIsLoading(true);
      clearError();

      try {
        const [decompRes, analogsRes] = await Promise.all([
          runDecomposition(selectedSiteId, modelType),
          searchAnalogs({
            siteId: selectedSiteId,
            modelType,
            testProfile,
            minSInd,
            minSDep,
            excludeBenchmarks,
            penalizeEstimated,
            limit: 1200,
            customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
            customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
            customMinSimilarity: testProfile === "manual_custom" ? customMinSimilarity : undefined,
            signal,
          }),
        ]);

        if (signal?.aborted) return;
        setDecomposition(decompRes);
        setSearchResult(analogsRes);
        setDrilldownState(null);
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
      } catch (err) {
        if (signal?.aborted) return;
        captureError(err);
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [
      selectedSiteId,
      modelType,
      testProfile,
      minSInd,
      minSDep,
      excludeBenchmarks,
      penalizeEstimated,
      selectedH3,
      customIvWeights,
      customDvWeights,
      customMinSimilarity,
      customProbedSite,
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
    testProfile,
    minSInd,
    minSDep,
    excludeBenchmarks,
    penalizeEstimated,
    customIvWeights,
    customDvWeights,
    customMinSimilarity,
  ]);

  useEffect(() => {
    if (!selectedH3 || !selectedSiteId) return;
    let cancelled = false;
    compareCellWithSite(selectedH3, selectedSiteId, modelType)
      .then((res) => {
        if (!cancelled) setComparison(res);
      })
      .catch((err) => {
        if (!cancelled) captureError(err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedH3, selectedSiteId, modelType, captureError]);

  const handleProbeCoordinate = useCallback(
    async (lat: number, lon: number) => {
      setProbingCoords({ lat, lon });
      clearError();
      try {
        const res = await probeEarthCoordinate(lat, lon, selectedSiteId, modelType);
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
    [selectedSiteId, modelType, clearError, captureError]
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
          testProfile
        );
        if (res.matches.length > 0) {
          const childIdList = res.matches.map((m) => m.earth_cell_h3);
          setSearchResult((prev) => {
            if (!prev) return prev;
            const childIds = new Set(childIdList);
            const remaining = prev.matches.filter((m) => !childIds.has(m.earth_cell_h3));
            const merged = [...res.matches, ...remaining].sort(
              (a, b) => b.combined_score - a.combined_score
            );
            return {
              ...prev,
              total_evaluated: prev.total_evaluated + res.matches.length,
              returned_count: merged.length,
              matches: merged,
            };
          });
          setDrilldownState({ parentH3: h3Index, childIds: childIdList });
          setSelectedH3(res.matches[0].earth_cell_h3);
          if (res.top_comparison) {
            setComparison(res.top_comparison);
          }
        }
      } catch (err) {
        captureError(err);
      } finally {
        setIsRefining(false);
      }
    },
    [selectedSiteId, modelType, penalizeEstimated, testProfile, clearError, captureError]
  );

  const handleRefreshApis = useCallback(async () => {
    setIsRefreshing(true);
    clearError();
    try {
      await refreshDatasets();
      await loadSites();
      await runAnalysis();
      return true;
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
          testProfile,
          minSInd,
          minSDep,
          excludeBenchmarks,
          limit: 600,
          customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
          customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
          customMinSimilarity: testProfile === "manual_custom" ? customMinSimilarity : undefined,
        });
        setSelectedBody(body);
        setCustomProbedSite(res.site);
        setSelectedSiteId(res.site.site_id);
        setDecomposition(res.decomposition);
        setSearchResult(res.analogs);
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
      testProfile,
      minSInd,
      minSDep,
      excludeBenchmarks,
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
    drilldownState,
    setDrilldownState,
    probingCoords,
    probingPlanetCoords,
    lastUpdated,
    errorState,
    runAnalysis,
    handleProbeCoordinate,
    handleRefineCell,
    handleRefreshApis,
    handleProbePlanet,
    handleSelectBody,
  };
}
