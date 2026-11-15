import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { compareCellWithSite } from "../../api/client";
import { formatNumber } from "../../i18n";
import type { PlanetarySite, SiteComparisonResponse } from "../../types/analog";
import { NumberTicker } from "../motion/NumberTicker";
import { CopernicusNotice } from "../ui/CopernicusNotice";
import { PaperPlanet, type WorldKey } from "./PaperPlanet";
import { Pictogram } from "./Pictograms";

const STEPS: Record<WorldKey, string[]> = {
  mars: ["cross", "match", "gaps", "use"],
  moon: ["cross", "match", "gaps", "use"],
  earth: ["lab", "use"],
};

// Antofagasta windows with real DEMs (docs/RESULTADOS_TERRENO_REALES.md).
const LOCAL_CELLS = ["83b224fffffffff", "83b220fffffffff", "83b225fffffffff", "83b221fffffffff"];

interface CrossingDialogProps {
  world: WorldKey | null;
  onClose: () => void;
  moon: PlanetarySite | null;
  mars: PlanetarySite | null;
  marsCrossing: SiteComparisonResponse | null;
}

/** Interactive "crossing" between a world and Antofagasta, one idea per step, with motion. */
export function CrossingDialog({ world, onClose, moon, mars, marsCrossing }: CrossingDialogProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!world) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    setStep(0);
    const id = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(id);
      returnFocus.current?.focus();
    };
  }, [world]);

  const steps = world ? STEPS[world] : [];
  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowRight") go(step + 1);
    if (event.key === "ArrowLeft") go(step - 1);
    if (event.key === "Tab" && panelRef.current) {
      // Keep keyboard focus inside the dialog.
      const items = panelRef.current.querySelectorAll<HTMLElement>("button, input, [href], [tabindex='0']");
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  const target = world === "moon" ? moon : mars;
  const offset = reduceMotion ? 0 : 60;

  return (
    <AnimatePresence>
      {world && (
        <motion.div
          key="crossing"
          className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label={t("crossing.close")}
            className="absolute inset-0 bg-ckepi-space/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crossing-title"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
            className="ckepi-glass relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-border-subtle focus:outline-none sm:rounded-3xl"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
                  {t("crossing.stepOf", { n: step + 1, total: steps.length })}
                </p>
                <h2 id="crossing-title" className="text-lg font-bold text-content">
                  {t(`crossing.${world}.title`)}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-full border border-border-subtle px-4 text-sm font-semibold text-content hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {t("crossing.close")}
              </button>
            </header>

            <div className="relative flex-1 overflow-y-auto px-5 py-6">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={`${world}-${steps[step]}`}
                  initial={{ opacity: 0, x: direction * offset }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -offset }}
                  transition={{ type: "spring", stiffness: 190, damping: 26 }}
                >
                  <StepContent
                    world={world}
                    step={steps[step]}
                    target={target}
                    marsCrossing={marsCrossing}
                    onGo={go}
                  />
                </motion.div>
              </AnimatePresence>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-border-subtle px-5 py-3">
              <div className="flex gap-1.5" aria-hidden="true">
                {steps.map((s, i) => (
                  <span key={s} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent" : "w-1.5 bg-content-muted/40"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(step - 1)}
                  disabled={step === 0}
                  className="min-h-11 rounded-full border border-border-subtle px-4 text-sm font-semibold text-content disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {t("crossing.back")}
                </button>
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => go(step + 1)}
                    className="min-h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content"
                  >
                    {t("crossing.next")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="min-h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content"
                  >
                    {t("crossing.done")}
                  </button>
                )}
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface StepContentProps {
  world: WorldKey;
  step: string;
  target: PlanetarySite | null;
  marsCrossing: SiteComparisonResponse | null;
  onGo: (step: number) => void;
}

function StepContent({ world, step, target, marsCrossing }: StepContentProps) {
  const { t } = useTranslation();
  const base = `crossing.${world}.${step}`;
  const heading = (
    <>
      <h3 className="text-2xl font-bold text-content">{t(`${base}.title`)}</h3>
      <p className="mt-2 text-base leading-relaxed text-content-muted">{t(`${base}.body`)}</p>
    </>
  );

  if (step === "cross") return <CrossStep world={world}>{heading}</CrossStep>;
  if (step === "match" && world === "mars") return <TerrainMatch crossing={marsCrossing}>{heading}</TerrainMatch>;
  if (step === "match" && world === "moon") return <ClimateMatch crossing={marsCrossing} moon={target}>{heading}</ClimateMatch>;
  if (step === "gaps") return <GapsStep world={world} target={target} crossing={marsCrossing}>{heading}</GapsStep>;
  if (step === "use") return <UseStep base={base}>{heading}</UseStep>;
  return <LabStep>{heading}</LabStep>;
}

/** Two paper planets travel toward each other: the crossing. */
function CrossStep({ world, children }: { world: WorldKey; children: ReactNode }) {
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <div className="space-y-6">
      <div className="relative flex h-40 items-center justify-center">
        <motion.div
          initial={reduceMotion ? false : { x: -120, opacity: 0 }}
          animate={{ x: -40, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 16 }}
        >
          <PaperPlanet world="earth" className="h-32 w-32" />
        </motion.div>
        <motion.div
          className="h-0.5 w-10 border-t-2 border-dashed border-accent"
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        />
        <motion.div
          initial={reduceMotion ? false : { x: 120, opacity: 0 }}
          animate={{ x: 40, opacity: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 16 }}
        >
          <PaperPlanet world={world} className="h-32 w-32" />
        </motion.div>
      </div>
      <div>{children}</div>
    </div>
  );
}

/** Real terrain comparison Jezero ↔ Antofagasta (CTX DEM vs Copernicus GLO-30, 30 m). */
function TerrainMatch({ crossing, children }: { crossing: SiteComparisonResponse | null; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const slope = crossing?.statistical_distribution?.slope_distribution ?? null;
  const max = slope ? Math.max(...slope.planetary_density, ...slope.earth_density, ...slope.control_yungay_density, 0.0001) : 1;
  return (
    <div className="space-y-5">
      {children}
      {slope ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-accent/50 p-3">
              <p className="text-xs text-content-muted">{t("crossing.mars.match.ours")}</p>
              <NumberTicker value={slope.wasserstein_distance} format={(v) => `${formatNumber(v, i18n.language, 2)}°`} className="font-mono text-3xl font-semibold text-accent" />
            </div>
            <div className="rounded-2xl border border-border-subtle p-3">
              <p className="text-xs text-content-muted">{t("crossing.mars.match.classic")}</p>
              <NumberTicker value={slope.control_yungay_w1} format={(v) => `${formatNumber(v, i18n.language, 2)}°`} className="font-mono text-3xl font-semibold text-content-muted" />
            </div>
          </div>
          <div className="flex h-28 items-end gap-[3px]" aria-hidden="true">
            {slope.bin_centers.map((center, i) => (
              <div key={center} className="flex h-full flex-1 items-end gap-px">
                {[
                  { d: slope.planetary_density[i], c: "bg-world-mars" },
                  { d: slope.earth_density[i], c: "bg-world-earth" },
                  { d: slope.control_yungay_density[i], c: "bg-content-muted/50" },
                ].map((series, s) => (
                  <motion.div
                    key={s}
                    className={`w-full rounded-t-sm ${series.c}`}
                    style={{ height: `${Math.max(2, (series.d / max) * 100)}%`, originY: 1 }}
                    initial={reduceMotion ? false : { scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.6, delay: reduceMotion ? 0 : 0.2 + i * 0.03 }}
                  />
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-content-muted">{t("crossing.mars.match.legend")}</p>
          <p className="rounded-xl border border-border-subtle px-3 py-2 text-xs text-content-muted">{t("crossing.mars.match.source")}</p>
          <CopernicusNotice />
        </>
      ) : (
        <p className="text-sm text-content-muted">{t("crossing.loading")}</p>
      )}
    </div>
  );
}

function CompareRow({ label, earth, other, unit, digits }: { label: string; earth: number | null; other: number | null; unit: string; digits: number }) {
  const { i18n } = useTranslation();
  const f = (v: number | null) => (v === null ? "—" : `${formatNumber(v, i18n.language, digits)} ${unit}`);
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 border-t border-border-subtle py-2 text-sm">
      <span className="font-semibold text-content">{label}</span>
      <span className="font-mono text-world-earth">{f(earth)}</span>
      <span className="font-mono text-world-moon">{f(other)}</span>
    </div>
  );
}

/** Moon: partial climate likeness, read from the API (Earth cell vs lunar south pole). */
function ClimateMatch({ crossing, moon, children }: { crossing: SiteComparisonResponse | null; moon: PlanetarySite | null; children: ReactNode }) {
  const { t } = useTranslation();
  const earth = crossing?.match.earth_variables ?? null;
  const get = (v: Record<string, number> | undefined, k: string) => (v && typeof v[k] === "number" ? v[k] : null);
  return (
    <div className="space-y-4">
      {children}
      <div>
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 text-[11px] uppercase tracking-wider text-content-muted">
          <span />
          <span>{t("worlds.earth")}</span>
          <span>{t("worlds.moon")}</span>
        </div>
        <CompareRow label={t("worlds.rows.thermalSwing")} earth={get(earth?.dependent, "diurnal_temp_amplitude_k")} other={get(moon?.variables.dependent, "diurnal_temp_amplitude_k")} unit="K" digits={0} />
        <CompareRow label={t("crossing.moon.match.uv")} earth={get(earth?.independent, "uv_irradiance_index")} other={get(moon?.variables.independent, "uv_irradiance_index")} unit="" digits={1} />
        <CompareRow label={t("crossing.moon.match.dryness")} earth={get(earth?.independent, "aridity_index")} other={get(moon?.variables.independent, "aridity_index")} unit="" digits={2} />
      </div>
      <p className="text-xs text-content-muted">{t("crossing.moon.match.note")}</p>
    </div>
  );
}

/** What Earth cannot imitate, with an interactive backpack. */
function GapsStep({ world, target, crossing, children }: { world: WorldKey; target: PlanetarySite | null; crossing: SiteComparisonResponse | null; children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [kg, setKg] = useState(10);
  const g = target?.variables.breakage.gravity_g ?? (world === "moon" ? 0.166 : 0.377);
  const earthB = crossing?.match.earth_variables.breakage;
  const f = (v: number, d = 1) => formatNumber(v, i18n.language, d);
  return (
    <div className="space-y-5">
      {children}
      <div className="rounded-2xl border border-border-subtle p-4">
        <div className="flex items-center gap-3">
          <Pictogram name="gravity" className="h-10 w-10 text-accent" />
          <label htmlFor="backpack-kg" className="text-sm font-semibold text-content">
            {t("crossing.gaps.backpack", { kg })}
          </label>
        </div>
        <input
          id="backpack-kg"
          type="range"
          min={1}
          max={40}
          value={kg}
          onChange={(e) => setKg(Number(e.target.value))}
          className="mt-3 h-11 w-full accent-accent"
        />
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-xs text-content-muted">{t("worlds.earth")}</p>
            <p className="font-mono text-2xl text-world-earth">{f(kg)} kg</p>
          </div>
          <div>
            <p className="text-xs text-content-muted">{t(`worlds.${world}`)}</p>
            <motion.p key={kg} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className={`font-mono text-2xl ${world === "moon" ? "text-world-moon" : "text-world-mars"}`}>
              {f(kg * g)} kg
            </motion.p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-status-break/40 p-3">
          <Pictogram name="pressure" className="h-8 w-8 text-status-break" />
          <p className="mt-1 text-sm font-semibold text-content">{t("worlds.rows.pressure")}</p>
          <p className="font-mono text-xs text-content-muted">
            {t("worlds.earth")} {earthB ? f(earthB.atm_pressure_mbar, 0) : "—"} mbar · {t(`worlds.${world}`)} {target ? f(target.variables.breakage.atm_pressure_mbar, world === "moon" ? 0 : 1) : "—"} mbar
          </p>
        </div>
        <div className="rounded-2xl border border-status-break/40 p-3">
          <Pictogram name="radiation" className="h-8 w-8 text-status-break" />
          <p className="mt-1 text-sm font-semibold text-content">{t("worlds.rows.radiation")}</p>
          <p className="font-mono text-xs text-content-muted">
            {t("worlds.earth")} {earthB ? f(earthB.radiation_msv_yr) : "—"} · {t(`worlds.${world}`)} {target ? f(target.variables.breakage.radiation_msv_yr, 0) : "—"} mSv/a
          </p>
        </div>
      </div>
    </div>
  );
}

/** Uses, STEAM skills and local jobs (text from i18n arrays). */
function UseStep({ base, children }: { base: string; children: ReactNode }) {
  const { t } = useTranslation();
  const groups: ["tests" | "skills" | "jobs", "slope" | "terrain" | "hexCell"][] = [
    ["tests", "slope"],
    ["skills", "terrain"],
    ["jobs", "hexCell"],
  ];
  return (
    <div className="space-y-5">
      {children}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {groups.map(([group, pictogram], i) => {
          const items = t(`${base}.${group}`, { returnObjects: true }) as string[];
          return (
            <motion.div
              key={group}
              className="rounded-2xl border border-border-subtle p-4"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Pictogram name={pictogram} className="h-8 w-8 text-accent" />
              <p className="mt-2 text-sm font-bold text-content">{t(`crossing.groups.${group}`)}</p>
              <ul className="mt-2 space-y-1 text-sm text-content-muted">
                {Array.isArray(items) && items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/** Antofagasta as a natural lab: the four real-DEM cells ranked against Jezero. */
function LabStep({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [rows, setRows] = useState<{ h3: string; w1: number }[]>([]);
  const [control, setControl] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      LOCAL_CELLS.map((h3) =>
        compareCellWithSite(h3, "mars_jezero_crater", "ridge", { signal: controller.signal }).then((res) => {
          const slope = res.statistical_distribution?.slope_distribution;
          if (slope) setControl(slope.control_yungay_w1);
          return slope ? { h3, w1: slope.wasserstein_distance } : null;
        })
      )
    )
      .then((list) => setRows(list.filter((r): r is { h3: string; w1: number } => r !== null).sort((a, b) => a.w1 - b.w1)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const max = Math.max(...rows.map((r) => r.w1), control ?? 0, 0.1);
  return (
    <div className="space-y-4">
      {children}
      {rows.length === 0 ? (
        <p className="text-sm text-content-muted">{t("crossing.loading")}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={row.h3}>
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-content">{t(`crossing.earth.lab.cells.${row.h3}`)}</span>
                <span className="font-mono text-content-muted">{formatNumber(row.w1, i18n.language, 2)}°</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-muted">
                <motion.div
                  className={`h-full rounded-full ${i === 0 ? "bg-accent" : "bg-content-muted/60"}`}
                  initial={reduceMotion ? false : { width: 0 }}
                  animate={{ width: `${(row.w1 / max) * 100}%` }}
                  transition={{ duration: 0.8, delay: i * 0.12 }}
                />
              </div>
            </div>
          ))}
          {control !== null && (
            <p className="pt-2 text-xs text-content-muted">
              {t("crossing.earth.lab.control", { value: formatNumber(control, i18n.language, 2) })}
            </p>
          )}
          <CopernicusNotice />
        </div>
      )}
    </div>
  );
}
