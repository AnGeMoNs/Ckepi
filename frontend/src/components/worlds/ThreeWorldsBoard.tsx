import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type {
  PhysicalVariables,
  PlanetarySite,
  SiteComparisonResponse,
  VariableOrigin,
} from "../../types/analog";
import { NumberTicker } from "../motion/NumberTicker";
import { SpotlightCard } from "../motion/SpotlightCard";
import { Pictogram, WorldMark, type PictogramName } from "./Pictograms";

type WorldId = "earth" | "moon" | "mars";
type Layer = "independent" | "dependent" | "breakage";

interface Row {
  key: Extract<PictogramName, "gravity" | "pressure" | "radiation" | "temperature" | "thermalSwing" | "slope">;
  layer: Layer;
  variable: string;
  unit: string;
  decimals: number;
  /** Log scale for quantities spanning orders of magnitude (pressure, radiation). */
  log?: boolean;
  /** Displayed value from the stored value (e.g. kelvin → °C). */
  display?: (value: number) => number;
}

// Each row reads a real variable from the API; B-layer rows are physical gaps Earth cannot reproduce.
const ROWS: Row[] = [
  { key: "gravity", layer: "breakage", variable: "gravity_g", unit: "g", decimals: 2 },
  { key: "pressure", layer: "breakage", variable: "atm_pressure_mbar", unit: "mbar", decimals: 1, log: true },
  { key: "radiation", layer: "breakage", variable: "radiation_msv_yr", unit: "mSv/a", decimals: 0, log: true },
  { key: "temperature", layer: "dependent", variable: "mean_surface_temp_k", unit: "°C", decimals: 0, display: (k) => k - 273.15 },
  { key: "thermalSwing", layer: "dependent", variable: "diurnal_temp_amplitude_k", unit: "K", decimals: 0 },
  { key: "slope", layer: "independent", variable: "slope_deg", unit: "°", decimals: 1 },
];

const WORLD_STYLE: Record<WorldId, { bar: string; text: string; glow: string }> = {
  earth: { bar: "bg-world-earth", text: "text-world-earth", glow: "bg-world-earth" },
  moon: { bar: "bg-world-moon", text: "text-world-moon", glow: "bg-world-moon" },
  mars: { bar: "bg-world-mars", text: "text-world-mars", glow: "bg-world-mars" },
};

interface WorldData {
  id: WorldId;
  label: string;
  variables: PhysicalVariables | null;
  origin: (variable: string) => VariableOrigin | null;
}

function readValue(variables: PhysicalVariables | null, row: Row): number | null {
  const value = variables?.[row.layer]?.[row.variable];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function scaled(value: number, log?: boolean): number {
  return log ? Math.log10(1 + Math.max(0, value)) : Math.abs(value);
}

interface ThreeWorldsBoardProps {
  sites: PlanetarySite[];
  activeSite: PlanetarySite | undefined;
  comparison: SiteComparisonResponse | null;
  onPickEarthCell: (h3Index: string) => void;
  onOpenFullAnalysis: () => void;
}

/** Bento board: Earth · Moon · Mars side by side with real API data and the measured terrain match. */
export function ThreeWorldsBoard({
  sites,
  activeSite,
  comparison,
  onPickEarthCell,
  onOpenFullAnalysis,
}: ThreeWorldsBoardProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const reduceMotion = Boolean(useReducedMotion());

  const moon = sites.find((s) => s.site_id === "moon_shackleton_pole") ?? sites.find((s) => s.body === "moon");
  const mars =
    activeSite?.body === "mars" ? activeSite : sites.find((s) => s.site_id === "mars_jezero_crater");
  const earthMatch = comparison?.match ?? null;

  const siteOrigin = (site: PlanetarySite | undefined) => (variable: string) =>
    site?.confidence?.variable_provenance?.[variable] ?? null;

  const worlds: WorldData[] = [
    {
      id: "earth",
      label: earthMatch
        ? earthMatch.known_analog_name ?? `${t("worlds.earth")} · ${earthMatch.earth_cell_h3.slice(0, 6)}`
        : t("worlds.earth"),
      variables: earthMatch?.earth_variables ?? null,
      origin: () => (earthMatch ? "measured" : null),
    },
    { id: "moon", label: moon ? t(moon.name_key) : t("worlds.moon"), variables: moon?.variables ?? null, origin: siteOrigin(moon) },
    { id: "mars", label: mars ? t(mars.name_key) : t("worlds.mars"), variables: mars?.variables ?? null, origin: siteOrigin(mars) },
  ];

  const terrain = comparison?.statistical_distribution ?? null;
  const slope = terrain?.slope_distribution ?? null;
  const isSynthetic = Boolean(terrain && /^SYNTHETIC/.test(terrain.earth_dem_source + terrain.planetary_dem_source));
  const maxDensity = slope
    ? Math.max(...slope.planetary_density, ...slope.earth_density, ...slope.control_yungay_density, 0.0001)
    : 1;

  return (
    <section aria-labelledby="three-worlds-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="three-worlds-title" className="text-xl font-bold text-content sm:text-2xl">
            {t("worlds.title")}
          </h2>
          <p className="text-sm text-content-muted">{t("worlds.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Comparison table of the three worlds (spans two columns on wide screens). */}
        <SpotlightCard className="xl:col-span-2" glowClassName="bg-accent">
          <div className="grid grid-cols-[minmax(7rem,1fr)_repeat(3,minmax(0,1.3fr))] gap-x-3 gap-y-1 p-4 text-sm sm:p-5">
            <span />
            {worlds.map((world) => (
              <div key={world.id} className="min-w-0 pb-2">
                <p className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${WORLD_STYLE[world.id].text}`}>
                  <WorldMark />
                  {t(`worlds.${world.id}`)}
                </p>
                <p className="truncate text-xs text-content-muted" title={world.label}>
                  {world.label}
                </p>
              </div>
            ))}

            {ROWS.map((row, rowIndex) => {
              const values = worlds.map((world) => readValue(world.variables, row));
              const maxScaled = Math.max(
                ...values.map((v) => (v === null ? 0 : scaled(row.display ? row.display(v) + 273.15 : v, row.log))),
                0.0001
              );
              return (
                <div key={row.key} className="contents">
                  <div className="flex items-center gap-2 border-t border-border-subtle py-2">
                    <Pictogram name={row.key} className="h-7 w-7 shrink-0 text-content-muted" />
                    <div className="flex flex-col">
                    <span className="font-semibold text-content">{t(`worlds.rows.${row.key}`)}</span>
                    {row.layer === "breakage" && (
                      <span className="text-[11px] text-status-break">{t("worlds.notReproducible")}</span>
                    )}
                    </div>
                  </div>
                  {worlds.map((world, worldIndex) => {
                    const raw = values[worldIndex];
                    if (raw === null) {
                      return (
                        <div key={world.id} className="border-t border-border-subtle py-2 text-content-muted">
                          —
                        </div>
                      );
                    }
                    const shown = row.display ? row.display(raw) : raw;
                    const width = (scaled(row.display ? shown + 273.15 : raw, row.log) / maxScaled) * 100;
                    const origin = world.origin(row.variable);
                    return (
                      <div key={world.id} className="min-w-0 border-t border-border-subtle py-2">
                        <div className="flex items-baseline gap-1">
                          <NumberTicker
                            value={shown}
                            format={(v) => formatNumber(v, lang, row.decimals)}
                            className="font-mono text-base font-semibold text-content"
                          />
                          <span className="text-xs text-content-muted">{row.unit}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                          <motion.div
                            className={`h-full rounded-full ${WORLD_STYLE[world.id].bar}`}
                            initial={reduceMotion ? false : { width: 0 }}
                            animate={{ width: `${Math.max(3, width)}%` }}
                            transition={{ duration: 0.9, delay: reduceMotion ? 0 : rowIndex * 0.06 + worldIndex * 0.04, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        {origin && (
                          <span className="mt-1 block text-[10px] uppercase tracking-wide text-content-muted">
                            {t(`worlds.origin.${origin}`)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="border-t border-border-subtle px-4 py-3 text-xs text-content-muted sm:px-5">
            {t("worlds.sourcesNote")}
          </p>
        </SpotlightCard>

        {/* Measured terrain match (real DEMs). */}
        <SpotlightCard glowClassName="bg-world-mars">
          <div className="flex h-full flex-col gap-3 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-content">
              <Pictogram name="terrain" className="h-6 w-6 text-accent" />
              {t("worlds.terrainTitle")}
            </div>

            {slope && terrain ? (
              <>
                <div>
                  <p className="text-xs text-content-muted">{t("worlds.terrainLead")}</p>
                  <div className="flex items-baseline gap-2">
                    <NumberTicker
                      value={slope.wasserstein_distance}
                      format={(v) => `${formatNumber(v, lang, 2)}°`}
                      className="font-mono text-4xl font-semibold text-accent"
                    />
                    <span className="text-xs text-content-muted">
                      {t("worlds.ci", {
                        low: formatNumber(slope.w1_ci_95[0], lang, 2),
                        high: formatNumber(slope.w1_ci_95[1], lang, 2),
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-content-muted">
                    {t("worlds.controlCompare", { value: formatNumber(slope.control_yungay_w1, lang, 2) })}
                  </p>
                </div>

                {/* Slope histogram: Mars target vs Earth cell vs Yungay control. */}
                <div className="flex h-24 items-end gap-[3px]" aria-hidden="true">
                  {slope.bin_centers.map((center, i) => (
                    <div key={center} className="flex h-full flex-1 items-end gap-px">
                      {[
                        { d: slope.planetary_density[i], c: WORLD_STYLE.mars.bar },
                        { d: slope.earth_density[i], c: WORLD_STYLE.earth.bar },
                        { d: slope.control_yungay_density[i], c: "bg-content-muted" },
                      ].map((series, s) => (
                        <motion.div
                          key={s}
                          className={`w-full rounded-t-sm ${series.c}`}
                          style={{ height: `${Math.max(2, (series.d / maxDensity) * 100)}%`, originY: 1 }}
                          initial={reduceMotion ? false : { scaleY: 0 }}
                          whileInView={{ scaleY: 1 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, delay: reduceMotion ? 0 : i * 0.03 }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-content-muted">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-world-mars" />{t("worlds.legendMars")}</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-world-earth" />{t("worlds.legendEarth")}</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-content-muted" />{t("worlds.legendControl")}</span>
                </div>
                <p className={`text-[11px] ${isSynthetic ? "font-semibold text-status-warn" : "text-content-muted"}`}>
                  {isSynthetic ? t("worlds.syntheticWarning") : t("worlds.terrainSources")}
                </p>
                <button
                  type="button"
                  onClick={onOpenFullAnalysis}
                  className="mt-auto inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-border-subtle px-4 text-sm font-semibold text-content transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {t("worlds.openFull")}
                </button>
              </>
            ) : (
              <div className="flex flex-1 flex-col justify-center gap-3">
                <p className="text-sm text-content-muted">{t("worlds.pickCell")}</p>
                <button
                  type="button"
                  onClick={() => onPickEarthCell("83b224fffffffff")}
                  className="inline-flex min-h-11 items-center gap-2 self-start rounded-full bg-accent px-4 text-sm font-bold text-accent-foreground shadow-ckepi-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content"
                >
                  <Pictogram name="hexCell" className="h-5 w-5" />
                  {t("worlds.pickAntofagasta")}
                </button>
                <p className="text-[11px] text-content-muted">
                  {t("worlds.terrainSources")}
                </p>
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>
    </section>
  );
}
