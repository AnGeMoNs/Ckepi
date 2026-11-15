// La máquina de pendientes — Anatomy figure (MIT kit), built for es / pt / en.
// Every number comes from compare-83b224fffffffff.json at build time.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import { STRINGS } from "./strings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");
const DATA = JSON.parse(readFileSync(join(HERE, "../../data/local/compare-83b224fffffffff.json"), "utf8"));
const SD = DATA.statistical_distribution;
const SLOPE = SD.slope_distribution;
const SCALE0 = SD.scale_sensitivity[0];
const NUM = {
  bins: SLOPE.bin_centers,
  jezero: SLOPE.planetary_density,
  pampa: SLOPE.earth_density,
  yungay: SLOPE.control_yungay_density,
  w1: { pampa: SLOPE.wasserstein_distance, yungay: SLOPE.control_yungay_w1 },
  ci: SLOPE.w1_ci_95,
  medJ: SCALE0.planetary_slope_median_deg,
  medE: SCALE0.earth_slope_median_deg,
  res: SD.common_resolution_m,
  win: SD.window_size_km,
  iters: SD.bootstrap_iterations,
};
if (NUM.bins.length !== 16 || SCALE0.resolution_m !== 30) throw new Error("unexpected data shape");

const WIDTH = 640;
const HEIGHT = 330;

// ---- world plan (units ~ px, z up) ----
const PLATE = { x: -166, y: -52, w: 338, d: 104, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const TRAY = { x: -152, y: -40, w: 96, d: 80, r: 3 };
const TRAY_H = 3;
const BLOCK_H = 15;
const JEZ = { x: -136, y: -34, w: 64, d: 29, r: 1.5 };
const EAR = { x: -136, y: 5, w: 64, d: 29, r: 1.5 };
const LANES = [JEZ.y + JEZ.d / 2, EAR.y + EAR.d / 2];
const TOP = TRAY_H + BLOCK_H;
const RAIL_Y = [-47, 42];
const RAIL_H = 4;
const POST_TOP = 38;
const PIVOT_Z = TOP + 3.2;
const PLATE_HALF = 7;
const PARK = -150;
const SCAN = [-128, -80];

const BIN0 = -38;
const PITCH = 9;
const COL_W = 3.8;
const ROW = { y: -4, d: 10 };
const RACK = { x: BIN0 - 6, y: -16, w: 16 * PITCH + 12, d: 32, r: 2 };
const RACK_H = 4;
const H_PER = 110; // rack height per unit of density
const WALL = { x: RACK.x + 2, y: -14, w: RACK.w - 4, d: 4, r: 0.6 };
const WALL_TOP = RACK_H + 0.55 * H_PER;

const CASE = { x: 120, y: -8, w: 44, d: 12, r: 2 };
const CASE_Z = 3;
const CASE_TOP = 58;
const FACE_Y = CASE.y + CASE.d;
const DIAL_C = [CASE.x + CASE.w / 2, FACE_Y, 33];
const DIAL_R = 18;
const MAX_W1 = 4;
const SWEEP = [210, -30]; // degrees in the x-z plane, from 0° to 4°

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PLATE.x, 0, POST_TOP + 6], [CASE.x + CASE.w, FACE_Y, CASE_TOP], [CASE.x, CASE.y, CASE_TOP]],
  WIDTH,
  HEIGHT,
  { pad: 14, azimuth: 52 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const seg = (a, b) => k.segment(a, b, P);
const xz = (pts, y, closed = true) => k.pathOf(pts.map(([x, z]) => at([x, y, z])), closed);
const angleOf = (v) => ((SWEEP[0] + (SWEEP[1] - SWEEP[0]) * Math.min(1, Math.max(0, v / MAX_W1))) * Math.PI) / 180;
const onDial = (r, a, y = FACE_Y + 0.2) => [DIAL_C[0] + r * Math.cos(a), y, DIAL_C[2] + r * Math.sin(a)];

// A flat card standing in the x-z plane: a back copy gives it thickness.
function cardXZ(pts, y, depth, { tone = "hi", shade = 3 } = {}) {
  const back = xz(pts, y - depth);
  const front = xz(pts, y);
  return `<g class="iso-solid"><path class="iso-fill" d="${back}"/><path class="iso-shade" data-shade="0" d="${back}"/><path class="iso-line iso-edge" data-tone="lo" d="${back}"/><path class="iso-fill" d="${front}"/><path class="iso-shade" data-shade="${shade}" d="${front}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${front}"/></g>`;
}

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 20), [PLATE.x + PLATE.w / 2, PLATE.y + 20], [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d - 20]];
  for (const [x, y] of feet.sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  const layers = [3.4, 6.8];
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L(layers.map((z) => k.sideSeam(PLATE, -z, P)).join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge
  const strip = { x: BIN0 - 4, y: PLATE.y + PLATE.d - 13, w: 16 * PITCH + 8, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(BIN0, BIN0 + 16 * PITCH, PITCH, 4, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // label plate with three rule lines
  const label = { x: -150, y: PLATE.y + PLATE.d - 13, w: 40, d: 8, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([2, 4, 6].map((dy, i) => k.lineOnTop([label.x + 3, label.y + dy], [label.x + label.w - (i === 2 ? 14 : 3), label.y + dy], 0.8, P)).join(""), { tone: "faint", free: true }));
  out.push(D([at([label.x + 1.5, label.y + 4, 0.8]), at([label.x + label.w - 1.5, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function tray() {
  const out = [];
  out.push(S(k.slabOf(TRAY, 0, TRAY_H, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(TRAY, 3), TRAY_H, P, 4), { tone: "faint" }));
  // centre divider between the two block pockets
  out.push(S(k.slabOf({ x: JEZ.x - 4, y: -2, w: JEZ.w + 8, d: 4, r: 1 }, TRAY_H, 2, P, 3), { tone: "mid" }));
  // tray grip at the front
  const grip = { x: TRAY.x + TRAY.w / 2 - 12, y: TRAY.y + TRAY.d, w: 24, d: 4, r: 1.5 };
  out.push(S(k.slabOf(grip, 0.5, 2.5, P, 4), { tone: "mid" }));
  out.push(D([at([grip.x + 3, grip.y + 2, 3]), at([grip.x + grip.w - 3, grip.y + 2, 3])], { size: 0.4 }));
  for (const y of RAIL_Y) {
    out.push(S(k.slabOf({ x: TRAY.x - 6, y, w: TRAY.w + 8, d: 5, r: 1 }, 0, RAIL_H, P, 3, 0.4), { tone: "mid" }));
    out.push(D([TRAY.x, TRAY.x + TRAY.w - 4].map((x) => at([x, y + 2.5, RAIL_H])), { size: 0.4 }));
    for (const x of [TRAY.x - 10, TRAY.x + TRAY.w + 2]) out.push(S(k.slabOf({ x, y: y - 1.5, w: 4, d: 8, r: 1 }, 0, 7, P, 3, 0.4), { tone: "mid" }));
  }
  return out.join("");
}

function block(plan, cls) {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(plan, 2), TRAY_H, 0.1, P)}" style="filter:blur(3px)"/>`);
  const strata = [3, 5.5, 8.5, 10.5, 13].map((z) => k.sideSeam(plan, TRAY_H + z, P, 4)).join("");
  out.push(`<g class="${cls}">${S(k.slabOf(plan, TRAY_H, BLOCK_H, P, 4, 0.5), { tone: "hi", crease: "lo", inner: L(strata, { tone: "lo" }) })}`);
  const grains = [];
  for (let i = 0; i < 26; i++) {
    const u = (i * 0.618034) % 1, v = (i * 0.381966 + 0.13) % 1;
    grains.push(at([plan.x + 4 + u * (plan.w - 8), plan.y + 4 + v * (plan.d - 8), TOP]));
  }
  out.push(D(grains, { size: 0.45, tone: "lo" }), `</g>`);
  return out.join("");
}

// Gantry built at x = 0 and moved along x.
const postPlan = (y) => ({ x: -3, y: y - 1, w: 6, d: 7, r: 1 });
function gantryBack() {
  const y = RAIL_Y[0];
  return [
    S(k.slabOf({ x: -6, y: y - 1.5, w: 12, d: 8, r: 1.2 }, RAIL_H, 5, P, 3, 0.4), { tone: "mid" }),
    S(k.slabOf(postPlan(y), RAIL_H + 5, POST_TOP - RAIL_H - 5, P, 3, 0.4), { tone: "mid" }),
  ].join("");
}
function probe(ly, index) {
  const out = [];
  out.push(S(k.cylinder(0, ly, 1.3, PIVOT_Z + 1, POST_TOP - PIVOT_Z - 1, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: -3.5, y: ly - 3.5, w: 7, d: 7, r: 1 }, POST_TOP - 6, 6, P, 3, 0.4), { tone: "mid" }));
  out.push(`<path data-part="plateE${index}" class="sm-plate-edge" d=""/><path data-part="plate${index}" class="sm-plate" d=""/>`);
  // protractor fan in front of the plate
  const py = ly + 6;
  const fan = [[0, PIVOT_Z]];
  for (let i = 0; i <= 16; i++) {
    const a = ((90 + 34 - (68 * i) / 16) * Math.PI) / 180;
    fan.push([12.5 * Math.cos(a), PIVOT_Z + 12.5 * Math.sin(a)]);
  }
  out.push(cardXZ(fan, py, 1, { tone: "hi", shade: 2 }));
  const minor = [], major = [];
  for (let deg = -30; deg <= 30; deg += 5) {
    const a = ((90 - deg) * Math.PI) / 180;
    const r0 = deg % 15 === 0 ? 9 : 10.4;
    (deg % 15 === 0 ? major : minor).push(seg([r0 * Math.cos(a), py + 0.1, PIVOT_Z + r0 * Math.sin(a)], [12.5 * Math.cos(a), py + 0.1, PIVOT_Z + 12.5 * Math.sin(a)]));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  out.push(`<path data-part="pointer${index}" class="iso-line" data-tone="hi" data-free="end" d=""/>`);
  out.push(D([at([0, py + 0.2, PIVOT_Z])], { size: 0.7, tone: "hi" }));
  // hanger strap from the rod to the fan
  out.push(S(k.slabOf({ x: -1, y: ly + 1.2, w: 2, d: py - ly - 1.2, r: 0.4 }, PIVOT_Z + 10.6, 1.4, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}
function gantryFront() {
  const y = RAIL_Y[1];
  const out = [];
  out.push(probe(LANES[0], 0), probe(LANES[1], 1));
  out.push(S(k.slabOf({ x: -6, y: y - 1.5, w: 12, d: 8, r: 1.2 }, RAIL_H, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf(postPlan(y), RAIL_H + 5, POST_TOP - RAIL_H - 5, P, 3, 0.4), { tone: "mid" }));
  const bar = { x: -4, y: RAIL_Y[0] - 2, w: 8, d: RAIL_Y[1] - RAIL_Y[0] + 9, r: 1.5 };
  out.push(S(k.slabOf(bar, POST_TOP, 6, P, 4, 0.5), { tone: "mid" }));
  out.push(L(k.lineOnTop([0, bar.y], [0, bar.y + bar.d], POST_TOP + 6, P), { tone: "faint" }));
  out.push(D([RAIL_Y[0] + 2.5, LANES[0], LANES[1], RAIL_Y[1] + 2.5].map((yy) => at([0, yy, POST_TOP + 6])), { size: 0.45 }));
  // knurled hand knob on the front bushing
  out.push(S(k.cylinder(0, y + 9.5, 3, RAIL_H + 0.5, 4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(0, y + 9.5, 3, RAIL_H + 0.5, RAIL_H + 4.5, 18, P), { tone: "lo" }));
  return out.join("");
}

function rackBase() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(RACK, 0, RACK_H, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(RACK, 0, RACK_H, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.lineOnTop([RACK.x, RACK.y + RACK.d - 4], [RACK.x + RACK.w, RACK.y + RACK.d - 4], RACK_H, P), { tone: "faint" }));
  // back wall with density rules every 0.1
  const rules = [1, 2, 3, 4, 5].map((i) => k.sideSeam(WALL, RACK_H + i * 0.1 * H_PER, P, 3)).join("");
  out.push(S(k.slabOf(WALL, RACK_H, WALL_TOP - RACK_H, P, 3, 0.4), { tone: "mid", inner: L(rules, { tone: "faint" }) }));
  out.push(D([WALL.x + 3, WALL.x + WALL.w - 3].map((x) => at([x, WALL.y + 2, WALL_TOP])), { size: 0.45 }));
  // end posts
  for (const x of [RACK.x - 2, RACK.x + RACK.w - 4]) out.push(S(k.slabOf({ x, y: RACK.y + 2, w: 6, d: 6, r: 1 }, RACK_H, 10, P, 3, 0.4), { tone: "mid" }));
  return out.join("");
}

function gauge() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(CASE, 0, CASE_TOP, P)}" style="filter:blur(6px)"/>`);
  for (const x of [CASE.x + 4, CASE.x + CASE.w - 10]) out.push(S(k.slabOf({ x, y: CASE.y + 1, w: 6, d: CASE.d - 2, r: 1 }, 0, CASE_Z, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf(CASE, CASE_Z, CASE_TOP - CASE_Z, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(CASE, CASE_Z + 6, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(CASE, 2.5), CASE_TOP, P, 4), { tone: "faint" }));
  // dial face: bezel card then the face
  const circle = (r, steps = 72) => Array.from({ length: steps }, (_, i) => [DIAL_C[0] + r * Math.cos((i / steps) * Math.PI * 2), DIAL_C[2] + r * Math.sin((i / steps) * Math.PI * 2)]);
  out.push(cardXZ(circle(DIAL_R + 2.5), FACE_Y + 0.8, 0.8, { tone: "hi", shade: 2 }));
  out.push(`<g class="c-ink">${cardXZ(circle(DIAL_R), FACE_Y + 1.1, 0.3, { tone: "lo", shade: 3 })}</g>`);
  const y = FACE_Y + 1.2;
  const minor = [], major = [];
  for (let i = 0; i <= 40; i++) {
    const a = angleOf((i / 40) * MAX_W1);
    const big = i % 10 === 0;
    const r0 = DIAL_R - (big ? 4 : i % 5 === 0 ? 3 : 2);
    (big ? major : minor).push(seg(onDial(r0, a, y), onDial(DIAL_R - 0.8, a, y)));
  }
  out.push(L(k.pathOf(Array.from({ length: 61 }, (_, i) => at(onDial(DIAL_R - 0.8, angleOf((i / 60) * MAX_W1), y)))), { tone: "lo" }));
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "hi" }));
  for (let v = 0; v <= MAX_W1; v++) {
    const [tx, , tz] = onDial(DIAL_R - 7.6, angleOf(v), y);
    out.push(k.faceTextSvg(k.sideMatrix([tx, y], tz - 1.1, P, "left"), String(v), { size: 3.2, tone: "hi", anchor: "middle" }));
  }
  // 95 % confidence band for the pampa
  const ci = Array.from({ length: 9 }, (_, i) => at(onDial(DIAL_R - 2.4, angleOf(NUM.ci[0] + ((NUM.ci[1] - NUM.ci[0]) * i) / 8), y)));
  out.push(`<path data-part="ci" class="iso-line sm-ci" data-free="" d="${k.pathOf(ci)}"/>`);
  // label plate + zero screw + corner screws on the face
  const lp = [[DIAL_C[0] - 9, CASE_Z + 4.5], [DIAL_C[0] + 9, CASE_Z + 4.5], [DIAL_C[0] + 9, CASE_Z + 9.5], [DIAL_C[0] - 9, CASE_Z + 9.5]];
  out.push(cardXZ(lp, FACE_Y + 0.5, 0.5, { tone: "mid", shade: 1 }));
  out.push(L([7, 8.4].map((dz) => seg([DIAL_C[0] - 7, FACE_Y + 0.6, CASE_Z + dz], [DIAL_C[0] + (dz > 8 ? 3 : 7), FACE_Y + 0.6, CASE_Z + dz])).join(""), { tone: "faint", free: true }));
  const fc = [[CASE.x + 4, CASE_TOP - 4], [CASE.x + CASE.w - 4, CASE_TOP - 4], [CASE.x + 4, CASE_Z + 4], [CASE.x + CASE.w - 4, CASE_Z + 4]];
  out.push(D(fc.map(([x, z]) => at([x, FACE_Y, z])), { size: 0.55 }));
  out.push(L(k.sideRing([DIAL_C[0], FACE_Y + 1.2, DIAL_C[2] - 9], 1.6, "y", P, 16), { tone: "mid" }));
  return out.join("");
}

const needleD = (v) => {
  const a = angleOf(v);
  const y = FACE_Y + 1.6;
  return k.pathOf([at(onDial(-3.5, a, y)), at(onDial(DIAL_R - 1.8, a, y))]);
};

function svgFor(t) {
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: t.aria,
    body: [
      plate(),
      tray(),
      `<g data-part="gback">${gantryBack()}</g>`,
      block(JEZ, "c-rust"),
      `<g data-part="earth" class="c-copper">${block(EAR, "")}</g>`,
      `<g data-part="gfront">${gantryFront()}</g>`,
      rackBase(),
      `<g data-part="bins"></g>`,
      gauge(),
      `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleD(NUM.w1.pampa)}" style="stroke-width:1.3"/>`,
      `<circle class="sm-hub" cx="${at([DIAL_C[0], FACE_Y + 1.7, DIAL_C[2]])[0].toFixed(1)}" cy="${at([DIAL_C[0], FACE_Y + 1.7, DIAL_C[2]])[1].toFixed(1)}" r="1.6"/>`,
    ],
  });
}

const EXTRA_CSS = `
.iso{--anatomy-page:#101F24;--anatomy-card:#13292d;--anatomy-text:#d9cfb8;--anatomy-strong:#FFF2D7;--anatomy-muted:#93a79f;
--anatomy-paper:#13292d;--anatomy-face:#1f4545;--anatomy-top:#24504f;
--anatomy-shade-0:#112a2c;--anatomy-shade-1:#163333;--anatomy-shade-2:#1b3d3d;--anatomy-shade-3:#204646;
--anatomy-lit-top:#2b5b59;--anatomy-lit-shade:#1f4545;
--anatomy-hi:#FFF2D7;--anatomy-mid:#a9a690;--anatomy-lo:#62807a;--anatomy-faint:#35595a;--anatomy-lit:#E4ED83;
--anatomy-halo:#050d0f;--anatomy-dot:#FFF2D7}
.c-rust{--anatomy-paper:#6a2507;--anatomy-top:#C1440E;--anatomy-shade-0:#6a2507;--anatomy-shade-1:#7f2d09;--anatomy-shade-2:#94350b;--anatomy-shade-3:#a93c0c;--anatomy-hi:#f6c9ae;--anatomy-lo:#5a1f06;--anatomy-dot:#3a1404}
.c-copper{--anatomy-paper:#8a5039;--anatomy-top:#E8A080;--anatomy-shade-0:#8a5039;--anatomy-shade-1:#a3624a;--anatomy-shade-2:#bb7559;--anatomy-shade-3:#d18869;--anatomy-hi:#ffe3d3;--anatomy-lo:#6e3d2a;--anatomy-dot:#4a2617}
.c-cream{--anatomy-paper:#8f8777;--anatomy-top:#FFF2D7;--anatomy-shade-0:#8f8777;--anatomy-shade-1:#aba28e;--anatomy-shade-2:#c5bba5;--anatomy-shade-3:#dfd4bc;--anatomy-hi:#fffaf0;--anatomy-lo:#6d665a;--anatomy-dot:#4a453c}
.c-ink{--anatomy-paper:#0c1d21;--anatomy-shade-0:#0a181b;--anatomy-shade-3:#0c1d21}
.sm-ci{stroke:#E8A080;stroke-width:2.4;stroke-linecap:butt;transition:opacity .4s}
.sm-hub{fill:#E4ED83}
.sm-plate{fill:#2b5b59;stroke:#FFF2D7;stroke-width:.6px;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.sm-plate-edge{fill:#163333;stroke:#a9a690;stroke-width:.6px;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.iso-page{width:min(760px,100% - 24px);margin:12px auto 16px}
.iso-figure{margin:0}
.iso-plate{padding:40px 12px 16px}
.iso-plate-corners{inset:14px 14px auto 14px;height:12px}
.iso-plate-corner[data-corner="title"]{white-space:normal;text-align:right;max-width:70%}
.sm-hint{margin:10px 2px 0;color:var(--anatomy-text);font-size:13px;line-height:1.5}
.sm-readout{margin:8px 2px 0;color:var(--anatomy-strong);font-family:var(--anatomy-mono);font-size:12.5px;line-height:1.5;font-variant-numeric:tabular-nums;min-height:3em}
.sm-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.sm-seg{display:inline-flex;flex-wrap:wrap;gap:0;border:1px solid var(--anatomy-lo)}
.sm-btn{min-height:44px;min-width:44px;padding:0 14px;border:0;background:transparent;color:var(--anatomy-text);font:600 13px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.sm-seg .sm-btn[aria-pressed="true"]{background:#E8A080;color:#101F24}
.sm-seg .sm-btn[data-earth="yungay"][aria-pressed="true"]{background:#FFF2D7}
.sm-scan{border:1px solid #E4ED83;color:#E4ED83}
.sm-scan:disabled{opacity:.55;cursor:default}
.sm-btn:focus-visible{outline:2px solid #E4ED83;outline-offset:2px}
.sm-keys{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0}
.sm-key{display:inline-flex;align-items:center;gap:7px}
.sm-chip{width:12px;height:10px;flex:none;border:1px solid #101F24}
.sm-foot{margin-top:10px;font-size:11.5px;color:var(--anatomy-muted)}
.iso-stage{outline:none}
@media (max-width:420px){.iso-plate{padding:36px 8px 12px}.sm-btn{padding:0 10px}}
`;

function live(t) {
  return `
const P = ${JSON.stringify(P)};
const NUM = ${JSON.stringify(NUM)};
const T = ${JSON.stringify(t.live)};
const LANG = ${JSON.stringify(t.lang)};
const C = ${JSON.stringify({ LANES, PIVOT_Z, PLATE_HALF, PARK, SCAN, BIN0, PITCH, COL_W, ROW, RACK_H, H_PER, FACE_Y, DIAL_C, DIAL_R, MAX_W1, SWEEP })};
const svg = document.querySelector(".iso-stage svg");
const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
const gback = $("gback"), gfront = $("gfront"), earth = $("earth"), bins = $("bins"), needle = $("needle"), ci = $("ci");
const plates = [$("plate0"), $("plate1")], edges = [$("plateE0"), $("plateE1")], pointers = [$("pointer0"), $("pointer1")];
const readout = document.querySelector("[data-readout]");
const scanBtn = document.querySelector("[data-scan]");
const earthBtns = [...document.querySelectorAll("[data-earth]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const fmt = (v, d = 2) => v.toLocaleString(LANG, { minimumFractionDigits: d, maximumFractionDigits: d });
const angleOf = (v) => (C.SWEEP[0] + (C.SWEEP[1] - C.SWEEP[0]) * Math.min(1, Math.max(0, v / C.MAX_W1))) * Math.PI / 180;
const onDial = (r, a, y) => [C.DIAL_C[0] + r * Math.cos(a), y, C.DIAL_C[2] + r * Math.sin(a)];
const at = (p) => iso(p, P);
const cdf = (dens) => { const out = []; let s = 0; const tot = dens.reduce((a, b) => a + b, 0); for (const v of dens) { s += v / tot; out.push(s); } return out; };
const sampleOf = (dens, u) => { const c = cdf(dens); const i = c.findIndex((v) => u <= v); return NUM.bins[i < 0 ? 15 : i]; };
const TOKENS = 120;
const state = {
  sel: "pampa", shown: "pampa", progress: 1, scanning: false, x: C.PARK, lift: 0, liftTarget: 0,
  needle: { x: NUM.w1.pampa, v: 0 }, tilt: [0, 0], reading: [0, 0], heights: { j: NUM.jezero.map((d) => d * C.H_PER), e: NUM.pampa.map((d) => d * C.H_PER) },
};
function plateD(ly, theta) {
  const c = [0, ly, C.PIVOT_Z], h = C.PLATE_HALF, w = 4.2, t = 0.9;
  const ux = Math.cos(theta), uz = Math.sin(theta), nx = -Math.sin(theta) * t, nz = Math.cos(theta) * t;
  const p = (s, dy, down) => at([c[0] + s * h * ux - (down ? nx : 0), ly + dy, c[2] + s * h * uz - (down ? nz : 0)]);
  return [pathOf([p(-1, -w, 0), p(1, -w, 0), p(1, w, 0), p(-1, w, 0)], true), pathOf([p(-1, w, 0), p(1, w, 0), p(1, w, 1), p(-1, w, 1)], true)];
}
function pointerD(ly, theta) {
  const y = ly + 6.2, a = Math.PI / 2 + theta;
  return pathOf([at([0, y, C.PIVOT_Z]), at([11.6 * Math.cos(a), y, C.PIVOT_Z + 11.6 * Math.sin(a)])]);
}
function binsSvg() {
  const out = [];
  for (let b = 0; b < 16; b++) {
    const x0 = C.BIN0 + b * C.PITCH;
    out.push(solidSvg(slabOf({ x: x0 - 0.6, y: C.ROW.y - 1, w: 0.8, d: C.ROW.d + 2, r: 0.2 }, C.RACK_H, 1.6, P, 1), { tone: "mid", crease: "none" }));
    const cols = [[state.heights.j[b], "c-rust", x0 + 0.6], [state.heights.e[b], state.shown === "pampa" ? "c-copper" : "c-cream", x0 + 0.6 + C.COL_W + 0.4]];
    for (const [h, cls, x] of cols) {
      if (h < 0.05) continue;
      const plan = { x, y: C.ROW.y, w: C.COL_W, d: C.ROW.d, r: 0.3 };
      let chips = "";
      for (let z = 2; z < h - 0.4; z += 2) chips += sideSeam(plan, C.RACK_H + z, P, 1);
      out.push('<g class="' + cls + '">' + solidSvg(slabOf(plan, C.RACK_H, h, P, 1), { tone: "hi", crease: "none", inner: chips ? lineSvg(chips, { tone: "lo" }) : "" }) + "</g>");
    }
  }
  out.push(solidSvg(slabOf({ x: C.BIN0 + 16 * C.PITCH - 0.6, y: C.ROW.y - 1, w: 0.8, d: C.ROW.d + 2, r: 0.2 }, C.RACK_H, 1.6, P, 1), { tone: "mid", crease: "none" }));
  return out.join("");
}
let lastBins = "";
function draw() {
  const tx = translateAlong(P, [state.x, 0, 0]);
  gback.setAttribute("transform", tx);
  gfront.setAttribute("transform", tx);
  earth.setAttribute("transform", translateAlong(P, [0, 0, state.lift]));
  earth.setAttribute("class", state.shown === "pampa" ? "c-copper" : "c-cream");
  C.LANES.forEach((ly, i) => { const pd = plateD(ly, state.tilt[i]); plates[i].setAttribute("d", pd[0]); edges[i].setAttribute("d", pd[1]); pointers[i].setAttribute("d", pointerD(ly, state.tilt[i])); });
  const key = state.heights.j.concat(state.heights.e).map((h) => h.toFixed(2)).join(",") + state.shown;
  if (key !== lastBins) { bins.innerHTML = binsSvg(); lastBins = key; }
  const a = angleOf(state.needle.x), y = C.FACE_Y + 1.6;
  needle.setAttribute("d", pathOf([at(onDial(-3.5, a, y)), at(onDial(C.DIAL_R - 1.8, a, y))]));
  ci.style.opacity = state.shown === "pampa" && state.progress >= 1 ? "1" : "0";
  let text;
  if (state.scanning) text = T.scanning.replace("{j}", fmt(state.reading[0])).replace("{e}", fmt(state.reading[1]));
  else if (state.progress < 1) text = T.ready;
  else if (state.shown === "pampa") text = T.pampa.replace("{w}", fmt(NUM.w1.pampa)).replace("{lo}", fmt(NUM.ci[0])).replace("{hi}", fmt(NUM.ci[1]));
  else text = T.yungay.replace("{w}", fmt(NUM.w1.yungay));
  if (readout.textContent !== text) readout.textContent = text;
  scanBtn.disabled = state.scanning;
  earthBtns.forEach((btn) => btn.setAttribute("aria-pressed", String(btn.dataset.earth === state.sel)));
}
const follow = (v, to, dt, tau, calm) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
let frame = 0, last = 0, visible = false, touring = !still.matches, tourClock = 0, tourStep = 0;
const TOUR = [["scan", 0], ["earth", 2.5], ["earth", 6.5], ["wait", 10]];
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring && !state.scanning && state.x <= C.PARK + 0.5 && state.lift === 0) {
    tourClock += dt;
    const [what, when] = TOUR[tourStep % TOUR.length];
    if (tourClock >= when) {
      if (what === "scan") startScan(true);
      if (what === "earth") pick(state.sel === "pampa" ? "yungay" : "pampa", true);
      tourStep++;
      if (tourStep % TOUR.length === 0) tourClock = 0;
    }
  }
  let moving = false;
  // gantry: park unless scanning
  if (state.scanning) {
    if (state.progress === 0 && state.x > C.SCAN[0] + 0.3) { state.x = follow(state.x, C.SCAN[0], dt, 0.25, calm); moving = true; }
    else {
      state.progress = calm ? 1 : Math.min(1, state.progress + dt / 5.5);
      state.x = C.SCAN[0] + (C.SCAN[1] - C.SCAN[0]) * state.progress;
      const token = Math.min(TOKENS - 1, Math.floor(state.progress * TOKENS));
      const u = (token * 0.6180339887 + 0.31) % 1;
      state.reading = [sampleOf(NUM.jezero, u), sampleOf(NUM[state.shown], u)];
      const sign = token % 2 ? 1 : -1;
      state.tilt = state.tilt.map((th, i) => follow(th, sign * state.reading[i] * Math.PI / 180, dt, 0.06, calm));
      if (state.progress >= 1) { state.scanning = false; state.tilt = [0, 0]; }
      moving = true;
    }
  } else {
    const nx = follow(state.x, C.PARK, dt, 0.3, calm);
    if (Math.abs(nx - C.PARK) < 0.05) state.x = C.PARK; else { state.x = nx; moving = true; }
    state.tilt = state.tilt.map((th) => { const v = follow(th, 0, dt, 0.15, calm); if (Math.abs(v) > 1e-4) { moving = true; return v; } return 0; });
  }
  // block swap: only once parked
  if (state.sel !== state.shown || state.lift > 0) {
    if (state.x <= C.PARK + 0.5) {
      const want = state.sel !== state.shown ? 6 : 0;
      state.lift = follow(state.lift, want, dt, 0.12, calm);
      if (state.sel !== state.shown && state.lift > 5.8) { state.shown = state.sel; }
      if (state.sel === state.shown && state.lift < 0.03) state.lift = 0;
      moving = true;
    } else moving = true;
  }
  // bins
  const p = state.progress;
  const targetJ = NUM.jezero.map((d) => d * C.H_PER * p), targetE = NUM[state.shown].map((d) => d * C.H_PER * p);
  const snap = (arr, to) => arr.map((h, i) => { const v = state.scanning ? to[i] : follow(h, to[i], dt, 0.25, calm); if (Math.abs(v - to[i]) < 0.02) return to[i]; moving = true; return v; });
  state.heights.j = snap(state.heights.j, targetJ);
  state.heights.e = snap(state.heights.e, targetE);
  // needle: rests at 0 until the scan completes, then springs to W1
  const want = p >= 1 && !state.scanning ? NUM.w1[state.shown] : 0;
  if (calm) { state.needle.x = want; state.needle.v = 0; }
  else {
    for (let i = 0; i < 4; i++) { state.needle.v += ((want - state.needle.x) * 90 - state.needle.v * 11) * dt / 4; state.needle.x += state.needle.v * dt / 4; }
    if (Math.abs(want - state.needle.x) < 1e-4 && Math.abs(state.needle.v) < 1e-4) { state.needle.x = want; state.needle.v = 0; } else moving = true;
  }
  draw();
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function startScan(fromTour) {
  if (!fromTour) touring = false;
  if (state.scanning) return;
  state.scanning = true; state.progress = 0; state.reading = [0, 0];
  run();
}
function pick(which, fromTour) {
  if (!fromTour) touring = false;
  if (state.scanning) { state.scanning = false; state.progress = 1; }
  state.sel = which;
  run();
}
scanBtn.addEventListener("click", () => startScan(false));
earthBtns.forEach((btn) => btn.addEventListener("click", () => pick(btn.dataset.earth, false)));
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(svg);
still.addEventListener?.("change", () => { if (still.matches) touring = false; run(); });
draw();
`;
}

const chip = (color) => `<span class="sm-chip" style="background:${color}" aria-hidden="true"></span>`;
for (const t of STRINGS) {
  const svg = svgFor(t);
  const fill = (s) => s.replace("{w}", fmt(t.lang, NUM.w1.pampa)).replace("{lo}", fmt(t.lang, NUM.ci[0])).replace("{hi}", fmt(t.lang, NUM.ci[1]));
  const caption = t.caption
    .replace("{res}", String(NUM.res)).replace("{win}", fmt(t.lang, NUM.win, 0)).replace("{iters}", String(NUM.iters))
    .replace("{b0}", fmt(t.lang, NUM.bins[0])).replace("{b15}", fmt(t.lang, NUM.bins[15]))
    .replace("{mj}", fmt(t.lang, NUM.medJ)).replace("{me}", fmt(t.lang, NUM.medE))
    .replace("{wp}", fmt(t.lang, NUM.w1.pampa)).replace("{wy}", fmt(t.lang, NUM.w1.yungay)).replace("{lo}", fmt(t.lang, NUM.ci[0])).replace("{hi}", fmt(t.lang, NUM.ci[1]));
  const body = `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 1</span><span class="iso-plate-corner" data-corner="title">${t.title}</span></div>
<div class="iso-stage" role="img" aria-label="${t.aria}">${svg}</div>
<p class="sm-hint">${t.hint}</p>
<div class="sm-controls"><div class="sm-seg" role="group" aria-label="${t.groupLabel}"><button type="button" class="sm-btn" data-earth="pampa" aria-pressed="true">${t.pampa}</button><button type="button" class="sm-btn" data-earth="yungay" aria-pressed="false">${t.yungay}</button></div><button type="button" class="sm-btn sm-scan" data-scan>${t.scan}</button></div>
<p class="sm-readout" data-readout aria-live="polite">${fill(t.live.pampa)}</p></div>
<figcaption class="iso-legend"><span class="sm-keys"><span class="sm-key">${chip("#C1440E")}${t.keyJ}</span><span class="sm-key">${chip("#E8A080")}${t.keyP}</span><span class="sm-key">${chip("#FFF2D7")}${t.keyY}</span><span class="sm-key">${chip("#E4ED83")}${t.keyN}</span></span><span class="iso-caption">${caption}</span><span class="sm-foot">${t.footer}</span></figcaption></figure>`;
  let html = k.pageHtml({ title: t.title, theme: "dark", body, script: kitScript() + live(t), width: 760 });
  html = html.replace('<html lang="en">', `<html lang="${t.lang}">`).replace("</style></head>", `${EXTRA_CSS}</style></head>`);
  const file = join(OUT, `slope-machine-${t.lang}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, html.length);
}
function fmt(lang, v, d = 2) {
  return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
}
