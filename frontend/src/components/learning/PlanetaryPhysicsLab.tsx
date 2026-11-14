import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Droplets,
  FlaskConical,
  HelpCircle,
  Scale,
  Waves,
  Wind,
  XCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "../../i18n";
import type {
  AnalogMatchItem,
  PlanetaryBody,
  PlanetarySite,
  SiteComparisonResponse,
} from "../../types/analog";
import {
  computeDynamicWindPressure,
  computeJumpFromEarthHeight,
  computeProjectileComparison,
  computeRockPushComparison,
  computeRoverSlopeComparison,
  computeShallowWaveComparison,
  computeWeightComparison,
  evaluateWaterStability,
  type PhysicsBody,
} from "../../utils/planetaryPhysics";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { FunFactCards } from "./FunFactCards";

type ExperimentId =
  | "weight"
  | "jump"
  | "projectile"
  | "waves"
  | "rocks"
  | "rover"
  | "wind"
  | "water";

interface PlanetaryPhysicsLabProps {
  body: PlanetaryBody;
  activeSite?: PlanetarySite;
  selectedCell?: AnalogMatchItem | null;
  comparison?: SiteComparisonResponse | null;
  onGoToCompare: () => void;
  onGoToPlan: () => void;
}

const BODIES: PhysicsBody[] = ["earth", "mars", "moon"];

type CategoryId = "body" | "physics" | "engineering" | "curiosities";

const CATEGORIES: { id: CategoryId; emoji: string }[] = [
  { id: "body", emoji: "🧑‍🚀" },
  { id: "physics", emoji: "🌊" },
  { id: "engineering", emoji: "🤖" },
  { id: "curiosities", emoji: "🪐" },
];

export function PlanetaryPhysicsLab({
  body,
  activeSite,
  selectedCell,
  comparison,
  onGoToCompare,
  onGoToPlan,
}: PlanetaryPhysicsLabProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const [experiment, setExperiment] = useState<ExperimentId>("weight");
  const [category, setCategory] = useState<CategoryId>("body");
  const [massKg, setMassKg] = useState<number>(80);
  const [earthJumpCm, setEarthJumpCm] = useState<number>(45);
  const [throwSpeedMs, setThrowSpeedMs] = useState<number>(15);
  const [throwAngleDeg, setThrowAngleDeg] = useState<number>(45);
  const [poolDepthM, setPoolDepthM] = useState<number>(1.5);
  const [rockMassKg, setRockMassKg] = useState<number>(50);
  const [rockAccelMs2, setRockAccelMs2] = useState<number>(1.0);
  const [roverMassKg, setRoverMassKg] = useState<number>(100);
  const [slopeDeg, setSlopeDeg] = useState<number>(15);
  const [frictionCoeff, setFrictionCoeff] = useState<number>(0.55);
  const [windSpeedMs, setWindSpeedMs] = useState<number>(28);
  const [waterTempC, setWaterTempC] = useState<number>(15);
  const [showScienceDetails, setShowScienceDetails] = useState<boolean>(true);

  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});

  const siteSlopeDeg = activeSite?.variables.independent.slope_deg;
  const earthSlopeDeg = comparison?.variable_deltas.find(
    (d) => d.variable === "slope_deg"
  )?.earth_value;

  const weightRes = useMemo(() => computeWeightComparison(massKg), [massKg]);
  const jumpRes = useMemo(() => computeJumpFromEarthHeight(earthJumpCm), [earthJumpCm]);
  const projRes = useMemo(
    () => computeProjectileComparison(throwSpeedMs, throwAngleDeg),
    [throwSpeedMs, throwAngleDeg]
  );
  const waveRes = useMemo(() => computeShallowWaveComparison(poolDepthM), [poolDepthM]);
  const rockRes = useMemo(
    () => computeRockPushComparison(rockMassKg, rockAccelMs2, frictionCoeff),
    [rockMassKg, rockAccelMs2, frictionCoeff]
  );
  const roverRes = useMemo(
    () => computeRoverSlopeComparison(roverMassKg, slopeDeg, frictionCoeff),
    [roverMassKg, slopeDeg, frictionCoeff]
  );
  const windRes = useMemo(() => computeDynamicWindPressure(windSpeedMs), [windSpeedMs]);
  const waterRes = useMemo(() => evaluateWaterStability(waterTempC), [waterTempC]);

  const experiments: { id: ExperimentId; label: string; category: CategoryId }[] = [
    { id: "weight", label: t("learn.experiments.weight.tab"), category: "body" },
    { id: "jump", label: t("learn.experiments.jump.tab"), category: "body" },
    { id: "projectile", label: t("learn.experiments.projectile.tab"), category: "physics" },
    { id: "waves", label: t("learn.experiments.waves.tab"), category: "physics" },
    { id: "water", label: t("learn.experiments.water.tab"), category: "physics" },
    { id: "rocks", label: t("learn.experiments.rocks.tab"), category: "engineering" },
    { id: "rover", label: t("learn.experiments.rover.tab"), category: "engineering" },
    { id: "wind", label: t("learn.experiments.wind.tab"), category: "engineering" },
  ];
  const categoryExperiments = experiments.filter((e) => e.category === category);
  const showExperiments = category !== "curiosities";
  const targetBody: PlanetaryBody = body;

  const selectCategory = (next: CategoryId) => {
    setCategory(next);
    const first = experiments.find((e) => e.category === next);
    if (first) setExperiment(first.id);
  };

  // Dynamic mini-challenge grounded in real compared slope data when available
  const dynamicSlopeVal = earthSlopeDeg ?? siteSlopeDeg ?? 15;
  const dynamicRover = useMemo(
    () => computeRoverSlopeComparison(100, dynamicSlopeVal, 0.55),
    [dynamicSlopeVal]
  );

  const challenges = [
    {
      id: "mass_vs_weight",
      question: t("learn.challenges.mass.question"),
      options: [
        { id: "a", label: t("learn.challenges.mass.optA") },
        { id: "b", label: t("learn.challenges.mass.optB") },
        { id: "c", label: t("learn.challenges.mass.optC") },
      ],
      correct: "b",
      explanation: t("learn.challenges.mass.explanation"),
    },
    {
      id: "dynamic_rover_slope",
      question: t("learn.challenges.roverDynamic.question", {
        slope: formatNumber(dynamicSlopeVal, lang, 1),
        site: activeSite ? t(activeSite.name_key) : t("bodies.mars"),
      }),
      options: [
        { id: "a", label: t("learn.challenges.roverDynamic.optA") },
        { id: "b", label: t("learn.challenges.roverDynamic.optB") },
        { id: "c", label: t("learn.challenges.roverDynamic.optC") },
      ],
      correct: "b",
      explanation: t("learn.challenges.roverDynamic.explanation", {
        earthN: formatNumber(dynamicRover.earth.parallelForceN, lang, 1),
        marsN: formatNumber(dynamicRover.mars.parallelForceN, lang, 1),
        marsNormalN: formatNumber(dynamicRover.mars.normalForceN, lang, 1),
      }),
    },
    {
      id: "non_replicable",
      question: t("learn.challenges.nonReplicable.question"),
      options: [
        { id: "a", label: t("learn.challenges.nonReplicable.optA") },
        { id: "b", label: t("learn.challenges.nonReplicable.optB") },
        { id: "c", label: t("learn.challenges.nonReplicable.optC") },
      ],
      correct: "c",
      explanation: t("learn.challenges.nonReplicable.explanation"),
    },
    {
      id: "slope_distributions",
      question: t("learn.challenges.distributions.question"),
      options: [
        { id: "a", label: t("learn.challenges.distributions.optA") },
        { id: "b", label: t("learn.challenges.distributions.optB") },
        { id: "c", label: t("learn.challenges.distributions.optC") },
      ],
      correct: "b",
      explanation: t("learn.challenges.distributions.explanation"),
    },
  ];
  const correctCount = challenges.filter((ch) => quizAnswers[ch.id] === ch.correct).length;

  // Build SVG parabola paths for projectile experiment
  const maxRange = Math.max(projRes.moon.rangeM, projRes.mars.rangeM, projRes.earth.rangeM, 1);
  const maxHeight = Math.max(
    projRes.moon.maxHeightM,
    projRes.mars.maxHeightM,
    projRes.earth.maxHeightM,
    1
  );

  const buildParabolaPath = (rangeM: number, peakM: number) => {
    const w = 320;
    const h = 130;
    const padX = 16;
    const padY = 14;
    const usableW = w - padX * 2;
    const usableH = h - padY * 2;
    const xEnd = padX + (rangeM / maxRange) * usableW;
    const xMid = (padX + xEnd) / 2;
    const yBase = h - padY;
    const yPeak = yBase - (peakM / maxHeight) * usableH;
    // Quadratic Bezier control point at 2*yPeak - yBase puts vertex at yPeak
    const yCtrl = 2 * yPeak - yBase;
    return `M ${padX} ${yBase} Q ${xMid.toFixed(1)} ${yCtrl.toFixed(1)} ${xEnd.toFixed(1)} ${yBase}`;
  };

  return (
    <div className="space-y-6">
      {/* Header / Context Banner */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <FlaskConical className="h-5 w-5 text-accent" aria-hidden="true" />
              <CardTitle>{t("learn.title")}</CardTitle>
              <Badge variant="accent">ODS 4 · STEAM</Badge>
            </div>
            <p className="text-xs text-content-muted sm:text-sm">{t("learn.subtitle")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {activeSite && (
              <Badge variant="default">
                <span aria-label={t("nav.locationLabel")}>📍</span> {t(activeSite.name_key)}
              </Badge>
            )}
            {selectedCell && (
              <Badge variant="valid">
                <span aria-label={t("nav.locationLabel")}>📍</span> {t(selectedCell.region_key)} (
                {selectedCell.earth_cell_h3.slice(0, 7)}…)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level 1: pick a fun category (simple entry point for any visitor) */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-content">{t("learnHub.pickCategory")}</p>
            <div
              role="group"
              aria-label={t("learnHub.pickCategory")}
              className="grid grid-cols-2 gap-2 lg:grid-cols-4"
            >
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectCategory(cat.id)}
                    className={`flex min-h-[6.5rem] flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      active
                        ? "border-accent bg-accent/10"
                        : "border-border-subtle bg-surface hover:border-accent/40 hover:bg-surface-muted"
                    }`}
                  >
                    <span className="text-2xl leading-none" aria-hidden="true">
                      {cat.emoji}
                    </span>
                    <span className="text-sm font-semibold text-content">
                      {t(`learnHub.categories.${cat.id}.title`)}
                    </span>
                    <span className="text-xs text-content-muted">
                      {t(`learnHub.categories.${cat.id}.subtitle`)}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs italic text-content-muted" aria-live="polite">
              💭 {t(`learnHub.categories.${category}.teaser`)}
            </p>
          </div>

          {/* Fun astronaut summary for "Your body" category */}
          {category === "body" && (
            <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-content">
                <span aria-hidden="true">🧑‍🚀</span>
                {t("learnHub.astronautCard.title", { body: t(`bodies.${targetBody}`) })}
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                <li className="rounded-lg bg-surface/70 p-2.5">
                  <span className="block text-content-muted">{t("learnHub.astronautCard.mass")}</span>
                  <strong className="text-base text-content">{formatNumber(massKg, lang, 0)} kg</strong>
                  <span className="block text-[11px] text-status-valid">
                    {t("learnHub.astronautCard.massSame")}
                  </span>
                </li>
                <li className="rounded-lg bg-surface/70 p-2.5">
                  <span className="block text-content-muted">{t("learnHub.astronautCard.weight")}</span>
                  <strong className="text-base text-content">
                    {formatNumber(weightRes[targetBody].weightN, lang, 0)} N
                  </strong>
                  <span className="block text-[11px] text-content-muted">
                    {t("learnHub.astronautCard.scale", {
                      kgf: formatNumber(weightRes[targetBody].earthScaleKgf, lang, 0),
                    })}
                  </span>
                </li>
                <li className="rounded-lg bg-surface/70 p-2.5">
                  <span className="block text-content-muted">{t("learnHub.astronautCard.jump")}</span>
                  <strong className="text-base text-content">
                    {formatNumber(jumpRes[targetBody].jumpHeightM * 100, lang, 0)} cm
                  </strong>
                  <span className="block text-[11px] text-content-muted">
                    {t("learnHub.astronautCard.jumpEarth", {
                      cm: formatNumber(earthJumpCm, lang, 0),
                    })}
                  </span>
                </li>
                <li className="rounded-lg bg-surface/70 p-2.5">
                  <span className="block text-content-muted">{t("learnHub.astronautCard.airTime")}</span>
                  <strong className="text-base text-content">
                    {formatNumber(jumpRes[targetBody].hangTimeS, lang, 2)} s
                  </strong>
                  <span className="block text-[11px] text-content-muted">
                    {t("learnHub.astronautCard.airTimeEarth", {
                      s: formatNumber(jumpRes.earth.hangTimeS, lang, 2),
                    })}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {showExperiments && (
            <>
              {/* Level 2: experiments within the category + Level 3 toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div
                  role="tablist"
                  aria-label={t("learn.experimentSelectorLabel")}
                  className="flex flex-wrap gap-2"
                  onKeyDown={(e) => {
                    const idx = categoryExperiments.findIndex((x) => x.id === experiment);
                    if (idx === -1 || categoryExperiments.length < 2) return;
                    let next = -1;
                    if (e.key === "ArrowRight") next = (idx + 1) % categoryExperiments.length;
                    else if (e.key === "ArrowLeft")
                      next = (idx - 1 + categoryExperiments.length) % categoryExperiments.length;
                    else if (e.key === "Home") next = 0;
                    else if (e.key === "End") next = categoryExperiments.length - 1;
                    if (next >= 0) {
                      e.preventDefault();
                      const nextId = categoryExperiments[next].id;
                      setExperiment(nextId);
                      document.getElementById(`exp-tab-${nextId}`)?.focus();
                    }
                  }}
                >
                  {categoryExperiments.map((exp) => {
                    const active = experiment === exp.id;
                    return (
                      <button
                        key={exp.id}
                        id={`exp-tab-${exp.id}`}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-controls="experiment-panel"
                        tabIndex={active ? 0 : -1}
                        onClick={() => setExperiment(exp.id)}
                        className={`min-h-11 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm ${
                          active
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border-subtle bg-surface text-content-muted hover:bg-surface-muted hover:text-content"
                        }`}
                      >
                        {exp.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  aria-expanded={showScienceDetails}
                  onClick={() => setShowScienceDetails((prev) => !prev)}
                  className="min-h-11 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  🔬{" "}
                  {showScienceDetails
                    ? t("learn.hideScienceDetails")
                    : t("learn.showScienceDetails")}
                </button>
              </div>
            </>
          )}

          {category === "curiosities" && <FunFactCards body={body} />}

          <div
            id="experiment-panel"
            role={showExperiments ? "tabpanel" : undefined}
            aria-labelledby={showExperiments ? `exp-tab-${experiment}` : undefined}
            className={showExperiments ? "" : "hidden"}
          >

          {/* Experiment A: Weight & Gravity */}
          {experiment === "weight" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Scale className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.weight.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.weight.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.idealizedModel")}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.massKg")}:{" "}
                    <strong className="text-content">{formatNumber(massKg, lang, 1)} kg</strong>
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={250}
                    step={1}
                    value={massKg}
                    onChange={(e) => setMassKg(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>{t("learn.controls.massExact")}</span>
                  <input
                    type="number"
                    min={1}
                    max={5000}
                    step={1}
                    value={massKg}
                    onChange={(e) => setMassKg(Number(e.target.value) || 80)}
                    className="min-h-11 rounded-lg border border-border-subtle bg-surface-elevated px-3 text-sm text-content"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {BODIES.map((b) => {
                  const item = weightRes[b];
                  const highlight = b === body;
                  return (
                    <div
                      key={b}
                      className={`rounded-xl border p-3 ${
                        highlight
                          ? "border-accent bg-accent/5"
                          : "border-border-subtle bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                          {t(`bodies.${b}`)}
                        </span>
                        <span className="text-xs text-content-muted">
                          g = {formatNumber(item.gravityMs2, lang, 2)} m/s²
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-content">
                        {formatNumber(item.weightN, lang, 1)} N
                      </p>
                      <p className="mt-1 text-xs text-content-muted">
                        {t("learn.experiments.weight.massInvariant", {
                          mass: formatNumber(item.massKg, lang, 1),
                          kgf: formatNumber(item.earthScaleKgf, lang, 1),
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: P = m · g [N]
                </p>
                <p className="mt-1">{t("learn.experiments.weight.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment B: Jump */}
          {experiment === "jump" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Activity className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.jump.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.jump.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.idealizedModel")}</Badge>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted sm:max-w-md">
                <span>
                  {t("learn.controls.earthJumpCm")}:{" "}
                  <strong className="text-content">{formatNumber(earthJumpCm, lang, 0)} cm</strong>
                </span>
                <input
                  type="range"
                  min={10}
                  max={120}
                  step={1}
                  value={earthJumpCm}
                  onChange={(e) => setEarthJumpCm(Number(e.target.value))}
                  className="min-h-11 w-full cursor-pointer accent-accent"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {BODIES.map((b) => {
                  const item = jumpRes[b];
                  const barPct = Math.min(100, (item.jumpHeightM / jumpRes.moon.jumpHeightM) * 100);
                  return (
                    <div
                      key={b}
                      className={`rounded-xl border p-3 ${
                        b === body
                          ? "border-accent bg-accent/5"
                          : "border-border-subtle bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-content-muted">
                        <span className="font-semibold uppercase">{t(`bodies.${b}`)}</span>
                        <span>{formatNumber(item.ratioVsEarth, lang, 2)}×</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-content">
                        {formatNumber(item.jumpHeightM, lang, 2)} m
                      </p>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                        <div
                          className="h-full rounded-full bg-accent transition-all motion-reduce:transition-none"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-content-muted">
                        t = {formatNumber(item.hangTimeS, lang, 2)} s · v₀ ={" "}
                        {formatNumber(item.takeoffSpeedMs, lang, 2)} m/s
                      </p>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: h = v₀² / (2·g) [m]
                </p>
                <p className="mt-1">{t("learn.experiments.jump.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment C: Projectile */}
          {experiment === "projectile" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Compass className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.projectile.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.projectile.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.idealizedModel")}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.throwSpeed")}:{" "}
                    <strong className="text-content">
                      {formatNumber(throwSpeedMs, lang, 1)} m/s
                    </strong>
                  </span>
                  <input
                    type="range"
                    min={3}
                    max={40}
                    step={1}
                    value={throwSpeedMs}
                    onChange={(e) => setThrowSpeedMs(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.throwAngle")}:{" "}
                    <strong className="text-content">{throwAngleDeg}°</strong>
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    step={1}
                    value={throwAngleDeg}
                    onChange={(e) => setThrowAngleDeg(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>
              </div>

              {/* SVG Trajectory Plot */}
              <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3">
                <svg
                  viewBox="0 0 320 130"
                  className="h-36 w-full"
                  role="img"
                  aria-label={t("learn.experiments.projectile.svgLabel")}
                >
                  <line
                    x1="16"
                    y1="116"
                    x2="304"
                    y2="116"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                  <path
                    d={buildParabolaPath(projRes.moon.rangeM, projRes.moon.maxHeightM)}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <path
                    d={buildParabolaPath(projRes.mars.rangeM, projRes.mars.maxHeightM)}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2.5"
                  />
                  <path
                    d={buildParabolaPath(projRes.earth.rangeM, projRes.earth.maxHeightM)}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />
                </svg>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-content-muted">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                    {t("bodies.earth")}: {formatNumber(projRes.earth.rangeM, lang, 1)} m
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                    {t("bodies.mars")}: {formatNumber(projRes.mars.rangeM, lang, 1)} m
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                    {t("bodies.moon")}: {formatNumber(projRes.moon.rangeM, lang, 1)} m
                  </span>
                </div>
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: R = v₀² · sin(2θ) / g [m]
                </p>
                <p className="mt-1">{t("learn.experiments.projectile.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment D: Shallow Waves in Pressurized Habitat */}
          {experiment === "waves" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Waves className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.waves.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.waves.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.experiments.waves.habitatBadge")}</Badge>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted sm:max-w-md">
                <span>
                  {t("learn.controls.poolDepth")}:{" "}
                  <strong className="text-content">{formatNumber(poolDepthM, lang, 2)} m</strong>
                </span>
                <input
                  type="range"
                  min={0.2}
                  max={5.0}
                  step={0.1}
                  value={poolDepthM}
                  onChange={(e) => setPoolDepthM(Number(e.target.value))}
                  className="min-h-11 w-full cursor-pointer accent-accent"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {BODIES.map((b) => {
                  const item = waveRes[b];
                  return (
                    <div
                      key={b}
                      className={`rounded-xl border p-3 ${
                        b === body
                          ? "border-accent bg-accent/5"
                          : "border-border-subtle bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-content-muted">
                        <span className="font-semibold uppercase">{t(`bodies.${b}`)}</span>
                        <span>{formatNumber(item.ratioVsEarth * 100, lang, 1)}%</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-content">
                        {formatNumber(item.waveSpeedMs, lang, 2)} m/s
                      </p>
                      <p className="mt-1 text-xs text-content-muted">
                        d = {formatNumber(item.depthM, lang, 2)} m
                      </p>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: c ≈ √(g · d) [m/s] (d ≪ λ)
                </p>
                <p className="mt-1">{t("learn.experiments.waves.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment E: Pushing/Lifting Rocks */}
          {experiment === "rocks" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Scale className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.rocks.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.rocks.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.idealizedModel")}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.rockMass")}:{" "}
                    <strong className="text-content">{formatNumber(rockMassKg, lang, 0)} kg</strong>
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={300}
                    step={5}
                    value={rockMassKg}
                    onChange={(e) => setRockMassKg(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.targetAccel")}:{" "}
                    <strong className="text-content">
                      {formatNumber(rockAccelMs2, lang, 1)} m/s²
                    </strong>
                  </span>
                  <input
                    type="range"
                    min={0.2}
                    max={3.0}
                    step={0.1}
                    value={rockAccelMs2}
                    onChange={(e) => setRockAccelMs2(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {BODIES.map((b) => {
                  const item = rockRes[b];
                  return (
                    <div
                      key={b}
                      className={`rounded-xl border p-3 ${
                        b === body
                          ? "border-accent bg-accent/5"
                          : "border-border-subtle bg-surface-elevated"
                      }`}
                    >
                      <span className="text-xs font-semibold uppercase text-content-muted">
                        {t(`bodies.${b}`)}
                      </span>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          {t("learn.experiments.rocks.liftForce")}:{" "}
                          <strong className="text-sm text-content">
                            {formatNumber(item.weightN, lang, 1)} N
                          </strong>
                        </p>
                        <p>
                          {t("learn.experiments.rocks.inertialForce")}:{" "}
                          <strong className="text-sm text-content">
                            {formatNumber(item.inertialForceN, lang, 1)} N
                          </strong>
                        </p>
                        <p className="text-content-muted">
                          {t("learn.experiments.rocks.friction")}:{" "}
                          {formatNumber(item.maxStaticFrictionN, lang, 1)} N
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: F_g = m·g ; F_neta = m·a ; F_fric,max ≈ μ·m·g [N]
                </p>
                <p className="mt-1">{t("learn.experiments.rocks.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment F: Rover & Slopes (Linked to Real Data) */}
          {experiment === "rover" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Compass className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.rover.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.rover.intro")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {typeof siteSlopeDeg === "number" && (
                    <Button
                      variant="secondary"
                      onClick={() => setSlopeDeg(Math.min(45, Math.max(0, Math.round(siteSlopeDeg * 10) / 10)))}
                    >
                      {t("learn.experiments.rover.loadSiteSlope", {
                        slope: formatNumber(siteSlopeDeg, lang, 1),
                      })}
                    </Button>
                  )}
                  {typeof earthSlopeDeg === "number" && (
                    <Button
                      variant="secondary"
                      onClick={() => setSlopeDeg(Math.min(45, Math.max(0, Math.round(earthSlopeDeg * 10) / 10)))}
                    >
                      {t("learn.experiments.rover.loadEarthSlope", {
                        slope: formatNumber(earthSlopeDeg, lang, 1),
                      })}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.roverMass")}:{" "}
                    <strong className="text-content">{formatNumber(roverMassKg, lang, 0)} kg</strong>
                  </span>
                  <input
                    type="range"
                    min={10}
                    max={1000}
                    step={10}
                    value={roverMassKg}
                    onChange={(e) => setRoverMassKg(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.slopeDeg")}:{" "}
                    <strong className="text-content">{formatNumber(slopeDeg, lang, 1)}°</strong>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={0.5}
                    value={slopeDeg}
                    onChange={(e) => setSlopeDeg(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>

                <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted">
                  <span>
                    {t("learn.controls.frictionCoeff")}:{" "}
                    <strong className="text-content">{formatNumber(frictionCoeff, lang, 2)}</strong>
                  </span>
                  <input
                    type="range"
                    min={0.15}
                    max={1.0}
                    step={0.05}
                    value={frictionCoeff}
                    onChange={(e) => setFrictionCoeff(Number(e.target.value))}
                    className="min-h-11 w-full cursor-pointer accent-accent"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-elevated p-3">
                <svg
                  viewBox="0 0 320 120"
                  className="h-32 w-full"
                  role="img"
                  aria-label={t("learn.experiments.rover.diagramLabel", {
                    slope: formatNumber(slopeDeg, lang, 1),
                  })}
                >
                  {(() => {
                    const rad = (slopeDeg * Math.PI) / 180;
                    const x0 = 40;
                    const y0 = 102;
                    const run = 190;
                    const rise = Math.min(82, Math.tan(rad) * run);
                    const xTop = x0 + run;
                    const yTop = y0 - rise;
                    const midX = x0 + run * 0.5;
                    const midY = y0 - rise * 0.5;
                    const activeRover = roverRes[targetBody];
                    const slipColor = activeRover.idealSlipRisk ? "#ef4444" : "#10b981";
                    return (
                      <g>
                        <polygon
                          points={`${x0},${y0} ${xTop},${y0} ${xTop},${yTop}`}
                          fill="currentColor"
                          fillOpacity="0.1"
                          stroke="currentColor"
                          strokeOpacity="0.35"
                          strokeWidth="1.5"
                        />
                        <g transform={`translate(${midX.toFixed(1)}, ${midY.toFixed(1)}) rotate(${(-slopeDeg).toFixed(1)})`}>
                          <rect
                            x="-18"
                            y="-20"
                            width="36"
                            height="14"
                            rx="3"
                            fill={slipColor}
                            fillOpacity="0.25"
                            stroke={slipColor}
                            strokeWidth="2"
                          />
                          <circle cx="-11" cy="-4" r="4" fill="currentColor" />
                          <circle cx="11" cy="-4" r="4" fill="currentColor" />
                        </g>
                        <text x={x0 + 28} y={y0 - 6} fontSize="11" fill="currentColor" opacity="0.8">
                          θ = {formatNumber(slopeDeg, lang, 1)}°
                        </text>
                        <text x="242" y="34" fontSize="10" fill="currentColor" opacity="0.8">
                          {t(`bodies.${targetBody}`)}
                        </text>
                        <text x="242" y="50" fontSize="10" fill={slipColor} fontWeight="bold">
                          F_∥ {formatNumber(activeRover.parallelForceN, lang, 0)} N
                        </text>
                        <text x="242" y="64" fontSize="10" fill="currentColor" opacity="0.75">
                          μ·N {formatNumber(activeRover.maxTractionN, lang, 0)} N
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {BODIES.map((b) => {
                  const item = roverRes[b];
                  return (
                    <div
                      key={b}
                      className={`rounded-xl border p-3 ${
                        b === body
                          ? "border-accent bg-accent/5"
                          : "border-border-subtle bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-content-muted">
                          {t(`bodies.${b}`)}
                        </span>
                        <Badge variant={item.idealSlipRisk ? "break" : "valid"}>
                          {item.idealSlipRisk
                            ? t("learn.experiments.rover.slipRisk")
                            : t("learn.experiments.rover.idealGrip")}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-xs">
                        <p>
                          F_∥ (m·g·sinθ):{" "}
                          <strong className="text-sm text-content">
                            {formatNumber(item.parallelForceN, lang, 1)} N
                          </strong>
                        </p>
                        <p>
                          N (m·g·cosθ):{" "}
                          <strong className="text-sm text-content">
                            {formatNumber(item.normalForceN, lang, 1)} N
                          </strong>
                        </p>
                        <p className="text-content-muted">
                          F_fric,max (μ·N): {formatNumber(item.maxTractionN, lang, 1)} N
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: F_∥ = m·g·sin(θ) ; N = m·g·cos(θ) ; F_fric,max ≈ μ·N [N]
                </p>
                <p className="mt-1">{t("learn.experiments.rover.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment G: Wind & Dynamic Pressure */}
          {experiment === "wind" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Wind className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.wind.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.wind.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.idealizedModel")}</Badge>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted sm:max-w-md">
                <span>
                  {t("learn.controls.windSpeedMs")}:{" "}
                  <strong className="text-content">
                    {formatNumber(windSpeedMs, lang, 0)} m/s ({formatNumber(windSpeedMs * 3.6, lang, 0)} km/h)
                  </strong>
                </span>
                <input
                  type="range"
                  min={2}
                  max={60}
                  step={1}
                  value={windSpeedMs}
                  onChange={(e) => setWindSpeedMs(Number(e.target.value))}
                  className="min-h-11 w-full cursor-pointer accent-accent"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {(["earth", "mars"] as const).map((b) => {
                  const item = windRes[b];
                  return (
                    <div
                      key={b}
                      className={`rounded-xl border p-3 ${
                        b === "mars" && body === "mars"
                          ? "border-accent bg-accent/5"
                          : "border-border-subtle bg-surface-elevated"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-content-muted">
                        <span className="font-semibold uppercase">{t(`bodies.${b}`)}</span>
                        <span>{formatNumber(item.ratioVsEarth * 100, lang, 1)}%</span>
                      </div>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-content">
                        {formatNumber(item.dynamicPressurePa, lang, 1)} Pa
                      </p>
                      <p className="mt-1 text-xs text-content-muted">
                        {t("learn.experiments.wind.densityLabel")}:{" "}
                        {formatNumber(item.airDensityKgM3, lang, 3)} kg/m³
                      </p>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: q = 0.5 · ρ · v² [Pa = N/m²]
                </p>
                <p className="mt-1">{t("learn.experiments.wind.limits")}</p>
                </div>
              )}
            </div>
          )}

          {/* Experiment H: Water & Pressure */}
          {experiment === "water" && (
            <div className="space-y-4 rounded-xl border border-border-subtle bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="flex items-center gap-2 text-base font-semibold text-content">
                    <Droplets className="h-4 w-4 text-accent" aria-hidden="true" />
                    {t("learn.experiments.water.question")}
                  </h3>
                  <p className="mt-1 text-xs text-content-muted">
                    {t("learn.experiments.water.intro")}
                  </p>
                </div>
                <Badge variant="warn">{t("learn.idealizedModel")}</Badge>
              </div>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-content-muted sm:max-w-md">
                <span>
                  {t("learn.controls.waterTempC")}:{" "}
                  <strong className="text-content">{formatNumber(waterTempC, lang, 0)} °C</strong>
                </span>
                <input
                  type="range"
                  min={-40}
                  max={105}
                  step={1}
                  value={waterTempC}
                  onChange={(e) => setWaterTempC(Number(e.target.value))}
                  className="min-h-11 w-full cursor-pointer accent-accent"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {waterRes.map((item) => {
                  const badgeVariant =
                    item.regime === "liquid"
                      ? "valid"
                      : item.regime === "solid"
                      ? "accent"
                      : "break";
                  return (
                    <div
                      key={item.location}
                      className="rounded-xl border border-border-subtle bg-surface-elevated p-3"
                    >
                      <p className="text-xs font-semibold text-content">
                        {t(`learn.experiments.water.${item.location}`)}
                      </p>
                      <div className="mt-2">
                        <Badge variant={badgeVariant}>
                          {t(`learn.experiments.water.regimes.${item.regime}`)}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs text-content-muted">
                        {t("learn.experiments.water.boilingLabel")}:{" "}
                        {formatNumber(item.boilingPointC, lang, 1)} °C
                      </p>
                    </div>
                  );
                })}
              </div>

              {showScienceDetails && (
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted">
                <p className="font-semibold text-content">
                  {t("learn.equationLabel")}: P_triple ≈ 0.6117 kPa · T_triple = 0.01 °C
                </p>
                <p className="mt-1">{t("learn.experiments.water.limits")}</p>
                </div>
              )}
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Contextual Mini-Challenges */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Award className="h-5 w-5 text-accent" aria-hidden="true" />
            <CardTitle>{t("learn.challengesTitle")}</CardTitle>
            <span aria-live="polite">
              <Badge variant={correctCount === challenges.length ? "valid" : "accent"}>
                {t("learnHub.score", { correct: correctCount, total: challenges.length })}
              </Badge>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onGoToCompare}>
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
              <span>{t("nav.backToCompare")}</span>
            </Button>
            <Button variant="primary" onClick={onGoToPlan}>
              <span>{t("nav.continueToPlan")}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {challenges.map((ch) => {
            const chosen = quizAnswers[ch.id];
            const isAnswered = Boolean(chosen);
            const isCorrect = chosen === ch.correct;
            return (
              <div
                key={ch.id}
                className="flex flex-col justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4"
              >
                <div className="space-y-2.5">
                  <p className="text-sm font-semibold text-content">{ch.question}</p>
                  <div className="space-y-1.5">
                    {ch.options.map((opt) => {
                      const selected = chosen === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [ch.id]: opt.id }))
                          }
                          aria-pressed={selected}
                          className={`flex min-h-11 w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                            selected
                              ? "border-accent bg-accent/10 font-semibold text-content"
                              : "border-border-subtle bg-surface-elevated text-content-muted hover:bg-surface-muted hover:text-content"
                          }`}
                        >
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {isAnswered && (
                  <div
                    role="status"
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                      isCorrect
                        ? "border-status-valid/40 bg-status-valid/10 text-content"
                        : "border-status-warn/40 bg-status-warn/10 text-content"
                    }`}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-valid" aria-hidden="true" />
                    ) : (
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-status-break" aria-hidden="true" />
                    )}
                    <div>
                      <p className="font-semibold">
                        {isCorrect ? t("learn.correctLabel") : t("learn.reviewLabel")}
                      </p>
                      <p className="mt-0.5 text-content-muted">{ch.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {correctCount === challenges.length && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-status-valid/40 bg-status-valid/10 p-4 text-sm text-content md:col-span-2"
            >
              <span className="text-3xl leading-none" aria-hidden="true">
                🏅
              </span>
              <div>
                <p className="font-semibold">{t("learnHub.badgeTitle")}</p>
                <p className="text-xs text-content-muted">{t("learnHub.badgeDesc")}</p>
              </div>
            </div>
          )}

          {!comparison && (
            <div className="flex items-center gap-2 rounded-xl border border-border-subtle bg-surface-elevated p-3 text-xs text-content-muted md:col-span-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-status-warn" aria-hidden="true" />
              <span>{t("learn.noComparisonHint")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
