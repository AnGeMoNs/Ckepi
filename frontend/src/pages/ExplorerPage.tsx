import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertCircle,
  BookOpen,
  ClipboardCheck,
  FlaskConical,
  GitCompareArrows,
  Globe,
  GraduationCap,
  MapPin,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { fetchAiStatus } from "../api/client";
import { GuidedStepsBanner } from "../components/layout/GuidedStepsBanner";
import { ContextualCuriosityStrip } from "../components/learning/ContextualCuriosityStrip";
import { SectionNav } from "../components/layout/SectionNav";
import { ActionBar } from "../components/mission/ActionBar";
import { ControlPanel } from "../components/mission/ControlPanel";
import { DataConfidenceBanner } from "../components/mission/DataConfidenceBanner";
import { LaAraucanaImpactPanel } from "../components/mission/LaAraucanaImpactPanel";
import { UnexpectedDiscoverySpotlight } from "../components/mission/UnexpectedDiscoverySpotlight";
import { StudentComparisonPanel } from "../components/student/StudentComparisonPanel";
import { StudentControlPanel } from "../components/student/StudentControlPanel";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { MapSkeleton, PanelSkeleton } from "../components/ui/Skeleton";
import { Toast, type ToastVariant } from "../components/ui/Toast";
import { useAnalogAnalysis } from "../hooks/useAnalogAnalysis";
import { useExplorerParams } from "../hooks/useExplorerParams";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { MissionAiAnalysisResponse, ReadingMode, ThemeMode } from "../types/analog";
import { readExplorerParams, type ExplorerTab } from "../utils/explorerParams";
import { createFieldTrialDraft } from "../utils/fieldTrialDraft";

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
const PlanetaryPhysicsLab = lazy(() =>
  import("../components/learning/PlanetaryPhysicsLab").then((m) => ({
    default: m.PlanetaryPhysicsLab,
  }))
);
const EducationPhysicsLab = lazy(() =>
  import("../components/education/PlanetaryPhysicsLab").then((m) => ({
    default: m.PlanetaryPhysicsLab,
  }))
);
const FieldTrialPlanner = lazy(() =>
  import("../components/planning/FieldTrialPlanner").then((m) => ({
    default: m.FieldTrialPlanner,
  }))
);

interface ExplorerPageProps {
  theme: ThemeMode;
  readingMode: ReadingMode;
  onChangeReadingMode?: (mode: ReadingMode) => void;
}

type MobileMapTab = "planet" | "earth";
type LearnSubView = "site_lab" | "atm_lab" | "three_worlds";

export function ExplorerPage({
  theme,
  readingMode,
  onChangeReadingMode,
}: ExplorerPageProps) {
  const { t } = useTranslation();
  const isStudent = readingMode === "explorer";
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
  const [hasConfigured, setHasConfigured] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const sp = new URLSearchParams(window.location.search);
    return sp.has("site") || sp.has("profile");
  });
  const [hasExploredMap, setHasExploredMap] = useState(false);
  const [hasExportedOrShared, setHasExportedOrShared] = useState(false);
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
    if (!isStudent && (initialTab === "learn" || initialTab === "plan")) return "compare";
    return initialTab;
  });
  const [learnView, setLearnView] = useState<LearnSubView>("site_lab");
  const [planDraft, setPlanDraft] = useState(createFieldTrialDraft);

  useEffect(() => {
    if (isStudent && activeTab === "evidence") {
      setActiveTab("compare");
    } else if (!isStudent && (activeTab === "learn" || activeTab === "plan")) {
      setActiveTab("compare");
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
    if (activeTab === "compare") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", activeTab);
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeTab]);

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

  const selectedCell =
    analysis.searchResult?.matches.find((m) => m.earth_cell_h3 === analysis.selectedH3) ??
    analysis.comparison?.match ??
    null;

  const navTabs: { id: ExplorerTab; label: string; icon: typeof GitCompareArrows }[] = isStudent
    ? [
        { id: "compare", label: t("nav.studentCompare"), icon: GitCompareArrows },
        { id: "learn", label: t("nav.learn"), icon: FlaskConical },
        { id: "plan", label: t("nav.plan"), icon: ClipboardCheck },
      ]
    : [
        { id: "compare", label: t("nav.compare"), icon: GitCompareArrows },
        { id: "evidence", label: t("nav.evidence"), icon: BookOpen },
      ];

  const handleTabKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const idx = navTabs.findIndex((tab) => tab.id === activeTab);
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
  const activeStep: 1 | 2 | 3 | 4 = hasExportedOrShared
    ? 4
    : hasExploredMap
      ? 3
      : hasConfigured
        ? 2
        : 1;

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
      sites={analysis.sites}
      selectedSiteId={params.selectedSiteId}
      customProbedSite={params.customProbedSite}
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
    <main id="main-content" className="mx-auto max-w-screen-2xl space-y-5 px-3 py-5 sm:px-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {analysis.isLoading ? t("controls.loading") : ""}
      </div>

      {/* Explicit Mode Context Banner & 1-Click Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-elevated px-3.5 py-2.5 shadow-sm sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {isStudent ? (
            <GraduationCap className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          ) : (
            <FlaskConical className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-content sm:text-sm">
                {isStudent ? t("modeBanner.studentTitle") : t("modeBanner.scienceTitle")}
              </span>
              <Badge variant={isStudent ? "valid" : "accent"}>
                {t(`app.modes.${readingMode}`)}
              </Badge>
            </div>
            <p className="text-xs text-content-muted">
              {isStudent ? t("modeBanner.studentDesc") : t("modeBanner.scienceDesc")}
            </p>
          </div>
        </div>
        {onChangeReadingMode && (
          <Button
            variant="secondary"
            onClick={() => onChangeReadingMode(isStudent ? "mission" : "explorer")}
          >
            {isStudent ? (
              <FlaskConical className="h-4 w-4 text-accent" aria-hidden="true" />
            ) : (
              <GraduationCap className="h-4 w-4 text-accent" aria-hidden="true" />
            )}
            <span>
              {isStudent ? t("modeBanner.switchToScience") : t("modeBanner.switchToStudent")}
            </span>
          </Button>
        )}
      </div>

      {/* Primary journey tabs (mode-aware) */}
      <nav
        aria-label={t("nav.tabsLabel")}
        role="tablist"
        className="flex flex-wrap gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-2 shadow-sm"
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

      {analysis.errorState && (
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
        {activeTab === "learn" && (
          <div id="panel-learn" role="tabpanel" aria-labelledby="tab-learn" className="space-y-4">
            <div
              role="tablist"
              aria-label={t("learn.hubLabel")}
              className="flex flex-wrap gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-2 shadow-sm"
            >
              {(
                [
                  { id: "site_lab", label: t("learn.subtabs.siteLab"), icon: FlaskConical },
                  { id: "atm_lab", label: t("learn.subtabs.atmLab"), icon: Globe },
                  { id: "three_worlds", label: t("learn.subtabs.threeWorlds"), icon: GraduationCap },
                ] as const
              ).map((sub) => {
                const SubIcon = sub.icon;
                const isActiveSub = learnView === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    role="tab"
                    aria-selected={isActiveSub}
                    onClick={() => setLearnView(sub.id)}
                    className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm ${
                      isActiveSub
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-content-muted hover:bg-surface-muted hover:text-content"
                    }`}
                  >
                    <SubIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{sub.label}</span>
                  </button>
                );
              })}
            </div>

            {learnView === "site_lab" && (
              <PlanetaryPhysicsLab
                body={params.selectedBody}
                activeSite={activeSite}
                selectedCell={selectedCell}
                comparison={analysis.comparison}
                onGoToCompare={() => setActiveTab("compare")}
                onGoToPlan={() => setActiveTab("plan")}
              />
            )}

            {learnView === "atm_lab" && (
              <EducationPhysicsLab
                activeBody={activeSite?.body}
                activeSite={activeSite}
                selectedMatch={analysis.comparison?.match}
                readingMode={readingMode}
              />
            )}

            {learnView === "three_worlds" && (
              <LaAraucanaImpactPanel
                variant="full"
                comparison={analysis.comparison}
                selectedH3={analysis.selectedH3}
                onSelectAntofagastaCell={(h3Index, siteId) => {
                  if (siteId && siteId !== params.selectedSiteId) {
                    params.setCustomProbedSite(null);
                    params.setSelectedSiteId(siteId);
                  }
                  analysis.setSelectedH3(h3Index);
                  setActiveTab("compare");
                }}
              />
            )}
          </div>
        )}

        {activeTab === "plan" && (
          <div id="panel-plan" role="tabpanel" aria-labelledby="tab-plan">
            <FieldTrialPlanner
              draft={planDraft}
              onDraftChange={setPlanDraft}
              activeSite={activeSite}
              selectedCell={selectedCell}
              comparison={analysis.comparison}
              onGoToCompare={() => setActiveTab("compare")}
              onGoToEvidence={() => {
                onChangeReadingMode?.("mission");
                setActiveTab("evidence");
              }}
            />
          </div>
        )}

        {activeTab === "evidence" && (
          <div id="panel-evidence" role="tabpanel" aria-labelledby="tab-evidence" className="space-y-6">
            <EvidencePanel activeSite={activeSite} comparison={analysis.comparison} />
          </div>
        )}
      </Suspense>

      <div
        id="panel-compare"
        role="tabpanel"
        aria-labelledby="tab-compare"
        hidden={activeTab !== "compare"}
        className="space-y-5"
      >
      {isStudent && <GuidedStepsBanner activeStep={activeStep} />}

      <div className="space-y-6">
        {/* Render a single ControlPanel instance to avoid duplicate IDs and draft divergence */}
        {isDesktop ? (
          <section aria-label={t("controls.drawerTitle")}>
            <Card>
              <CardHeader>
                <CardTitle>{t("controls.drawerTitle")}</CardTitle>
              </CardHeader>
              <CardContent>{controlPanelNode}</CardContent>
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
        )}

        {/* Main Workspace */}
        <div className="min-w-0 space-y-6">
          <ActionBar
            activeSite={activeSite}
            lastUpdated={analysis.lastUpdated}
            isRefreshing={analysis.isRefreshing}
            isUpdating={isUpdating}
            copiedLink={copiedLink}
            onRefreshApis={() => void handleRefresh()}
            onShareLink={() => void handleShareLink()}
            onOpenMobileSettings={() => setMobileDrawerOpen(true)}
          />

          <SectionNav
            visibleSections={
              isStudent
                ? {
                    "section-maps": true,
                    "section-student-comparison": Boolean(analysis.comparison),
                  }
                : {
                    "section-maps": true,
                    "section-discovery": Boolean(
                      analysis.searchResult && analysis.searchResult.matches.length > 0
                    ),
                    "section-decomposition": Boolean(analysis.decomposition),
                    "section-diagnostics": Boolean(analysis.comparison),
                    "section-ranking": Boolean(
                      analysis.searchResult && analysis.searchResult.matches.length > 0
                    ),
                  }
            }
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

            <div className="lg:hidden">
              <SegmentedControl
                ariaLabel={t("controls.mapSwitcherLabel")}
                value={mobileMapTab}
                onChange={setMobileMapTab}
                fullWidth
                options={[
                  {
                    value: "earth",
                    label: t("controls.mapViewEarth"),
                    icon: <MapPin className="h-3.5 w-3.5" aria-hidden="true" />,
                  },
                  {
                    value: "planet",
                    label: t("controls.mapViewPlanet"),
                    icon: <Globe className="h-3.5 w-3.5" aria-hidden="true" />,
                  },
                ]}
              />
            </div>

            {isInitialLoading ? (
              <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                <MapSkeleton />
                <MapSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                <div className={mobileMapTab === "planet" ? "block" : "hidden lg:block"}>
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

                {analysis.searchResult ? (
                  <div className={mobileMapTab === "earth" ? "block" : "hidden lg:block"}>
                    <Suspense fallback={<MapSkeleton />}>
                      <AnalogMap
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
                  <div className={mobileMapTab === "earth" ? "block" : "hidden lg:block"}>
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
                        description={t("controls.emptyDescription")}
                        actionLabel={t("controls.retry")}
                        onAction={() => void analysis.runAnalysis()}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          {analysis.searchResult && analysis.searchResult.matches.length === 0 && (
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
                onOpenLearn={() => {
                  setLearnView("site_lab");
                  setActiveTab("learn");
                }}
                onSwitchToScientific={() => onChangeReadingMode?.("mission")}
              />
            </section>
          )}

          {isStudent && (
            <ContextualCuriosityStrip
              body={params.selectedBody}
              activeSite={activeSite}
              comparison={analysis.comparison}
              onOpenLearn={() => {
                setLearnView("site_lab");
                setActiveTab("learn");
              }}
            />
          )}

          {!isStudent && analysis.searchResult && analysis.searchResult.matches.length > 0 && (
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

          {!isStudent && activeSite && <DataConfidenceBanner site={activeSite} />}

          {!isStudent && analysis.decomposition && (
            <section
              id="section-decomposition"
              className={`scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Suspense fallback={<PanelSkeleton heightClass="h-48" />}>
                <DecompositionPanel decomposition={analysis.decomposition} />
              </Suspense>
            </section>
          )}

          {!isStudent && analysis.comparison && (
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

          {!isStudent && analysis.searchResult && analysis.searchResult.matches.length > 0 && (
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
