import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpFromLine,
  Award,
  CheckCircle2,
  Clock,
  FlaskConical,
  HelpCircle,
  Info,
  Pause,
  Play,
  Rocket,
  RotateCcw,
  Scale,
  Sliders,
  Sparkles,
  Sun,
  TrendingUp,
  Waves,
  Wind,
  XCircle,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { AnalogMatchItem, PlanetaryBody, PlanetarySite, ReadingMode } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Slider } from "../ui/Slider";

interface BodyPhysics {
  id: "earth" | "mars" | "moon" | "titan" | "custom";
  gravity: number;
  radiusKm: number;
  escapeVelKms: number;
  solarFluxWm2: number;
  atmDensityKgM3: number;
  pressureMbar: number;
  stroke: string;
  barClass: string;
  dotClass: string;
  optional?: boolean;
}

const BASE_BODIES: readonly BodyPhysics[] = [
  {
    id: "earth",
    gravity: 9.81,
    radiusKm: 6371,
    escapeVelKms: 11.19,
    solarFluxWm2: 1000,
    atmDensityKgM3: 1.225,
    pressureMbar: 1013.25,
    stroke: "#3b82f6",
    barClass: "bg-blue-500",
    dotClass: "bg-blue-500",
  },
  {
    id: "mars",
    gravity: 3.72,
    radiusKm: 3389.5,
    escapeVelKms: 5.03,
    solarFluxWm2: 590,
    atmDensityKgM3: 0.02,
    pressureMbar: 6.5,
    stroke: "#f97316",
    barClass: "bg-orange-500",
    dotClass: "bg-orange-500",
  },
  {
    id: "moon",
    gravity: 1.62,
    radiusKm: 1737.4,
    escapeVelKms: 2.38,
    solarFluxWm2: 1361,
    atmDensityKgM3: 0.0,
    pressureMbar: 0.0,
    stroke: "#a855f7",
    barClass: "bg-purple-500",
    dotClass: "bg-purple-500",
  },
  {
    id: "titan",
    gravity: 1.35,
    radiusKm: 2574.7,
    escapeVelKms: 2.64,
    solarFluxWm2: 15,
    atmDensityKgM3: 5.3,
    pressureMbar: 1467.0,
    stroke: "#14b8a6",
    barClass: "bg-teal-500",
    dotClass: "bg-teal-500",
    optional: true,
  },
] as const;

interface WaveSimulatorCardProps {
  bodies: readonly BodyPhysics[];
  isVisible: boolean;
}

const WaveSimulatorCard = memo(function WaveSimulatorCard({
  bodies,
  isVisible,
}: WaveSimulatorCardProps) {
  const { t } = useTranslation();
  const [waterDepthM, setWaterDepthM] = useState(5);
  const [wavelengthM, setWavelengthM] = useState(30);
  const [waveRunning, setWaveRunning] = useState(true);
  const [wavePhaseTime, setWavePhaseTime] = useState(0);
  const lastTsRef = useRef<number | null>(null);

  const shouldAnimate = waveRunning && isVisible;

  useEffect(() => {
    if (!shouldAnimate) {
      lastTsRef.current = null;
      return;
    }
    let rafId = 0;
    const step = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
        setWavePhaseTime((prev) => prev + dt);
      }
      lastTsRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [shouldAnimate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>{t("physicsLab.waves.title")}</span>
          </CardTitle>
          <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
            c = √(g · h)
          </code>
        </div>
        <p className="text-xs text-content-muted">{t("physicsLab.waves.description")}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Slider
            id="physics-wave-depth"
            label={t("physicsLab.waves.depthLabel")}
            value={waterDepthM}
            min={0.5}
            max={40}
            step={0.5}
            formattedValue={`${waterDepthM.toFixed(1)} m`}
            onChange={setWaterDepthM}
          />
          <Slider
            id="physics-wave-length"
            label={t("physicsLab.waves.wavelengthLabel")}
            value={wavelengthM}
            min={10}
            max={80}
            step={2}
            formattedValue={`${wavelengthM} m`}
            onChange={setWavelengthM}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: t("physicsLab.waves.presets.hydroponics"), h: 1.0 },
              { label: t("physicsLab.waves.presets.jezeroDelta"), h: 8.0 },
              { label: t("physicsLab.waves.presets.subglacialLake"), h: 25.0 },
            ].map((preset) => (
              <button
                key={preset.h}
                type="button"
                onClick={() => setWaterDepthM(preset.h)}
                className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                  waterDepthM === preset.h
                    ? "border-accent bg-accent/15 text-content"
                    : "border-border-subtle bg-surface-muted/60 text-content-muted hover:text-content"
                }`}
              >
                {preset.label} ({preset.h}m)
              </button>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setWaveRunning((r) => !r)}
          >
            {waveRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("physicsLab.controls.pause")}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("physicsLab.controls.play")}</span>
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          {bodies.map((body) => {
            const celerityMs = Math.sqrt(body.gravity * waterDepthM);
            const celerityKmh = celerityMs * 3.6;
            const periodSec = wavelengthM / Math.max(0.1, celerityMs);
            const k = (2 * Math.PI) / (wavelengthM * 2.2);
            const phase = wavePhaseTime * celerityMs * 0.45;
            const points: string[] = [];
            for (let x = 0; x <= 360; x += 8) {
              const y = 20 + 8 * Math.sin(k * x - phase);
              points.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
            }
            const wavePath = `${points.join(" ")} L360,40 L0,40 Z`;

            return (
              <div
                key={body.id}
                className="rounded-lg border border-border-subtle bg-surface-muted/40 p-2.5"
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-content">
                    <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                    {t(`physicsLab.bodies.${body.id}`)}
                  </span>
                  <span className="tabular-nums text-content">
                    <strong>{celerityMs.toFixed(2)} m/s</strong>{" "}
                    <span className="text-content-muted">
                      ({celerityKmh.toFixed(1)} km/h · T = {periodSec.toFixed(1)} s)
                    </span>
                  </span>
                </div>
                <svg
                  viewBox="0 0 360 40"
                  className="h-9 w-full overflow-hidden rounded bg-surface-elevated"
                  aria-hidden="true"
                >
                  <path d={wavePath} fill={body.stroke} fillOpacity={0.22} />
                  <path
                    d={points.join(" ")}
                    fill="none"
                    stroke={body.stroke}
                    strokeWidth={2}
                  />
                </svg>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

interface PendulumSimulatorCardProps {
  bodies: readonly BodyPhysics[];
  isVisible: boolean;
}

const PendulumSimulatorCard = memo(function PendulumSimulatorCard({
  bodies,
  isVisible,
}: PendulumSimulatorCardProps) {
  const { t } = useTranslation();
  const [pendulumLengthM, setPendulumLengthM] = useState(1.0);
  const [pendulumRunning, setPendulumRunning] = useState(true);
  const [phaseTime, setPhaseTime] = useState(0);
  const lastTsRef = useRef<number | null>(null);

  const shouldAnimate = pendulumRunning && isVisible;

  useEffect(() => {
    if (!shouldAnimate) {
      lastTsRef.current = null;
      return;
    }
    let rafId = 0;
    const step = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - lastTsRef.current) / 1000);
        setPhaseTime((prev) => prev + dt);
      }
      lastTsRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [shouldAnimate]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>{t("physicsLab.pendulum.title")}</span>
          </CardTitle>
          <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
            T = 2π √(L / g)
          </code>
        </div>
        <p className="text-xs text-content-muted">{t("physicsLab.pendulum.description")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Slider
              id="physics-pendulum-length"
              label={t("physicsLab.pendulum.lengthLabel")}
              value={pendulumLengthM}
              min={0.25}
              max={4.0}
              step={0.25}
              formattedValue={`${pendulumLengthM.toFixed(2)} m`}
              onChange={setPendulumLengthM}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPendulumRunning((r) => !r)}
          >
            {pendulumRunning ? (
              <>
                <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("physicsLab.controls.pause")}</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t("physicsLab.controls.play")}</span>
              </>
            )}
          </Button>
        </div>

        <div
          className={`grid gap-2.5 rounded-lg border border-border-subtle bg-surface-muted/30 p-3 ${
            bodies.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
          }`}
        >
          {bodies.map((body) => {
            const period = 2 * Math.PI * Math.sqrt(pendulumLengthM / body.gravity);
            const oscPerMin = 60 / period;
            const omega = (2 * Math.PI) / period;
            const angleRad = 0.42 * Math.cos(omega * phaseTime);
            const pivotX = 50;
            const pivotY = 8;
            const rodLen = 58;
            const bobX = pivotX + rodLen * Math.sin(angleRad);
            const bobY = pivotY + rodLen * Math.cos(angleRad);

            return (
              <div key={body.id} className="flex flex-col items-center gap-1.5">
                <svg
                  viewBox="0 0 100 82"
                  className="h-28 w-full rounded-md border border-border-subtle bg-surface-elevated"
                  aria-hidden="true"
                >
                  <line
                    x1={25}
                    y1={pivotY}
                    x2={75}
                    y2={pivotY}
                    stroke="currentColor"
                    strokeOpacity={0.35}
                    strokeWidth={2}
                  />
                  <line
                    x1={pivotX}
                    y1={pivotY}
                    x2={pivotX}
                    y2={74}
                    stroke="currentColor"
                    strokeOpacity={0.12}
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={pivotX}
                    y1={pivotY}
                    x2={bobX}
                    y2={bobY}
                    stroke="currentColor"
                    strokeOpacity={0.6}
                    strokeWidth={1.6}
                  />
                  <circle cx={bobX} cy={bobY} r={7} fill={body.stroke} />
                </svg>
                <div className="text-center text-[11px]">
                  <div className="font-semibold text-content">
                    {t(`physicsLab.bodies.${body.id}`)}
                  </div>
                  <div className="tabular-nums text-content">
                    <strong>T = {period.toFixed(2)} s</strong>
                  </div>
                  <div className="tabular-nums text-content-muted">
                    {oscPerMin.toFixed(1)} {t("physicsLab.pendulum.oscPerMin")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});

interface PlanetaryPhysicsLabProps {
  activeBody?: PlanetaryBody;
  activeSite?: PlanetarySite;
  selectedMatch?: AnalogMatchItem;
  readingMode?: ReadingMode;
}

const AtmosphericChemistryCard = memo(function AtmosphericChemistryCard({
  activeBody,
}: {
  activeBody?: PlanetaryBody;
}) {
  const { t } = useTranslation();
  const [crewCount, setCrewCount] = useState(4);
  const [missionDays, setMissionDays] = useState(30);

  // 0.84 kg O2 per astronaut per day (NASA ISS ECLSS standard)
  const totalO2Kg = crewCount * missionDays * 0.84;
  // Stoichiometry: 2 CO2 (88 g/mol) -> 2 CO + O2 (32 g/mol) => 2.75 kg CO2 per 1 kg O2
  const marsCo2NeededKg = totalO2Kg * 2.75;
  // Stoichiometry: 2 H2O (36 g/mol) -> 2 H2 + O2 (32 g/mol) => 1.125 kg (liters) H2O per 1 kg O2
  const moonWaterLiters = totalO2Kg * 1.125;
  // Lunar regolith is ~42% oxygen by mass, assuming ~25% extraction efficiency => ~9.5 kg regolith per 1 kg O2
  const moonRegolithKg = totalO2Kg * 9.5;

  const atmospheres = [
    {
      id: "earth" as const,
      pressureLabel: "1013.25 mbar (1 atm)",
      statusVariant: "valid" as const,
      statusKey: "physicsLab.atmosphere.earth.status",
      summaryKey: "physicsLab.atmosphere.earth.summary",
      po2Label: "212 mbar (Óptimo: 160–250 mbar)",
      armstrongOk: true,
      gases: [
        { formula: "N₂", pct: 78.08, color: "bg-blue-500", roleKey: "physicsLab.atmosphere.roles.n2Earth" },
        { formula: "O₂", pct: 20.95, color: "bg-emerald-500", roleKey: "physicsLab.atmosphere.roles.o2Earth" },
        { formula: "Ar", pct: 0.93, color: "bg-purple-500", roleKey: "physicsLab.atmosphere.roles.ar" },
        { formula: "CO₂", pct: 0.04, color: "bg-amber-500", roleKey: "physicsLab.atmosphere.roles.co2Earth" },
      ],
    },
    {
      id: "mars" as const,
      pressureLabel: "6.5 mbar (0.6% atm)",
      statusVariant: "break" as const,
      statusKey: "physicsLab.atmosphere.mars.status",
      summaryKey: "physicsLab.atmosphere.mars.summary",
      po2Label: "0.008 mbar (Hipoxia letal)",
      armstrongOk: false,
      gases: [
        { formula: "CO₂", pct: 95.32, color: "bg-amber-500", roleKey: "physicsLab.atmosphere.roles.co2Mars" },
        { formula: "N₂", pct: 2.7, color: "bg-blue-500", roleKey: "physicsLab.atmosphere.roles.n2Mars" },
        { formula: "Ar", pct: 1.6, color: "bg-purple-500", roleKey: "physicsLab.atmosphere.roles.ar" },
        { formula: "O₂ + CO", pct: 0.21, color: "bg-red-500", roleKey: "physicsLab.atmosphere.roles.o2CoMars" },
      ],
    },
    {
      id: "moon" as const,
      pressureLabel: "~10⁻¹² mbar (Vacío / Exosfera)",
      statusVariant: "break" as const,
      statusKey: "physicsLab.atmosphere.moon.status",
      summaryKey: "physicsLab.atmosphere.moon.summary",
      po2Label: "0.000 mbar (Vacío absoluto)",
      armstrongOk: false,
      gases: [
        { formula: "SiO₂ / FeO / TiO₂ (Regolito)", pct: 43.0, color: "bg-emerald-500", roleKey: "physicsLab.atmosphere.roles.regolithO2" },
        { formula: "H₂O (Hielo polar)", pct: 5.0, color: "bg-cyan-500", roleKey: "physicsLab.atmosphere.roles.polarIce" },
        { formula: "Exosfera (Ar, He, Ne)", pct: 0.01, color: "bg-purple-500", roleKey: "physicsLab.atmosphere.roles.exosphere" },
      ],
    },
  ];

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-accent" aria-hidden="true" />
            <span>{t("physicsLab.atmosphere.title")}</span>
          </CardTitle>
          <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
            pO₂ = P_total · y_O₂ (160–250 mbar)
          </code>
        </div>
        <p className="text-xs text-content-muted">{t("physicsLab.atmosphere.description")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* 3-Column Comparison: Earth, Mars, Moon */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {atmospheres.map((world) => {
            const isHighlighted = activeBody === world.id;
            return (
              <div
                key={world.id}
                className={`flex flex-col justify-between rounded-xl border p-3.5 space-y-3 ${
                  isHighlighted
                    ? "border-accent bg-accent/5"
                    : "border-border-subtle bg-surface-muted/30"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-content">
                      {t(`physicsLab.bodies.${world.id}`)}
                    </span>
                    <Badge variant={world.statusVariant}>{t(world.statusKey)}</Badge>
                  </div>
                  <div className="text-[11px] text-content-muted">
                    {t("physicsLab.atmosphere.totalPressure")}:{" "}
                    <strong className="tabular-nums text-content">{world.pressureLabel}</strong>
                  </div>

                  {/* Stacked Visual Bar */}
                  <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
                    {world.gases.map((g) => (
                      <div
                        key={g.formula}
                        className={`${g.color} h-full transition-all`}
                        style={{ width: `${Math.max(3, g.pct)}%` }}
                        title={`${g.formula}: ${g.pct}%`}
                      />
                    ))}
                  </div>

                  {/* Gas Breakdown List */}
                  <div className="space-y-1.5 pt-1">
                    {world.gases.map((g) => (
                      <div key={g.formula} className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-content">
                            <span className={`h-2 w-2 rounded-full ${g.color}`} aria-hidden="true" />
                            {g.formula}
                          </span>
                          <span className="tabular-nums font-bold text-content">{g.pct}%</span>
                        </div>
                        <p className="pl-3.5 text-[11px] text-content-muted">{t(g.roleKey)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Human Physiology Readiness Box */}
                <div className="rounded-lg border border-border-subtle bg-surface-elevated p-2.5 space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted">{t("physicsLab.atmosphere.partialO2")}:</span>
                    <strong className="tabular-nums text-content">{world.po2Label}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted">{t("physicsLab.atmosphere.armstrongLimit")}:</span>
                    <span
                      className={`font-semibold ${
                        world.armstrongOk ? "text-status-valid" : "text-status-break"
                      }`}
                    >
                      {world.armstrongOk
                        ? t("physicsLab.atmosphere.armstrongSafe")
                        : t("physicsLab.atmosphere.armstrongBoil")}
                    </span>
                  </div>
                  <p className="pt-1 text-content-muted border-t border-border-subtle/60">
                    {t(world.summaryKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why Earth Air is Optimal for Human Life */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-border-subtle bg-surface-muted/40 p-3.5 md:grid-cols-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content">
              <CheckCircle2 className="h-3.5 w-3.5 text-status-valid" aria-hidden="true" />
              <span>{t("physicsLab.atmosphere.pillars.o2Title")}</span>
            </div>
            <p className="text-[11px] text-content-muted">
              {t("physicsLab.atmosphere.pillars.o2Desc")}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content">
              <Info className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span>{t("physicsLab.atmosphere.pillars.n2Title")}</span>
            </div>
            <p className="text-[11px] text-content-muted">
              {t("physicsLab.atmosphere.pillars.n2Desc")}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-content">
              <ShieldAlert className="h-3.5 w-3.5 text-status-warn" aria-hidden="true" />
              <span>{t("physicsLab.atmosphere.pillars.co2Title")}</span>
            </div>
            <p className="text-[11px] text-content-muted">
              {t("physicsLab.atmosphere.pillars.co2Desc")}
            </p>
          </div>
        </div>

        {/* Interactive ISRU Life Support Calculator (MOXIE & Lunar Regolith/Ice) */}
        <div className="rounded-xl border border-border-subtle bg-surface-elevated p-4 space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-content">
              {t("physicsLab.atmosphere.isru.title")}
            </h3>
            <p className="text-xs text-content-muted">
              {t("physicsLab.atmosphere.isru.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Slider
              id="physics-crew-count"
              label={t("physicsLab.atmosphere.isru.crewLabel")}
              value={crewCount}
              min={1}
              max={12}
              step={1}
              formattedValue={`${crewCount} ${t("physicsLab.atmosphere.isru.astronauts")}`}
              onChange={setCrewCount}
            />
            <Slider
              id="physics-mission-days"
              label={t("physicsLab.atmosphere.isru.daysLabel")}
              value={missionDays}
              min={1}
              max={365}
              step={1}
              formattedValue={`${missionDays} ${t("physicsLab.atmosphere.isru.days")}`}
              onChange={setMissionDays}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
              <div className="text-[11px] text-content-muted">
                {t("physicsLab.atmosphere.isru.o2Required")}
              </div>
              <div className="mt-0.5 tabular-nums text-base font-bold text-content">
                {totalO2Kg.toFixed(1)} kg O₂
              </div>
              <div className="text-[11px] text-content-muted">
                {t("physicsLab.atmosphere.isru.o2RateNote")}
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
              <div className="text-[11px] text-content-muted">
                {t("physicsLab.atmosphere.isru.marsMoxieTitle")}
              </div>
              <div className="mt-0.5 tabular-nums text-base font-bold text-orange-500">
                {marsCo2NeededKg.toFixed(1)} kg CO₂
              </div>
              <div className="text-[11px] text-content-muted">
                2 CO₂ → 2 CO + O₂ ({t("physicsLab.atmosphere.isru.marsMoxieNote")})
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3">
              <div className="text-[11px] text-content-muted">
                {t("physicsLab.atmosphere.isru.moonIceTitle")}
              </div>
              <div className="mt-0.5 tabular-nums text-base font-bold text-purple-500">
                {moonWaterLiters.toFixed(1)} L H₂O{" "}
                <span className="text-xs font-normal text-content-muted">
                  / {moonRegolithKg.toFixed(0)} kg reg.
                </span>
              </div>
              <div className="text-[11px] text-content-muted">
                2 H₂O → 2 H₂ + O₂ ({t("physicsLab.atmosphere.isru.moonIceNote")})
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

export function PlanetaryPhysicsLab({
  activeBody,
  activeSite,
  selectedMatch,
  readingMode,
}: PlanetaryPhysicsLabProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Auto-pause background animations when scrolled offscreen or tab hidden
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let inView = true;
    let docVisible = !document.hidden;

    const syncVisibility = () => {
      setIsVisible(inView && docVisible);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]) {
          inView = entries[0].isIntersecting;
          syncVisibility();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);

    const onVisChange = () => {
      docVisible = !document.hidden;
      syncVisibility();
    };
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, []);

  // Global lab toggles & custom gravity
  const [includeTitan, setIncludeTitan] = useState(false);
  const [enableCustomBody, setEnableCustomBody] = useState(false);
  const [customGravity, setCustomGravity] = useState(24.79); // Default Jupiter

  const bodies = useMemo(() => {
    const list: BodyPhysics[] = BASE_BODIES.map((b) => {
      if (activeSite && activeSite.body === b.id) {
        return {
          ...b,
          solarFluxWm2: activeSite.variables.independent.solar_flux_wm2 || b.solarFluxWm2,
          pressureMbar: activeSite.variables.breakage.atm_pressure_mbar ?? b.pressureMbar,
        };
      }
      return b;
    }).filter((b) => !b.optional || includeTitan);

    if (enableCustomBody) {
      const approxRadiusKm = 6371 * Math.sqrt(customGravity / 9.81);
      const escapeKms = Math.sqrt(2 * customGravity * approxRadiusKm * 1000) / 1000;
      list.push({
        id: "custom",
        gravity: customGravity,
        radiusKm: approxRadiusKm,
        escapeVelKms: escapeKms,
        solarFluxWm2: 450,
        atmDensityKgM3: 0.0,
        pressureMbar: 0.0,
        stroke: "#eab308",
        barClass: "bg-yellow-500",
        dotClass: "bg-yellow-500",
      });
    }
    return list;
  }, [activeSite, includeTitan, enableCustomBody, customGravity]);

  // 1. Weight & Inertia calculator state
  const [massKg, setMassKg] = useState(75);

  // 2. Jump simulator state
  const [jumpVelocity, setJumpVelocity] = useState(3.2);
  const [jumpSlowMo, setJumpSlowMo] = useState(false);
  const [jumpRunning, setJumpRunning] = useState(false);
  const [jumpElapsed, setJumpElapsed] = useState(0);
  const jumpLastTsRef = useRef<number | null>(null);

  // 3. Trajectory comparison state
  const [launchSpeed, setLaunchSpeed] = useState(20);
  const [launchAngleDeg, setLaunchAngleDeg] = useState(45);
  const [enableAtmDrag, setEnableAtmDrag] = useState(false);
  const [trajRunning, setTrajRunning] = useState(false);
  const [trajElapsed, setTrajElapsed] = useState(0);
  const [hoverFraction, setHoverFraction] = useState<number | null>(null);
  const trajLastTsRef = useRef<number | null>(null);

  // 6. Escape velocity state
  const [spacecraftMassKg, setSpacecraftMassKg] = useState(1200);

  // 7. Solar Photovoltaic & Dust Attenuation state
  const [solarAreaM2, setSolarAreaM2] = useState(12);
  const [dustOpticalDepth, setDustOpticalDepth] = useState(0.25);

  // 8. Interactive STEAM mini-quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [labCategory, setLabCategory] = useState<
    "all" | "mechanics" | "waves_energy" | "atmosphere" | "quiz"
  >("all");

  // Jump animation loop
  const maxJumpTime = useMemo(() => {
    const minG = Math.min(...bodies.map((b) => b.gravity));
    return (2 * jumpVelocity) / minG;
  }, [bodies, jumpVelocity]);

  useEffect(() => {
    if (!jumpRunning) {
      jumpLastTsRef.current = null;
      return;
    }
    let rafId = 0;
    const speedFactor = jumpSlowMo ? 0.45 : 1.0;
    const step = (ts: number) => {
      if (jumpLastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - jumpLastTsRef.current) / 1000) * speedFactor;
        setJumpElapsed((prev) => {
          const next = prev + dt;
          if (next >= maxJumpTime) {
            setJumpRunning(false);
            return maxJumpTime;
          }
          return next;
        });
      }
      jumpLastTsRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [jumpRunning, jumpSlowMo, maxJumpTime]);

  // Computed trajectory curves (vacuum or numeric drag integration)
  const trajectoryData = useMemo(() => {
    const theta = (launchAngleDeg * Math.PI) / 180;
    const vx0 = launchSpeed * Math.cos(theta);
    const vy0 = launchSpeed * Math.sin(theta);

    const dragCoeffFactor = (0.5 * 0.47 * Math.PI * 0.055 * 0.055) / 0.45;

    const curves = bodies.map((body) => {
      if (!enableAtmDrag || body.atmDensityKgM3 === 0) {
        const flightTime = (2 * vy0) / body.gravity;
        const range = vx0 * flightTime;
        const maxHeight = (vy0 * vy0) / (2 * body.gravity);
        const samples = 56;
        const points: Array<{ t: number; x: number; y: number; v: number }> = [];
        for (let i = 0; i <= samples; i++) {
          const tSec = (i / samples) * flightTime;
          const vyCur = vy0 - body.gravity * tSec;
          points.push({
            t: tSec,
            x: vx0 * tSec,
            y: Math.max(0, vy0 * tSec - 0.5 * body.gravity * tSec * tSec),
            v: Math.hypot(vx0, vyCur),
          });
        }
        return { body, flightTime, range, maxHeight, points };
      }

      const dt = 0.015;
      let tSec = 0;
      let x = 0;
      let y = 0;
      let vx = vx0;
      let vy = vy0;
      let maxHeight = 0;
      const rawPoints: Array<{ t: number; x: number; y: number; v: number }> = [
        { t: 0, x: 0, y: 0, v: launchSpeed },
      ];
      const kDrag = dragCoeffFactor * body.atmDensityKgM3;

      while (y >= 0 && tSec < 120) {
        const speed = Math.hypot(vx, vy);
        const ax = -kDrag * speed * vx;
        const ay = -body.gravity - kDrag * speed * vy;
        vx += ax * dt;
        vy += ay * dt;
        x += vx * dt;
        y += vy * dt;
        tSec += dt;
        if (y > maxHeight) maxHeight = y;
        if (y >= 0) {
          rawPoints.push({ t: tSec, x, y, v: Math.hypot(vx, vy) });
        }
      }
      rawPoints.push({ t: tSec, x, y: 0, v: Math.hypot(vx, vy) });
      const stride = Math.max(1, Math.floor(rawPoints.length / 56));
      const points = rawPoints.filter(
        (_, idx) => idx % stride === 0 || idx === rawPoints.length - 1
      );
      return {
        body,
        flightTime: tSec,
        range: x,
        maxHeight,
        points,
      };
    });

    const maxRange = Math.max(...curves.map((c) => c.range), 1);
    const maxHeight = Math.max(...curves.map((c) => c.maxHeight), 1);
    const maxFlightTime = Math.max(...curves.map((c) => c.flightTime), 0.1);
    return { curves, maxRange, maxHeight, maxFlightTime };
  }, [bodies, launchSpeed, launchAngleDeg, enableAtmDrag]);

  useEffect(() => {
    if (!trajRunning) {
      trajLastTsRef.current = null;
      return;
    }
    let rafId = 0;
    const step = (ts: number) => {
      if (trajLastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - trajLastTsRef.current) / 1000);
        setTrajElapsed((prev) => {
          const next = prev + dt;
          if (next >= trajectoryData.maxFlightTime) {
            setTrajRunning(false);
            return trajectoryData.maxFlightTime;
          }
          return next;
        });
      }
      trajLastTsRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [trajRunning, trajectoryData.maxFlightTime]);

  const maxJumpHeight = useMemo(() => {
    const minG = Math.min(...bodies.map((b) => b.gravity));
    return (jumpVelocity * jumpVelocity) / (2 * minG);
  }, [bodies, jumpVelocity]);

  const earthJumpHeight = (jumpVelocity * jumpVelocity) / (2 * 9.81);
  const maxWeightG = Math.max(...bodies.map((b) => b.gravity), 9.81);

  const quizQuestions = useMemo(
    () => [
      {
        q: t("physicsLab.quiz.q1.question"),
        options: [
          t("physicsLab.quiz.q1.optA"),
          t("physicsLab.quiz.q1.optB"),
          t("physicsLab.quiz.q1.optC"),
        ],
        correct: 1,
        explanation: t("physicsLab.quiz.q1.explanation"),
      },
      {
        q: t("physicsLab.quiz.q2.question"),
        options: [
          t("physicsLab.quiz.q2.optA"),
          t("physicsLab.quiz.q2.optB"),
          t("physicsLab.quiz.q2.optC"),
        ],
        correct: 2,
        explanation: t("physicsLab.quiz.q2.explanation"),
      },
      {
        q: t("physicsLab.quiz.q3.question"),
        options: [
          t("physicsLab.quiz.q3.optA"),
          t("physicsLab.quiz.q3.optB"),
          t("physicsLab.quiz.q3.optC"),
        ],
        correct: 0,
        explanation: t("physicsLab.quiz.q3.explanation"),
      },
    ],
    [t]
  );

  const correctCount = Object.entries(quizAnswers).filter(
    ([qIdx, ans]) => quizQuestions[Number(qIdx)]?.correct === ans
  ).length;

  const showMechanics = labCategory === "all" || labCategory === "mechanics";
  const showWavesEnergy = labCategory === "all" || labCategory === "waves_energy";
  const showAtmosphere = labCategory === "all" || labCategory === "atmosphere";
  const showQuiz = labCategory === "all" || labCategory === "quiz";

  return (
    <div ref={containerRef} className="space-y-4 sm:space-y-5">
      {/* Header & Live Telemetry Context */}
      <div
        className={`rounded-2xl border bg-gradient-to-br from-surface-elevated via-surface-elevated to-accent/5 p-3.5 sm:p-5 space-y-3.5 shadow-sm transition-colors ${
          readingMode === "explorer"
            ? "border-accent/60"
            : "border-border-subtle/90"
        }`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-sm">
              <FlaskConical className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold tracking-tight text-content sm:text-lg">
                  {t("physicsLab.title")}
                </h2>
                <Badge variant="accent">{t("physicsLab.badge")}</Badge>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-content-muted">
                {t("physicsLab.subtitle")}
              </p>
            </div>
          </div>

          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs sm:flex-wrap">
            {bodies.map((body) => {
              const isTarget = activeBody === body.id;
              return (
                <span
                  key={body.id}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
                    isTarget
                      ? "border-accent bg-accent/10 text-content"
                      : "border-border-subtle bg-surface-muted/60 text-content-muted"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                  <span>{t(`physicsLab.bodies.${body.id}`)}</span>
                  <span className="tabular-nums font-semibold">{body.gravity.toFixed(2)} m/s²</span>
                </span>
              );
            })}
            <button
              type="button"
              onClick={() => setIncludeTitan((v) => !v)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors ${
                includeTitan
                  ? "border-teal-500/60 bg-teal-500/10 text-content"
                  : "border-border-subtle bg-surface-muted/40 text-content-muted hover:text-content"
              }`}
            >
              <Sparkles className="h-3 w-3 text-teal-500" aria-hidden="true" />
              <span>{t("physicsLab.toggleTitan")}</span>
            </button>
            <button
              type="button"
              onClick={() => setEnableCustomBody((v) => !v)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 font-medium transition-colors ${
                enableCustomBody
                  ? "border-yellow-500/60 bg-yellow-500/10 text-content"
                  : "border-border-subtle bg-surface-muted/40 text-content-muted hover:text-content"
              }`}
            >
              <Sliders className="h-3 w-3 text-yellow-500" aria-hidden="true" />
              <span>{t("physicsLab.toggleCustom")}</span>
            </button>
          </div>
        </div>

        {/* Category Filter Tabs for fast mobile & desktop navigation */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto border-t border-border-subtle/70 pt-3">
          {(
            [
              { id: "all", label: t("physicsLab.categories.all") },
              { id: "mechanics", label: t("physicsLab.categories.mechanics") },
              { id: "waves_energy", label: t("physicsLab.categories.wavesEnergy") },
              { id: "atmosphere", label: t("physicsLab.categories.atmosphere") },
              { id: "quiz", label: t("physicsLab.categories.quiz") },
            ] as const
          ).map((cat) => {
            const active = labCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setLabCategory(cat.id)}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-accent text-accent-foreground shadow-sm shadow-accent/20"
                    : "bg-surface-muted/60 text-content-muted hover:bg-surface-muted hover:text-content"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Custom Gravity Controls when enabled */}
        {enableCustomBody && (
          <div className="flex flex-col gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-md">
              <Slider
                id="physics-custom-gravity"
                label={t("physicsLab.customGravityLabel")}
                value={customGravity}
                min={0.3}
                max={25.0}
                step={0.05}
                formattedValue={`${customGravity.toFixed(2)} m/s² (${(customGravity / 9.81).toFixed(2)} g)`}
                onChange={setCustomGravity}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Ceres (0.28)", g: 0.28 },
                { label: "Europa (1.31)", g: 1.31 },
                { label: "Venus (8.87)", g: 8.87 },
                { label: "Neptuno (11.15)", g: 11.15 },
                { label: "Júpiter (24.79)", g: 24.79 },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setCustomGravity(item.g)}
                  className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                    Math.abs(customGravity - item.g) < 0.03
                      ? "border-yellow-500 bg-yellow-500/20 text-content"
                      : "border-border-subtle bg-surface-elevated text-content-muted hover:text-content"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Live Telemetry Connection Bar when a Planetary Site is active */}
        {activeSite && (
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border-subtle bg-surface-muted/40 p-2.5 text-xs sm:grid-cols-4">
            <div>
              <span className="text-content-muted">{t("physicsLab.telemetry.activeTarget")}:</span>
              <div className="font-semibold text-content truncate">{t(activeSite.name_key)}</div>
            </div>
            <div>
              <span className="text-content-muted">{t("physicsLab.telemetry.surfaceTemp")}:</span>
              <div className="tabular-nums font-semibold text-content">
                {(activeSite.variables.dependent.mean_surface_temp_k - 273.15).toFixed(1)} °C (
                {activeSite.variables.dependent.mean_surface_temp_k.toFixed(0)} K)
              </div>
            </div>
            <div>
              <span className="text-content-muted">{t("physicsLab.telemetry.pressure")}:</span>
              <div className="tabular-nums font-semibold text-content">
                {activeSite.variables.breakage.atm_pressure_mbar.toFixed(2)} mbar
              </div>
            </div>
            <div>
              <span className="text-content-muted">{t("physicsLab.telemetry.earthAnalog")}:</span>
              <div className="font-semibold text-content truncate">
                {selectedMatch
                  ? selectedMatch.known_analog_name || t(selectedMatch.region_key)
                  : "—"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Weight & Inertia Calculator in Newtons */}
        {showMechanics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("physicsLab.weight.title")}</span>
              </CardTitle>
              <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
                W = m · g
              </code>
            </div>
            <p className="text-xs text-content-muted">{t("physicsLab.weight.description")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              id="physics-mass-slider"
              label={t("physicsLab.weight.massLabel")}
              value={massKg}
              min={1}
              max={1050}
              step={1}
              formattedValue={`${massKg} kg`}
              onChange={setMassKg}
            />

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t("physicsLab.weight.presets.backpack"), kg: 15 },
                { label: t("physicsLab.weight.presets.astronaut"), kg: 75 },
                { label: t("physicsLab.weight.presets.suit"), kg: 145 },
                { label: t("physicsLab.weight.presets.viper"), kg: 430 },
                { label: t("physicsLab.weight.presets.perseverance"), kg: 1025 },
              ].map((preset) => (
                <button
                  key={preset.kg}
                  type="button"
                  onClick={() => setMassKg(preset.kg)}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    massKg === preset.kg
                      ? "border-accent bg-accent/15 text-content"
                      : "border-border-subtle bg-surface-muted/60 text-content-muted hover:text-content"
                  }`}
                >
                  {preset.label} ({preset.kg} kg)
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {bodies.map((body) => {
                const weightN = massKg * body.gravity;
                const earthEqKg = weightN / 9.81;
                const pct = Math.min(100, (body.gravity / maxWeightG) * 100);
                return (
                  <div
                    key={body.id}
                    className={`rounded-xl border p-2.5 ${
                      activeBody === body.id
                        ? "border-accent/60 bg-accent/5"
                        : "border-border-subtle bg-surface-muted/40"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-content">
                        <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                        {t(`physicsLab.bodies.${body.id}`)}{" "}
                        <span className="text-[11px] font-normal text-content-muted">
                          ({((body.gravity / 9.81) * 100).toFixed(0)}% g)
                        </span>
                      </span>
                      <span className="tabular-nums text-content">
                        <strong className="text-sm">{weightN.toFixed(1)} N</strong>{" "}
                        <span className="text-[11px] text-content-muted">
                          ({t("physicsLab.weight.feelsLike", { kg: earthEqKg.toFixed(1) })})
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${body.barClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-border-subtle bg-surface-muted/30 p-2.5 text-xs text-content-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span>{t("physicsLab.weight.inertiaTip", { kg: massKg })}</span>
            </div>
          </CardContent>
        </Card>
        )}

        {/* 2. Jump Simulation by Gravity */}
        {showMechanics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <ArrowUpFromLine className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("physicsLab.jump.title")}</span>
              </CardTitle>
              <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
                h = v₀² / (2g)
              </code>
            </div>
            <p className="text-xs text-content-muted">{t("physicsLab.jump.description")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Slider
                  id="physics-jump-velocity"
                  label={t("physicsLab.jump.velocityLabel")}
                  value={jumpVelocity}
                  min={1.5}
                  max={6.0}
                  step={0.1}
                  formattedValue={`${jumpVelocity.toFixed(1)} m/s`}
                  onChange={(v) => {
                    setJumpVelocity(v);
                    setJumpRunning(false);
                    setJumpElapsed(0);
                  }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={() => {
                    if (jumpElapsed >= maxJumpTime) {
                      setJumpElapsed(0);
                    }
                    setJumpRunning((r) => !r);
                  }}
                >
                  {jumpRunning ? (
                    <>
                      <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t("physicsLab.controls.pause")}</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t("physicsLab.jump.jumpAction")}</span>
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setJumpSlowMo((s) => !s)}
                >
                  <span>{jumpSlowMo ? "0.5×" : "1×"}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={t("physicsLab.controls.reset")}
                  onClick={() => {
                    setJumpRunning(false);
                    setJumpElapsed(0);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div
              className={`grid gap-2.5 rounded-lg border border-border-subtle bg-surface-muted/30 p-3 ${
                bodies.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
              }`}
            >
              {bodies.map((body) => {
                const maxH = (jumpVelocity * jumpVelocity) / (2 * body.gravity);
                const airTime = (2 * jumpVelocity) / body.gravity;
                const currentH = Math.max(
                  0,
                  jumpVelocity * jumpElapsed - 0.5 * body.gravity * jumpElapsed * jumpElapsed
                );
                const heightPct = maxJumpHeight > 0 ? (currentH / maxJumpHeight) * 100 : 0;
                const peakPct = maxJumpHeight > 0 ? (maxH / maxJumpHeight) * 100 : 0;
                const mult = earthJumpHeight > 0 ? maxH / earthJumpHeight : 1;

                return (
                  <div key={body.id} className="flex flex-col items-center gap-2">
                    <div className="relative h-40 w-full overflow-hidden rounded-md border border-border-subtle bg-surface-elevated">
                      {[0.25, 0.5, 0.75, 1].map((frac) => (
                        <div
                          key={frac}
                          className="absolute inset-x-0 border-t border-border-subtle/50 text-[9px] text-content-muted/60 pl-1"
                          style={{ bottom: `calc(${frac * 82}% + 10px)` }}
                        >
                          {(maxJumpHeight * frac).toFixed(1)}m
                        </div>
                      ))}
                      <div
                        className="absolute inset-x-1 border-t border-dashed border-accent/70"
                        style={{ bottom: `calc(${Math.min(86, peakPct * 0.82)}% + 10px)` }}
                      />
                      <div className="absolute inset-x-0 bottom-0 h-2.5 bg-surface-muted" />
                      <div
                        className="absolute bottom-1 left-1/2 h-1.5 -translate-x-1/2 rounded-full bg-black/25 transition-all"
                        style={{
                          width: `${Math.max(6, 18 - (heightPct / 100) * 12)}px`,
                        }}
                      />
                      <div
                        className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full shadow-sm ${body.dotClass}`}
                        style={{
                          bottom: `calc(${Math.min(86, heightPct * 0.82)}% + 10px)`,
                        }}
                      />
                    </div>
                    <div className="text-center text-[11px]">
                      <div className="font-semibold text-content">
                        {t(`physicsLab.bodies.${body.id}`)}
                      </div>
                      <div className="tabular-nums text-content">
                        <strong>{maxH.toFixed(2)} m</strong>{" "}
                        <span className="text-content-muted">({mult.toFixed(1)}×)</span>
                      </div>
                      <div className="tabular-nums text-content-muted">
                        {t("physicsLab.jump.airTime")}: {airTime.toFixed(2)} s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {/* 3. Projectile Trajectory Comparison */}
        {showMechanics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("physicsLab.trajectory.title")}</span>
              </CardTitle>
              <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
                R = v₀² sin(2θ) / g
              </code>
            </div>
            <p className="text-xs text-content-muted">{t("physicsLab.trajectory.description")}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Slider
                id="physics-launch-speed"
                label={t("physicsLab.trajectory.speedLabel")}
                value={launchSpeed}
                min={5}
                max={35}
                step={1}
                formattedValue={`${launchSpeed} m/s`}
                onChange={(v) => {
                  setLaunchSpeed(v);
                  setTrajRunning(false);
                  setTrajElapsed(0);
                }}
              />
              <Slider
                id="physics-launch-angle"
                label={t("physicsLab.trajectory.angleLabel")}
                value={launchAngleDeg}
                min={10}
                max={80}
                step={1}
                formattedValue={`${launchAngleDeg}°`}
                onChange={(v) => {
                  setLaunchAngleDeg(v);
                  setTrajRunning(false);
                  setTrajElapsed(0);
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setEnableAtmDrag((d) => !d);
                  setTrajRunning(false);
                  setTrajElapsed(0);
                }}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  enableAtmDrag
                    ? "border-accent bg-accent/15 text-content"
                    : "border-border-subtle bg-surface-muted/50 text-content-muted hover:text-content"
                }`}
              >
                <Wind className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                <span>{t("physicsLab.trajectory.dragToggle")}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={() => {
                    if (trajElapsed >= trajectoryData.maxFlightTime) {
                      setTrajElapsed(0);
                    }
                    setTrajRunning((r) => !r);
                  }}
                >
                  {trajRunning ? (
                    <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{t("physicsLab.trajectory.launchAction")}</span>
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  aria-label={t("physicsLab.controls.reset")}
                  onClick={() => {
                    setTrajRunning(false);
                    setTrajElapsed(0);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-muted/30 p-2">
              <svg
                viewBox="0 0 420 180"
                className="h-44 w-full cursor-crosshair touch-none"
                role="img"
                aria-label={t("physicsLab.trajectory.chartAria")}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = ((e.clientX - rect.left) / rect.width) * 420;
                  const frac = Math.max(0, Math.min(1, (relX - 32) / 370));
                  setHoverFraction(frac);
                }}
                onMouseLeave={() => setHoverFraction(null)}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  if (!touch) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relX = ((touch.clientX - rect.left) / rect.width) * 420;
                  const frac = Math.max(0, Math.min(1, (relX - 32) / 370));
                  setHoverFraction(frac);
                }}
                onTouchEnd={() => setHoverFraction(null)}
              >
                {[0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = 155 - frac * 130;
                  return (
                    <line
                      key={frac}
                      x1={32}
                      y1={y}
                      x2={406}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={0.12}
                      strokeDasharray="3 3"
                    />
                  );
                })}
                <line x1={32} y1={155} x2={406} y2={155} stroke="currentColor" strokeOpacity={0.35} />
                <line x1={32} y1={20} x2={32} y2={155} stroke="currentColor" strokeOpacity={0.35} />

                <text x={35} y={24} fontSize={9} fill="currentColor" opacity={0.65}>
                  {trajectoryData.maxHeight.toFixed(0)} m
                </text>
                <text x={404} y={170} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.65}>
                  {trajectoryData.maxRange.toFixed(0)} m
                </text>

                {hoverFraction !== null && (
                  <line
                    x1={32 + hoverFraction * 370}
                    y1={20}
                    x2={32 + hoverFraction * 370}
                    y2={155}
                    stroke="currentColor"
                    strokeOpacity={0.3}
                    strokeDasharray="2 2"
                  />
                )}

                {trajectoryData.curves.map(({ body, points }) => {
                  const d = points
                    .map((pt, idx) => {
                      const sx = 32 + (pt.x / trajectoryData.maxRange) * 370;
                      const sy = 155 - (pt.y / trajectoryData.maxHeight) * 130;
                      return `${idx === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`;
                    })
                    .join(" ");

                  const targetTime =
                    hoverFraction !== null
                      ? hoverFraction * trajectoryData.maxFlightTime
                      : trajElapsed;
                  const activePt =
                    points.find((p) => p.t >= targetTime) ?? points[points.length - 1];
                  const dotX = 32 + (activePt.x / trajectoryData.maxRange) * 370;
                  const dotY = 155 - (activePt.y / trajectoryData.maxHeight) * 130;

                  return (
                    <g key={body.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke={body.stroke}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                      />
                      {(trajRunning || trajElapsed > 0 || hoverFraction !== null) && (
                        <circle cx={dotX} cy={dotY} r={4.5} fill={body.stroke} />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div
              className={`grid gap-2 text-center text-[11px] ${
                bodies.length >= 4
                  ? "grid-cols-2 sm:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-3"
              }`}
            >
              {trajectoryData.curves.map(({ body, range, maxHeight, flightTime }) => (
                <div
                  key={body.id}
                  className="rounded-md border border-border-subtle bg-surface-muted/40 p-2"
                >
                  <div className="font-semibold text-content">
                    {t(`physicsLab.bodies.${body.id}`)}
                  </div>
                  <div className="mt-0.5 tabular-nums text-content-muted">
                    {t("physicsLab.trajectory.range")}:{" "}
                    <strong className="text-content">{range.toFixed(1)} m</strong>
                  </div>
                  <div className="tabular-nums text-content-muted">
                    {t("physicsLab.trajectory.height")}:{" "}
                    <strong className="text-content">{maxHeight.toFixed(1)} m</strong>
                  </div>
                  <div className="tabular-nums text-content-muted">
                    {t("physicsLab.trajectory.time")}:{" "}
                    <strong className="text-content">{flightTime.toFixed(1)} s</strong>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        )}

        {/* 4. Isolated Shallow Water Wave Speed Simulation */}
        {showWavesEnergy && <WaveSimulatorCard bodies={bodies} isVisible={isVisible} />}

        {/* 5. Isolated Planetary Pendulum & Gravitational Clock */}
        {showWavesEnergy && <PendulumSimulatorCard bodies={bodies} isVisible={isVisible} />}

        {/* 6. Escape Velocity & Orbital Energy */}
        {showMechanics && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("physicsLab.escape.title")}</span>
              </CardTitle>
              <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
                vₑ = √(2gR)
              </code>
            </div>
            <p className="text-xs text-content-muted">{t("physicsLab.escape.description")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Slider
              id="physics-spacecraft-mass"
              label={t("physicsLab.escape.massLabel")}
              value={spacecraftMassKg}
              min={100}
              max={5000}
              step={100}
              formattedValue={`${spacecraftMassKg} kg`}
              onChange={setSpacecraftMassKg}
            />

            <div className="space-y-2.5">
              {bodies.map((body) => {
                const orbitalVelKms = body.escapeVelKms / Math.SQRT2;
                const escapeEnergyGJ =
                  (0.5 * spacecraftMassKg * Math.pow(body.escapeVelKms * 1000, 2)) / 1e9;
                const maxEsc = Math.max(...bodies.map((b) => b.escapeVelKms), 11.19);
                const pct = Math.min(100, (body.escapeVelKms / maxEsc) * 100);

                return (
                  <div
                    key={body.id}
                    className="rounded-lg border border-border-subtle bg-surface-muted/40 p-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-content">
                        <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                        {t(`physicsLab.bodies.${body.id}`)}
                      </span>
                      <span className="tabular-nums text-content">
                        <strong>{body.escapeVelKms.toFixed(2)} km/s</strong>{" "}
                        <span className="text-content-muted">
                          ({t("physicsLab.escape.orbital")}: {orbitalVelKms.toFixed(2)} km/s ·{" "}
                          {escapeEnergyGJ.toFixed(1)} GJ)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${body.barClass}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {/* 7. Solar Photovoltaic Generation & Dust Storm Attenuation */}
        {showWavesEnergy && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-accent" aria-hidden="true" />
                <span>{t("physicsLab.solar.title")}</span>
              </CardTitle>
              <code className="rounded bg-surface-muted px-2 py-0.5 text-[11px] font-semibold text-content">
                P = η · A · S₀ · e^(-τ)
              </code>
            </div>
            <p className="text-xs text-content-muted">{t("physicsLab.solar.description")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Slider
                id="physics-solar-area"
                label={t("physicsLab.solar.areaLabel")}
                value={solarAreaM2}
                min={2}
                max={80}
                step={2}
                formattedValue={`${solarAreaM2} m²`}
                onChange={setSolarAreaM2}
              />
              <Slider
                id="physics-dust-tau"
                label={t("physicsLab.solar.dustLabel")}
                value={dustOpticalDepth}
                min={0.05}
                max={3.0}
                step={0.05}
                formattedValue={`τ = ${dustOpticalDepth.toFixed(2)}`}
                onChange={setDustOpticalDepth}
              />
            </div>

            <div
              className={`grid gap-3 ${
                bodies.length >= 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3"
              }`}
            >
              {bodies.map((body) => {
                // Airless bodies (Moon) do not experience atmospheric dust storm optical depth tau
                const effectiveTau = body.pressureMbar > 0 ? dustOpticalDepth : 0.0;
                const attenuatedFlux = body.solarFluxWm2 * Math.exp(-effectiveTau);
                const powerWatts = 0.3 * solarAreaM2 * attenuatedFlux;
                const roversPowered = powerWatts / 250;

                return (
                  <div
                    key={body.id}
                    className="rounded-lg border border-border-subtle bg-surface-muted/40 p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-content">
                        <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                        {t(`physicsLab.bodies.${body.id}`)}
                      </span>
                      <span className="tabular-nums text-[11px] text-content-muted">
                        {attenuatedFlux.toFixed(0)} W/m²
                      </span>
                    </div>
                    <div className="tabular-nums text-base font-bold text-content">
                      {powerWatts >= 1000
                        ? `${(powerWatts / 1000).toFixed(2)} kW`
                        : `${powerWatts.toFixed(0)} W`}
                    </div>
                    <div className="text-[11px] text-content-muted">
                      {t("physicsLab.solar.roversPowered", {
                        count: Number(roversPowered.toFixed(1)),
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        )}

        {/* 8. Atmospheric Chemistry & Human Habitability Comparison */}
        {showAtmosphere && <AtmosphericChemistryCard activeBody={activeBody} />}
      </div>

      {/* 9. Interactive STEAM Challenge / Self-Assessment */}
      {showQuiz && (
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-4 w-4 text-accent" aria-hidden="true" />
              <span>{t("physicsLab.quiz.title")}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="accent">
                {correctCount} / {quizQuestions.length}
              </Badge>
              <Badge variant="default">
                <HelpCircle className="h-3 w-3" aria-hidden="true" />
                <span>{t("physicsLab.quiz.subtitleBadge")}</span>
              </Badge>
            </div>
          </div>
          <p className="text-xs text-content-muted">{t("physicsLab.quiz.description")}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quizQuestions.map((item, qIdx) => {
              const selected = quizAnswers[qIdx];
              const answered = selected !== undefined;
              const isCorrect = selected === item.correct;
              return (
                <div
                  key={qIdx}
                  className="flex flex-col justify-between rounded-lg border border-border-subtle bg-surface-muted/30 p-3 space-y-3"
                >
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-content">
                      {qIdx + 1}. {item.q}
                    </div>
                    <div className="space-y-1.5">
                      {item.options.map((opt, optIdx) => {
                        const isPicked = selected === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() =>
                              setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))
                            }
                            className={`flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${
                              !answered
                                ? "border-border-subtle bg-surface-elevated text-content hover:border-accent"
                                : optIdx === item.correct
                                  ? "border-status-valid bg-status-valid/10 font-semibold text-content"
                                  : isPicked
                                    ? "border-status-break bg-status-break/10 text-content"
                                    : "border-border-subtle bg-surface-elevated/50 text-content-muted"
                            }`}
                          >
                            <span>{opt}</span>
                            {answered && optIdx === item.correct && (
                              <CheckCircle2
                                className="h-3.5 w-3.5 shrink-0 text-status-valid"
                                aria-hidden="true"
                              />
                            )}
                            {answered && isPicked && !isCorrect && (
                              <XCircle
                                className="h-3.5 w-3.5 shrink-0 text-status-break"
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {answered && (
                    <p className="rounded bg-surface-elevated p-2 text-[11px] text-content-muted">
                      {item.explanation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
