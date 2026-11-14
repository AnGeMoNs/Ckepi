import { useMemo, useState } from "react";
import {
  Activity,
  Clock,
  Compass,
  Cpu,
  Filter,
  Globe2,
  Navigation,
  Radio,
  Rocket,
  RotateCcw,
  Satellite,
  Sprout,
  Target,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent, formatTimestamp } from "../../i18n";
import type { AnalogMatchItem, PlanetaryBody, PlanetarySite } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { Slider } from "../ui/Slider";

interface TelemetryAndDeploymentPanelProps {
  activeSite?: PlanetarySite;
  sites: PlanetarySite[];
  matches: AnalogMatchItem[];
  selectedMatch?: AnalogMatchItem | null;
  lastUpdated: Date | null;
  onSelectSite: (siteId: string, body?: PlanetaryBody) => void;
  onSelectCell: (h3Index: string) => void;
  onProbePlanet?: (body: PlanetaryBody, lat: number, lon: number) => void;
}

type DeploymentSystem = "rover" | "lander" | "isru_drill" | "rotorcraft";
type ResearchGoal =
  | "rover_new_worlds"
  | "landing_viability"
  | "crop_agriculture"
  | "isru_water"
  | "astrobiology";

interface AgencyLandingSite {
  id: string;
  agency: "NASA" | "CNSA" | "ISRO" | "ESA" | "JAXA";
  country: string;
  body: PlanetaryBody;
  nameKey: string;
  builtInSiteId?: string;
  lat: number;
  lon: number;
  slopeDeg: number;
  roughness: number;
  thermalInertiaTiu: number;
  solarFluxWm2: number;
  iceFrac: number;
  meanTempK: number;
}

const INTERNATIONAL_LANDING_SITES: readonly AgencyLandingSite[] = [
  {
    id: "nasa_jezero",
    agency: "NASA",
    country: "USA",
    body: "mars",
    nameKey: "telemetryAndRover.agencies.sites.nasa_jezero",
    builtInSiteId: "mars_jezero_crater",
    lat: 18.38,
    lon: 77.58,
    slopeDeg: 6.4,
    roughness: 0.42,
    thermalInertiaTiu: 281,
    solarFluxWm2: 409,
    iceFrac: 0.03,
    meanTempK: 236,
  },
  {
    id: "nasa_gale",
    agency: "NASA",
    country: "USA",
    body: "mars",
    nameKey: "telemetryAndRover.agencies.sites.nasa_gale",
    builtInSiteId: "mars_gale_crater",
    lat: -5.4,
    lon: 137.8,
    slopeDeg: 9.8,
    roughness: 0.51,
    thermalInertiaTiu: 338,
    solarFluxWm2: 472,
    iceFrac: 0.02,
    meanTempK: 235,
  },
  {
    id: "nasa_arcadia",
    agency: "NASA",
    country: "USA",
    body: "mars",
    nameKey: "telemetryAndRover.agencies.sites.nasa_arcadia",
    builtInSiteId: "mars_arcadia_planitia",
    lat: 46.7,
    lon: -172.0,
    slopeDeg: 2.1,
    roughness: 0.22,
    thermalInertiaTiu: 174,
    solarFluxWm2: 201,
    iceFrac: 0.62,
    meanTempK: 215,
  },
  {
    id: "nasa_shackleton",
    agency: "NASA",
    country: "USA",
    body: "moon",
    nameKey: "telemetryAndRover.agencies.sites.nasa_shackleton",
    builtInSiteId: "moon_shackleton_pole",
    lat: -89.68,
    lon: 129.78,
    slopeDeg: 18.5,
    roughness: 0.68,
    thermalInertiaTiu: 58,
    solarFluxWm2: 267,
    iceFrac: 0.35,
    meanTempK: 158,
  },
  {
    id: "cnsa_utopia",
    agency: "CNSA",
    country: "China",
    body: "mars",
    nameKey: "telemetryAndRover.agencies.sites.cnsa_utopia",
    lat: 25.06,
    lon: 109.92,
    slopeDeg: 3.2,
    roughness: 0.28,
    thermalInertiaTiu: 245,
    solarFluxWm2: 390,
    iceFrac: 0.18,
    meanTempK: 226,
  },
  {
    id: "cnsa_von_karman",
    agency: "CNSA",
    country: "China",
    body: "moon",
    nameKey: "telemetryAndRover.agencies.sites.cnsa_von_karman",
    lat: -45.45,
    lon: 177.59,
    slopeDeg: 5.8,
    roughness: 0.39,
    thermalInertiaTiu: 72,
    solarFluxWm2: 640,
    iceFrac: 0.04,
    meanTempK: 192,
  },
  {
    id: "isro_shiv_shakti",
    agency: "ISRO",
    country: "India",
    body: "moon",
    nameKey: "telemetryAndRover.agencies.sites.isro_shiv_shakti",
    lat: -69.37,
    lon: 32.32,
    slopeDeg: 6.9,
    roughness: 0.41,
    thermalInertiaTiu: 64,
    solarFluxWm2: 410,
    iceFrac: 0.19,
    meanTempK: 174,
  },
  {
    id: "esa_oxia_planum",
    agency: "ESA",
    country: "Europe",
    body: "mars",
    nameKey: "telemetryAndRover.agencies.sites.esa_oxia_planum",
    lat: 18.2,
    lon: -24.55,
    slopeDeg: 3.8,
    roughness: 0.31,
    thermalInertiaTiu: 265,
    solarFluxWm2: 425,
    iceFrac: 0.08,
    meanTempK: 234,
  },
  {
    id: "jaxa_shioli",
    agency: "JAXA",
    country: "Japan",
    body: "moon",
    nameKey: "telemetryAndRover.agencies.sites.jaxa_shioli",
    lat: -13.32,
    lon: 25.25,
    slopeDeg: 15.4,
    roughness: 0.56,
    thermalInertiaTiu: 92,
    solarFluxWm2: 830,
    iceFrac: 0.0,
    meanTempK: 204,
  },
] as const;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function computeClimateDurationFactor(
  body: PlanetaryBody,
  durationMonths: number,
  dustFlux: number,
  tempAmpK: number
): {
  days: number;
  sols: number;
  lunarNights: number;
  tempSwingK: number;
  dustLossPct: number;
  stormRiskPct: number;
  durationMultiplier: number;
} {
  const days = Math.round(durationMonths * 30);
  const sols = Math.round(days * 0.973);
  const lunarNights = Math.floor(days / 29.5);

  if (body === "mars") {
    // Seasonal drift on Mars increases over a 23-month Martian year
    const seasonPhase = Math.sin((Math.min(durationMonths, 12) / 12) * (Math.PI / 2));
    const tempSwingK = Math.round(12 + seasonPhase * 32 + (tempAmpK / 100) * 6);
    const dustLossPct = Math.min(85, Math.round(sols * (0.14 + dustFlux * 0.22)));
    const stormRiskPct = Math.min(
      92,
      Math.round(8 + (durationMonths / 24) * 58 + dustFlux * 25)
    );
    const penalty = clamp01((dustLossPct / 100) * 0.22 + (stormRiskPct / 100) * 0.14);
    return {
      days,
      sols,
      lunarNights: 0,
      tempSwingK,
      dustLossPct,
      stormRiskPct,
      durationMultiplier: clamp01(1 - penalty),
    };
  }

  // Moon: surviving multiple 14-day cryogenic lunar nights (-170 °C) is the primary duration bottleneck
  const tempSwingK = Math.round(tempAmpK);
  const nightPenalty = lunarNights === 0 ? 0 : Math.min(0.32, lunarNights * 0.045);
  return {
    days,
    sols: days,
    lunarNights,
    tempSwingK,
    dustLossPct: 0,
    stormRiskPct: 0,
    durationMultiplier: clamp01(1 - nightPenalty),
  };
}

function computeCropSuitability(
  solarFluxWm2: number,
  iceFrac: number,
  meanTempK: number,
  slopeDeg: number,
  aridityOrPurity = 0.8
): number {
  const lightScore = clamp01(solarFluxWm2 / 550);
  const waterScore = clamp01(0.3 + iceFrac * 1.4);
  const thermalScore = clamp01(1 - Math.abs(meanTempK - 265) / 160);
  const flatTerrain = clamp01(1 - slopeDeg / 25);
  return clamp01(
    lightScore * 0.32 +
      waterScore * 0.3 +
      thermalScore * 0.2 +
      flatTerrain * 0.1 +
      aridityOrPurity * 0.08
  );
}

function computePlanetaryDeploymentMetrics(
  site: PlanetarySite,
  system: DeploymentSystem,
  goal: ResearchGoal,
  durationMonths: number
): {
  overall: number;
  survivalAfterDuration: number;
  traction: number;
  thermalSolar: number;
  dustWind: number;
  instrumentConf: number;
  cropScore: number;
  landingScore: number;
} {
  const iv = site.variables.independent;
  const dv = site.variables.dependent;
  const brk = site.variables.breakage;

  const slope = iv.slope_deg ?? 10;
  const roughness = iv.topographic_roughness ?? 0.5;
  const thermalInertia = iv.thermal_inertia ?? 180;
  const solar = iv.solar_flux_wm2 ?? 400;
  const ice = iv.subsurface_ice_frac ?? 0;
  const tempK = dv.mean_surface_temp_k ?? 220;
  const ampK = dv.diurnal_temp_amplitude_k ?? 100;
  const wind = dv.surface_wind_ms ?? 0;
  const dust = dv.aeolian_dust_flux ?? 0;
  const pressure = brk.atm_pressure_mbar ?? 0;

  const instrumentConf = site.confidence ? clamp01(site.confidence.score) : 0.94;
  const densityFirmness = clamp01(thermalInertia / 320);

  const tractionRover = clamp01(
    (1 - (slope / 32) * 0.58 - roughness * 0.32) * 0.82 + densityFirmness * 0.18
  );
  const landingScore = clamp01(1 - (slope / 20) * 0.72 - roughness * 0.28);

  const tempComfort = clamp01(1 - Math.abs(tempK - 240) / 170);
  const thermalShockSafety = clamp01(1 - ampK / 340);
  const solarScore = clamp01(solar / 650);
  const thermalSolar = clamp01(
    tempComfort * 0.38 + thermalShockSafety * 0.32 + solarScore * 0.3
  );

  const dustWindRover = clamp01(1 - dust * 0.38 - (wind / 35) * 0.22);
  const cropScore = computeCropSuitability(solar, ice, tempK, slope, 0.85);

  const climateInfo = computeClimateDurationFactor(site.body, durationMonths, dust, ampK);

  if (system === "rotorcraft" && pressure < 1.0) {
    return {
      overall: 0,
      survivalAfterDuration: 0,
      traction: tractionRover,
      thermalSolar,
      dustWind: 0,
      instrumentConf,
      cropScore,
      landingScore,
    };
  }

  let baseOverall = clamp01(
    tractionRover * 0.4 +
      thermalSolar * 0.28 +
      dustWindRover * 0.18 +
      instrumentConf * 0.14
  );

  if (goal === "landing_viability" || system === "lander") {
    baseOverall = clamp01(
      landingScore * 0.52 +
        dustWindRover * 0.2 +
        thermalSolar * 0.16 +
        instrumentConf * 0.12
    );
  } else if (goal === "crop_agriculture") {
    baseOverall = clamp01(cropScore * 0.62 + landingScore * 0.22 + thermalSolar * 0.16);
  } else if (goal === "isru_water" || system === "isru_drill") {
    const resourceScore =
      site.body === "mars"
        ? clamp01(0.55 + ice * 0.45)
        : clamp01(0.25 + ice * 1.45);
    baseOverall = clamp01(
      resourceScore * 0.48 + tractionRover * 0.28 + thermalSolar * 0.24
    );
  } else if (goal === "astrobiology") {
    baseOverall = clamp01(
      tractionRover * 0.35 +
        thermalSolar * 0.3 +
        clamp01(0.4 + ice * 0.9) * 0.2 +
        instrumentConf * 0.15
    );
  }

  const survivalAfterDuration = clamp01(baseOverall * climateInfo.durationMultiplier);

  return {
    overall: baseOverall,
    survivalAfterDuration,
    traction: tractionRover,
    thermalSolar,
    dustWind: dustWindRover,
    instrumentConf,
    cropScore,
    landingScore,
  };
}

function computeEarthSectionMetrics(
  match: AnalogMatchItem,
  goal: ResearchGoal
): {
  roverScore: number;
  landingScore: number;
  cropScore: number;
  goalScore: number;
} {
  const iv = match.earth_variables.independent;
  const dv = match.earth_variables.dependent;

  const slope = iv.slope_deg ?? 8;
  const roughness = iv.topographic_roughness ?? 0.4;
  const inertia = iv.thermal_inertia ?? 220;
  const humidity = iv.relative_humidity_pct ?? 20;
  const solar = iv.solar_flux_wm2 ?? 500;
  const ice = iv.subsurface_ice_frac ?? 0;
  const tempK = dv.mean_surface_temp_k ?? 285;
  const bareGround = clamp01(1 - (iv.vegetation_lai_proxy ?? 0) / 2.5);

  const densityFirmness = clamp01(inertia / 350);
  const dryTraction = clamp01(1 - humidity / 95);

  const roverScore = clamp01(
    (1 - slope / 35) * 0.25 +
      (1 - roughness * 0.5) * 0.2 +
      densityFirmness * 0.2 +
      dryTraction * 0.15 +
      match.combined_score * 0.2
  );

  const landingScore = clamp01(
    (1 - slope / 22) * 0.45 +
      (1 - roughness * 0.6) * 0.25 +
      bareGround * 0.15 +
      match.combined_score * 0.15
  );

  const cropScore = computeCropSuitability(solar, Math.max(ice, humidity / 200), tempK, slope, 0.9);

  let goalScore = roverScore;
  if (goal === "landing_viability") goalScore = landingScore;
  else if (goal === "crop_agriculture") goalScore = cropScore;
  else if (goal === "isru_water") {
    goalScore = clamp01((iv.subsurface_ice_frac ?? 0) * 0.4 + dryTraction * 0.3 + match.combined_score * 0.3);
  } else if (goal === "astrobiology") {
    goalScore = clamp01(match.combined_score * 0.55 + bareGround * 0.25 + dryTraction * 0.2);
  }

  return { roverScore, landingScore, cropScore, goalScore };
}

export function TelemetryAndDeploymentPanel({
  activeSite,
  sites,
  matches,
  selectedMatch,
  lastUpdated,
  onSelectSite,
  onSelectCell,
  onProbePlanet,
}: TelemetryAndDeploymentPanelProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [system, setSystem] = useState<DeploymentSystem>("rover");
  const [researchGoal, setResearchGoal] = useState<ResearchGoal>("rover_new_worlds");
  const [durationMonths, setDurationMonths] = useState<number>(2);
  const [agencyFilter, setAgencyFilter] = useState<string>("all");

  // Point Zero (Baseline = 0) & Primary Environmental Filter for New/Unseen Sections
  const [pointZeroH3, setPointZeroH3] = useState<string | null>(null);
  const [unseenOnly, setUnseenOnly] = useState<boolean>(true);
  const [maxHumidityPct, setMaxHumidityPct] = useState<number>(45);
  const [maxTempC, setMaxTempC] = useState<number>(40);
  const [minDensityTiu, setMinDensityTiu] = useState<number>(60);
  const [maxSlopeDeg, setMaxSlopeDeg] = useState<number>(22);

  const formatElapsed = (isoOrDate: string | Date | null | undefined): string => {
    if (!isoOrDate) return t("telemetryAndRover.elapsedJustNow");
    const parsed = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
    if (Number.isNaN(parsed.getTime())) return t("telemetryAndRover.elapsedJustNow");
    const diffMs = Math.max(0, Date.now() - parsed.getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t("telemetryAndRover.elapsedJustNow");
    if (mins < 60) return t("telemetryAndRover.elapsedMinutes", { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) {
      return t("telemetryAndRover.elapsedHours", { count: hours, mins: mins % 60 });
    }
    const days = Math.floor(hours / 24);
    return t("telemetryAndRover.elapsedDays", { count: days });
  };

  const climateShift = useMemo(() => {
    if (!activeSite) return null;
    return computeClimateDurationFactor(
      activeSite.body,
      durationMonths,
      activeSite.variables.dependent.aeolian_dust_flux ?? 0,
      activeSite.variables.dependent.diurnal_temp_amplitude_k ?? 100
    );
  }, [activeSite, durationMonths]);

  // Candidate planetary sites ranked by selected research goal & duration
  const bodySites = useMemo(() => {
    const targetBody = activeSite?.body ?? "mars";
    const list = sites.filter((s) => s.body === targetBody);
    if (activeSite && !list.some((s) => s.site_id === activeSite.site_id)) {
      list.unshift(activeSite);
    }
    return list
      .map((s) => ({
        site: s,
        metrics: computePlanetaryDeploymentMetrics(s, system, researchGoal, durationMonths),
      }))
      .sort((a, b) => b.metrics.survivalAfterDuration - a.metrics.survivalAfterDuration);
  }, [sites, activeSite, system, researchGoal, durationMonths]);

  const activeSiteMetrics = useMemo(() => {
    if (!activeSite) return null;
    return computePlanetaryDeploymentMetrics(activeSite, system, researchGoal, durationMonths);
  }, [activeSite, system, researchGoal, durationMonths]);

  // Point Zero reference cell (defaults to currently selected match or top match)
  const baselineCell = useMemo(() => {
    if (pointZeroH3) {
      const found = matches.find((m) => m.earth_cell_h3 === pointZeroH3);
      if (found) return found;
    }
    return selectedMatch ?? matches[0] ?? null;
  }, [pointZeroH3, selectedMatch, matches]);

  // Filtered new sections using the Primary Filter (Humidity, Temp, Density/Inertia, Slope, Unseen only)
  const filteredNewSections = useMemo(() => {
    return matches
      .filter((m) => {
        if (unseenOnly && m.is_benchmark) return false;
        const iv = m.earth_variables.independent;
        const dv = m.earth_variables.dependent;
        const hum = iv.relative_humidity_pct ?? 0;
        const tempC = (dv.mean_surface_temp_k ?? 273.15) - 273.15;
        const densityTiu = iv.thermal_inertia ?? 0;
        const slope = iv.slope_deg ?? 0;

        if (hum > maxHumidityPct) return false;
        if (tempC > maxTempC) return false;
        if (densityTiu < minDensityTiu) return false;
        if (slope > maxSlopeDeg) return false;
        return true;
      })
      .map((m) => ({
        match: m,
        scores: computeEarthSectionMetrics(m, researchGoal),
      }))
      .sort((a, b) => b.scores.goalScore - a.scores.goalScore);
  }, [
    matches,
    unseenOnly,
    maxHumidityPct,
    maxTempC,
    minDensityTiu,
    maxSlopeDeg,
    researchGoal,
  ]);

  const filteredAgencySites = useMemo(() => {
    return INTERNATIONAL_LANDING_SITES.filter(
      (s) => agencyFilter === "all" || s.agency === agencyFilter
    );
  }, [agencyFilter]);

  if (!activeSite) return null;

  const siteFetchedDate = activeSite.provenance?.fetched_at
    ? new Date(activeSite.provenance.fetched_at)
    : lastUpdated;
  const earthFetchedDate = selectedMatch?.provenance?.fetched_at
    ? new Date(selectedMatch.provenance.fetched_at)
    : lastUpdated;

  const activeBodyName = t(`bodies.${activeSite.body}`);
  const isMoonRotorcraft = activeSite.body === "moon" && system === "rotorcraft";

  const baseIv = baselineCell?.earth_variables.independent;
  const baseDv = baselineCell?.earth_variables.dependent;
  const baseDensity = baseIv?.thermal_inertia ?? activeSite.variables.independent.thermal_inertia ?? 200;
  const baseHumidity = baseIv?.relative_humidity_pct ?? activeSite.variables.independent.relative_humidity_pct ?? 0;
  const baseTempC = ((baseDv?.mean_surface_temp_k ?? activeSite.variables.dependent.mean_surface_temp_k ?? 250) - 273.15);
  const baseSlope = baseIv?.slope_deg ?? activeSite.variables.independent.slope_deg ?? 8;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* 1. Data Lag & Synchronization Monitor (5 cols on xl) */}
        <Card className="xl:col-span-5">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("telemetryAndRover.lagTitle")}</span>
              </CardTitle>
              <Badge variant="valid">
                <Radio className="h-3 w-3" aria-hidden="true" />
                <span>
                  {activeSite.provenance?.is_live_probed
                    ? t("telemetryAndRover.freshnessLive")
                    : t("telemetryAndRover.freshnessCached")}
                </span>
              </Badge>
            </div>
            <p className="text-xs text-content-muted">{t("telemetryAndRover.lagSubtitle")}</p>
          </CardHeader>

          <CardContent className="space-y-3">
            {/* Planetary Telemetry Feed Box */}
            <div className="rounded-xl border border-border-subtle bg-surface-muted/35 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-content">
                  <Satellite className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t("telemetryAndRover.planetaryFeedTitle", { body: activeBodyName })}
                </span>
                <Badge variant="accent">{formatElapsed(siteFetchedDate)}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                <div className="rounded-lg border border-border-subtle/70 bg-surface p-2">
                  <span className="block text-[10px] uppercase tracking-wider text-content-muted">
                    {t("telemetryAndRover.lastSyncLabel")}
                  </span>
                  <strong className="tabular-nums text-content">
                    {siteFetchedDate && !Number.isNaN(siteFetchedDate.getTime())
                      ? formatTimestamp(siteFetchedDate, lang)
                      : "—"}
                  </strong>
                </div>
                <div className="rounded-lg border border-border-subtle/70 bg-surface p-2">
                  <span className="block text-[10px] uppercase tracking-wider text-content-muted">
                    {t("telemetryAndRover.obsWindowLabel")}
                  </span>
                  <strong
                    className="truncate block tabular-nums text-content"
                    title={activeSite.provenance?.observation_window}
                  >
                    {activeSite.provenance?.observation_window || "—"}
                  </strong>
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-content-muted">
                <strong className="text-content">
                  {t("telemetryAndRover.signalLatencyLabel")}:
                </strong>{" "}
                {activeSite.body === "mars"
                  ? t("telemetryAndRover.marsLatencyDesc")
                  : t("telemetryAndRover.moonLatencyDesc")}
              </p>
            </div>

            {/* Earth Analog Satellite Feed Box */}
            {selectedMatch && (
              <div className="rounded-xl border border-border-subtle bg-surface-muted/35 p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-content">
                    <Activity className="h-3.5 w-3.5 text-status-valid" aria-hidden="true" />
                    {t("telemetryAndRover.earthFeedTitle", {
                      cell: selectedMatch.earth_cell_h3,
                    })}
                  </span>
                  <Badge variant="default">{formatElapsed(earthFetchedDate)}</Badge>
                </div>

                <div className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
                  <div className="rounded-lg border border-border-subtle/70 bg-surface p-2">
                    <span className="block text-[10px] uppercase tracking-wider text-content-muted">
                      {t("telemetryAndRover.lastSyncLabel")}
                    </span>
                    <strong className="tabular-nums text-content">
                      {earthFetchedDate && !Number.isNaN(earthFetchedDate.getTime())
                        ? formatTimestamp(earthFetchedDate, lang)
                        : "—"}
                    </strong>
                  </div>
                  <div className="rounded-lg border border-border-subtle/70 bg-surface p-2">
                    <span className="block text-[10px] uppercase tracking-wider text-content-muted">
                      {t("telemetryAndRover.obsWindowLabel")}
                    </span>
                    <strong className="truncate block tabular-nums text-content">
                      {selectedMatch.provenance?.observation_window || "NASA POWER / ERA5"}
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-content-muted">
                  <strong className="text-content">
                    {t("telemetryAndRover.signalLatencyLabel")}:
                  </strong>{" "}
                  {t("telemetryAndRover.earthLatencyDesc")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. Rover Deployment Simulator + Mission Duration Climate Shift + Research Goal (7 cols on xl) */}
        <Card className="xl:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Rocket className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("telemetryAndRover.roverTitle")}</span>
              </CardTitle>

              <div className="flex flex-wrap items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <select
                  aria-label={t("telemetryAndRover.systemTypeLabel")}
                  value={system}
                  onChange={(e) => setSystem(e.target.value as DeploymentSystem)}
                  className="min-h-9 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-xs font-semibold text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="rover">{t("telemetryAndRover.systems.rover")}</option>
                  <option value="lander">{t("telemetryAndRover.systems.lander")}</option>
                  <option value="isru_drill">{t("telemetryAndRover.systems.isru_drill")}</option>
                  <option value="rotorcraft">{t("telemetryAndRover.systems.rotorcraft")}</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-content-muted">{t("telemetryAndRover.roverSubtitle")}</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Mission Research Goal + Mission Duration (Climate Shift) Controls */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-surface-muted/30 p-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="rover-research-goal-select"
                  className="block text-xs font-semibold text-content"
                >
                  {t("telemetryAndRover.researchGoals.label")}
                </label>
                <select
                  id="rover-research-goal-select"
                  value={researchGoal}
                  onChange={(e) => setResearchGoal(e.target.value as ResearchGoal)}
                  className="min-h-10 w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="rover_new_worlds">
                    {t("telemetryAndRover.researchGoals.rover_new_worlds")}
                  </option>
                  <option value="landing_viability">
                    {t("telemetryAndRover.researchGoals.landing_viability")}
                  </option>
                  <option value="crop_agriculture">
                    {t("telemetryAndRover.researchGoals.crop_agriculture")}
                  </option>
                  <option value="isru_water">
                    {t("telemetryAndRover.researchGoals.isru_water")}
                  </option>
                  <option value="astrobiology">
                    {t("telemetryAndRover.researchGoals.astrobiology")}
                  </option>
                </select>

                <div className="flex flex-wrap gap-1 pt-0.5">
                  {[
                    { m: 0.5, label: t("telemetryAndRover.duration.presets.short") },
                    { m: 2, label: t("telemetryAndRover.duration.presets.twoMonths") },
                    { m: 6, label: t("telemetryAndRover.duration.presets.sixMonths") },
                    { m: 12, label: t("telemetryAndRover.duration.presets.oneYear") },
                    { m: 23, label: t("telemetryAndRover.duration.presets.marsYear") },
                  ].map((p) => (
                    <button
                      key={p.m}
                      type="button"
                      onClick={() => setDurationMonths(p.m)}
                      className={`rounded-md border px-2 py-0.5 text-[11px] font-medium transition ${
                        durationMonths === p.m
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-border-subtle bg-surface text-content-muted hover:text-content"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Slider
                  id="mission-duration-months"
                  label={t("telemetryAndRover.duration.label")}
                  value={durationMonths}
                  min={0.5}
                  max={24}
                  step={0.5}
                  formattedValue={t("telemetryAndRover.duration.months", {
                    count: durationMonths,
                    days: Math.round(durationMonths * 30),
                  })}
                  onChange={setDurationMonths}
                />
                {climateShift && (
                  <p className="rounded-lg border border-border-subtle/80 bg-surface p-2 text-[11px] leading-relaxed text-content-muted">
                    <strong className="text-content">
                      {t("telemetryAndRover.duration.climateImpactTitle", {
                        months: durationMonths,
                      })}
                      :
                    </strong>{" "}
                    {activeSite.body === "mars"
                      ? t("telemetryAndRover.duration.marsClimateNote", {
                          days: climateShift.days,
                          sols: climateShift.sols,
                          tempSwing: climateShift.tempSwingK,
                          dustLoss: climateShift.dustLossPct,
                          stormRisk: climateShift.stormRiskPct,
                        })
                      : t("telemetryAndRover.duration.moonClimateNote", {
                          days: climateShift.days,
                          lunarNights: climateShift.lunarNights,
                        })}
                  </p>
                )}
              </div>
            </div>

            {/* Active Site Operational Readiness Breakdown */}
            {activeSiteMetrics && (
              <div className="rounded-xl border border-accent/40 bg-accent/5 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-medium text-content-muted">
                      {t("telemetryAndRover.currentTargetSuccess", {
                        site: t(activeSite.name_key),
                      })}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl font-extrabold tabular-nums text-accent">
                        {formatPercent(activeSiteMetrics.survivalAfterDuration, lang)}
                      </span>
                      <Badge variant="default">
                        {t("telemetryAndRover.duration.survivalAfterDuration", {
                          months: durationMonths,
                        })}
                      </Badge>
                      <Badge
                        variant={
                          activeSiteMetrics.survivalAfterDuration >= 0.7
                            ? "valid"
                            : activeSiteMetrics.survivalAfterDuration >= 0.45
                            ? "warn"
                            : "break"
                        }
                      >
                        {activeSiteMetrics.survivalAfterDuration >= 0.7
                          ? t("telemetryAndRover.verdictHigh")
                          : activeSiteMetrics.survivalAfterDuration >= 0.45
                          ? t("telemetryAndRover.verdictMed")
                          : t("telemetryAndRover.verdictLow")}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <span className="block text-content-muted">
                        {t("telemetryAndRover.landingScoreLabel")}
                      </span>
                      <strong className="tabular-nums text-sm text-content">
                        {formatPercent(activeSiteMetrics.landingScore, lang)}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-content-muted">
                        {t("telemetryAndRover.cropScoreLabel")}
                      </span>
                      <strong className="tabular-nums text-sm text-status-valid">
                        {formatPercent(activeSiteMetrics.cropScore, lang)}
                      </strong>
                    </div>
                  </div>
                </div>

                {isMoonRotorcraft ? (
                  <p className="rounded-lg border border-status-break/40 bg-status-break/10 p-2.5 text-xs font-medium text-status-break">
                    {t("telemetryAndRover.moonRotorcraftZero")}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {[
                      {
                        key: "traction",
                        val: activeSiteMetrics.traction,
                        label: t("telemetryAndRover.factors.traction"),
                      },
                      {
                        key: "thermalSolar",
                        val: activeSiteMetrics.thermalSolar,
                        label: t("telemetryAndRover.factors.thermalSolar"),
                      },
                      {
                        key: "dustWind",
                        val: activeSiteMetrics.dustWind,
                        label: t("telemetryAndRover.factors.dustWind"),
                      },
                      {
                        key: "cropScore",
                        val: activeSiteMetrics.cropScore,
                        label: t("telemetryAndRover.cropScoreLabel"),
                      },
                    ].map((f) => (
                      <div
                        key={f.key}
                        className="rounded-lg border border-border-subtle bg-surface p-2 space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="truncate text-content-muted">{f.label}</span>
                          <strong className="tabular-nums text-content">
                            {formatPercent(f.val, lang)}
                          </strong>
                        </div>
                        <ProgressBar
                          value={f.val}
                          tone={f.val >= 0.7 ? "valid" : f.val >= 0.45 ? "accent" : "warn"}
                          label={f.label}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optimal Planetary Sites Ranking */}
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-content">
                <Compass className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>
                  {t("telemetryAndRover.planetarySectionTitle", { body: activeBodyName })}
                </span>
              </h4>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {bodySites.map(({ site, metrics }, idx) => {
                  const isCurrent = site.site_id === activeSite.site_id;
                  const isOptimal = idx === 0 && metrics.survivalAfterDuration > 0;
                  return (
                    <button
                      key={site.site_id}
                      type="button"
                      onClick={() => onSelectSite(site.site_id, site.body)}
                      className={`flex flex-col justify-between gap-1.5 rounded-xl border p-2.5 text-left text-xs transition ${
                        isCurrent
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-border-subtle bg-surface hover:border-accent/40 hover:bg-surface-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <span className="font-semibold text-content line-clamp-1">
                          #{idx + 1} · {t(site.name_key)}
                        </span>
                        <span className="shrink-0 font-extrabold tabular-nums text-accent">
                          {formatPercent(metrics.survivalAfterDuration, lang)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-content-muted">
                        <span>
                          {t("variables.slope_deg.label")}:{" "}
                          {formatNumber(site.variables.independent.slope_deg ?? 0, lang, 1)}° ·{" "}
                          {t("telemetryAndRover.pointZero.cropSuitability")}:{" "}
                          {formatPercent(metrics.cropScore, lang)}
                        </span>
                        {isOptimal && (
                          <Badge variant="valid">{t("telemetryAndRover.optimalBadge")}</Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. International Agency Landing Sites (NASA vs CNSA China, ISRO India, ESA Europe, JAXA Japan) + Rover Point Zero & Primary Filter */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* International Landing & Rover Proposals (5 cols on xl) */}
        <Card className="xl:col-span-5">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Globe2 className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("telemetryAndRover.agencies.title")}</span>
              </CardTitle>
            </div>
            <p className="text-xs text-content-muted">
              {t("telemetryAndRover.agencies.subtitle")}
            </p>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {["all", "NASA", "CNSA", "ISRO", "ESA", "JAXA"].map((ag) => {
                const active = agencyFilter === ag;
                return (
                  <button
                    key={ag}
                    type="button"
                    onClick={() => setAgencyFilter(ag)}
                    className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                      active
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border-subtle bg-surface text-content-muted hover:text-content"
                    }`}
                  >
                    {ag === "all" ? t("telemetryAndRover.agencies.filterAll") : ag}
                  </button>
                );
              })}
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredAgencySites.map((item) => {
                const landingViability = clamp01(
                  1 - (item.slopeDeg / 22) * 0.7 - item.roughness * 0.3
                );
                const cropViability = computeCropSuitability(
                  item.solarFluxWm2,
                  item.iceFrac,
                  item.meanTempK,
                  item.slopeDeg,
                  0.85
                );
                const isBuiltInActive =
                  item.builtInSiteId && activeSite.site_id === item.builtInSiteId;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-2 rounded-xl border p-2.5 text-xs transition ${
                      isBuiltInActive
                        ? "border-accent bg-accent/10"
                        : "border-border-subtle bg-surface-muted/30 hover:border-accent/40"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={item.agency === "NASA" ? "accent" : "valid"}>
                          {item.agency} · {item.country}
                        </Badge>
                        <span className="truncate font-semibold text-content">
                          {t(item.nameKey)}
                        </span>
                      </div>
                      <p className="text-[11px] tabular-nums text-content-muted">
                        ({formatNumber(item.lat, lang, 2)}°, {formatNumber(item.lon, lang, 2)}°) ·{" "}
                        {t("telemetryAndRover.landingScoreLabel")}:{" "}
                        <strong className="text-content">
                          {formatPercent(landingViability, lang)}
                        </strong>{" "}
                        · {t("telemetryAndRover.pointZero.cropSuitability")}:{" "}
                        <strong className="text-status-valid">
                          {formatPercent(cropViability, lang)}
                        </strong>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (item.builtInSiteId) {
                          onSelectSite(item.builtInSiteId, item.body);
                        } else if (onProbePlanet) {
                          onProbePlanet(item.body, item.lat, item.lon);
                        }
                      }}
                      className="shrink-0 rounded-lg border border-accent/50 bg-accent/15 px-2.5 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-accent-foreground"
                    >
                      {isBuiltInActive
                        ? t("telemetryAndRover.agencies.activeSiteBadge")
                        : t("telemetryAndRover.agencies.probeLiveBtn")}
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Rover Point Zero (Baseline = 0) + Primary Filter for Unseen Sections (7 cols on xl) */}
        <Card className="xl:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Target className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("telemetryAndRover.pointZero.title")}</span>
              </CardTitle>

              {selectedMatch && (
                <button
                  type="button"
                  onClick={() => setPointZeroH3(selectedMatch.earth_cell_h3)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent transition hover:bg-accent hover:text-accent-foreground"
                >
                  <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("telemetryAndRover.pointZero.setBaselineBtn")}</span>
                </button>
              )}
            </div>
            <p className="text-xs text-content-muted">
              {t("telemetryAndRover.pointZero.subtitle")}
            </p>
          </CardHeader>

          <CardContent className="space-y-3.5">
            {/* Baseline = 0 Status Bar */}
            {baselineCell && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="accent">Δ = 0</Badge>
                  <span className="font-semibold text-content">
                    {t("telemetryAndRover.pointZero.baselineActive", {
                      name: baselineCell.known_analog_name ?? t(baselineCell.region_key),
                    })}
                  </span>
                </div>
                <span className="tabular-nums text-[11px] text-content-muted">
                  {t("telemetryAndRover.pointZero.densityParam")}: {formatNumber(baseDensity, lang, 0)} TIU (0) ·{" "}
                  {t("telemetryAndRover.pointZero.humidityParam")}: {formatNumber(baseHumidity, lang, 1)}% (0) ·{" "}
                  {t("telemetryAndRover.pointZero.tempParam")}: {formatNumber(baseTempC, lang, 1)} °C (0)
                </span>
              </div>
            )}

            {/* Primary Environmental Filters (Humidity, Temp, Density/Inertia, Slope, Unseen Only) */}
            <div className="rounded-xl border border-border-subtle bg-surface-muted/30 p-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-content">
                  <Filter className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  {t("telemetryAndRover.pointZero.firstFiltersTitle")}
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-content">
                    <input
                      type="checkbox"
                      checked={unseenOnly}
                      onChange={(e) => setUnseenOnly(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-border-subtle text-accent focus:ring-accent"
                    />
                    <span>{t("telemetryAndRover.pointZero.unseenOnly")}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setUnseenOnly(true);
                      setMaxHumidityPct(45);
                      setMaxTempC(40);
                      setMinDensityTiu(60);
                      setMaxSlopeDeg(22);
                    }}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-accent hover:bg-accent/10"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>{t("telemetryAndRover.pointZero.resetFirstFilters")}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Slider
                  id="first-filter-humidity"
                  label={t("telemetryAndRover.pointZero.maxHumidity")}
                  value={maxHumidityPct}
                  min={5}
                  max={100}
                  step={5}
                  formattedValue={`≤ ${maxHumidityPct}%`}
                  onChange={setMaxHumidityPct}
                />
                <Slider
                  id="first-filter-temp"
                  label={t("telemetryAndRover.pointZero.maxTempC")}
                  value={maxTempC}
                  min={-30}
                  max={50}
                  step={2}
                  formattedValue={`≤ ${maxTempC} °C`}
                  onChange={setMaxTempC}
                />
                <Slider
                  id="first-filter-density"
                  label={t("telemetryAndRover.pointZero.minDensityTiu")}
                  value={minDensityTiu}
                  min={0}
                  max={400}
                  step={10}
                  formattedValue={`≥ ${minDensityTiu} TIU`}
                  onChange={setMinDensityTiu}
                />
                <Slider
                  id="first-filter-slope"
                  label={t("telemetryAndRover.pointZero.maxSlopeDeg")}
                  value={maxSlopeDeg}
                  min={2}
                  max={35}
                  step={1}
                  formattedValue={`≤ ${maxSlopeDeg}°`}
                  onChange={setMaxSlopeDeg}
                />
              </div>
            </div>

            {/* New Sections Comparison vs Point Zero */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-content">
                  {t("telemetryAndRover.pointZero.newSectionsCount", {
                    count: filteredNewSections.length,
                  })}
                </span>
                <span className="text-content-muted">
                  {t("telemetryAndRover.pointZero.deltaLabel")}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {filteredNewSections.slice(0, 4).map(({ match, scores }) => {
                  const iv = match.earth_variables.independent;
                  const dv = match.earth_variables.dependent;
                  const deltaDensity = (iv.thermal_inertia ?? 0) - baseDensity;
                  const deltaHum = (iv.relative_humidity_pct ?? 0) - baseHumidity;
                  const deltaTemp = (dv.mean_surface_temp_k ?? 273.15) - 273.15 - baseTempC;
                  const deltaSlope = (iv.slope_deg ?? 0) - baseSlope;
                  const isCurrent = match.earth_cell_h3 === selectedMatch?.earth_cell_h3;

                  const fmtDelta = (v: number, decimals = 1) =>
                    `${v >= 0 ? "+" : ""}${formatNumber(v, lang, decimals)}`;

                  return (
                    <button
                      key={match.earth_cell_h3}
                      type="button"
                      onClick={() => onSelectCell(match.earth_cell_h3)}
                      className={`flex flex-col justify-between gap-2 rounded-xl border p-2.5 text-left text-xs transition ${
                        isCurrent
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-border-subtle bg-surface hover:border-accent/40 hover:bg-surface-muted/50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-content">
                            {match.known_analog_name ?? t(match.region_key)}
                          </p>
                          <p className="truncate text-[11px] text-content-muted">
                            {t(match.biome_key)} · ({formatNumber(match.coordinates.lat, lang, 1)}°,{" "}
                            {formatNumber(match.coordinates.lon, lang, 1)}°)
                          </p>
                        </div>
                        <span className="shrink-0 font-extrabold tabular-nums text-accent">
                          {formatPercent(scores.goalScore, lang)}
                        </span>
                      </div>

                      {/* Relative Deltas vs Point 0 */}
                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-muted/50 p-1.5 text-[10px] tabular-nums text-content-muted">
                        <span>
                          Δ {t("telemetryAndRover.pointZero.densityParam")}:{" "}
                          <strong className="text-content">{fmtDelta(deltaDensity, 0)} TIU</strong>
                        </span>
                        <span>
                          Δ {t("telemetryAndRover.pointZero.humidityParam")}:{" "}
                          <strong className="text-content">{fmtDelta(deltaHum, 1)}%</strong>
                        </span>
                        <span>
                          Δ {t("telemetryAndRover.pointZero.tempParam")}:{" "}
                          <strong className="text-content">{fmtDelta(deltaTemp, 1)} °C</strong>
                        </span>
                        <span>
                          Δ {t("telemetryAndRover.pointZero.slopeParam")}:{" "}
                          <strong className="text-content">{fmtDelta(deltaSlope, 1)}°</strong>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 text-status-valid">
                          <Sprout className="h-3 w-3" aria-hidden="true" />
                          {t("telemetryAndRover.pointZero.cropSuitability")}:{" "}
                          <strong>{formatPercent(scores.cropScore, lang)}</strong>
                        </span>
                        <span className="text-content-muted">
                          {t("telemetryAndRover.landingScoreLabel")}:{" "}
                          <strong className="text-content">
                            {formatPercent(scores.landingScore, lang)}
                          </strong>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
