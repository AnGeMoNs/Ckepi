import assert from "node:assert/strict";
import test from "node:test";

import {
  computeJumpFromEarthHeight,
  computeProjectileComparison,
  computeRockPushComparison,
  computeRoverSlopeComparison,
  computeShallowWaveComparison,
  computeWeightComparison,
} from "../src/utils/planetaryPhysics.ts";

test("computeWeightComparison preserves mass and scales weight in Newtons", () => {
  const res = computeWeightComparison(80);
  assert.equal(res.earth.massKg, 80);
  assert.equal(res.mars.massKg, 80);
  assert.equal(res.moon.massKg, 80);

  assert.ok(Math.abs(res.earth.weightN - 784.532) < 0.01);
  assert.ok(Math.abs(res.mars.weightN - 296.8) < 0.01);
  assert.ok(Math.abs(res.moon.weightN - 129.6) < 0.01);
  assert.equal(res.earth.earthScaleKgf, 80);
  assert.ok(Math.abs(res.mars.earthScaleKgf - 80 * (3.71 / 9.80665)) < 0.001);
});

test("computeJumpFromEarthHeight yields ~2.64x height on Mars at equal takeoff speed", () => {
  const res = computeJumpFromEarthHeight(50);
  assert.ok(Math.abs(res.earth.jumpHeightM - 0.5) < 0.001);
  assert.ok(Math.abs(res.mars.ratioVsEarth - 9.80665 / 3.71) < 0.001);
  assert.ok(Math.abs(res.mars.ratioVsEarth - 2.643) < 0.01);
  assert.ok(res.moon.jumpHeightM > res.mars.jumpHeightM);
});

test("computeProjectileComparison peaks at 45 deg and scales inversely with g", () => {
  const r45 = computeProjectileComparison(20, 45);
  const r30 = computeProjectileComparison(20, 30);
  assert.ok(r45.earth.rangeM > r30.earth.rangeM);
  assert.ok(r45.mars.rangeM > r45.earth.rangeM);
  assert.ok(r45.moon.rangeM > r45.mars.rangeM);
  assert.ok(Math.abs(r45.mars.rangeM / r45.earth.rangeM - 9.80665 / 3.71) < 0.001);
});

test("computeShallowWaveComparison matches ~0.615 speed ratio on Mars", () => {
  const res = computeShallowWaveComparison(1.5);
  assert.ok(Math.abs(res.mars.ratioVsEarth - 0.615) < 0.002);
  assert.ok(res.moon.waveSpeedMs < res.mars.waveSpeedMs);
});

test("computeRockPushComparison keeps inertial force F=m*a invariant across bodies", () => {
  const res = computeRockPushComparison(50, 1.2, 0.5);
  assert.equal(res.earth.inertialForceN, 60);
  assert.equal(res.mars.inertialForceN, 60);
  assert.equal(res.moon.inertialForceN, 60);
  assert.ok(res.mars.weightN < res.earth.weightN);
  assert.ok(res.mars.maxStaticFrictionN < res.earth.maxStaticFrictionN);
});

test("computeRoverSlopeComparison matches 100 kg at 15 deg and detects slip when tan(theta) > mu", () => {
  const res = computeRoverSlopeComparison(100, 15, 0.55);
  assert.ok(Math.abs(res.earth.parallelForceN - 253.8) < 0.5);
  assert.ok(Math.abs(res.mars.parallelForceN - 96.0) < 0.5);
  assert.equal(res.mars.idealSlipRisk, false);

  const steep = computeRoverSlopeComparison(100, 35, 0.4);
  assert.equal(steep.earth.idealSlipRisk, true);
  assert.equal(steep.mars.idealSlipRisk, true);
});

test("physics helpers clamp invalid or non-finite inputs safely", () => {
  const w = computeWeightComparison(Number.NaN);
  assert.equal(w.earth.massKg, 80);
  const s = computeRoverSlopeComparison(-10, 90, 0);
  assert.equal(s.earth.roverMassKg, 5);
  assert.equal(s.earth.slopeDeg, 45);
  assert.equal(s.earth.frictionCoeff, 0.1);
});
