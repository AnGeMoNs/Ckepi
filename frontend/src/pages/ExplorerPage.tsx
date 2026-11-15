import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  GitCompareArrows,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchAiStatus } from "../api/client";
import { ContextualCuriosityStrip } from "../components/learning/ContextualCuriosityStrip";
import { ActionBar } from "../components/mission/ActionBar";
import { ControlPanel } from "../components/mission/ControlPanel";
import { ScientificHome } from "../components/mission/ScientificHome";
import { VerifiedTerrainDemo } from "../components/mission/VerifiedTerrainDemo";
import { DataConfidenceBanner } from "../components/mission/DataConfidenceBanner";
import { UnexpectedDiscoverySpotlight } from "../components/mission/UnexpectedDiscoverySpotlight";
import { StudentComparisonPanel } from "../components/student/StudentComparisonPanel";
import { StudentControlPanel } from "../components/student/StudentControlPanel";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { ActionPin } from "../components/explore/ActionPin";
import { DestinationPicker } from "../components/explore/DestinationPicker";
import { MapCarousel } from "../components/explore/MapCarousel";
import { SteamMission } from "../components/steam/SteamMission";
import { WorldLab } from "../components/lab/WorldLab";
import { Pictogram } from "../components/worlds/Pictograms";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { MapSkeleton, PanelSkeleton } from "../components/ui/Skeleton";
import { Toast, type ToastVariant } from "../components/ui/Toast";
import { useAnalogAnalysis } from "../hooks/useAnalogAnalysis";
import { useExplorerParams } from "../hooks/useExplorerParams";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { MissionAiAnalysisResponse, ReadingMode, ThemeMode } from "../types/analog";
import { readExplorerParams, type ExplorerTab } from "../utils/explorerParams";

const PlanetaryMap = lazy(() =>
  import("../components/map/PlanetaryMap").then((m) => ({ default: m.PlanetaryMap }))
);
const AnalogMap = lazy(() =>
  import("../components/map/AnalogMap").then((m) => ({ default: m.AnalogMap }))
);
const DecompositionPanel = lazy(() =>
  import("../components/decomposition/DecompositionPanel").then((m) => ({
    default: m.DecompositionPanel,
  }))
);
const MissionDiagnostics = lazy(() =>
  import("../components/mission/MissionDiagnostics").then((m) => ({
    default: m.MissionDiagnostics,
  }))
);
const AnalogComparisonMatrix = lazy(() =>
  import("../components/mission/AnalogComparisonMatrix").then((m) => ({
    default: m.AnalogComparisonMatrix,
  }))
);
const EvidencePanel = lazy(() =>
  import("../components/evidence/EvidencePanel").then((m) => ({ default: m.EvidencePanel }))
);

interface ExplorerPageProps {
  theme: ThemeMode;
  readingMode: ReadingMode;
  onChangeReadingMode?: (mode: ReadingMode) => void;
}

type MobileMapTab = "planet" | "earth";

export function ExplorerPage({
  theme,
  readingMode,
  onChangeReadingMode,
}: ExplorerPageProps) {
  const { t } = useTranslation();
  const isStudent = readingMode === "explorer";
  const reducedMotion = useReducedMotion();
  const params = useExplorerParams();

  const analysis = useAnalogAnalysis({
    selectedSiteId: params.selectedSiteId,
    setSelectedSiteId: params.setSelectedSiteId,
    setSelectedBody: params.setSelectedBody,
    customProbedSite: params.customProbedSite,
    setCustomProbedSite: params.setCustomProbedSite,
    modelType: params.modelType,
    distanceMetric: params.distanceMetric,
    testProfile: params.testProfile,
    minSInd: params.minSInd,
    minSDep: params.minSDep,
    excludeBenchmarks: params.excludeBenchmarks,
    penalizeEstimated: params.penalizeEstimated,
    customIvWeights: params.customIvWeights,
    customDvWeights: params.customDvWeights,
    customMinSimilarity: params.customMinSimilarity,
  });

  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMapTab, setMobileMapTab] = useState<MobileMapTab>("earth");
  const [copiedLink, setCopiedLink] = useState(false);
  const [, setHasConfigured] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.has("site") || sp.has("profile");
  });
  const [, setHasExploredMap] = useState(false);
  const [, setHasExportedOrShared] = useState(false);
  const [toastState, setToastState] = useState<{ message: string; variant: ToastVariant } | null>(
    null
  );
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<MissionAiAnalysisResponse | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<ExplorerTab>(() => {
    const initialTab = readExplorerParams(
      typeof window !== "undefined" ? window.location.search : ""
    ).tab;
    if (isStudent && initialTab === "evidence") return "compare";
    if (isStudent && initialTab === "plan") return "mission";
    // STEAM opens on the cadet mission unless a link asks for another tab.
    if (isStudent && !new URLSearchParams(window.location.search).has("tab")) return "mission";
    if (!isStudent && initialTab === "mission") return "start";
    if (!isStudent && (initialTab === "learn" || initialTab === "plan")) return "compare";
    if (!isStudent && !new URLSearchParams(window.location.search).has("tab") && !window.location.hash) return "start";
    return initialTab;
  });

  useEffect(() => {
    if (isStudent && activeTab === "plan") {
      setActiveTab("mission");
    } else if (isStudent && ["start", "results", "analysis", "evidence"].includes(activeTab)) {
      setActiveTab("compare");
    } else if (!isStudent && (activeTab === "learn" || activeTab === "plan")) {
      setActiveTab("compare");
    } else if (!isStudent && activeTab === "mission") {
      setActiveTab("start");
    }
  }, [isStudent, activeTab]);
  const copiedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchAiStatus()
      .then((status) => {
        if (!cancelled) setAiEnabled(status.enabled);
      })
      .catch(() => {
        if (!cancelled) setAiEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (activeTab === "compare" && isStudent) {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeTab, isStudent]);

  useEffect(() => {
    const onBack = () => setActiveTab(readExplorerParams(window.location.search).tab);
    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, []);

  const navigatePage = (next: ExplorerTab) => {
    if (next === activeTab) return;
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    url.hash = "";
    window.history.pushState({}, "", url.toString());
    setActiveTab(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const showMapPage = isStudent || activeTab === "compare";
  const showResultsPage = !isStudent && activeTab === "results";
  const showAnalysisPage = !isStudent && activeTab === "analysis";
  const workspacePage = isStudent ? "compare" : activeTab;

  useEffect(() => {
    if (isDesktop) {
      setMobileDrawerOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
    };
  }, []);

  const activeSite =
    params.customProbedSite && params.customProbedSite.site_id === params.selectedSiteId
      ? params.customProbedSite
      : analysis.sites.find((s) => s.site_id === params.selectedSiteId);


  const navTabs: { id: ExplorerTab; label: string; icon?: typeof GitCompareArrows; art?: string }[] = isStudent
    ? [
        { id: "mission", label: t("steam.tab"), art: "/img/planets/ckepi-planet-steam.webp" },
        { id: "learn", label: t("steam.worldsTab"), art: "/img/planets/ckepi-planet-earth.webp" },
        { id: "compare", label: t("nav.studentCompare"), art: "/img/terrain-art/ckepi-map-atacama.webp" },
      ]
    : [
        { id: "start", label: t("sciencePages.start"), art: "/img/planets/ckepi-planet-earth.webp" },
        { id: "compare", label: t("sciencePages.compare"), art: "/img/terrain-art/ckepi-map-atacama.webp" },
        { id: "results", label: t("sciencePages.results"), art: "/img/planets/ckepi-planet-science.webp" },
        { id: "analysis", label: t("sciencePages.analysis"), art: "/img/science-accessories/ckepi-icon-slope.webp" },
        { id: "evidence", label: t("sciencePages.evidence"), art: "/img/science-accessories/ckepi-icon-soil.webp" },
      ];

  const handleTabKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const focusedId = e.target instanceof HTMLElement ? e.target.closest('[role="tab"]')?.id.replace(/^tab-/, "") : undefined;
    const idx = navTabs.findIndex((tab) => tab.id === (focusedId ?? activeTab));
    if (idx === -1) return;
    const nextIndex =
      e.key === "ArrowRight"
        ? (idx + 1) % navTabs.length
        : e.key === "ArrowLeft"
          ? (idx - 1 + navTabs.length) % navTabs.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? navTabs.length - 1
              : null;
    if (nextIndex === null) return;
    e.preventDefault();
    const nextTab = navTabs[nextIndex].id;
    setActiveTab(nextTab);
    document.getElementById(`tab-${nextTab}`)?.focus();
  };

  const hasResults = Boolean(analysis.searchResult || analysis.decomposition);
  const isInitialLoading = analysis.isLoading && !hasResults;
  const isUpdating = analysis.isLoading && hasResults;

  const showToast = (message: string, variant: ToastVariant = "success") => {
    setToastState({ message, variant });
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastState(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  const handleShareLink = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      showToast(t("controls.copyFailed"), "error");
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setHasExportedOrShared(true);
      showToast(t("controls.copiedLink"), "success");
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
      copiedTimerRef.current = window.setTimeout(() => {
        setCopiedLink(false);
        copiedTimerRef.current = null;
      }, 2000);
    } catch {
      showToast(t("controls.copyFailed"), "error");
    }
  };

  const handleExported = () => {
    setHasExportedOrShared(true);
    showToast(t("controls.exportedToast"), "success");
  };

  const handleRefresh = async () => {
    const ok = await analysis.handleRefreshApis();
    if (ok) {
      showToast(t("controls.refreshedToast"));
    }
  };

  const controlPanelNode = isStudent ? (
    <StudentControlPanel
      sites={analysis.sites}
      selectedBody={params.selectedBody}
      selectedSiteId={params.selectedSiteId}
      customProbedSite={params.customProbedSite}
      activeSite={activeSite}
      testProfile={params.testProfile}
      onSelectBody={(body) => {
        setHasConfigured(true);
        analysis.handleSelectBody(body);
      }}
      onSelectSite={(nextId, body) => {
        setHasConfigured(true);
        params.setCustomProbedSite(null);
        params.setSelectedSiteId(nextId);
        if (body) params.setSelectedBody(body);
      }}
      onChangeTestProfile={(profile) => {
        setHasConfigured(true);
        params.setTestProfile(profile);
      }}
    />
  ) : (
    <ControlPanel
      layout={isDesktop ? "horizontal" : "vertical"}
      activeSite={activeSite}
      testProfile={params.testProfile}
      modelType={params.modelType}
      distanceMetric={params.distanceMetric}
      minSInd={params.minSInd}
      minSDep={params.minSDep}
      excludeBenchmarks={params.excludeBenchmarks}
      penalizeEstimated={params.penalizeEstimated}
      showAdvanced={params.showAdvanced}
      searchResult={analysis.searchResult}
      customIvWeights={params.customIvWeights}
      customDvWeights={params.customDvWeights}
      customMinSimilarity={params.customMinSimilarity}
      onChangeTestProfile={(profile) => {
        setHasConfigured(true);
        params.setTestProfile(profile);
      }}
      onChangeModelType={params.setModelType}
      onChangeDistanceMetric={(metric) => {
        setHasConfigured(true);
        params.setDistanceMetric(metric);
      }}
      onChangeMinSInd={params.setMinSInd}
      onChangeMinSDep={params.setMinSDep}
      onChangeExcludeBenchmarks={params.setExcludeBenchmarks}
      onChangePenalizeEstimated={params.setPenalizeEstimated}
      onToggleAdvanced={() => params.setShowAdvanced((prev) => !prev)}
      onClonePresetToManual={params.clonePresetToManual}
      onClearGlobalThresholds={params.clearGlobalThresholds}
      onApplyManualVariables={(iv, dv, minSim) => {
        setHasConfigured(true);
        params.applyManualVariables(iv, dv, minSim);
      }}
    />
  );

  return (
    <main id="main-content" className="mx-auto max-w-screen-2xl space-y-5 px-3 py-4 sm:px-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {analysis.isLoading ? t("controls.loading") : ""}
      </div>

      {!isStudent && activeTab === "start" && <ScientificHome body={params.selectedBody} evaluated={analysis.searchResult?.total_evaluated} onEarth={() => { setMobileMapTab("earth"); navigatePage("compare"); }} onChoose={(body) => { params.setCustomProbedSite(null); params.setSelectedBody(body); params.setSelectedSiteId(body === "moon" ? "moon_shackleton_pole" : "mars_jezero_crater"); navigatePage("compare"); }} />}

      {/* Primary journey tabs (mode-aware) */}
      {<nav
        aria-label={t("nav.tabsLabel")}
        role="tablist"
        className={`ckepi-liquid grid gap-1 rounded-3xl p-1.5 ${isStudent ? "grid-cols-3" : "grid-cols-5"}`}
        onKeyDown={handleTabKeyDown}
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
              onClick={() => navigatePage(tab.id)}
              className={tab.art
                ? `relative flex min-h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:min-h-[5rem] sm:text-sm ${active ? "text-content" : "text-content-muted hover:text-content"}`
                : `flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm ${
                active
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-content-muted hover:bg-surface-muted hover:text-content"
              }`}
            >
              {tab.art ? (
                <>
                  {active && <motion.span layoutId="science-tab-lens" aria-hidden="true" className="ckepi-liquid ckepi-liquid-glow absolute inset-0 rounded-2xl" transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />}
                  <motion.img src={tab.art} alt="" width={64} height={48} draggable={false} className="relative h-7 w-10 object-contain sm:h-9 sm:w-12" animate={reducedMotion ? undefined : { y: active ? -2 : 0, scale: active ? 1.08 : 0.94 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} />
                  <span className="relative max-w-full truncate">{tab.label}</span>
                </>
              ) : (
                <>
                  {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                  <span>{tab.label}</span>
                </>
              )}
            </button>
          );
        })}
      </nav>}

      {isStudent && activeTab === "mission" && (
        <div id="panel-mission" role="tabpanel" aria-labelledby="tab-mission">
          <SteamMission sites={analysis.sites} onOpenScience={() => onChangeReadingMode?.("mission")} onOpenWorlds={() => setActiveTab("learn")} />
        </div>
      )}

      {!isStudent && activeTab === "start" && (
        <section id="panel-start" aria-labelledby="scientific-home-title" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {([
            { page: "compare", art: "/img/terrain-art/ckepi-map-atacama.webp" },
            { page: "results", art: "/img/planets/ckepi-planet-science.webp" },
            { page: "analysis", art: "/img/science-accessories/ckepi-icon-slope.webp" },
            { page: "evidence", art: "/img/science-accessories/ckepi-icon-soil.webp" },
          ] as const).map(({ page, art }) => (
            <motion.button key={page} id={`portal-${page}`} type="button" onClick={() => navigatePage(page)} whileHover={reducedMotion ? undefined : { y: -4 }} whileTap={reducedMotion ? undefined : { scale: 0.98 }} className="scientific-portal relative flex min-h-36 min-w-0 flex-col items-center justify-center gap-3 rounded-2xl p-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
              <img src={art} alt="" width={240} height={150} className="h-28 w-full object-contain" />
              <span className="text-base font-bold sm:text-lg">{t(`sciencePages.${page}`)}</span>
            </motion.button>
          ))}
        </section>
      )}

      {!isStudent && activeTab === "compare" && (
        <DestinationPicker
          sites={analysis.sites}
          selectedSiteId={params.selectedSiteId}
          customProbedSite={params.customProbedSite}
          activeSite={activeSite}
          onSelect={(siteId, body) => {
            setHasConfigured(true);
            params.setCustomProbedSite(null);
            params.setSelectedSiteId(siteId);
            params.setSelectedBody(body);
          }}
        />
      )}

      {!isStudent && activeTab !== "start" && activeTab !== "compare" && (
        <DestinationPicker
          compact
          title={t(`sciencePages.${activeTab}`)}
          subtitle={t(`sciencePages.description.${activeTab}`)}
          sites={analysis.sites}
          selectedSiteId={params.selectedSiteId}
          customProbedSite={params.customProbedSite}
          activeSite={activeSite}
          onSelect={(siteId, body) => {
            setHasConfigured(true);
            params.setCustomProbedSite(null);
            params.setSelectedSiteId(siteId);
            params.setSelectedBody(body);
          }}
        />
      )}

      {analysis.errorState && (analysis.catalogErrorState || !isStudent || activeTab === "compare") && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-break/40 bg-status-break/10 p-4 text-sm text-status-break"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t(analysis.errorState.key, analysis.errorState.params)}</span>
          </div>
          <Button variant="secondary" onClick={() => void analysis.runAnalysis()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("controls.retry")}
          </Button>
        </div>
      )}

      <Suspense fallback={<PanelSkeleton heightClass="h-64" />}>
        {isStudent && activeTab === "learn" && (
          <div id="panel-learn" role="tabpanel" aria-labelledby="tab-learn">
            <WorldLab sites={analysis.sites} onStartMission={() => setActiveTab("mission")} />
          </div>
        )}

        {activeTab === "evidence" && (
          <div id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence" className="space-y-6">
            <EvidencePanel activeSite={activeSite} comparison={analysis.comparison} />
          </div>
        )}
      </Suspense>

      <div
        id={["compare", "results", "analysis"].includes(workspacePage) ? `panel-${workspacePage}` : "workspace-retained"}
        role="tabpanel"
        aria-labelledby={`tab-${workspacePage}`}
        hidden={isStudent ? activeTab !== "compare" : !["compare", "results", "analysis"].includes(activeTab)}
        className="space-y-5"
      >
      {showAnalysisPage && params.selectedSiteId === "mars_jezero_crater" && <VerifiedTerrainDemo />}
      {showResultsPage && (!analysis.searchResult || analysis.searchResult.matches.length === 0) && <EmptyState icon={<SearchX className="h-6 w-6" aria-hidden="true" />} title={t(analysis.isLoading ? "controls.loading" : "controls.emptyTitle")} description={t(analysis.isLoading ? "controls.mapLoadingDescription" : "controls.emptyDescription")} actionLabel={t("sciencePages.compare")} onAction={() => navigatePage("compare")} />}

      <div className="space-y-6">
        {/* Render a single ControlPanel instance to avoid duplicate IDs and draft divergence */}
        {showMapPage && (isDesktop ? (
          <section aria-label={t("controls.drawerTitle")}>
            <Card variant="liquid" className="!rounded-[2rem]">
              <CardHeader className="rounded-t-[2rem] border-b-0 bg-transparent px-5 pt-6 text-center sm:px-8 sm:pt-8">
                <CardTitle className="!text-3xl sm:!text-4xl">{t("explore.mission.title")}</CardTitle>
                <p className="mx-auto mt-2 max-w-2xl text-base text-content-muted sm:text-lg">{t("explore.mission.subtitle")}</p>
              </CardHeader>
              <CardContent className="sm:px-8 sm:pb-8">{controlPanelNode}</CardContent>
            </Card>
          </section>
        ) : (
          <Drawer
            open={mobileDrawerOpen}
            title={t("controls.drawerTitle")}
            closeLabel={t("controls.closeSettings")}
            onClose={() => setMobileDrawerOpen(false)}
          >
            {controlPanelNode}
          </Drawer>
        ))}

        {/* Main Workspace */}
        <div className="min-w-0 space-y-6">
          {showMapPage && <><ActionBar
            isRefreshing={analysis.isRefreshing}
            isUpdating={isUpdating}
            copiedLink={copiedLink}
            onRefreshApis={() => void handleRefresh()}
            onShareLink={() => void handleShareLink()}
            onOpenMobileSettings={() => setMobileDrawerOpen(true)}
          />

          {/* Maps Section */}
          <section id="section-maps" className="scroll-mt-32 space-y-3">
            {isUpdating && (
              <div
                aria-hidden="true"
                className="h-1 w-full overflow-hidden rounded-full bg-surface-muted"
              >
                <div className="h-full w-1/3 animate-pulse motion-reduce:animate-none rounded-full bg-accent" />
              </div>
            )}

            {isInitialLoading ? (
              <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-2">
                <MapSkeleton />
                <MapSkeleton />
              </div>
            ) : (
              <MapCarousel
                wide={isDesktop}
                ariaLabel={t("controls.mapSwitcherLabel")}
                active={mobileMapTab}
                onChange={setMobileMapTab}
                slides={[
                  {
                    id: "planet",
                    label: t("controls.mapViewPlanet"),
                    art: `/img/planets/ckepi-planet-${params.selectedBody}.webp`,
                    node: (
                <div className="h-full min-w-0">
                  <Suspense fallback={<MapSkeleton />}>
                    <PlanetaryMap
                      body={params.selectedBody}
                      sites={analysis.sites}
                      theme={theme}
                      activeTarget={
                        activeSite
                          ? {
                              lat: activeSite.coordinates.lat,
                              lon: activeSite.coordinates.lon,
                              label: t(activeSite.name_key),
                            }
                          : null
                      }
                      probingPlanetCoords={analysis.probingPlanetCoords}
                      onSelectBody={analysis.handleSelectBody}
                      onSelectSite={(siteId) => {
                        setHasConfigured(true);
                        params.setCustomProbedSite(null);
                        params.setSelectedSiteId(siteId);
                      }}
                      onProbePlanet={(body, lat, lon) => {
                        setHasExploredMap(true);
                        void analysis.handleProbePlanet(body, lat, lon);
                      }}
                    />
                  </Suspense>
                </div>
                    ),
                  },
                  {
                    id: "earth",
                    label: t("controls.mapViewEarth"),
                    art: "/img/planets/ckepi-planet-earth.webp",
                    node: (analysis.searchResult ? (
                  <div className="h-full min-w-0">
                    <Suspense fallback={<MapSkeleton />}>
                      <AnalogMap
                        compact
                        onOpenAnalysis={() => navigatePage("analysis")}
                        matches={analysis.searchResult.matches}
                        totalEvaluated={analysis.searchResult.total_evaluated}
                        selectedH3={analysis.selectedH3}
                        selectedMatchOverride={analysis.comparison?.match ?? null}
                        theme={theme}
                        readingMode={readingMode}
                        probingCoords={analysis.probingCoords}
                        isRefining={analysis.isRefining}
                        earthDensity={analysis.earthDensity}
                        onChangeEarthDensity={analysis.setEarthDensity}
                        drilldownState={analysis.drilldownState}
                        onSelectCell={(h3Index) => {
                          setHasExploredMap(true);
                          analysis.setSelectedH3(h3Index);
                        }}
                        onProbeCoordinate={(lat, lon) => {
                          setHasExploredMap(true);
                          void analysis.handleProbeCoordinate(lat, lon);
                        }}
                        onRefineCell={(h3Index) => {
                          setHasExploredMap(true);
                          void analysis.handleRefineCell(h3Index);
                        }}
                        onExitDrilldown={() => analysis.setDrilldownState(null)}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <div className="h-full min-w-0">
                    {analysis.isLoading ? (
                      <MapSkeleton />
                    ) : (
                      <EmptyState
                        icon={<AlertCircle className="h-6 w-6 text-status-break" aria-hidden="true" />}
                        title={
                          analysis.errorState
                            ? t(analysis.errorState.key, analysis.errorState.params)
                            : t("controls.loading")
                        }
                        description={t(analysis.errorState ? "controls.analysisErrorDescription" : "controls.mapLoadingDescription")}
                        actionLabel={t("controls.retry")}
                        onAction={() => void analysis.runAnalysis()}
                      />
                    )}
                  </div>
                )),
                  },
                ]}
              />
            )}
          </section>

          {!isStudent && (
            <div className="flex flex-wrap items-center justify-center gap-5 pt-2 sm:gap-8">
              <ActionPin label={t("sciencePages.results")} onClick={() => navigatePage("results")} />
              <ActionPin primary label={t("sciencePages.analysis")} onClick={() => navigatePage("analysis")} />
            </div>
          )}

          {!analysis.errorState && !analysis.isLoading && analysis.searchResult && analysis.searchResult.matches.length === 0 && (
            <EmptyState
              icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
              title={t("controls.emptyTitle")}
              description={t("controls.emptyDescription")}
              actionLabel={t("controls.emptyAction")}
              onAction={params.clearGlobalThresholds}
            />
          )}

          {isInitialLoading && (
            <div className="space-y-6">
              <PanelSkeleton heightClass="h-48" />
              <PanelSkeleton heightClass="h-64" />
            </div>
          )}

          </>}

          {isStudent && analysis.comparison && (
            <section
              id="section-student-comparison"
              className={`scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <StudentComparisonPanel
                comparison={analysis.comparison}
                matches={analysis.searchResult?.matches ?? []}
                activeSite={activeSite}
                aiEnabled={aiEnabled}
                aiAnalysis={aiAnalysis}
                onAiAnalysisChange={setAiAnalysis}
                onSelectCell={(h3Index) => {
                  setHasExploredMap(true);
                  analysis.setSelectedH3(h3Index);
                }}
                onOpenLearn={() => setActiveTab("learn")}
                onSwitchToScientific={() => onChangeReadingMode?.("mission")}
              />
            </section>
          )}

          {isStudent && (
            <ContextualCuriosityStrip
              body={params.selectedBody}
              activeSite={activeSite}
              comparison={analysis.comparison}
              onOpenLearn={() => setActiveTab("learn")}
            />
          )}

          {showResultsPage && analysis.searchResult && analysis.searchResult.matches.length > 0 && (
            <section
              id="section-discovery"
              className={`scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <UnexpectedDiscoverySpotlight
                matches={analysis.searchResult.matches}
                totalEvaluated={analysis.searchResult.total_evaluated}
                selectedH3={analysis.selectedH3}
                excludeBenchmarks={params.excludeBenchmarks}
                site={activeSite}
                onSelectCell={(h3Index) => {
                  setHasExploredMap(true);
                  analysis.setSelectedH3(h3Index);
                }}
                onToggleExcludeBenchmarks={(next) => {
                  setHasConfigured(true);
                  params.setExcludeBenchmarks(next);
                }}
              />
            </section>
          )}

          {showAnalysisPage && activeSite && <DataConfidenceBanner site={activeSite} />}

          {showAnalysisPage && analysis.decomposition && (
            <section
              id="section-decomposition"
              className={`scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <details className="ckepi-liquid group rounded-[2rem] p-5 sm:p-6"><summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 text-lg font-bold sm:text-xl [&::-webkit-details-marker]:hidden"><img src="/img/planets/ckepi-planet-science.webp" alt="" width={56} height={56} className="h-12 w-12 object-contain drop-shadow-ckepi-logo" /><span className="flex-1">{t("sciencePages.groups.model")}</span><Pictogram name="chevronDown" className="h-6 w-6 text-content-muted transition-transform group-open:rotate-180" /></summary><Suspense fallback={<PanelSkeleton heightClass="h-48" />}>
                <DecompositionPanel decomposition={analysis.decomposition} />
              </Suspense></details>
            </section>
          )}

          {showAnalysisPage && analysis.comparison && (
            <section
              id="section-diagnostics"
              className={`scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Suspense fallback={<PanelSkeleton heightClass="h-64" />}>
                <MissionDiagnostics
                  comparison={analysis.comparison}
                  readingMode={readingMode}
                  modelType={params.modelType}
                  distanceMetric={params.distanceMetric}
                  testProfile={params.testProfile}
                  penalizeEstimated={params.penalizeEstimated}
                  customIvWeights={params.customIvWeights}
                  customDvWeights={params.customDvWeights}
                  customMinSimilarity={params.customMinSimilarity}
                  aiEnabled={aiEnabled}
                  aiAnalysis={aiAnalysis}
                  onAiAnalysisChange={setAiAnalysis}
                  onExported={handleExported}
                />
              </Suspense>
            </section>
          )}

          {showResultsPage && analysis.searchResult && analysis.searchResult.matches.length > 0 && (
            <section
              id="section-ranking"
              className={`scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Suspense fallback={<PanelSkeleton heightClass="h-72" />}>
                <AnalogComparisonMatrix
                  matches={analysis.searchResult.matches}
                  selectedH3={analysis.selectedH3}
                  selectedMatchOverride={analysis.comparison?.match ?? null}
                  activeSite={activeSite}
                  aiAnalysis={aiAnalysis}
                  onSelectCell={(h3Index) => {
                    setHasExploredMap(true);
                    analysis.setSelectedH3(h3Index);
                  }}
                  onExported={handleExported}
                />
              </Suspense>
            </section>
          )}
        </div>
      </div>
      </div>

      {toastState && (
        <Toast
          message={toastState.message}
          variant={toastState.variant}
          dismissLabel={t("controls.dismissToast")}
          onDismiss={() => setToastState(null)}
        />
      )}
    </main>
  );
}
