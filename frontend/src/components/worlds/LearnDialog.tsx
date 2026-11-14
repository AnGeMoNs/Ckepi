import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

import { compareCellWithSite } from "../../api/client";
import { formatNumber } from "../../i18n";
import type { PlanetarySite, SiteComparisonResponse } from "../../types/analog";
import { PaperPlanet, type WorldKey } from "./PaperPlanet";
import { Pictogram, type PictogramName } from "./Pictograms";

/**
 * Local-mode lesson: one idea per step, a big pictogram, one sentence, something to touch,
 * and a "listen" button. Real data is translated into words ("very similar", "not similar").
 */
const STEPS: Record<WorldKey, string[]> = {
  mars: ["what", "similar", "different", "why"],
  moon: ["what", "similar", "different", "why"],
  earth: ["what", "zones", "why"],
};

const STEP_PICTO: Record<string, PictogramName> = {
  similar: "slope",
  different: "gravity",
  why: "rover",
  zones: "hexCell",
};

const ANTOFAGASTA_CELL = "83b224fffffffff";
const LOCAL_CELLS = ["83b224fffffffff", "83b225fffffffff", "83b220fffffffff", "83b221fffffffff"];

interface LearnDialogProps {
  world: WorldKey | null;
  sites: PlanetarySite[];
  onClose: () => void;
}

export function LearnDialog({ world, sites, onClose }: LearnDialogProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [speaking, setSpeaking] = useState(false);
  const [crossing, setCrossing] = useState<SiteComparisonResponse | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

  // Real comparison Jezero ↔ Antofagasta (cached on the backend, answers in < 0.5 s).
  useEffect(() => {
    if (!world || crossing) return;
    const controller = new AbortController();
    compareCellWithSite(ANTOFAGASTA_CELL, "mars_jezero_crater", "ridge", { signal: controller.signal })
      .then(setCrossing)
      .catch(() => undefined);
    return () => controller.abort();
  }, [world, crossing]);

  useEffect(() => {
    if (!world) return;
    const previous = document.activeElement as HTMLElement | null;
    setStep(0);
    const id = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(id);
      if (canSpeak) window.speechSynthesis.cancel();
      previous?.focus();
    };
  }, [world, canSpeak]);

  useEffect(() => {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [step, canSpeak]);

  const steps = world ? STEPS[world] : [];
  const key = world ? `learn.${world}.${steps[step]}` : "";
  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return;
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const speak = () => {
    if (!canSpeak) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(`${t(`${key}.title`)}. ${t(`${key}.text`)}`);
    const lang = i18n.language.slice(0, 2);
    u.lang = lang === "pt" ? "pt-BR" : lang === "en" ? "en-US" : "es-CL";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
    setSpeaking(true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") onClose();
    if (event.key === "ArrowRight") go(step + 1);
    if (event.key === "ArrowLeft") go(step - 1);
  };

  const target = world === "moon"
    ? sites.find((s) => s.site_id === "moon_shackleton_pole") ?? null
    : sites.find((s) => s.site_id === "mars_jezero_crater") ?? null;

  return (
    <AnimatePresence>
      {world && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" aria-label={t("crossing.close")} className="absolute inset-0 bg-ckepi-space/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="learn-title"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 200, damping: 24 }}
            className="ckepi-glass relative flex max-h-[94svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[2rem] border border-border-subtle focus:outline-none sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between gap-2 px-5 pt-4">
              <div className="flex gap-1.5" aria-label={t("crossing.stepOf", { n: step + 1, total: steps.length })}>
                {steps.map((s, i) => (
                  <span key={s} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-accent" : "w-2 bg-content-muted/40"}`} />
                ))}
              </div>
              <button type="button" onClick={onClose} className="ckepi-cardboard min-h-11 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                {t("crossing.close")}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 pt-2">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: reduceMotion ? 0 : dir * 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: reduceMotion ? 0 : dir * -50 }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  className="flex flex-col items-center text-center"
                >
                  {steps[step] === "what" ? (
                    <PaperPlanet world={world} className="h-36 w-36" />
                  ) : (
                    <Pictogram name={world === "moon" && steps[step] === "similar" ? "sun" : STEP_PICTO[steps[step]]} className="h-20 w-20 text-accent" />
                  )}
                  <h2 id="learn-title" className="mt-3 text-2xl font-bold text-content sm:text-3xl">{t(`${key}.title`)}</h2>
                  <p className="mt-2 max-w-lg text-lg leading-relaxed text-content-muted">{t(`${key}.text`)}</p>
                  <div className="mt-5 w-full">
                    <Interactive world={world} step={steps[step]} crossing={crossing} target={target} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-5 py-3">
              {canSpeak ? (
                <button type="button" onClick={speak} aria-pressed={speaking} className="ckepi-cardboard min-h-11 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {speaking ? t("story.stopListening") : t("story.listen")}
                </button>
              ) : <span />}
              <div className="flex gap-2">
                <button type="button" onClick={() => go(step - 1)} disabled={step === 0} className="min-h-11 rounded-full border border-border-subtle px-4 text-sm font-semibold text-content disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  {t("crossing.back")}
                </button>
                <button
                  type="button"
                  onClick={() => (step < steps.length - 1 ? go(step + 1) : onClose())}
                  className="min-h-11 rounded-full bg-accent px-5 text-sm font-bold text-accent-foreground shadow-ckepi-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-content"
                >
                  {step < steps.length - 1 ? t("crossing.next") : t("crossing.done")}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface InteractiveProps {
  world: WorldKey;
  step: string;
  crossing: SiteComparisonResponse | null;
  target: PlanetarySite | null;
}

function Interactive({ world, step, crossing, target }: InteractiveProps) {
  if (step === "similar" && world === "mars") return <SimilarityMeter crossing={crossing} />;
  if (step === "similar" && world === "moon") return <DayNight crossing={crossing} moon={target} />;
  if (step === "different") return <Backpack world={world} target={target} />;
  if (step === "zones") return <Zones />;
  if (step === "why") return <WhyChips world={world} />;
  return null;
}

/** Words, not numbers: where each place falls between "very similar" and "not similar". */
function Meter({ value, max, colorClass }: { value: number; max: number; colorClass: string }) {
  const reduceMotion = useReducedMotion();
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="relative h-4 rounded-full bg-gradient-to-r from-status-valid/60 via-status-warn/60 to-status-break/60">
      <motion.span
        className={`absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-surface ${colorClass}`}
        initial={reduceMotion ? false : { left: "0%" }}
        animate={{ left: `${pct}%` }}
        transition={{ type: "spring", stiffness: 90, damping: 14 }}
      />
    </div>
  );
}

function SimilarityMeter({ crossing }: { crossing: SiteComparisonResponse | null }) {
  const { t, i18n } = useTranslation();
  const [zone, setZone] = useState<"pampa" | "yungay">("pampa");
  const slope = crossing?.statistical_distribution?.slope_distribution;
  if (!slope) return <p className="text-sm text-content-muted">{t("crossing.loading")}</p>;
  const value = zone === "pampa" ? slope.wasserstein_distance : slope.control_yungay_w1;
  return (
    <div className="space-y-3 text-left">
      <div className="flex justify-center gap-2">
        {(["pampa", "yungay"] as const).map((z) => (
          <button key={z} type="button" onClick={() => setZone(z)} aria-pressed={zone === z} className={`ckepi-cardboard min-h-11 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${zone === z ? "ckepi-cardboard-active" : ""}`}>
            {t(`learn.zone.${z}`)}
          </button>
        ))}
      </div>
      <Meter value={value} max={7} colorClass="bg-world-mars" />
      <div className="flex justify-between text-xs font-semibold text-content-muted">
        <span>{t("learn.scale.very")}</span>
        <span>{t("learn.scale.not")}</span>
      </div>
      <p className="text-center text-base font-semibold text-content">
        {t(zone === "pampa" ? "learn.mars.similar.pampa" : "learn.mars.similar.yungay")}
      </p>
      <p className="text-center font-mono text-[11px] text-content-muted">
        {t("learn.mars.similar.source", { value: formatNumber(value, i18n.language, 2) })}
      </p>
    </div>
  );
}

function DayNight({ crossing, moon }: { crossing: SiteComparisonResponse | null; moon: PlanetarySite | null }) {
  const { t, i18n } = useTranslation();
  const [night, setNight] = useState(false);
  const temps = (vars: Record<string, number> | undefined) => {
    const mean = vars?.mean_surface_temp_k;
    const amp = vars?.diurnal_temp_amplitude_k;
    if (typeof mean !== "number" || typeof amp !== "number") return null;
    return (night ? mean - amp / 2 : mean + amp / 2) - 273.15;
  };
  const earth = temps(crossing?.match.earth_variables.dependent);
  const lunar = temps(moon?.variables.dependent);
  const cell = (label: string, value: number | null, cls: string) => (
    <div className="ckepi-glass rounded-2xl border border-border-subtle p-3 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">{label}</p>
      <motion.p key={`${label}-${night}`} initial={{ scale: 1.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`font-mono text-3xl ${cls}`}>
        {value === null ? "…" : `${formatNumber(value, i18n.language, 0)} °C`}
      </motion.p>
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="flex justify-center gap-2">
        {[false, true].map((n) => (
          <button key={String(n)} type="button" onClick={() => setNight(n)} aria-pressed={night === n} className={`ckepi-cardboard min-h-11 rounded-full px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${night === n ? "ckepi-cardboard-active" : ""}`}>
            {t(n ? "learn.night" : "learn.day")}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cell(t("local.atacama"), earth, "text-world-earth")}
        {cell(t("worlds.moon"), lunar, "text-world-moon")}
      </div>
      <p className="text-xs text-content-muted">{t("learn.moon.similar.note")}</p>
    </div>
  );
}

function Backpack({ world, target }: { world: WorldKey; target: PlanetarySite | null }) {
  const { t, i18n } = useTranslation();
  const [kg, setKg] = useState(10);
  const g = target?.variables.breakage.gravity_g ?? (world === "moon" ? 0.166 : 0.377);
  return (
    <div className="space-y-3">
      <label htmlFor="learn-kg" className="text-base font-semibold text-content">{t("crossing.gaps.backpack", { kg })}</label>
      <input id="learn-kg" type="range" min={1} max={40} value={kg} onChange={(e) => setKg(Number(e.target.value))} className="h-11 w-full accent-accent" />
      <div className="grid grid-cols-2 gap-3">
        <div className="ckepi-glass rounded-2xl border border-border-subtle p-3">
          <p className="text-xs uppercase tracking-wider text-content-muted">{t("local.atacama")}</p>
          <p className="font-mono text-3xl text-world-earth">{formatNumber(kg, i18n.language, 0)} kg</p>
        </div>
        <div className="ckepi-glass rounded-2xl border border-border-subtle p-3">
          <p className="text-xs uppercase tracking-wider text-content-muted">{t(`worlds.${world}`)}</p>
          <motion.p key={kg} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className={`font-mono text-3xl ${world === "moon" ? "text-world-moon" : "text-world-mars"}`}>
            {formatNumber(kg * g, i18n.language, 1)} kg
          </motion.p>
        </div>
      </div>
      <p className="text-sm text-content-muted">{t(`learn.${world}.different.extra`)}</p>
    </div>
  );
}

function Zones() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState<{ h3: string; w1: number }[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    Promise.all(
      LOCAL_CELLS.map((h3) =>
        compareCellWithSite(h3, "mars_jezero_crater", "ridge", { signal: controller.signal }).then((r) => {
          const s = r.statistical_distribution?.slope_distribution;
          return s ? { h3, w1: s.wasserstein_distance } : null;
        })
      )
    )
      .then((list) => setRows(list.filter((r): r is { h3: string; w1: number } => r !== null).sort((a, b) => a.w1 - b.w1)))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  if (rows.length === 0) return <p className="text-sm text-content-muted">{t("crossing.loading")}</p>;
  return (
    <ol className="space-y-3 text-left">
      {rows.map((row, i) => (
        <motion.li key={row.h3} initial={reduceMotion ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
          <div className="mb-1 flex justify-between text-sm font-semibold text-content">
            <span>{t(`crossing.earth.lab.cells.${row.h3}`)}</span>
            <span className={i === 0 ? "text-status-valid" : "text-content-muted"}>
              {t(row.w1 < 1 ? "learn.scale.very" : row.w1 < 4 ? "learn.scale.some" : "learn.scale.not")}
            </span>
          </div>
          <Meter value={row.w1} max={7} colorClass={i === 0 ? "bg-accent" : "bg-content-muted"} />
        </motion.li>
      ))}
    </ol>
  );
}

function WhyChips({ world }: { world: WorldKey }) {
  const { t } = useTranslation();
  const items = t(`learn.${world}.why.items`, { returnObjects: true }) as string[];
  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {Array.isArray(items) &&
        items.map((item, i) => (
          <motion.li key={item} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} className="ckepi-glass rounded-2xl border border-border-subtle p-3 text-sm font-semibold text-content">
            {item}
          </motion.li>
        ))}
    </ul>
  );
}

