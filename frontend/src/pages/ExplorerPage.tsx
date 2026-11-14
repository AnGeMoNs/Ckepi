import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FlaskConical,
  GitCompareArrows,
  RefreshCw,
  Share2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  ApiClientError,
  compareCellWithSite,
  fetchPlanetarySites,
  probeEarthCoordinate,
  probePlanetaryLocation,
  refineAnalogCell,
  refreshDatasets,
  runDecomposition,
  searchAnalogs,
} from "../api/client";
import { DecompositionPanel } from "../components/decomposition/DecompositionPanel";
import { GuidedStepsBanner } from "../components/layout/GuidedStepsBanner";
import { ContextualCuriosityStrip } from "../components/learning/ContextualCuriosityStrip";

const EvidencePanel = lazy(() =>
  import("../components/evidence/EvidencePanel").then((m) => ({ default: m.EvidencePanel }))
);
const PlanetaryPhysicsLab = lazy(() =>
  import("../components/learning/PlanetaryPhysicsLab").then((m) => ({
    default: m.PlanetaryPhysicsLab,
  }))
);
const FieldTrialPlanner = lazy(() =>
  import("../components/planning/FieldTrialPlanner").then((m) => ({
    default: m.FieldTrialPlanner,
  }))
);
const AnalogMap = lazy(() =>
  import("../components/map/AnalogMap").then((m) => ({ default: m.AnalogMap }))
);
const PlanetaryMap = lazy(() =>
  import("../components/map/PlanetaryMap").then((m) => ({ default: m.PlanetaryMap }))
);
import { AnalogComparisonMatrix } from "../components/mission/AnalogComparisonMatrix";
import {
  MANUAL_DV_KEYS,
  MANUAL_IV_KEYS,
  ManualVariableControls,
} from "../components/mission/ManualVariableControls";
import { DataConfidenceBanner } from "../components/mission/DataConfidenceBanner";
import { MissionDiagnostics } from "../components/mission/MissionDiagnostics";
import { PresetProfileInspector } from "../components/mission/PresetProfileInspector";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { InfoTooltip } from "../components/ui/InfoTooltip";
import { Select } from "../components/ui/Select";
import { formatPercent, formatTimestamp } from "../i18n";
import { useClipboard } from "../hooks/useClipboard";
import { createFieldTrialDraft } from "../utils/fieldTrialDraft";
import { readExplorerParams, type ExplorerTab } from "../utils/explorerParams";
import type {
  AnalogSearchResponse,
  DecompositionModelType,
  DecompositionResponse,
  PlanetaryBody,
  PlanetarySite,
  ReadingMode,
  SiteComparisonResponse,
  TestProfileType,
  ThemeMode,
} from "../types/analog";

interface ExplorerPageProps {
  theme: ThemeMode;
  readingMode: ReadingMode;
}

export function ExplorerPage({ theme, readingMode }: ExplorerPageProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [initialParams] = useState(() => readExplorerParams(
    typeof window !== "undefined" ? window.location.search : ""
  ));
  const [activeTab, setActiveTab] = useState<ExplorerTab>(initialParams.tab);
  const [planDraft, setPlanDraft] = useState(createFieldTrialDraft);
  const linkClipboard = useClipboard();
  const copiedLink = linkClipboard.status === "copied";
  const analysisController = useRef<AbortController | null>(null);
  const requests = useRef({ earth: 0, planet: 0, refine: 0 });
  const preloadedComparisonKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeTab === "compare") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeTab]);
  const [sites, setSites] = useState<PlanetarySite[]>([]);
  const [selectedBody, setSelectedBody] = useState<PlanetaryBody>(initialParams.body);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(
    initialParams.siteId
  );
  const [customProbedSite, setCustomProbedSite] = useState<PlanetarySite | null>(null);
  const [modelType, setModelType] = useState<DecompositionModelType>("ridge");
  const [testProfile, setTestProfile] = useState<TestProfileType>(
    initialParams.profile
  );
  const [minSInd, setMinSInd] = useState<number>(0.2);
  const [minSDep, setMinSDep] = useState<number>(0.0);
  const [excludeBenchmarks, setExcludeBenchmarks] = useState<boolean>(
    initialParams.discovery
  );
  const [penalizeEstimated, setPenalizeEstimated] = useState<boolean>(
    initialParams.penalize
  );
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [drilldownState, setDrilldownState] = useState<{
    parentH3: string;
    childIds: string[];
  } | null>(null);
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

  const [rawDecomposition, setDecomposition] = useState<DecompositionResponse | null>(null);
  const [rawSearchResult, setSearchResult] = useState<AnalogSearchResponse | null>(null);
  const [selectedH3, setSelectedH3] = useState<string | null>(null);
  const [rawComparison, setComparison] = useState<SiteComparisonResponse | null>(null);

  // Never attach a previous site's measurements to the newly selected target.
  const decomposition = rawDecomposition?.site_id === selectedSiteId ? rawDecomposition : null;
  const searchResult = rawSearchResult?.site_id === selectedSiteId ? rawSearchResult : null;
  const comparison = rawComparison?.site.site_id === selectedSiteId &&
    rawComparison.match.earth_cell_h3 === selectedH3 ? rawComparison : null;
  const activeSite = customProbedSite?.site_id === selectedSiteId
    ? customProbedSite
    : sites.find((site) => site.site_id === selectedSiteId);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [probingCoords, setProbingCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [probingPlanetCoords, setProbingPlanetCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [errorState, setErrorState] = useState<{ key: string; params: Record<string, string> } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadSites = useCallback(async (signal?: AbortSignal) => {
    try {
      const list = await fetchPlanetarySites(signal);
      if (!signal?.aborted) setSites(list);
    } catch (err) {
      if (signal?.aborted) return;
      setIsLoading(false);
      if (err instanceof ApiClientError) {
        setErrorState({ key: err.errorKey, params: err.params });
      } else {
        setErrorState({ key: "errors.unknown_error", params: {} });
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadSites(controller.signal);
    return () => controller.abort();
  }, [loadSites]);

  useEffect(() => {
    if (activeSite) {
      setSelectedBody(activeSite.body);
    } else if (sites.length > 0) {
      setCustomProbedSite(null);
      setSelectedSiteId(sites.find((site) => site.body === selectedBody)?.site_id ?? sites[0].site_id);
    }
  }, [activeSite, sites, selectedBody]);

  useEffect(() => {
    // Invalidate pending probes when their scientific context changes.
    requests.current.earth += 1;
    requests.current.planet += 1;
    requests.current.refine += 1;
    setProbingCoords(null);
    setProbingPlanetCoords(null);
    setIsRefining(false);
  }, [selectedSiteId, modelType, testProfile, minSInd, minSDep,
    excludeBenchmarks, penalizeEstimated, customIvWeights, customDvWeights, customMinSimilarity]);

  const runAnalysis = useCallback(
    async () => {
      if (!activeSite) return;
      analysisController.current?.abort();
      const controller = new AbortController();
      analysisController.current = controller;
      const { signal } = controller;
      setIsLoading(true);
      setErrorState(null);

      try {
        const [decompRes, analogsRes] = await Promise.all([
          runDecomposition(selectedSiteId, modelType, signal),
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
          setSelectedH3((current) => analogsRes.matches.some((m) => m.earth_cell_h3 === current)
            ? current : analogsRes.matches[0].earth_cell_h3);
        } else {
          setSelectedH3(null);
          setComparison(null);
        }
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiClientError) {
          setErrorState({ key: err.errorKey, params: err.params });
        } else {
          setErrorState({ key: "errors.unknown_error", params: {} });
        }
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
      customIvWeights,
      customDvWeights,
      customMinSimilarity,
      activeSite,
    ]
  );

  useEffect(() => {
    setDecomposition(null);
    setSearchResult(null);
    setComparison(null);
    setDrilldownState(null);
    setLastUpdated(null);
    setIsLoading(Boolean(activeSite));
    const timer = window.setTimeout(() => void runAnalysis(), 250);
    return () => {
      window.clearTimeout(timer);
      analysisController.current?.abort();
    };
  }, [runAnalysis, activeSite]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("site", selectedSiteId);
    url.searchParams.set("profile", testProfile);
    if (excludeBenchmarks) url.searchParams.set("discovery", "1");
    else url.searchParams.delete("discovery");
    if (penalizeEstimated) url.searchParams.set("penalize", "1");
    else url.searchParams.delete("penalize");
    window.history.replaceState({}, "", url.toString());
  }, [selectedSiteId, testProfile, excludeBenchmarks, penalizeEstimated]);

  const hasSearchResult = Boolean(searchResult);
  const customWeightsKey = useMemo(
    () =>
      testProfile === "manual_custom"
        ? JSON.stringify({ iv: customIvWeights, dv: customDvWeights })
        : "",
    [testProfile, customIvWeights, customDvWeights]
  );

  const buildCompareKey = useCallback(
    (h3Index: string, siteId: string) =>
      `${siteId}|${h3Index}|${modelType}|${testProfile}|${penalizeEstimated ? "1" : "0"}|${customWeightsKey}`,
    [modelType, testProfile, penalizeEstimated, customWeightsKey]
  );

  useEffect(() => {
    if (!selectedH3 || !selectedSiteId || !hasSearchResult) return;
    const key = buildCompareKey(selectedH3, selectedSiteId);
    if (preloadedComparisonKeyRef.current === key) {
      preloadedComparisonKeyRef.current = null;
      return;
    }

    const controller = new AbortController();
    setComparison(null);
    compareCellWithSite(selectedH3, selectedSiteId, modelType, {
      signal: controller.signal,
      testProfile,
      penalizeEstimated,
      customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
      customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
    })
      .then((res) => {
        if (!controller.signal.aborted) setComparison(res);
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          if (err instanceof ApiClientError) {
            setErrorState({ key: err.errorKey, params: err.params });
          } else {
            setErrorState({ key: "errors.unknown_error", params: {} });
          }
        }
      });
    return () => {
      controller.abort();
    };
  }, [
    selectedH3,
    selectedSiteId,
    modelType,
    testProfile,
    penalizeEstimated,
    customIvWeights,
    customDvWeights,
    hasSearchResult,
    buildCompareKey,
  ]);

  const handleProbeCoordinate = useCallback(
    async (lat: number, lon: number) => {
      const requestId = ++requests.current.earth;
      setProbingCoords({ lat, lon });
      setErrorState(null);
      try {
        const res = await probeEarthCoordinate(lat, lon, selectedSiteId, modelType, {
          testProfile,
          penalizeEstimated,
          customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
          customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
        });
        if (requestId !== requests.current.earth) return;
        preloadedComparisonKeyRef.current = buildCompareKey(
          res.match.earth_cell_h3,
          selectedSiteId
        );
        setComparison(res);
        setSelectedH3(res.match.earth_cell_h3);
        setSearchResult((prev) => {
          if (!prev) return prev;
          const filtered = prev.matches.filter(
            (m) => m.earth_cell_h3 !== res.match.earth_cell_h3
          );
          return {
            ...prev,
            total_evaluated: prev.total_evaluated + (filtered.length === prev.matches.length ? 1 : 0),
            returned_count: filtered.length + 1,
            matches: [res.match, ...filtered],
          };
        });
      } catch (err) {
        if (requestId !== requests.current.earth) return;
        if (err instanceof ApiClientError) {
          setErrorState({ key: err.errorKey, params: err.params });
        } else {
          setErrorState({ key: "errors.unknown_error", params: {} });
        }
      } finally {
        if (requestId === requests.current.earth) {
          setProbingCoords(null);
        }
      }
    },
    [
      selectedSiteId,
      modelType,
      testProfile,
      penalizeEstimated,
      customIvWeights,
      customDvWeights,
      buildCompareKey,
    ]
  );

  const handleRefineCell = useCallback(
    async (h3Index: string) => {
      const requestId = ++requests.current.refine;
      setIsRefining(true);
      setErrorState(null);
      try {
        const res = await refineAnalogCell(
          h3Index,
          selectedSiteId,
          modelType,
          penalizeEstimated,
          testProfile,
          testProfile === "manual_custom" ? customIvWeights : undefined,
          testProfile === "manual_custom" ? customDvWeights : undefined
        );
        if (requestId !== requests.current.refine) return;
        if (res.matches.length > 0) {
          const childIdList = res.matches.map((m) => m.earth_cell_h3);
          if (res.top_comparison) {
            preloadedComparisonKeyRef.current = buildCompareKey(
              res.matches[0].earth_cell_h3,
              selectedSiteId
            );
          }
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
        if (requestId !== requests.current.refine) return;
        if (err instanceof ApiClientError) {
          setErrorState({ key: err.errorKey, params: err.params });
        } else {
          setErrorState({ key: "errors.unknown_error", params: {} });
        }
      } finally {
        if (requestId === requests.current.refine) {
          setIsRefining(false);
        }
      }
    },
    [
      selectedSiteId,
      modelType,
      penalizeEstimated,
      testProfile,
      customIvWeights,
      customDvWeights,
      buildCompareKey,
    ]
  );

  const handleRefreshApis = useCallback(async () => {
    setIsRefreshing(true);
    setErrorState(null);
    try {
      await refreshDatasets();
      await loadSites();
      await runAnalysis();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorState({ key: err.errorKey, params: err.params });
      } else {
        setErrorState({ key: "errors.unknown_error", params: {} });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [loadSites, runAnalysis]);

  const handleProbePlanet = useCallback(
    async (body: PlanetaryBody, lat: number, lon: number) => {
      const requestId = ++requests.current.planet;
      setProbingPlanetCoords({ lat, lon });
      setErrorState(null);
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
          penalizeEstimated,
          limit: 600,
          customIvWeights: testProfile === "manual_custom" ? customIvWeights : undefined,
          customDvWeights: testProfile === "manual_custom" ? customDvWeights : undefined,
          customMinSimilarity: testProfile === "manual_custom" ? customMinSimilarity : undefined,
        });
        if (requestId !== requests.current.planet) return;
        const firstH3 = res.analogs.matches[0]?.earth_cell_h3 ?? null;
        if (res.top_comparison && firstH3) {
          preloadedComparisonKeyRef.current = buildCompareKey(firstH3, res.site.site_id);
        }
        setSelectedBody(body);
        setCustomProbedSite(res.site);
        setSelectedSiteId(res.site.site_id);
        setDecomposition(res.decomposition);
        setSearchResult(res.analogs);
        setComparison(res.top_comparison);
        setSelectedH3(firstH3);
        setLastUpdated(new Date());
      } catch (err) {
        if (requestId !== requests.current.planet) return;
        if (err instanceof ApiClientError) {
          setErrorState({ key: err.errorKey, params: err.params });
        } else {
          setErrorState({ key: "errors.unknown_error", params: {} });
        }
      } finally {
        if (requestId === requests.current.planet) {
          setProbingPlanetCoords(null);
        }
      }
    },
    [modelType, testProfile, minSInd, minSDep, excludeBenchmarks, penalizeEstimated,
      customIvWeights, customDvWeights, customMinSimilarity, buildCompareKey]
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
    [sites]
  );

  const selectedCell =
    searchResult?.matches.find((m) => m.earth_cell_h3 === selectedH3) ??
    comparison?.match ??
    null;

  const handleFocusAtacama = useCallback(() => {
    const matches = searchResult?.matches ?? [];
    // Find closest cached H3 cell to Antofagasta / Yungay (-24.10, -69.90)
    let bestH3: string | null = null;
    let bestDist = Infinity;
    for (const m of matches) {
      const dLat = m.coordinates.lat - -24.1;
      const dLon = m.coordinates.lon - -69.9;
      const dist = dLat * dLat + dLon * dLon;
      if (dist < bestDist) {
        bestDist = dist;
        bestH3 = m.earth_cell_h3;
      }
    }
    if (bestH3 && bestDist < 12) {
      setSelectedH3(bestH3);
    } else {
      void handleProbeCoordinate(-24.1, -69.9);
    }
  }, [searchResult, handleProbeCoordinate]);

  const navTabs: {
    id: "compare" | "learn" | "plan" | "evidence";
    label: string;
    icon: typeof GitCompareArrows;
  }[] = [
    { id: "compare", label: t("nav.compare"), icon: GitCompareArrows },
    { id: "learn", label: t("nav.learn"), icon: FlaskConical },
    { id: "plan", label: t("nav.plan"), icon: ClipboardCheck },
    { id: "evidence", label: t("nav.evidence"), icon: BookOpen },
  ];

  return (
    <main id="main-content" className="mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-6">
      {/* Primary Journey Navigation: Compare · Learn · Plan · Evidence */}
      <nav
        aria-label={t("nav.tabsLabel")}
        role="tablist"
        className="flex flex-wrap gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-2 shadow-sm"
        onKeyDown={(e) => {
          const idx = navTabs.findIndex((tab) => tab.id === activeTab);
          if (idx === -1) return;
          const nextIndex = e.key === "ArrowRight" ? (idx + 1) % navTabs.length
            : e.key === "ArrowLeft" ? (idx - 1 + navTabs.length) % navTabs.length
            : e.key === "Home" ? 0
            : e.key === "End" ? navTabs.length - 1 : null;
          if (nextIndex === null) return;
          e.preventDefault();
          const nextTab = navTabs[nextIndex].id;
          setActiveTab(nextTab);
          document.getElementById(`tab-${nextTab}`)?.focus();
        }}
      >
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm ${
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-content-muted hover:bg-surface-muted hover:text-content"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Error Banner */}
      {errorState && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-break/40 bg-status-break/10 p-4 text-sm text-status-break"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t(errorState.key, errorState.params)}</span>
          </div>
          <Button variant="secondary" onClick={() => { void (activeSite ? runAnalysis() : loadSites()); }}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("controls.retry")}
          </Button>
        </div>
      )}

      <Suspense
        fallback={
          <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-content-muted">
            <RefreshCw className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
            <span>{t("controls.loading")}</span>
          </div>
        }
      >
        {activeTab === "learn" && (
          <div id="panel-learn" role="tabpanel" aria-labelledby="tab-learn">
            <PlanetaryPhysicsLab
              body={selectedBody}
              activeSite={activeSite}
              selectedCell={selectedCell}
              comparison={comparison}
              onGoToCompare={() => setActiveTab("compare")}
              onGoToPlan={() => setActiveTab("plan")}
            />
          </div>
        )}

        {activeTab === "plan" && (
          <div id="panel-plan" role="tabpanel" aria-labelledby="tab-plan">
            <FieldTrialPlanner
              draft={planDraft}
              onDraftChange={setPlanDraft}
              activeSite={activeSite}
              selectedCell={selectedCell}
              comparison={comparison}
              onGoToCompare={() => setActiveTab("compare")}
              onGoToEvidence={() => setActiveTab("evidence")}
            />
          </div>
        )}

        {activeTab === "evidence" && (
          <div id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence">
            <EvidencePanel activeSite={activeSite} comparison={comparison} />
          </div>
        )}
      </Suspense>

      {activeTab === "compare" && (
        <div id="panel-compare" role="tabpanel" aria-labelledby="tab-compare" className="space-y-6">
          <GuidedStepsBanner />

      {/* Control Bar */}
      <Card>
        <CardContent className="space-y-4">
          {/* Level 1: Essential Controls (no truncation) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(() => {
              const siteOptions = [
                ...sites.map((s) => ({
                  value: s.site_id,
                  label: t(s.name_key),
                })),
                ...(customProbedSite
                  ? [
                      {
                        value: customProbedSite.site_id,
                        label: `${t(customProbedSite.name_key)} (${customProbedSite.coordinates.lat}, ${customProbedSite.coordinates.lon})`,
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
                <Select
                  id="target-site-select"
                  label={t("controls.targetSite")}
                  value={effectiveValue}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setCustomProbedSite(null);
                    setSelectedSiteId(nextId);
                    const found = sites.find((s) => s.site_id === nextId);
                    if (found) setSelectedBody(found.body);
                  }}
                  options={effectiveOptions}
                />
              );
            })()}

            <Select
              id="test-profile-select"
              label={t("controls.testProfile")}
              value={testProfile}
              onChange={(e) => setTestProfile(e.target.value as TestProfileType)}
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

          {/* Preset Profile Inspector ("Ver más") */}
          {testProfile !== "manual_custom" && searchResult && (
            <PresetProfileInspector
              testProfile={testProfile}
              weightsUsed={searchResult.causal_weights_used}
              onCloneToManual={(weights) => {
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
              }}
            />
          )}

          {/* Level 2: Manual Variable-by-Variable Mode */}
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
              onClearGlobalThresholds={() => {
                setMinSInd(0);
                setMinSDep(0);
              }}
              onApply={(nextIvWeights, nextDvWeights, nextMinSim) => {
                setCustomIvWeights(nextIvWeights);
                setCustomDvWeights(nextDvWeights);
                setCustomMinSimilarity(nextMinSim);
              }}
            />
          )}

          {/* Secondary Row: Discovery Toggle + Advanced Scientific Settings + Data Sources */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="discovery-mode-toggle"
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm text-content hover:bg-surface-muted"
              >
                <input
                  id="discovery-mode-toggle"
                  type="checkbox"
                  checked={excludeBenchmarks}
                  onChange={(e) => setExcludeBenchmarks(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                <Sparkles className="h-4 w-4 shrink-0 text-status-valid" aria-hidden="true" />
                <span className="font-medium">{t("controls.discoveryOnly")}</span>
                <InfoTooltip label={t("controls.discoveryOnly")} text={t("controls.discoveryHint")} />
              </label>

              <Button
                variant="secondary"
                onClick={handleFocusAtacama}
              >
                <span>{t("nav.focusAtacama")}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowAdvanced((prev) => !prev)}
                aria-expanded={showAdvanced}
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>{t("controls.advancedToggle")}</span>
                {showAdvanced ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-content-muted">
              {activeSite && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{t("controls.dataSources")}:</span>
                  {activeSite.data_sources.map((src) => (
                    <Badge key={src} variant="default">
                      {src}
                    </Badge>
                  ))}
                </div>
              )}
              {lastUpdated && (
                <span>
                  · {t("controls.lastUpdated")}: {formatTimestamp(lastUpdated, lang)}
                </span>
              )}
              <Button
                variant="secondary"
                disabled={isRefreshing}
                onClick={() => void handleRefreshApis()}
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                <span>{isRefreshing ? t("controls.refreshing") : t("controls.refreshApis")}</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => void linkClipboard.copy(window.location.href)}
                disabled={linkClipboard.status === "copying"}
              >
                {copiedLink ? (
                  <Check className="h-4 w-4 text-status-valid" aria-hidden="true" />
                ) : (
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{copiedLink ? t("controls.copiedLink") : t("controls.shareLink")}</span>
              </Button>
            </div>
          </div>

          <span role="status" aria-live="polite" className="sr-only">
            {copiedLink ? t("controls.copiedLink") : ""}
          </span>
          {linkClipboard.status === "error" && (
            <p role="alert" className="text-sm text-status-break">{t("errors.clipboard_failed")}</p>
          )}

          {/* Level 3: Collapsible Advanced Scientific Settings */}
          {showAdvanced && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border-subtle bg-surface p-4 md:grid-cols-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <label
                    htmlFor="model-type-select"
                    className="text-xs font-medium text-content-muted"
                  >
                    {t("controls.modelType")}
                  </label>
                  <InfoTooltip
                    label={t("controls.modelType")}
                    text={t("controls.modelTypeHint")}
                  />
                </div>
                <Select
                  id="model-type-select"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as DecompositionModelType)}
                  options={[
                    { value: "ridge", label: t("controls.ridge") },
                    { value: "random_forest", label: t("controls.randomForest") },
                  ]}
                />
                {testProfile !== "causal_auto" && (
                  <p className="text-xs text-status-warn">{t("controls.modelOverriddenNote")}</p>
                )}
              </div>

              <div className="flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-content-muted">
                  <div className="flex items-center gap-0.5">
                    <label htmlFor="min-sind-range">{t("controls.minSInd")}</label>
                    <InfoTooltip label={t("controls.minSInd")} text={t("controls.minSIndHelp")} />
                  </div>
                  <span className="tabular-nums font-semibold text-content">
                    {formatPercent(minSInd, lang)}
                  </span>
                </div>
                <input
                  id="min-sind-range"
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={minSInd}
                  onChange={(e) => setMinSInd(Number(e.target.value))}
                  className="min-h-11 w-full cursor-pointer accent-accent"
                />
                <p className="text-xs text-content-muted">{t("controls.minSIndHelp")}</p>
              </div>

              <div className="flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium text-content-muted">
                  <label htmlFor="min-sdep-range">{t("controls.minSDep")}</label>
                  <span className="tabular-nums font-semibold text-content">
                    {formatPercent(minSDep, lang)}
                  </span>
                </div>
                <input
                  id="min-sdep-range"
                  type="range"
                  min={0}
                  max={0.85}
                  step={0.05}
                  value={minSDep}
                  onChange={(e) => setMinSDep(Number(e.target.value))}
                  className="min-h-11 w-full cursor-pointer accent-accent"
                />
                <p className="text-xs text-content-muted">{t("controls.minSDepHelp")}</p>
              </div>

              <label
                htmlFor="penalize-estimated-toggle"
                className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2 text-xs text-content md:col-span-3"
              >
                <input
                  id="penalize-estimated-toggle"
                  type="checkbox"
                  checked={penalizeEstimated}
                  onChange={(e) => setPenalizeEstimated(e.target.checked)}
                  className="h-4 w-4 accent-accent"
                />
                <span className="font-medium">{t("controls.penalizeEstimated")}</span>
              </label>
            </div>
          )}

          {activeSite && (
            <p className="text-xs text-content-muted sm:text-sm">
              {t(activeSite.mission_context_key)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated px-4 py-3 text-sm text-content-muted">
          <RefreshCw className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
          <span>{t("controls.loading")}</span>
        </div>
      )}

      {/* Dual Interactive Planetary & Global Earth Maps */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Suspense
          fallback={
            <div className="flex h-80 items-center justify-center rounded-xl border border-border-subtle bg-surface-elevated text-sm text-content-muted">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin text-accent" aria-hidden="true" />
              <span>{t("controls.loading")}</span>
            </div>
          }
        >
          <PlanetaryMap
            body={selectedBody}
            sites={sites}
            activeTarget={
              activeSite
                ? {
                    lat: activeSite.coordinates.lat,
                    lon: activeSite.coordinates.lon,
                    label: t(activeSite.name_key),
                  }
                : null
            }
            probingPlanetCoords={probingPlanetCoords}
            onSelectBody={handleSelectBody}
            onSelectSite={(siteId) => {
              setCustomProbedSite(null);
              setSelectedSiteId(siteId);
            }}
            onProbePlanet={(body, lat, lon) => void handleProbePlanet(body, lat, lon)}
          />
        </Suspense>

        {searchResult && (
          <Suspense
            fallback={
              <div className="flex h-80 items-center justify-center rounded-xl border border-border-subtle bg-surface-elevated text-sm text-content-muted">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-accent" aria-hidden="true" />
                <span>{t("controls.loading")}</span>
              </div>
            }
          >
            <AnalogMap
              matches={searchResult.matches}
              totalEvaluated={searchResult.total_evaluated}
              selectedH3={selectedH3}
              theme={theme}
              probingCoords={probingCoords}
              isRefining={isRefining}
              drilldownState={drilldownState}
              onSelectCell={(h3Index) => setSelectedH3(h3Index)}
              onProbeCoordinate={(lat, lon) => void handleProbeCoordinate(lat, lon)}
              onRefineCell={(h3Index) => void handleRefineCell(h3Index)}
              onExitDrilldown={() => setDrilldownState(null)}
            />
          </Suspense>
        )}
      </div>

      {/* Data Confidence & Honest Estimation Banner */}
      {activeSite && <DataConfidenceBanner site={activeSite} />}

      {/* Contextual Curiosity CTA linking Compare -> Learn */}
      <ContextualCuriosityStrip
        body={selectedBody}
        activeSite={activeSite}
        comparison={comparison}
        onOpenLearn={() => setActiveTab("learn")}
      />

      {/* Main Analytical Sections */}
      {decomposition && <DecompositionPanel decomposition={decomposition} />}

      {comparison && <MissionDiagnostics comparison={comparison} readingMode={readingMode} />}

      {searchResult && (
        <AnalogComparisonMatrix
          matches={searchResult.matches}
          selectedH3={selectedH3}
          activeSite={activeSite}
          onSelectCell={(h3Index) => setSelectedH3(h3Index)}
        />
      )}
        </div>
      )}
    </main>
  );
}

