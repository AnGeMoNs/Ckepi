import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpFromLine,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  Scale,
  TrendingUp,
  Waves,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PlanetaryBody } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Slider } from "../ui/Slider";

interface BodyPhysics {
  id: "earth" | "mars" | "moon";
  gravity: number;
  stroke: string;
  barClass: string;
  dotClass: string;
}

const BODIES: readonly BodyPhysics[] = [
  {
    id: "earth",
    gravity: 9.81,
    stroke: "#3b82f6",
    barClass: "bg-blue-500",
    dotClass: "bg-blue-500",
  },
  {
    id: "mars",
    gravity: 3.72,
    stroke: "#f97316",
    barClass: "bg-orange-500",
    dotClass: "bg-orange-500",
  },
  {
    id: "moon",
    gravity: 1.62,
    stroke: "#a855f7",
    barClass: "bg-purple-500",
    dotClass: "bg-purple-500",
  },
] as const;

interface PlanetaryPhysicsLabProps {
  activeBody?: PlanetaryBody;
}

export function PlanetaryPhysicsLab({ activeBody }: PlanetaryPhysicsLabProps) {
  const { t } = useTranslation();

  // 1. Weight calculator state
  const [massKg, setMassKg] = useState(70);

  // 2. Jump simulator state
  const [jumpVelocity, setJumpVelocity] = useState(3.2);
  const [jumpRunning, setJumpRunning] = useState(false);
  const [jumpElapsed, setJumpElapsed] = useState(0);
  const jumpLastTsRef = useRef<number | null>(null);

  // 3. Trajectory comparison state
  const [launchSpeed, setLaunchSpeed] = useState(18);
  const [launchAngleDeg, setLaunchAngleDeg] = useState(45);
  const [trajRunning, setTrajRunning] = useState(false);
  const [trajElapsed, setTrajElapsed] = useState(0);
  const trajLastTsRef = useRef<number | null>(null);

  // 4. Shallow water wave state
  const [waterDepthM, setWaterDepthM] = useState(5);
  const [waveRunning, setWaveRunning] = useState(true);
  const [wavePhaseTime, setWavePhaseTime] = useState(0);
  const waveLastTsRef = useRef<number | null>(null);

  // Jump animation loop
  const maxJumpTime = useMemo(() => {
    const minG = Math.min(...BODIES.map((b) => b.gravity));
    return (2 * jumpVelocity) / minG;
  }, [jumpVelocity]);

  useEffect(() => {
    if (!jumpRunning) {
      jumpLastTsRef.current = null;
      return;
    }
    let rafId = 0;
    const step = (ts: number) => {
      if (jumpLastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - jumpLastTsRef.current) / 1000);
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
  }, [jumpRunning, maxJumpTime]);

  // Trajectory animation loop
  const maxFlightTime = useMemo(() => {
    const theta = (launchAngleDeg * Math.PI) / 180;
    const vy = launchSpeed * Math.sin(theta);
    const minG = Math.min(...BODIES.map((b) => b.gravity));
    return (2 * vy) / minG;
  }, [launchSpeed, launchAngleDeg]);

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
          if (next >= maxFlightTime) {
            setTrajRunning(false);
            return maxFlightTime;
          }
          return next;
        });
      }
      trajLastTsRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [trajRunning, maxFlightTime]);

  // Shallow water wave animation loop
  useEffect(() => {
    if (!waveRunning) {
      waveLastTsRef.current = null;
      return;
    }
    let rafId = 0;
    const step = (ts: number) => {
      if (waveLastTsRef.current !== null) {
        const dt = Math.min(0.05, (ts - waveLastTsRef.current) / 1000);
        setWavePhaseTime((prev) => prev + dt);
      }
      waveLastTsRef.current = ts;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [waveRunning]);

  // Computed trajectory curves for SVG
  const trajectoryData = useMemo(() => {
    const theta = (launchAngleDeg * Math.PI) / 180;
    const vx = launchSpeed * Math.cos(theta);
    const vy = launchSpeed * Math.sin(theta);

    const curves = BODIES.map((body) => {
      const flightTime = (2 * vy) / body.gravity;
      const range = vx * flightTime;
      const maxHeight = (vy * vy) / (2 * body.gravity);
      const samples = 48;
      const points: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= samples; i++) {
        const tSec = (i / samples) * flightTime;
        points.push({
          x: vx * tSec,
          y: Math.max(0, vy * tSec - 0.5 * body.gravity * tSec * tSec),
        });
      }
      return { body, flightTime, range, maxHeight, points, vx, vy };
    });

    const maxRange = Math.max(...curves.map((c) => c.range), 1);
    const maxHeight = Math.max(...curves.map((c) => c.maxHeight), 1);
    return { curves, maxRange, maxHeight };
  }, [launchSpeed, launchAngleDeg]);

  const maxJumpHeight = useMemo(() => {
    const minG = Math.min(...BODIES.map((b) => b.gravity));
    return (jumpVelocity * jumpVelocity) / (2 * minG);
  }, [jumpVelocity]);

  const earthJumpHeight = (jumpVelocity * jumpVelocity) / (2 * 9.81);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-elevated p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
            <FlaskConical className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-content">{t("physicsLab.title")}</h2>
              <Badge variant="accent">{t("physicsLab.badge")}</Badge>
            </div>
            <p className="mt-0.5 text-xs text-content-muted">{t("physicsLab.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {BODIES.map((body) => {
            const isTarget = activeBody === body.id;
            return (
              <span
                key={body.id}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium ${
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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* 1. Weight Calculator in Newtons */}
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
              max={250}
              step={1}
              formattedValue={`${massKg} kg`}
              onChange={setMassKg}
            />

            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t("physicsLab.weight.presets.backpack"), kg: 15 },
                { label: t("physicsLab.weight.presets.astronaut"), kg: 75 },
                { label: t("physicsLab.weight.presets.suit"), kg: 145 },
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

            <div className="space-y-2.5">
              {BODIES.map((body) => {
                const weightN = massKg * body.gravity;
                const earthEqKg = weightN / 9.81;
                const pct = Math.min(100, (body.gravity / 9.81) * 100);
                return (
                  <div
                    key={body.id}
                    className={`rounded-lg border p-2.5 ${
                      activeBody === body.id
                        ? "border-accent/60 bg-accent/5"
                        : "border-border-subtle bg-surface-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-content">
                        <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                        {t(`physicsLab.bodies.${body.id}`)}
                      </span>
                      <span className="tabular-nums text-content">
                        <strong className="text-sm">{weightN.toFixed(1)} N</strong>{" "}
                        <span className="text-content-muted">
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
          </CardContent>
        </Card>

        {/* 2. Jump Simulation by Gravity */}
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
              <div className="flex items-center gap-2">
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

            <div className="grid grid-cols-3 gap-3 rounded-lg border border-border-subtle bg-surface-muted/30 p-3">
              {BODIES.map((body) => {
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
                    <div className="relative h-36 w-full overflow-hidden rounded-md border border-border-subtle bg-surface-elevated">
                      {/* Peak height marker */}
                      <div
                        className="absolute inset-x-1 border-t border-dashed border-content-muted/40"
                        style={{ bottom: `calc(${Math.min(88, peakPct * 0.85)}% + 10px)` }}
                      />
                      {/* Ground */}
                      <div className="absolute inset-x-0 bottom-0 h-2.5 bg-surface-muted" />
                      {/* Jumper */}
                      <div
                        className={`absolute left-1/2 h-4 w-4 -translate-x-1/2 rounded-full shadow-sm ${body.dotClass}`}
                        style={{
                          bottom: `calc(${Math.min(88, heightPct * 0.85)}% + 10px)`,
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
                      <div className="tabular-nums text-content-muted">{airTime.toFixed(2)} s</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 3. Projectile Trajectory Comparison */}
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

            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {BODIES.map((body) => (
                  <span key={body.id} className="inline-flex items-center gap-1.5 text-content-muted">
                    <span className={`h-2.5 w-2.5 rounded-full ${body.dotClass}`} aria-hidden="true" />
                    {t(`physicsLab.bodies.${body.id}`)}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  onClick={() => {
                    if (trajElapsed >= maxFlightTime) {
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

            <div className="rounded-lg border border-border-subtle bg-surface-muted/30 p-2">
              <svg
                viewBox="0 0 420 180"
                className="h-44 w-full"
                role="img"
                aria-label={t("physicsLab.trajectory.chartAria")}
              >
                {/* Grid lines */}
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
                {/* Axes */}
                <line x1={32} y1={155} x2={406} y2={155} stroke="currentColor" strokeOpacity={0.35} />
                <line x1={32} y1={20} x2={32} y2={155} stroke="currentColor" strokeOpacity={0.35} />

                {/* Axis labels */}
                <text x={35} y={24} fontSize={9} fill="currentColor" opacity={0.65}>
                  {trajectoryData.maxHeight.toFixed(0)} m
                </text>
                <text x={404} y={170} textAnchor="end" fontSize={9} fill="currentColor" opacity={0.65}>
                  {trajectoryData.maxRange.toFixed(0)} m
                </text>

                {/* Curves + animated dots */}
                {trajectoryData.curves.map(({ body, points, flightTime, vx, vy }) => {
                  const d = points
                    .map((pt, idx) => {
                      const sx = 32 + (pt.x / trajectoryData.maxRange) * 370;
                      const sy = 155 - (pt.y / trajectoryData.maxHeight) * 130;
                      return `${idx === 0 ? "M" : "L"}${sx.toFixed(1)},${sy.toFixed(1)}`;
                    })
                    .join(" ");

                  const clampedT = Math.min(trajElapsed, flightTime);
                  const curX = vx * clampedT;
                  const curY = Math.max(0, vy * clampedT - 0.5 * body.gravity * clampedT * clampedT);
                  const dotX = 32 + (curX / trajectoryData.maxRange) * 370;
                  const dotY = 155 - (curY / trajectoryData.maxHeight) * 130;

                  return (
                    <g key={body.id}>
                      <path
                        d={d}
                        fill="none"
                        stroke={body.stroke}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                      />
                      {(trajRunning || trajElapsed > 0) && (
                        <circle cx={dotX} cy={dotY} r={4.5} fill={body.stroke} />
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
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

        {/* 4. Shallow Water Wave Speed Simulation */}
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
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
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

            <div className="space-y-2.5">
              {BODIES.map((body) => {
                const celerityMs = Math.sqrt(body.gravity * waterDepthM);
                const celerityKmh = celerityMs * 3.6;
                const k = (2 * Math.PI) / 80;
                const phase = wavePhaseTime * celerityMs * 0.45;
                const points: string[] = [];
                for (let x = 0; x <= 360; x += 6) {
                  const y = 20 + 8 * Math.sin(k * x - phase);
                  points.push(`${x === 0 ? "M" : "L"}${x},${y.toFixed(1)}`);
                }
                const wavePath = `${points.join(" ")} L360,40 L0,40 Z`;

                return (
                  <div
                    key={body.id}
                    className="rounded-lg border border-border-subtle bg-surface-muted/40 p-2.5"
                  >
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-content">
                        <span className={`h-2 w-2 rounded-full ${body.dotClass}`} aria-hidden="true" />
                        {t(`physicsLab.bodies.${body.id}`)}
                      </span>
                      <span className="tabular-nums text-content">
                        <strong>{celerityMs.toFixed(2)} m/s</strong>{" "}
                        <span className="text-content-muted">({celerityKmh.toFixed(1)} km/h)</span>
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
      </div>
    </div>
  );
}
