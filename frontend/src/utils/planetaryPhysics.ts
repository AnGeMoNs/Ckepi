import type { PlanetaryBody } from "../types/analog";

export type PhysicsBody = "earth" | PlanetaryBody;

export interface GravitySpec {
  body: PhysicsBody;
  gravityMs2: number;
  surfacePressureKpa: number;
  labelKey: string;
}

export const GRAVITY_SPECS: Record<PhysicsBody, GravitySpec> = {
  earth: {
    body: "earth",
    gravityMs2: 9.80665,
    surfacePressureKpa: 101.325,
    labelKey: "bodies.earth",
  },
  mars: {
    body: "mars",
    gravityMs2: 3.71,
    surfacePressureKpa: 0.61,
    labelKey: "bodies.mars",
  },
  moon: {
    body: "moon",
    gravityMs2: 1.62,
    surfacePressureKpa: 0,
    labelKey: "bodies.moon",
  },
};

export function clampFinite(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

export interface WeightComparison {
  body: PhysicsBody;
  massKg: number;
  gravityMs2: number;
  weightN: number;
  earthScaleKgf: number;
}

export function computeWeightComparison(massKgRaw: number): Record<PhysicsBody, WeightComparison> {
  const massKg = clampFinite(massKgRaw, 1, 5000, 80);
  const gEarth = GRAVITY_SPECS.earth.gravityMs2;

  return {
    earth: {
      body: "earth",
      massKg,
      gravityMs2: gEarth,
      weightN: massKg * gEarth,
      earthScaleKgf: massKg,
    },
    mars: {
      body: "mars",
      massKg,
      gravityMs2: GRAVITY_SPECS.mars.gravityMs2,
      weightN: massKg * GRAVITY_SPECS.mars.gravityMs2,
      earthScaleKgf: (massKg * GRAVITY_SPECS.mars.gravityMs2) / gEarth,
    },
    moon: {
      body: "moon",
      massKg,
      gravityMs2: GRAVITY_SPECS.moon.gravityMs2,
      weightN: massKg * GRAVITY_SPECS.moon.gravityMs2,
      earthScaleKgf: (massKg * GRAVITY_SPECS.moon.gravityMs2) / gEarth,
    },
  };
}

export interface JumpComparison {
  body: PhysicsBody;
  takeoffSpeedMs: number;
  jumpHeightM: number;
  hangTimeS: number;
  ratioVsEarth: number;
}

export function computeJumpFromEarthHeight(earthJumpCmRaw: number): Record<PhysicsBody, JumpComparison> {
  const earthJumpM = clampFinite(earthJumpCmRaw, 5, 250, 45) / 100;
  const gEarth = GRAVITY_SPECS.earth.gravityMs2;
  const v0 = Math.sqrt(2 * gEarth * earthJumpM);

  const calc = (body: PhysicsBody): JumpComparison => {
    const g = GRAVITY_SPECS[body].gravityMs2;
    const h = (v0 * v0) / (2 * g);
    const hangTimeS = (2 * v0) / g;
    return {
      body,
      takeoffSpeedMs: v0,
      jumpHeightM: h,
      hangTimeS,
      ratioVsEarth: h / earthJumpM,
    };
  };

  return {
    earth: calc("earth"),
    mars: calc("mars"),
    moon: calc("moon"),
  };
}

export interface ProjectileComparison {
  body: PhysicsBody;
  v0Ms: number;
  angleDeg: number;
  rangeM: number;
  maxHeightM: number;
  flightTimeS: number;
}

export function computeProjectileComparison(
  v0MsRaw: number,
  angleDegRaw: number
): Record<PhysicsBody, ProjectileComparison> {
  const v0Ms = clampFinite(v0MsRaw, 1, 100, 15);
  const angleDeg = clampFinite(angleDegRaw, 5, 85, 45);
  const theta = (angleDeg * Math.PI) / 180;
  const sinTheta = Math.sin(theta);
  const sin2Theta = Math.sin(2 * theta);

  const calc = (body: PhysicsBody): ProjectileComparison => {
    const g = GRAVITY_SPECS[body].gravityMs2;
    return {
      body,
      v0Ms,
      angleDeg,
      rangeM: (v0Ms * v0Ms * sin2Theta) / g,
      maxHeightM: Math.pow(v0Ms * sinTheta, 2) / (2 * g),
      flightTimeS: (2 * v0Ms * sinTheta) / g,
    };
  };

  return {
    earth: calc("earth"),
    mars: calc("mars"),
    moon: calc("moon"),
  };
}

export interface ShallowWaveComparison {
  body: PhysicsBody;
  depthM: number;
  waveSpeedMs: number;
  ratioVsEarth: number;
}

export function computeShallowWaveComparison(depthMRaw: number): Record<PhysicsBody, ShallowWaveComparison> {
  const depthM = clampFinite(depthMRaw, 0.1, 10, 1.5);
  const cEarth = Math.sqrt(GRAVITY_SPECS.earth.gravityMs2 * depthM);

  const calc = (body: PhysicsBody): ShallowWaveComparison => {
    const c = Math.sqrt(GRAVITY_SPECS[body].gravityMs2 * depthM);
    return {
      body,
      depthM,
      waveSpeedMs: c,
      ratioVsEarth: c / cEarth,
    };
  };

  return {
    earth: calc("earth"),
    mars: calc("mars"),
    moon: calc("moon"),
  };
}

export interface RockPushComparison {
  body: PhysicsBody;
  rockMassKg: number;
  targetAccelMs2: number;
  frictionCoeff: number;
  weightN: number;
  inertialForceN: number;
  maxStaticFrictionN: number;
  totalHorizontalForceN: number;
}

export function computeRockPushComparison(
  rockMassKgRaw: number,
  targetAccelMs2Raw: number,
  frictionCoeffRaw: number
): Record<PhysicsBody, RockPushComparison> {
  const rockMassKg = clampFinite(rockMassKgRaw, 1, 2000, 50);
  const targetAccelMs2 = clampFinite(targetAccelMs2Raw, 0.1, 5, 1.0);
  const frictionCoeff = clampFinite(frictionCoeffRaw, 0.05, 1.2, 0.55);

  const calc = (body: PhysicsBody): RockPushComparison => {
    const g = GRAVITY_SPECS[body].gravityMs2;
    const weightN = rockMassKg * g;
    const inertialForceN = rockMassKg * targetAccelMs2;
    const maxStaticFrictionN = frictionCoeff * weightN;
    return {
      body,
      rockMassKg,
      targetAccelMs2,
      frictionCoeff,
      weightN,
      inertialForceN,
      maxStaticFrictionN,
      totalHorizontalForceN: inertialForceN + maxStaticFrictionN,
    };
  };

  return {
    earth: calc("earth"),
    mars: calc("mars"),
    moon: calc("moon"),
  };
}

export interface RoverSlopeComparison {
  body: PhysicsBody;
  roverMassKg: number;
  slopeDeg: number;
  frictionCoeff: number;
  parallelForceN: number;
  normalForceN: number;
  maxTractionN: number;
  tractionMarginN: number;
  idealSlipRisk: boolean;
}

export function computeRoverSlopeComparison(
  roverMassKgRaw: number,
  slopeDegRaw: number,
  frictionCoeffRaw: number
): Record<PhysicsBody, RoverSlopeComparison> {
  const roverMassKg = clampFinite(roverMassKgRaw, 5, 3000, 100);
  const slopeDeg = clampFinite(slopeDegRaw, 0, 45, 15);
  const frictionCoeff = clampFinite(frictionCoeffRaw, 0.1, 1.2, 0.55);
  const theta = (slopeDeg * Math.PI) / 180;
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);

  const calc = (body: PhysicsBody): RoverSlopeComparison => {
    const g = GRAVITY_SPECS[body].gravityMs2;
    const weightN = roverMassKg * g;
    const parallelForceN = weightN * sinT;
    const normalForceN = weightN * cosT;
    const maxTractionN = frictionCoeff * normalForceN;
    const tractionMarginN = maxTractionN - parallelForceN;
    return {
      body,
      roverMassKg,
      slopeDeg,
      frictionCoeff,
      parallelForceN,
      normalForceN,
      maxTractionN,
      tractionMarginN,
      idealSlipRisk: tractionMarginN < 0,
    };
  };

  return {
    earth: calc("earth"),
    mars: calc("mars"),
    moon: calc("moon"),
  };
}
