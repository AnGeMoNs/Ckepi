import { lazy, Suspense, useDeferredValue, useState } from "react";
import { AlertCircle, Globe, MapPin, RefreshCw, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { GuidedStepsBanner } from "../components/layout/GuidedStepsBanner";
import { SectionNav } from "../components/layout/SectionNav";
import { ActionBar } from "../components/mission/ActionBar";
import { ControlPanel } from "../components/mission/ControlPanel";
import { DataConfidenceBanner } from "../components/mission/DataConfidenceBanner";
import { Button } from "../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { MapSkeleton, PanelSkeleton } from "../components/ui/Skeleton";
import { Toast } from "../components/ui/Toast";
import { useAnalogAnalysis } from "../hooks/useAnalogAnalysis";
import { useExplorerParams } from "../hooks/useExplorerParams";
import type { ReadingMode, ThemeMode } from "../types/analog";

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

interface ExplorerPageProps {
  theme: ThemeMode;
  readingMode: ReadingMode;
}

type MobileMapTab = "planet" | "earth";

export function ExplorerPage({ theme, readingMode }: ExplorerPageProps) {
  const { t } = useTranslation();
  const params = useExplorerParams();

  const deferredMinSInd = useDeferredValue(params.minSInd);
  const deferredMinSDep = useDeferredValue(params.minSDep);

  const analysis = useAnalogAnalysis({
    selectedSiteId: params.selectedSiteId,
    setSelectedSiteId: params.setSelectedSiteId,
    setSelectedBody: params.setSelectedBody,
    customProbedSite: params.customProbedSite,
    setCustomProbedSite: params.setCustomProbedSite,
    modelType: params.modelType,
    testProfile: params.testProfile,
    minSInd: deferredMinSInd,
    minSDep: deferredMinSDep,
    excludeBenchmarks: params.excludeBenchmarks,
    penalizeEstimated: params.penalizeEstimated,
    customIvWeights: params.customIvWeights,
    customDvWeights: params.customDvWeights,
    customMinSimilarity: params.customMinSimilarity,
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileMapTab, setMobileMapTab] = useState<MobileMapTab>("earth");
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const activeSite =
    params.customProbedSite && params.customProbedSite.site_id === params.selectedSiteId
      ? params.customProbedSite
      : analysis.sites.find((s) => s.site_id === params.selectedSiteId);

  const hasResults = Boolean(analysis.searchResult || analysis.decomposition);
  const isInitialLoading = analysis.isLoading && !hasResults;
  const isUpdating = analysis.isLoading && hasResults;
  const activeStep: 1 | 2 | 3 = analysis.comparison ? 3 : analysis.searchResult ? 2 : 1;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleShareLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      showToast(t("controls.copiedLink"));
      window.setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRefresh = async () => {
    const ok = await analysis.handleRefreshApis();
    if (ok) {
      showToast(t("controls.refreshedToast"));
    }
  };

  const controlPanelNode = (
    <ControlPanel
      sites={analysis.sites}
      selectedSiteId={params.selectedSiteId}
      customProbedSite={params.customProbedSite}
      activeSite={activeSite}
      testProfile={params.testProfile}
      modelType={params.modelType}
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
        params.setCustomProbedSite(null);
        params.setSelectedSiteId(nextId);
        if (body) params.setSelectedBody(body);
      }}
      onChangeTestProfile={params.setTestProfile}
      onChangeModelType={params.setModelType}
      onChangeMinSInd={params.setMinSInd}
      onChangeMinSDep={params.setMinSDep}
      onChangeExcludeBenchmarks={params.setExcludeBenchmarks}
      onChangePenalizeEstimated={params.setPenalizeEstimated}
      onToggleAdvanced={() => params.setShowAdvanced((prev) => !prev)}
      onClonePresetToManual={params.clonePresetToManual}
      onClearGlobalThresholds={params.clearGlobalThresholds}
      onApplyManualVariables={params.applyManualVariables}
    />
  );

  return (
    <main className="mx-auto max-w-screen-2xl space-y-5 px-3 py-5 sm:px-6">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {analysis.isLoading ? t("controls.loading") : toastMessage ?? ""}
      </div>

      <GuidedStepsBanner activeStep={activeStep} />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Desktop Sticky Sidebar */}
        <aside className="hidden xl:sticky xl:top-20 xl:block xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle>{t("controls.drawerTitle")}</CardTitle>
            </CardHeader>
            <CardContent>{controlPanelNode}</CardContent>
          </Card>
        </aside>

        {/* Mobile / Tablet Drawer */}
        <Drawer
          open={mobileDrawerOpen}
          title={t("controls.drawerTitle")}
          closeLabel={t("controls.closeSettings")}
          onClose={() => setMobileDrawerOpen(false)}
        >
          {controlPanelNode}
        </Drawer>

        {/* Main Workspace */}
        <div className="min-w-0 space-y-6">
          <ActionBar
            activeSite={activeSite}
            lastUpdated={analysis.lastUpdated}
            isRefreshing={analysis.isRefreshing}
            isUpdating={isUpdating}
            copiedLink={copiedLink}
            onRefreshApis={() => void handleRefresh()}
            onShareLink={handleShareLink}
            onOpenMobileSettings={() => setMobileDrawerOpen(true)}
          />

          <SectionNav
            visibleSections={{
              "section-maps": true,
              "section-decomposition": Boolean(analysis.decomposition),
              "section-diagnostics": Boolean(analysis.comparison),
              "section-ranking": Boolean(
                analysis.searchResult && analysis.searchResult.matches.length > 0
              ),
            }}
          />

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

          {/* Maps Section */}
          <section
            id="section-maps"
            className={`scroll-mt-32 space-y-3 transition-opacity ${
              isUpdating ? "opacity-60" : "opacity-100"
            }`}
          >
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
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <MapSkeleton />
                <MapSkeleton />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                        params.setCustomProbedSite(null);
                        params.setSelectedSiteId(siteId);
                      }}
                      onProbePlanet={(body, lat, lon) =>
                        void analysis.handleProbePlanet(body, lat, lon)
                      }
                    />
                  </Suspense>
                </div>

                {analysis.searchResult && (
                  <div className={mobileMapTab === "earth" ? "block" : "hidden lg:block"}>
                    <Suspense fallback={<MapSkeleton />}>
                      <AnalogMap
                        matches={analysis.searchResult.matches}
                        totalEvaluated={analysis.searchResult.total_evaluated}
                        selectedH3={analysis.selectedH3}
                        theme={theme}
                        probingCoords={analysis.probingCoords}
                        isRefining={analysis.isRefining}
                        drilldownState={analysis.drilldownState}
                        onSelectCell={(h3Index) => analysis.setSelectedH3(h3Index)}
                        onProbeCoordinate={(lat, lon) =>
                          void analysis.handleProbeCoordinate(lat, lon)
                        }
                        onRefineCell={(h3Index) => void analysis.handleRefineCell(h3Index)}
                        onExitDrilldown={() => analysis.setDrilldownState(null)}
                      />
                    </Suspense>
                  </div>
                )}
              </div>
            )}
          </section>

          {activeSite && <DataConfidenceBanner site={activeSite} />}

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

          {analysis.decomposition && (
            <section
              id="section-decomposition"
              className={`cv-auto scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Suspense fallback={<PanelSkeleton heightClass="h-48" />}>
                <DecompositionPanel decomposition={analysis.decomposition} />
              </Suspense>
            </section>
          )}

          {analysis.comparison && (
            <section
              id="section-diagnostics"
              className={`cv-auto scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Suspense fallback={<PanelSkeleton heightClass="h-64" />}>
                <MissionDiagnostics
                  comparison={analysis.comparison}
                  readingMode={readingMode}
                />
              </Suspense>
            </section>
          )}

          {analysis.searchResult && analysis.searchResult.matches.length > 0 && (
            <section
              id="section-ranking"
              className={`cv-auto scroll-mt-32 transition-opacity ${
                isUpdating ? "opacity-60" : "opacity-100"
              }`}
            >
              <Suspense fallback={<PanelSkeleton heightClass="h-72" />}>
                <AnalogComparisonMatrix
                  matches={analysis.searchResult.matches}
                  selectedH3={analysis.selectedH3}
                  activeSite={activeSite}
                  onSelectCell={(h3Index) => analysis.setSelectedH3(h3Index)}
                />
              </Suspense>
            </section>
          )}
        </div>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          dismissLabel={t("controls.dismissToast")}
          onDismiss={() => setToastMessage(null)}
        />
      )}
    </main>
  );
}
