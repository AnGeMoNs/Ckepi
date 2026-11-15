// La cámara de presión — Anatomy figure (MIT kit), built for es / pt / en.
// Pressures: NASA NSSDCA Planetary Fact Sheets (Williams, 2024). Pampa value from compare-83b224fffffffff.json.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import { STRINGS } from "./pressure-strings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");
const DATA = JSON.parse(readFileSync(join(HERE, "../../data/local/compare-83b224fffffffff.json"), "utf8"));
const PAMPA_MBAR = DATA.match.earth_variables.breakage.atm_pressure_mbar;
if (typeof PAMPA_MBAR !== "number") throw new Error("missing pampa pressure");

// mbar. Earth 1014, Mars 6.36 (NSSDCA), Moon ~3e-15 bar = 3e-12 mbar (treated as vacuum).
const PR = { earth: 1014, mars: 6.36, moon: 3e-12, pampa: PAMPA_MBAR, atm: 1013.25 };
const BURST = 4; // illustrative: a party balloon bursts past ~4x its volume
const RATIO = PR.earth / PR.mars;

const WIDTH = 640;
const HEIGHT = 340;

// ---- world plan (units ~ px, z up) ----
const PLATE = { x: -118, y: -52, w: 252, d: 100, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const J = [-62, -6]; // bell jar axis
const DISC_R = 40;
const DISC_H = 5;
const GASKET = [35.5, 1.2];
const JAR_R = 34;
const WALL_TOP = 48;
const DOME_H = 24;
const JAR_Z = DISC_H + GASKET[1];
const KNOB_Z = WALL_TOP + DOME_H - 0.6;
const PED = { r: 4, h: 3.4 };
const KNOT_Z = DISC_H + PED.h + 0.9;
const R0 = 13; // balloon radius at Earth pressure
const NECK = 2.2;

const MAN = { x: -26, y: -8, w: 70, d: 14, r: 2 }; // manifold block from the jar base to the gauge
const MAN_H = 7;
const CASE = { x: 6, y: -6, w: 38, d: 10, r: 2 };
const CASE_TOP = 56;
const FACE_Y = CASE.y + CASE.d;
const DIAL_C = [CASE.x + CASE.w / 2, FACE_Y, 33];
const DIAL_R = 15;
const MAX_KPA = 120;
const SWEEP = [225, -45];
const VALVE = [-12, -1];

const PUMP = [104, -20];
const BARREL_R = 7.5;
const BARREL_TOP = 60;
const CAP_TOP = 65;
const GLAND_TOP = 67.5;
const HANDLE_Z = 92; // handle underside at rest (pulled up)
const STROKE = 20;
const FOOT = { x: 82, y: -34, w: 44, d: 28, r: 3 };
const FOOT_TOP = 3;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [J[0], J[1], KNOB_Z + 7], [PUMP[0], PUMP[1], HANDLE_Z + 6], [PUMP[0] + 22, PUMP[1], HANDLE_Z + 6], [CASE.x + CASE.w, FACE_Y, CASE_TOP]],
  WIDTH,
  HEIGHT,
  { pad: 14, azimuth: 52 },
);
const CAM = k.cameraOf(P);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const seg = (a, b) => k.segment(a, b, P);
const xz = (pts, y, closed = true) => k.pathOf(pts.map(([x, z]) => at([x, y, z])), closed);
const f1 = (v) => (Math.round(v * 10) / 10).toString();
const angleOf = (kpa) => ((SWEEP[0] + (SWEEP[1] - SWEEP[0]) * Math.min(1, Math.max(0, kpa / MAX_KPA))) * Math.PI) / 180;
const onDial = (r, a, y = FACE_Y + 0.2) => [DIAL_C[0] + r * Math.cos(a), y, DIAL_C[2] + r * Math.sin(a)];
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function cardXZ(pts, y, depth, { tone = "hi", shade = 3 } = {}) {
  const back = xz(pts, y - depth);
  const front = xz(pts, y);
  return `<g class="iso-solid"><path class="iso-fill" d="${back}"/><path class="iso-shade" data-shade="0" d="${back}"/><path class="iso-line iso-edge" data-tone="lo" d="${back}"/><path class="iso-fill" d="${front}"/><path class="iso-shade" data-shade="${shade}" d="${front}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${front}"/></g>`;
}

// Circle arcs of a horizontal ring split by which side faces the viewer.
function ringArc(cx, cy, r, z, front, steps = 64) {
  const [vx, vy] = k.towardViewer(P);
  const facing = Math.atan2(vy, vx);
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = facing + (front ? -Math.PI / 2 : Math.PI / 2) + (i / steps) * Math.PI;
    pts.push(at([cx + r * Math.cos(a), cy + r * Math.sin(a), z]));
  }
  return k.pathOf(pts);
}

// Convex hull (monotone chain) of screen points.
function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of pts.reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}
const jarRadiusAt = (z) => (z <= WALL_TOP ? JAR_R : JAR_R * Math.sqrt(Math.max(0, 1 - ((z - WALL_TOP) / DOME_H) ** 2)));
function jarSilhouette() {
  const pts = [];
  const zs = [JAR_Z, WALL_TOP];
  for (let i = 1; i <= 16; i++) zs.push(WALL_TOP + (DOME_H * i) / 16);
  for (const z of zs) {
    const r = jarRadiusAt(z);
    for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; pts.push(at([J[0] + r * Math.cos(a), J[1] + r * Math.sin(a), z])); }
  }
  return k.pathOf(hull(pts), true);
}

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 20), [PLATE.x + PLATE.w / 2, PLATE.y + 20], [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d - 20]];
  for (const [x, y] of byDepth(feet)) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L([3.4, 6.8].map((z) => k.sideSeam(PLATE, -z, P)).join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge
  const strip = { x: -40, y: PLATE.y + PLATE.d - 13, w: 120, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // label plate with three rule lines
  const label = { x: -104, y: PLATE.y + PLATE.d - 15, w: 40, d: 8, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([2, 4, 6].map((dy, i) => k.lineOnTop([label.x + 3, label.y + dy], [label.x + label.w - (i === 2 ? 14 : 3), label.y + dy], 0.8, P)).join(""), { tone: "faint", free: true }));
  out.push(D([at([label.x + 1.5, label.y + 4, 0.8]), at([label.x + label.w - 1.5, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function jarBase() {
  const out = [`<path class="iso-halo" d="${k.slabOf({ x: J[0] - DISC_R, y: J[1] - DISC_R, w: DISC_R * 2, d: DISC_R * 2, r: DISC_R }, 0, 0.1, P, 24).fill}" style="filter:blur(4px)"/>`];
  out.push(S(k.cylinder(J[0], J[1], DISC_R, 0, DISC_H, P, 72, 0.8), { tone: "mid", inner: L(k.sideArc(J[0], J[1], DISC_R, 2.2, P, 40), { tone: "faint" }) }));
  out.push(L(k.ring(J[0], J[1], DISC_R - 2.5, DISC_H, P, 72), { tone: "faint" }));
  // four clamp screws round the rim
  const screws = [0, 1, 2, 3].map((i) => { const a = Math.PI / 4 + (i * Math.PI) / 2; return [J[0] + (DISC_R - 1.3) * Math.cos(a), J[1] + (DISC_R - 1.3) * Math.sin(a)]; });
  out.push(D(screws.map(([x, y]) => at([x, y, DISC_H])), { size: 0.55 }));
  // rubber gasket the jar sits on
  out.push(S(k.cylinder(J[0], J[1], GASKET[0], DISC_H, GASKET[1], P, 72), { tone: "lo", crease: "none" }));
  // jar floor inside the gasket, with the suction port
  out.push(L(k.ring(J[0], J[1], 6, JAR_Z, P, 24), { tone: "faint" }));
  return out.join("");
}

function glassBack() {
  const sil = jarSilhouette();
  return `<path class="pc-glass-fill" d="${sil}"/><path class="pc-glass-back" d="${ringArc(J[0], J[1], JAR_R, JAR_Z, false)}"/><path class="pc-glass-back" d="${ringArc(J[0], J[1], JAR_R, WALL_TOP, false)}"/>`;
}

function glassFront() {
  const out = [];
  out.push(`<path class="pc-glass-front" d="${ringArc(J[0], J[1], JAR_R, JAR_Z + 0.2, true)}"/>`);
  out.push(`<path class="pc-glass-seam" d="${ringArc(J[0], J[1], JAR_R, WALL_TOP, true)}"/>`);
  // two shine strips on the left of the wall, one on the dome
  const shine = (deg, z0, z1, w) => {
    const a = (deg * Math.PI) / 180;
    const p0 = at([J[0] + JAR_R * Math.cos(a), J[1] + JAR_R * Math.sin(a), z0]);
    const p1 = at([J[0] + JAR_R * Math.cos(a), J[1] + JAR_R * Math.sin(a), z1]);
    return `<path class="pc-shine" style="stroke-width:${w}" d="${k.pathOf([p0, p1])}"/>`;
  };
  out.push(shine(160, 12, 42, 2.2), shine(150, 16, 36, 0.9));
  const dome = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; const z = WALL_TOP + 3 + t * (DOME_H - 9); const r = jarRadiusAt(z) - 0.2; const a = ((150 + 30 * t) * Math.PI) / 180; dome.push(at([J[0] + r * Math.cos(a), J[1] + r * Math.sin(a), z])); }
  out.push(`<path class="pc-shine" style="stroke-width:1.6" d="${k.pathOf(dome)}"/>`);
  out.push(`<path class="pc-glass-edge" d="${jarSilhouette()}"/>`);
  // knob on the dome
  out.push(S(k.cylinder(J[0], J[1], 6.5, KNOB_Z, 2.2, P, 40, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(J[0], J[1], 3.2, KNOB_Z + 2.2, 3.4, P, 28), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(J[0], J[1], 4.6, KNOB_Z + 5.6, 1.8, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(J[0], J[1], 4.6, KNOB_Z + 5.6, KNOB_Z + 7.4, 22, P, 0.3), { tone: "lo" }));
  return out.join("");
}

function pedestal() {
  const out = [];
  out.push(S(k.cylinder(J[0], J[1], PED.r + 1.6, DISC_H, 0.8, P, 28), { tone: "mid" }));
  out.push(S(k.cylinder(J[0], J[1], PED.r - 1.4, DISC_H + 0.8, PED.h - 1.6, P, 24), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(J[0], J[1], PED.r, DISC_H + PED.h - 0.8, 0.8, P, 28), { tone: "mid" }));
  out.push(L(k.ring(J[0], J[1], 1.6, DISC_H + PED.h, P, 16), { tone: "lo" }));
  return out.join("");
}

// Balloon drawn in screen px around the knot; the page scales the group about the knot (orthographic: a sphere stays a circle).
const KNOT = at([J[0], J[1], KNOT_Z]);
const UP = CAM.cosE * CAM.k;
function balloonArt() {
  const r = R0 * CAM.k;
  const cy = -(NECK + R0 * 1.04) * UP;
  const ry = r * 1.06;
  const bottom = cy + ry;
  const body = `M ${f1(-r)} ${f1(cy)} a ${f1(r)} ${f1(ry)} 0 1 0 ${f1(2 * r)} 0 a ${f1(r)} ${f1(ry)} 0 1 0 ${f1(-2 * r)} 0 Z`;
  const neck = `M ${f1(-r * 0.2)} ${f1(bottom - 0.6)} Q ${f1(-r * 0.06)} ${f1(bottom + 0.8)} ${f1(-1.1)} ${f1(-1.3)} L ${f1(1.1)} ${f1(-1.3)} Q ${f1(r * 0.06)} ${f1(bottom + 0.8)} ${f1(r * 0.2)} ${f1(bottom - 0.6)} Z`;
  return `<clipPath id="pc-bclip"><path d="${body}"/></clipPath>
<path class="pc-b-neck" d="${neck}"/>
<path class="pc-b-body" d="${body}"/>
<g clip-path="url(#pc-bclip)"><ellipse class="pc-b-shade" cx="${f1(r * 0.5)}" cy="${f1(cy + ry * 0.45)}" rx="${f1(r * 1.05)}" ry="${f1(ry * 0.95)}"/><ellipse class="pc-b-shade2" cx="${f1(r * 0.85)}" cy="${f1(cy + ry * 0.75)}" rx="${f1(r * 0.8)}" ry="${f1(ry * 0.7)}"/></g>
<ellipse class="pc-b-glint" cx="${f1(-r * 0.42)}" cy="${f1(cy - ry * 0.42)}" rx="${f1(r * 0.2)}" ry="${f1(r * 0.12)}" transform="rotate(-38 ${f1(-r * 0.42)} ${f1(cy - ry * 0.42)})"/>
<path class="pc-b-edge" d="${body}"/>
<ellipse class="pc-b-knot" cx="0" cy="0" rx="1.7" ry="1.2"/>
<path class="pc-b-tail" d="M -0.6 0.9 q -0.8 1.6 -2.2 2.1 M 0.6 0.9 q 0.7 1.5 1.9 2.2"/>`;
}
const SHADOW = k.slabOf({ x: J[0] - R0, y: J[1] - R0, w: 2 * R0, d: 2 * R0, r: R0 }, JAR_Z, 0.05, P, 24).fill;
const SHADOW_C = at([J[0], J[1], JAR_Z]);

function manifold() {
  const out = [];
  out.push(S(k.slabOf(MAN, 0, MAN_H, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(MAN, 3, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(MAN, 2), MAN_H, P, 4), { tone: "faint" }));
  out.push(D([MAN.x + 4, MAN.x + MAN.w - 4].map((x) => at([x, MAN.y + MAN.d / 2, MAN_H])), { size: 0.5 }));
  // vent valve: bonnet + knurled knob; the pointer is live
  out.push(S(k.cylinder(VALVE[0], VALVE[1], 3, MAN_H, 2.4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(VALVE[0], VALVE[1], 5, MAN_H + 2.4, 3.2, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(VALVE[0], VALVE[1], 5, MAN_H + 2.4, MAN_H + 5.6, 26, P), { tone: "lo" }));
  out.push(`<path data-part="valve" class="iso-line" data-tone="hi" data-free="end" d=""/>`);
  out.push(D([at([VALVE[0], VALVE[1], MAN_H + 5.6])], { size: 0.55, tone: "hi" }));
  // hose nipple on the end face
  out.push(S(k.slabOf({ x: MAN.x + MAN.w, y: -3, w: 4, d: 4, r: 1 }, 1.6, 3.8, P, 2), { tone: "mid", crease: "none" }));
  return out.join("");
}

function gauge() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(CASE, MAN_H, CASE_TOP - MAN_H, P)}" style="filter:blur(6px);opacity:.6"/>`);
  out.push(S(k.slabOf(CASE, MAN_H, CASE_TOP - MAN_H, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(CASE, MAN_H + 5, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(CASE, 2.5), CASE_TOP, P, 4), { tone: "faint" }));
  const circle = (r, steps = 72) => Array.from({ length: steps }, (_, i) => [DIAL_C[0] + r * Math.cos((i / steps) * Math.PI * 2), DIAL_C[2] + r * Math.sin((i / steps) * Math.PI * 2)]);
  out.push(cardXZ(circle(DIAL_R + 2.5), FACE_Y + 0.8, 0.8, { tone: "hi", shade: 2 }));
  out.push(`<g class="c-ink">${cardXZ(circle(DIAL_R), FACE_Y + 1.1, 0.3, { tone: "lo", shade: 3 })}</g>`);
  const y = FACE_Y + 1.2;
  const minor = [], major = [];
  for (let v = 0; v <= MAX_KPA; v += 5) {
    const a = angleOf(v);
    const big = v % 20 === 0;
    const r0 = DIAL_R - (big ? 3.6 : v % 10 === 0 ? 2.6 : 1.8);
    (big ? major : minor).push(seg(onDial(r0, a, y), onDial(DIAL_R - 0.8, a, y)));
  }
  out.push(L(k.pathOf(Array.from({ length: 81 }, (_, i) => at(onDial(DIAL_R - 0.8, angleOf((i / 80) * MAX_KPA), y)))), { tone: "lo" }));
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "hi" }));
  for (let v = 0; v <= MAX_KPA; v += 40) {
    const [tx, , tz] = onDial(DIAL_R - 6.6, angleOf(v), y);
    out.push(k.faceTextSvg(k.sideMatrix([tx, y], tz - 0.9, P, "left"), String(v), { size: 2.4, tone: "hi", anchor: "middle" }));
  }
  out.push(k.faceTextSvg(k.sideMatrix([DIAL_C[0], y], DIAL_C[2] - 7.6, P, "left"), "kPa", { size: 2.2, tone: "mid", anchor: "middle" }));
  // marks: Mars mean, pampa 83b224, Earth mean (sea level)
  const mark = (kpa, cls, r0 = DIAL_R - 4.4) => `<path class="pc-mark ${cls}" d="${seg(onDial(r0, angleOf(kpa), y + 0.05), onDial(DIAL_R + 1.6, angleOf(kpa), y + 0.05))}"/>`;
  out.push(mark(PR.mars / 10, "pc-mark-mars"), mark(PR.pampa / 10, "pc-mark-pampa"), mark(PR.earth / 10, "pc-mark-earth", DIAL_R - 2));
  // bottom label plate + corner screws
  const lp = [[DIAL_C[0] - 9, MAN_H + 3], [DIAL_C[0] + 9, MAN_H + 3], [DIAL_C[0] + 9, MAN_H + 8], [DIAL_C[0] - 9, MAN_H + 8]];
  out.push(cardXZ(lp, FACE_Y + 0.5, 0.5, { tone: "mid", shade: 1 }));
  out.push(L([5.4, 6.8].map((dz) => seg([DIAL_C[0] - 7, FACE_Y + 0.6, MAN_H + dz], [DIAL_C[0] + (dz > 6 ? 3 : 7), FACE_Y + 0.6, MAN_H + dz])).join(""), { tone: "faint", free: true }));
  const fc = [[CASE.x + 3.5, CASE_TOP - 3.5], [CASE.x + CASE.w - 3.5, CASE_TOP - 3.5], [CASE.x + 3.5, MAN_H + 3.5], [CASE.x + CASE.w - 3.5, MAN_H + 3.5]];
  out.push(D(fc.map(([x, z]) => at([x, FACE_Y, z])), { size: 0.55 }));
  return out.join("");
}
const needleD = (kpa) => {
  const a = angleOf(kpa);
  const y = FACE_Y + 1.6;
  return k.pathOf([at(onDial(-3.2, a, y)), at(onDial(DIAL_R - 0.9, a, y))]);
};

// Hose from the manifold nipple to the pump's side port, as a cubic in world space.
function hose() {
  const p0 = [MAN.x + MAN.w + 4, -1, 3.5];
  const p3 = [PUMP[0] - BARREL_R - 4.2, PUMP[1] + 2, 9];
  const c1 = [p0[0] + 22, p0[1] + 2, 3.5];
  const c2 = [p3[0] - 18, p3[1] + 12, 4];
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, u = 1 - t;
    pts.push(at([0, 1, 2].map((j) => u * u * u * p0[j] + 3 * u * u * t * c1[j] + 3 * u * t * t * c2[j] + t * t * t * p3[j])));
  }
  const d = k.pathOf(pts);
  const w = 3.6 * CAM.k;
  return `<path class="pc-hose-edge" style="stroke-width:${(w + 1.2).toFixed(2)}" d="${d}"/><path class="pc-hose" style="stroke-width:${w.toFixed(2)}" d="${d}"/><path class="pc-hose-shine" style="stroke-width:${(w * 0.22).toFixed(2)}" transform="translate(0 ${(-w * 0.22).toFixed(2)})" d="${d}"/>`;
}

function pumpBody() {
  const out = [];
  const [x, y] = PUMP;
  out.push(`<path class="iso-halo" d="${k.haloOf(FOOT, 0, FOOT_TOP, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(FOOT, 0, FOOT_TOP, P, 4, 0.6), { tone: "mid" }));
  // two foot treads with grip grooves
  for (const tx of [FOOT.x + 3, FOOT.x + FOOT.w - 15]) {
    const tread = { x: tx, y: FOOT.y + 4, w: 12, d: FOOT.d - 8, r: 1.5 };
    out.push(S(k.slabOf(tread, FOOT_TOP, 1.2, P, 3, 0.3), { tone: "mid" }));
    out.push(L([4, 7, 10, 13, 16].map((dy) => k.lineOnTop([tread.x, tread.y + dy], [tread.x + tread.w, tread.y + dy], FOOT_TOP + 1.2, P)).join(""), { tone: "faint" }));
  }
  // side port nipple (hose end)
  out.push(S(k.slabOf({ x: x - BARREL_R - 4.4, y: y + 0, w: 5, d: 4, r: 1 }, 7, 4, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(x, y, BARREL_R + 1.4, FOOT_TOP, 4, P, 40, 0.4), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, BARREL_R, FOOT_TOP + 4, BARREL_TOP - FOOT_TOP - 4, P, 48), {
    tone: "hi",
    crease: "none",
    inner: L([16, 30, 44].map((z) => k.sideArc(x, y, BARREL_R, z, P, 24)).join(""), { tone: "faint" }),
  }));
  // label band on the barrel
  out.push(L(k.sideArc(x, y, BARREL_R, 22, P, 24) + k.sideArc(x, y, BARREL_R, 26, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, BARREL_R + 1.6, BARREL_TOP, CAP_TOP - BARREL_TOP, P, 40, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(x, y, BARREL_R + 1.6, BARREL_TOP + 0.6, CAP_TOP - 0.6, 30, P), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 3, CAP_TOP, GLAND_TOP - CAP_TOP, P, 24), { tone: "mid" }));
  return out.join("");
}
function pumpHandle() {
  const [x, y] = PUMP;
  const out = [];
  out.push(S(k.cylinder(x, y, 3.6, HANDLE_Z, 5, P, 28, 0.4), { tone: "mid" }));
  const bar = { x: x - 22, y: y - 2.5, w: 44, d: 5, r: 2.4 };
  out.push(S(k.slabOf(bar, HANDLE_Z + 0.6, 3.8, P, 4, 0.4), { tone: "mid" }));
  for (const gx of [x - 23, x + 13]) {
    const grip = { x: gx, y: y - 3.4, w: 10, d: 6.8, r: 3.2 };
    out.push(S(k.slabOf(grip, HANDLE_Z, 4.8, P, 6, 0.4), { tone: "hi" }));
    out.push(L([2.5, 5, 7.5].map((dx) => seg([gx + dx, y + 3.4, HANDLE_Z + 0.6], [gx + dx, y + 3.4, HANDLE_Z + 4.2])).join(""), { tone: "lo" }));
  }
  out.push(D([at([x, y, HANDLE_Z + 5])], { size: 0.6, tone: "hi" }));
  return out.join("");
}

function svgFor(t) {
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: t.aria,
    body: [
      plate(),
      jarBase(),
      glassBack(),
      `<g class="c-copper"><path data-part="shadow" class="pc-b-shadow" d="${SHADOW}"/></g>`,
      pedestal(),
      `<g data-part="balloon" class="pc-balloon" transform="translate(${f1(KNOT[0])} ${f1(KNOT[1])})">${balloonArt()}</g>`,
      `<circle data-part="pop" class="pc-pop" cx="0" cy="0" r="0" opacity="0"/>`,
      `<g data-part="shreds" class="pc-shreds"></g>`,
      glassFront(),
      manifold(),
      gauge(),
      `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleD(PR.earth / 10)}" style="stroke-width:1.3"/>`,
      `<circle class="pc-hub" cx="${at([DIAL_C[0], FACE_Y + 1.7, DIAL_C[2]])[0].toFixed(1)}" cy="${at([DIAL_C[0], FACE_Y + 1.7, DIAL_C[2]])[1].toFixed(1)}" r="1.6"/>`,
      hose(),
      pumpBody(),
      `<g data-part="rod"></g>`,
      `<g data-part="handle">${pumpHandle()}</g>`,
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
.c-copper{--anatomy-paper:#8a5039;--anatomy-top:#E8A080;--anatomy-shade-0:#8a5039;--anatomy-shade-1:#a3624a;--anatomy-shade-2:#bb7559;--anatomy-shade-3:#d18869;--anatomy-hi:#ffe3d3;--anatomy-lo:#6e3d2a;--anatomy-dot:#4a2617}
.c-ink{--anatomy-paper:#0c1d21;--anatomy-shade-0:#0a181b;--anatomy-shade-3:#0c1d21}
.pc-glass-fill{fill:#FFF2D7;fill-opacity:.045}
.pc-glass-back{fill:none;stroke:#62807a;stroke-width:.6px;stroke-opacity:.8;vector-effect:non-scaling-stroke}
.pc-glass-front{fill:none;stroke:#FFF2D7;stroke-width:.8px;stroke-opacity:.85;vector-effect:non-scaling-stroke}
.pc-glass-seam{fill:none;stroke:#a9a690;stroke-width:.6px;stroke-opacity:.6;vector-effect:non-scaling-stroke}
.pc-glass-edge{fill:none;stroke:#FFF2D7;stroke-width:.8px;stroke-opacity:.9;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.pc-shine{fill:none;stroke:#FFF2D7;stroke-opacity:.16;stroke-linecap:round}
.pc-b-body{fill:#E8A080}
.pc-b-neck{fill:#bb7559;stroke:#6e3d2a;stroke-width:.5px;vector-effect:non-scaling-stroke}
.pc-b-shade{fill:#bb7559;opacity:.55}
.pc-b-shade2{fill:#8a5039;opacity:.55}
.pc-b-seam{fill:none;stroke:#6e3d2a;stroke-width:.5px;stroke-opacity:.6;vector-effect:non-scaling-stroke}
.pc-b-glint{fill:#FFF2D7;opacity:.75}
.pc-b-edge{fill:none;stroke:#6e3d2a;stroke-width:.7px;vector-effect:non-scaling-stroke}
.pc-b-knot{fill:#bb7559;stroke:#6e3d2a;stroke-width:.5px;vector-effect:non-scaling-stroke}
.pc-b-tail{fill:none;stroke:#bb7559;stroke-width:.7px;stroke-linecap:round;vector-effect:non-scaling-stroke}
.pc-b-shadow{fill:#050d0f;opacity:.45;filter:blur(2px)}
.pc-pop{fill:none;stroke:#E4ED83;stroke-width:1.4px;vector-effect:non-scaling-stroke}
.pc-shred{stroke:#6e3d2a;stroke-width:.4px;stroke-linejoin:round;vector-effect:non-scaling-stroke}
.pc-shred[data-side="0"]{fill:#E8A080}.pc-shred[data-side="1"]{fill:#bb7559}
.pc-mark{stroke-width:1.5px;stroke-linecap:butt;vector-effect:non-scaling-stroke}
.pc-mark-mars{stroke:#C1440E}.pc-mark-pampa{stroke:#FFF2D7}.pc-mark-earth{stroke:#E8A080}
.pc-hub{fill:#E4ED83}
.pc-hose-edge{fill:none;stroke:#0c1d21;stroke-linecap:butt;stroke-linejoin:round}
.pc-hose{fill:none;stroke:#2b5b59;stroke-linecap:butt;stroke-linejoin:round}
.pc-hose-shine{fill:none;stroke:#62807a;stroke-linecap:butt;stroke-opacity:.8}
.iso-page{width:min(760px,100% - 24px);margin:12px auto 16px}
.iso-figure{margin:0}
.iso-plate{padding:40px 12px 16px}
.iso-plate-corners{inset:14px 14px auto 14px;height:12px}
.iso-plate-corner[data-corner="title"]{white-space:normal;text-align:right;max-width:70%}
.sm-hint{margin:10px 2px 0;color:var(--anatomy-text);font-size:13px;line-height:1.5}
.sm-readout{margin:8px 2px 0;color:var(--anatomy-strong);font-family:var(--anatomy-mono);font-size:12.5px;line-height:1.5;font-variant-numeric:tabular-nums;min-height:3em}
.pc-note{margin:2px 2px 0;color:var(--anatomy-muted);font-size:12px;line-height:1.5}
.sm-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.sm-seg{display:inline-flex;flex-wrap:wrap;gap:0;border:1px solid var(--anatomy-lo)}
.sm-btn{min-height:44px;min-width:44px;padding:0 14px;border:0;background:transparent;color:var(--anatomy-text);font:600 13px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.sm-seg .sm-btn[aria-pressed="true"]{background:#E8A080;color:#101F24}
.sm-seg .sm-btn[data-world="mars"][aria-pressed="true"]{background:#C1440E;color:#FFF2D7}
.sm-seg .sm-btn[data-world="moon"][aria-pressed="true"]{background:#FFF2D7}
.sm-seg[data-units] .sm-btn[aria-pressed="true"]{background:#FFF2D7;color:#101F24}
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
const PR = ${JSON.stringify(PR)};
const T = ${JSON.stringify(t.live)};
const W = ${JSON.stringify(t.worlds)};
const LANG = ${JSON.stringify(t.lang)};
const C = ${JSON.stringify({ J, JAR_R, JAR_Z, R0, NECK, KNOT, KNOT_Z, UP, K: CAM.k, SHADOW_C, FACE_Y, DIAL_C, DIAL_R, MAX_KPA, SWEEP, PUMP, GLAND_TOP, HANDLE_Z, STROKE, VALVE, MAN_H, BURST })};
const svg = document.querySelector(".iso-stage svg");
const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
const balloon = $("balloon"), shadow = $("shadow"), pop = $("pop"), shredsG = $("shreds"), needle = $("needle"), rod = $("rod"), handle = $("handle"), valve = $("valve");
const readout = document.querySelector("[data-readout]");
const pumpBtn = document.querySelector("[data-pump]");
const worldBtns = [...document.querySelectorAll("[data-world]")];
const unitBtns = [...document.querySelectorAll("[data-unit]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const at = (p) => iso(p, P);
const nf = (v, o) => v.toLocaleString(LANG, Object.assign({ useGrouping: false }, o));
function fmtP(mbar, unit) {
  const u = unit === "kpa" ? "kPa" : unit === "mbar" ? "mbar" : "atm";
  if (mbar < 0.005) return T.approx + " " + u;
  if (unit === "mbar") return nf(mbar, { maximumFractionDigits: mbar >= 100 ? 0 : mbar >= 10 ? 1 : 2, minimumFractionDigits: mbar >= 100 ? 0 : mbar >= 10 ? 1 : 2 }) + " " + u;
  if (unit === "kpa") { const v = mbar / 10; const d = v >= 10 ? 1 : v >= 0.1 ? 2 : 3; return nf(v, { minimumFractionDigits: d, maximumFractionDigits: d }) + " " + u; }
  const v = mbar / PR.atm;
  return (v >= 0.1 ? nf(v, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : nf(v, { maximumSignificantDigits: 2 })) + " " + u;
}
const fmtN = (n) => (n < 10 ? nf(n, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : n.toLocaleString(LANG, { maximumFractionDigits: 0 }));
const angleOf = (kpa) => (C.SWEEP[0] + (C.SWEEP[1] - C.SWEEP[0]) * Math.min(1, Math.max(0, kpa / C.MAX_KPA))) * Math.PI / 180;
const onDial = (r, a, y) => [C.DIAL_C[0] + r * Math.cos(a), y, C.DIAL_C[2] + r * Math.sin(a)];
const params = new URLSearchParams(location.search);
const initial = ["earth", "mars", "moon"].includes(params.get("world")) ? params.get("world") : "mars";
const state = { world: initial, runWorld: initial, unit: "kpa", phase: "idle", p: PR.earth, from: PR.earth, t: 0, burst: false, grow: 1, fade: 1, needle: { x: PR.earth / 10, v: 0 }, stroke: 0, valve: 0, popT: -1, shreds: [] };
// deterministic pseudo-random
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function spawnShreds(settled) {
  seed = 7;
  const s = Math.cbrt(C.BURST);
  const cz = C.KNOT_Z + (C.NECK + C.R0 * 1.04) * s, R = C.R0 * s;
  state.shreds = Array.from({ length: 18 }, (_, i) => {
    const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1);
    const n = [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)];
    const sp = 70 + rnd() * 70;
    const sh = { p: [C.J[0] + n[0] * R, C.J[1] + n[1] * R, cz + n[2] * R], v: [n[0] * sp, n[1] * sp, n[2] * sp + 40], a: rnd() * 6.28, w: (rnd() - 0.5) * 18, tilt: rnd() * 6.28, size: 2.2 + rnd() * 2.6, side: i % 2, rest: false };
    if (settled) { const rr = 6 + rnd() * (C.JAR_R - 10), aa = rnd() * 6.28; sh.p = [C.J[0] + rr * Math.cos(aa), C.J[1] + rr * Math.sin(aa), C.JAR_Z + 0.2]; sh.v = [0, 0, 0]; sh.rest = true; }
    return sh;
  });
}
function stepShreds(dt) {
  let moving = false;
  for (const s of state.shreds) {
    if (s.rest) continue;
    moving = true;
    s.v[2] -= 260 * dt;
    for (let j = 0; j < 3; j++) { s.v[j] *= Math.exp(-dt * 1.4); s.p[j] += s.v[j] * dt; }
    s.a += s.w * dt; s.tilt += s.w * 0.6 * dt;
    const dx = s.p[0] - C.J[0], dy = s.p[1] - C.J[1], r = Math.hypot(dx, dy), lim = C.JAR_R - 2.5;
    if (r > lim) { s.p[0] = C.J[0] + dx / r * lim; s.p[1] = C.J[1] + dy / r * lim; const vn = (s.v[0] * dx + s.v[1] * dy) / r; if (vn > 0) { s.v[0] -= 1.5 * vn * dx / r; s.v[1] -= 1.5 * vn * dy / r; } }
    const top = 46 + 20 * Math.sqrt(Math.max(0, 1 - (r / C.JAR_R) ** 2));
    if (s.p[2] > top) { s.p[2] = top; if (s.v[2] > 0) s.v[2] *= -0.4; }
    if (s.p[2] < C.JAR_Z + 0.2) { s.p[2] = C.JAR_Z + 0.2; s.v[2] *= -0.3; s.v[0] *= 0.5; s.v[1] *= 0.5; s.w *= 0.5; if (Math.abs(s.v[2]) < 8) { s.v = [0, 0, 0]; s.rest = true; } }
  }
  return moving;
}
function shredsSvg() {
  let out = "";
  for (const s of state.shreds) {
    const flat = s.rest || s.p[2] < C.JAR_Z + 1;
    const ca = Math.cos(s.a), sa = Math.sin(s.a), ct = flat ? 1 : Math.cos(s.tilt), st = flat ? 0 : Math.sin(s.tilt);
    const u = [ca * s.size, sa * s.size, 0], v = [-sa * ct * s.size * 0.6, ca * ct * s.size * 0.6, st * s.size * 0.6];
    const q = [[-1, -1], [1, -0.7], [0.8, 1], [-0.9, 0.8]].map(([a, b]) => at([s.p[0] + a * u[0] + b * v[0], s.p[1] + a * u[1] + b * v[1], s.p[2] + a * u[2] + b * v[2]]));
    out += '<path class="pc-shred" data-side="' + s.side + '" d="' + pathOf(q, true) + '"/>';
  }
  return out;
}
function rodSvg(top) { return solidSvg(cylinder(C.PUMP[0], C.PUMP[1], 1.5, C.GLAND_TOP, top - C.GLAND_TOP, P, 16), { tone: "hi", crease: "none" }); }
function valveD(a) { const z = C.MAN_H + 5.6; return pathOf([at([C.VALVE[0], C.VALVE[1], z]), at([C.VALVE[0] + 4.2 * Math.cos(a), C.VALVE[1] + 4.2 * Math.sin(a), z])]); }
const PUMP_S = 5.4, VENT_S = 1.1, GROW_S = 0.7;
// Log-linear pump-down in two legs: sea level to the burst point over the first 45 %, then on to the target.
function curve(u, target) {
  const lb = Math.log(PR.earth / C.BURST), lt = Math.log(Math.max(target, 1e-3)), l0 = Math.log(PR.earth);
  const e = (x) => x * x * (3 - 2 * x);
  return u < 0.45 ? Math.exp(l0 + (lb - l0) * e(u / 0.45)) : Math.exp(lb + (lt - lb) * e((u - 0.45) / 0.55));
}
function text() {
  const p = fmtP(state.p, state.unit);
  const n = PR.earth / Math.max(state.p, 1e-12);
  if (state.phase === "venting" || state.phase === "growing") return T.venting.replace("{p}", p);
  if (state.phase === "pumping") return (state.burst ? T.burstNow : T.pumping).replace("{p}", p).replace("{n}", fmtN(n));
  if (state.phase === "done") return T[state.world].replace("{p}", p).replace("{n}", fmtN(n));
  return T.ready.replace("{world}", W[state.world]).replace("{p}", fmtP(PR[state.world], state.unit));
}
let lastShreds = "", lastRod = -1;
function draw() {
  const vol = Math.min(PR.earth / Math.max(state.p, 1e-12), C.BURST);
  const s = Math.cbrt(vol) * state.grow;
  balloon.setAttribute("transform", "translate(" + C.KNOT[0].toFixed(2) + " " + C.KNOT[1].toFixed(2) + ") scale(" + s.toFixed(4) + ")");
  balloon.style.display = state.burst || s < 0.01 ? "none" : "";
  shadow.setAttribute("transform", "translate(" + C.SHADOW_C[0].toFixed(2) + " " + C.SHADOW_C[1].toFixed(2) + ") scale(" + (state.burst ? 0 : s).toFixed(4) + ") translate(" + (-C.SHADOW_C[0]).toFixed(2) + " " + (-C.SHADOW_C[1]).toFixed(2) + ")");
  const sh = shredsSvg();
  if (sh !== lastShreds) { shredsG.innerHTML = sh; lastShreds = sh; }
  shredsG.style.opacity = String(state.fade);
  if (state.popT >= 0) {
    const sz = Math.cbrt(C.BURST), c = at([C.J[0], C.J[1], C.KNOT_Z + (C.NECK + C.R0 * 1.04) * sz]);
    pop.setAttribute("cx", c[0].toFixed(1)); pop.setAttribute("cy", c[1].toFixed(1));
    pop.setAttribute("r", (C.R0 * sz * C.K * (1 + state.popT * 2.2)).toFixed(1));
    pop.setAttribute("opacity", Math.max(0, 1 - state.popT * 2.5).toFixed(2));
  } else pop.setAttribute("opacity", "0");
  const top = C.HANDLE_Z - state.stroke * C.STROKE;
  if (Math.abs(top - lastRod) > 0.01) { rod.innerHTML = rodSvg(top); lastRod = top; }
  handle.setAttribute("transform", translateAlong(P, [0, 0, -state.stroke * C.STROKE]));
  valve.setAttribute("d", valveD(-0.6 + state.valve));
  const a = angleOf(state.needle.x), y = C.FACE_Y + 1.6;
  needle.setAttribute("d", pathOf([at(onDial(-3.2, a, y)), at(onDial(C.DIAL_R - 0.9, a, y))]));
  const tx = text();
  if (readout.textContent !== tx) readout.textContent = tx;
  pumpBtn.disabled = state.phase === "pumping" || state.phase === "venting" || state.phase === "growing";
  worldBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.world === state.world)));
  unitBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.unit === state.unit)));
}
function finishInstantly() {
  state.runWorld = state.world;
  state.p = PR[state.world];
  state.burst = state.world !== "earth";
  state.grow = 1; state.fade = 1; state.stroke = 0; state.popT = -1;
  if (state.burst) spawnShreds(true); else state.shreds = [];
  state.phase = "done";
  state.needle.x = state.p / 10; state.needle.v = 0;
}
let frame = 0, last = 0, visible = false, touring = !still.matches, tourClock = 0, wasBurst = false;
const TOUR = ["mars", "moon", "earth"];
let tourIndex = Math.max(0, TOUR.indexOf(initial));
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  let moving = false;
  if (touring && (state.phase === "idle" || state.phase === "done")) {
    tourClock += dt;
    if (state.phase === "idle" && tourClock > 1.2) { tourClock = 0; startPump(true); }
    else if (state.phase === "done" && tourClock > 4.5) { tourClock = 0; tourIndex = (tourIndex + 1) % TOUR.length; state.world = TOUR[tourIndex]; startPump(true); }
  }
  if (state.phase === "venting") {
    state.t += dt / VENT_S;
    const u = Math.min(1, state.t), e = u * u * (3 - 2 * u);
    state.p = state.from + (PR.earth - state.from) * e;
    state.fade = 1 - e; state.valve = Math.sin(Math.PI * u) * 1.6;
    if (u >= 1) { state.shreds = []; state.fade = 1; state.valve = 0; state.p = PR.earth; if (state.burst) { state.burst = false; state.grow = 0; state.phase = "growing"; } else state.phase = "pumping"; state.t = 0; }
    moving = true;
  } else if (state.phase === "growing") {
    state.t += dt / GROW_S;
    const u = Math.min(1, state.t);
    state.grow = 1 - Math.pow(1 - u, 3);
    if (u >= 1) { state.grow = 1; state.phase = "pumping"; state.t = 0; }
    moving = true;
  } else if (state.phase === "pumping") {
    const rw = state.runWorld, dur = rw === "earth" ? 1.6 : PUMP_S;
    state.t += dt / dur;
    const u = Math.min(1, state.t);
    state.p = rw === "earth" ? PR.earth : curve(u, PR[rw]);
    const strokes = rw === "earth" ? 2 : 6;
    state.stroke = 0.5 - 0.5 * Math.cos(2 * Math.PI * strokes * u);
    if (!state.burst && PR.earth / state.p > C.BURST) { state.burst = true; spawnShreds(false); state.popT = 0; }
    if (u >= 1) { state.p = PR[rw]; state.stroke = 0; state.phase = state.world === rw ? "done" : "idle"; tourClock = 0; }
    moving = true;
  }
  if (state.popT >= 0) { state.popT += dt; if (state.popT > 0.45) state.popT = -1; moving = true; }
  if (stepShreds(dt)) moving = true;
  // needle: a damped spring onto the pressure (kPa)
  const want = state.p / 10;
  for (let i = 0; i < 4; i++) { state.needle.v += ((want - state.needle.x) * 120 - state.needle.v * 16) * dt / 4; state.needle.x += state.needle.v * dt / 4; }
  if (Math.abs(want - state.needle.x) < 1e-3 && Math.abs(state.needle.v) < 1e-3) { state.needle.x = want; state.needle.v = 0; } else moving = true;
  draw();
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function startPump(fromTour) {
  if (!fromTour) touring = false;
  if (state.phase === "pumping" || state.phase === "venting" || state.phase === "growing") return;
  if (still.matches) { finishInstantly(); draw(); return; }
  state.t = 0; state.runWorld = state.world;
  if (state.p < PR.earth - 0.01 || state.burst) { state.phase = "venting"; state.from = state.p; }
  else state.phase = "pumping";
  run();
}
pumpBtn.addEventListener("click", () => startPump(false));
worldBtns.forEach((b) => b.addEventListener("click", () => { touring = false; state.world = b.dataset.world; if (state.phase === "done") state.phase = "idle"; draw(); }));
unitBtns.forEach((b) => b.addEventListener("click", () => { state.unit = b.dataset.unit; draw(); }));
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(svg);
still.addEventListener?.("change", () => { if (still.matches) { touring = false; if (state.phase !== "idle" && state.phase !== "done") finishInstantly(); } run(); });
draw();
`;
}

const chip = (color) => `<span class="sm-chip" style="background:${color}" aria-hidden="true"></span>`;
function fmt(lang, v, d) {
  return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: false });
}
for (const t of STRINGS) {
  const pe = `${fmt(t.lang, PR.earth, 0)} mbar`;
  const pm = `${fmt(t.lang, PR.mars, 2)} mbar`;
  const pmk = `${fmt(t.lang, PR.mars / 10, 2)} kPa`;
  const pampa = `${fmt(t.lang, PR.pampa / 10, 1)} kPa`;
  const fill = (s) => s.replaceAll("{pe}", pe).replaceAll("{pm}", pm).replaceAll("{pmk}", pmk).replaceAll("{pampa}", pampa).replaceAll("{ratio}", fmt(t.lang, RATIO, 0));
  const svg = svgFor(t);
  const worldBtn = (w) => `<button type="button" class="sm-btn" data-world="${w}" aria-pressed="${w === "mars"}">${t.worlds[w]}</button>`;
  const unitBtn = (u, label) => `<button type="button" class="sm-btn" data-unit="${u}" aria-pressed="${u === "kpa"}">${label}</button>`;
  const ready = t.live.ready.replace("{world}", t.worlds.mars).replace("{p}", `${fmt(t.lang, PR.mars / 10, 2)} kPa`);
  const body = `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 2</span><span class="iso-plate-corner" data-corner="title">${t.title}</span></div>
<div class="iso-stage" role="img" aria-label="${t.aria}">${svg}</div>
<p class="sm-hint">${t.hint}</p>
<div class="sm-controls"><div class="sm-seg" role="group" aria-label="${t.worldLabel}">${["earth", "mars", "moon"].map(worldBtn).join("")}</div><button type="button" class="sm-btn sm-scan" data-pump>${t.pump}</button><div class="sm-seg" data-units role="group" aria-label="${t.unitLabel}">${unitBtn("kpa", "kPa")}${unitBtn("mbar", "mbar")}${unitBtn("atm", "atm")}</div></div>
<p class="sm-readout" data-readout aria-live="polite">${ready}</p>
<p class="pc-note">${t.note}</p></div>
<figcaption class="iso-legend"><span class="sm-keys"><span class="sm-key">${chip("#E8A080")}${fill(t.keyBalloon)}</span><span class="sm-key">${chip("#E4ED83")}${t.keyNeedle}</span><span class="sm-key">${chip("#FFF2D7")}${fill(t.keyPampa)}</span><span class="sm-key">${chip("#C1440E")}${fill(t.keyMars)}</span></span><span class="iso-caption">${fill(t.caption)}</span><span class="sm-foot">${t.footer}</span></figcaption></figure>`;
  let html = k.pageHtml({ title: t.title, theme: "dark", body, script: kitScript() + live(t), width: 760 });
  html = html.replace('<html lang="en">', `<html lang="${t.lang}">`).replace("</style></head>", `${EXTRA_CSS}</style></head>`);
  const file = join(OUT, `pressure-chamber-${t.lang}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, html.length);
}
console.log("Earth/Mars ratio", RATIO.toFixed(2), "pampa", PR.pampa);
