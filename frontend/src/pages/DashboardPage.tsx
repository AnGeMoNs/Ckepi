import { lazy, Suspense, useEffect, useState } from "react";
import { BookOpen, ChevronRight, Download, FlaskConical, ShieldCheck, Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { getLocalSites } from "../api/localData";
import { useNumberFormat } from "../components/expedition/format";
import { AnalogCard } from "../components/science/AnalogCard";
import { downloadCsv, downloadGeoJson } from "../components/science/exportMeasured";
import { MeasuredFootprintMap } from "../components/science/MeasuredFootprintMap";
import { WorldTerrainStrip } from "../components/science/WorldTerrainStrip";
import { EnvironmentalContext } from "../components/science/EnvironmentalContext";
import { MeasuredRanking } from "../components/science/MeasuredRanking";
import { useMeasuredCells } from "../components/science/measuredCells";
import { CardboardButton } from "../components/ui/CardboardButton";
import { CopernicusNotice } from "../components/ui/CopernicusNotice";
import { ParamIcon } from "../components/ui/ParamIcon";
import { STANDARD_G, WORLD_FACTS } from "../data/threeWorlds";
import type { PlanetarySite, ThemeMode } from "../types/analog";
import "./dashboard.css";

const MeasuredMap = lazy(() => import("../components/science/MeasuredMap").then((m) => ({ default: m.MeasuredMap })));
const Expedition = lazy(() => import("../components/expedition/Expedition").then((m) => ({ default: m.Expedition })));
type Section = "compare" | "learn" | "evidence";
type Target = "mars" | "moon";
type Metric = "slope" | "relief" | "gravity" | "atmosphere" | "radiation" | "temperature";
const METRICS: Metric[] = ["slope", "relief", "gravity", "atmosphere", "radiation", "temperature"];
const LANGS = ["es", "pt", "en"] as const;
const NAV = [{ id: "compare", art: "science" }, { id: "learn", art: "steam" }, { id: "evidence", art: "earth" }] as const;

interface DashboardPageProps { onOpenAdvanced: () => void; initialSection?: Section; theme: ThemeMode; onToggleTheme: () => void }

/** One workspace: measured comparison → explicit limits → learning → sourced export. */
export function DashboardPage({ onOpenAdvanced, initialSection = "compare", theme, onToggleTheme }: DashboardPageProps) {
  const { t, i18n } = useTranslation();
  const fmt = useNumberFormat();
  const [section, setSection] = useState<Section>(initialSection);
  const [visitedLearn, setVisitedLearn] = useState(initialSection === "learn");
  const [attempt, setAttempt] = useState(0);
  const state = useMeasuredCells(attempt);
  const [selected, setSelected] = useState("");
  const [target, setTarget] = useState<Target>("mars");
  const [showSatellite, setShowSatellite] = useState(false);
  const [metric, setMetric] = useState<Metric>("slope");
  const [sites, setSites] = useState<PlanetarySite[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const cells = state.status === "ready" ? state.cells : [];
  const index = Math.max(0, cells.findIndex((c) => c.h3 === selected));
  const cell = cells[index] ?? null;

  useEffect(() => {
    if (!visitedLearn) return;
    const controller = new AbortController();
    setCatalogError(false);
    getLocalSites(controller.signal).then((next) => {
      if (!controller.signal.aborted) setSites(next);
    }).catch(() => { if (!controller.signal.aborted) setCatalogError(true); });
    return () => controller.abort();
  }, [visitedLearn, attempt]);

  const open = (next: Section) => {
    setSection(next);
    if (next === "learn") setVisitedLearn(true);
  };
  const facts = WORLD_FACTS[target];
  const metricValue = (key: Metric): string => {
    if (key === "gravity") return `${fmt(facts.gravityMs2.value / STANDARD_G, 3)} g`;
    if (key === "atmosphere") return `${fmt(facts.pressureMbar.value / 10, 2)} kPa`;
    if (key === "radiation") return `≈ ${fmt(facts.radiationMsvYr.value, 0)} ${t("lab.units.msvYr")}`;
    if (target === "moon" || !cell) return t("dashboard.notMeasured");
    if (key === "slope") return `${fmt(cell.w1Deg)}°`;
    if (key === "relief") return `${fmt(cell.reliefW1M)} m`;
    return `${fmt(cell.comparison.site.variables.dependent.mean_surface_temp_k, 1)} K`;
  };

  return (
    <div className="ckepi-dashboard min-h-screen bg-surface text-content">
      <a href="#dashboard-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:p-3">{t("nav.skipToContent")}</a>
      <aside className="dashboard-rail">
        <img src="/img/ckepi/svg/ckepi-horizontal-vector-dark.svg" alt="CKEPI" width={180} height={56} className="w-36 rounded-xl bg-ckepi-space p-2" />
        <p className="mt-3 hidden text-xs font-semibold uppercase tracking-widest text-content-muted lg:block">{t("dashboard.railLabel")}</p>
        <nav className="dashboard-nav" aria-label={t("dashboard.navigation")}>
          {NAV.map(({ id, art }) => (
            <button key={id} type="button" aria-current={section === id ? "page" : undefined} onClick={() => open(id)} className={`dashboard-nav-item ${section === id ? "dashboard-nav-active" : ""}`}>
              <img src={`/img/planets/ckepi-planet-${art}.webp`} alt="" width={48} height={48} className="h-12 w-12 shrink-0 object-contain" /><span>{t(`dashboard.nav.${id}`)}</span>
            </button>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-4 border-t border-border-subtle pt-5 lg:block">
          <p className="text-sm font-semibold">{t("dashboard.challenge")}</p>
          <p className="text-xs leading-relaxed text-content-muted">{t("dashboard.challengeNote")}</p>
          <button type="button" onClick={onOpenAdvanced} className="min-h-11 text-left text-sm font-semibold text-accent underline underline-offset-4">{t("science.advanced")}</button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-60">
        <header className="dashboard-topbar">
          <p className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-ckepi-sulfur" aria-hidden="true" />{t("dashboard.snapshot")}</p>
          <div className="flex items-center gap-1"><button type="button" onClick={onToggleTheme} aria-label={t(theme === "dark" ? "app.themeLight" : "app.themeDark")} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-accent">{theme === "dark" ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}</button><div className="flex gap-1" role="group" aria-label={t("local.language")}>{LANGS.map((lang) => (
            <button key={lang} type="button" onClick={() => void i18n.changeLanguage(lang)} aria-pressed={i18n.language.startsWith(lang)} className={`min-h-11 min-w-11 rounded-xl text-xs font-bold uppercase ${i18n.language.startsWith(lang) ? "bg-accent text-accent-foreground" : "text-content-muted"}`}>{lang}</button>
          ))}</div></div>
        </header>

        <main id="dashboard-main" className="mx-auto max-w-[100rem] space-y-6 px-4 py-6 sm:px-7 lg:px-8">
          <section className="dashboard-intro grid gap-5 xl:grid-cols-[1fr_auto] xl:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-accent">{t("dashboard.kicker")}</p>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">{t("dashboard.title")}</h1>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-content-muted">{t("dashboard.lead")}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold sm:gap-3">
              {["question", "compare", "decide"].map((step, n) => <span key={step} className="inline-flex items-center gap-2"><span className="rounded-lg border border-border-subtle bg-surface-elevated px-3 py-2">{t(`dashboard.workflow.${step}`)}</span>{n < 2 && <ChevronRight className="h-4 w-4 text-accent" aria-hidden="true" />}</span>)}
            </div>
          </section>

          {section !== "learn" && (
            <>
              <WorldTerrainStrip target={target} onTargetChange={setTarget} />
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label={t("dashboard.metrics")}>
                {METRICS.map((key) => <button type="button" key={key} aria-pressed={metric === key} onClick={() => setMetric(key)} className={`dashboard-metric ${metric === key ? "dashboard-metric-active" : ""}`}><ParamIcon name={key} className="h-16 w-16" /><span className="block text-xs text-content-muted">{t(`dashboard.metric.${key}`)}</span><strong className="block break-words font-mono text-base tabular-nums">{metricValue(key)}</strong></button>)}
              </div>
              <p className="text-sm text-content-muted" role="status">{t(`dashboard.metricHelp.${metric}`)}</p>
              <p className="text-xs text-content-muted">{t(target === "moon" ? "dashboard.moonSource" : "dashboard.factSource")}</p>

              {target === "moon" ? (
                <section className="dashboard-panel grid gap-6 p-6 md:grid-cols-[1fr_2fr] md:items-center">
                  <img src="/img/terrain-art/ckepi-map-moon.webp" alt="" width={768} height={512} className="w-full rounded-2xl" />
                  <div><p className="text-xs font-bold uppercase tracking-widest text-accent">{t("dashboard.referenceOnly")}</p><h2 className="mt-2 text-2xl font-bold">{t("science.moon.title")}</h2><p className="mt-3 text-content-muted">{t("science.moon.lead")}</p><p className="mt-3 text-sm">{t("science.moon.next")}</p><CardboardButton onClick={() => open("learn")} className="mt-4">{t("dashboard.nav.learn")}</CardboardButton></div>
                </section>
              ) : state.status === "loading" ? <p className="dashboard-panel p-6" role="status">{t("science.loading")}</p>
                : state.status === "error" ? <div className="dashboard-panel flex flex-wrap items-center gap-4 p-6" role="alert"><p>{t("science.error")}</p><CardboardButton onClick={() => setAttempt((n) => n + 1)}>{t("expedition.retry")}</CardboardButton></div>
                  : cell && (
                    <>
                      {section === "compare" ? (
                        <>
                          <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                            <section className="dashboard-panel min-w-0 overflow-hidden">
                              <header className="flex flex-wrap items-center justify-between gap-2 p-5"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">{t("dashboard.mapKicker")}</p><h2 className="mt-1 text-xl font-bold">{t("dashboard.mapTitle")}</h2></div><span className="rounded-full border border-border-subtle px-3 py-1 text-xs">{t("dashboard.windowCount", { count: cells.length, m: cell.resolutionM })}</span></header>
                              <div className="px-5 pb-3"><button type="button" aria-pressed={showSatellite} onClick={() => setShowSatellite((shown) => !shown)} className="min-h-11 rounded-xl border border-border-subtle px-3 text-sm font-semibold">{t(showSatellite ? "dashboard.schematic" : "dashboard.satellite")}</button></div>
                              {showSatellite ? <Suspense fallback={<p className="p-6" role="status">{t("science.loading")}</p>}><MeasuredMap cells={cells} selected={cell.h3} onSelect={setSelected} format={fmt} /></Suspense> : <MeasuredFootprintMap cells={cells} selected={cell.h3} onSelect={setSelected} format={fmt} />}
                              <div className="space-y-3 p-5"><p className="text-xs text-content-muted">{t(showSatellite ? "science.map.legend" : "dashboard.schematicLegend")}</p><div className="grid grid-cols-2 gap-2">{cells.map((item, n) => <button key={item.h3} type="button" aria-pressed={item.h3 === cell.h3} onClick={() => setSelected(item.h3)} className={`min-h-14 rounded-xl border px-3 py-2 text-left ${item.h3 === cell.h3 ? "border-accent bg-accent/10" : "border-border-subtle"}`}><span className="block text-xs text-content-muted">{t("dashboard.window", { n: n + 1 })} · {item.h3.slice(-5) === "fffff" ? item.h3.slice(0, 6) : item.h3}</span><strong className="font-mono text-lg">{fmt(item.w1Deg)}°</strong></button>)}</div></div>
                            </section>
                            <div className="min-w-0"><AnalogCard cell={cell} rank={index + 1} format={fmt} /></div>
                          </div>
                          <EnvironmentalContext cell={cell} format={fmt} />
                          <section className="dashboard-decision grid gap-5 p-6 lg:grid-cols-[1fr_1.5fr]">
                            <div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"><ShieldCheck className="h-4 w-4" aria-hidden="true" />{t("dashboard.decisionKicker")}</p><h2 className="mt-2 text-2xl font-bold">{t(index === 0 ? "dashboard.candidate" : "dashboard.counterexample")}</h2><p className="mt-2 text-sm">{t("dashboard.decisionLimit")}</p></div>
                            <div className="grid gap-4 sm:grid-cols-2"><div><h3 className="font-bold">{t("dashboard.canDo")}</h3><p className="mt-2 text-sm">{t("dashboard.canDoText")}</p></div><div><h3 className="font-bold">{t("dashboard.cannotDo")}</h3><p className="mt-2 text-sm">{t("dashboard.cannotDoText")}</p></div></div>
                          </section>
                        </>
                      ) : <section className="dashboard-panel space-y-6 p-5 sm:p-7"><MeasuredRanking cells={cells} selected={cell.h3} onSelect={setSelected} format={fmt} /><div className="flex flex-wrap gap-3"><CardboardButton onClick={() => downloadCsv(cells)}><Download className="h-4 w-4" aria-hidden="true" />{t("science.download.csv")}</CardboardButton><CardboardButton onClick={() => downloadGeoJson(cells)}>{t("science.download.geojson")}</CardboardButton></div><p className="text-sm text-content-muted">{t("science.download.note")}</p><p className="break-words text-xs" lang="en">{cell.marsDem}<br />{cell.earthDem}</p><CopernicusNotice /></section>}
                    </>
                  )}
            </>
          )}

          {visitedLearn && <section hidden={section !== "learn"} aria-label={t("dashboard.nav.learn")}>
            <div className="dashboard-panel p-4 sm:p-6"><p className="mb-5 flex items-center gap-2 text-sm text-accent"><BookOpen className="h-5 w-5" aria-hidden="true" />{t("dashboard.learnBridge")}</p>
              {catalogError && <div className="mb-4 flex flex-wrap gap-3" role="alert"><p>{t("dashboard.catalogError")}</p><CardboardButton onClick={() => setAttempt((n) => n + 1)}>{t("expedition.retry")}</CardboardButton></div>}
              <Suspense fallback={<p role="status">{t("science.loading")}</p>}><Expedition sites={sites} onOpenScience={() => open("compare")} /></Suspense>
            </div>
          </section>}

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle py-4 text-xs text-content-muted">
            <p>{t("dashboard.innovation")}</p><button type="button" onClick={onOpenAdvanced} className="inline-flex min-h-11 items-center gap-2 text-accent"><FlaskConical className="h-4 w-4" aria-hidden="true" />{t("science.advanced")}</button>
            <p className="w-full">{t("dashboard.ai")}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
