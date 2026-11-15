// La estación de radiación y temperatura — Anatomy figure (MIT kit), built for es / pt / en.
// Same house style as build.mjs (the slope machine). Day–night swings come from the project snapshot.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import { STRINGS } from "./weather-station-strings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");
const CMP = JSON.parse(readFileSync(join(HERE, "../../data/local/compare-83b224fffffffff.json"), "utf8"));
const SITES = JSON.parse(readFileSync(join(HERE, "../../data/local/sites.json"), "utf8"));
const MOON = SITES.find((s) => s.site_id === "moon_shackleton_pole");
if (!MOON || CMP.site.site_id !== "mars_jezero_crater") throw new Error("unexpected data shape");

// ---- the model: every number the figure shows ----
const TOKEN_MSV = 2.4; // UNSCEAR world average yearly dose, one token
const DAYS = 365.25;
const NUM = {
  dose: { earth: 2.4, mars: 230, moon: 380 }, // mSv/yr: UNSCEAR · MSL RAD (Hassler et al. 2014) · simulated, solar minimum (Reitz et al. 2012)
  swing: {
    earth: CMP.match.earth_variables.dependent.diurnal_temp_amplitude_k, // ERA5, cell 83b224
    mars: CMP.site.variables.dependent.diurnal_temp_amplitude_k, // Jezero, MEDA
    moon: MOON.variables.dependent.diurnal_temp_amplitude_k, // Shackleton, model
  },
};
for (const v of Object.values(NUM.swing)) if (typeof v !== "number" || !(v > 0)) throw new Error("missing swing");
NUM.tokens = Object.fromEntries(Object.entries(NUM.dose).map(([w, d]) => [w, Math.max(1, Math.round(d / TOKEN_MSV))]));
NUM.daily = Object.fromEntries(Object.entries(NUM.dose).map(([w, d]) => [w, d / DAYS]));
// atmospheric column over the detector, g/cm² (Earth sea level; Gale crater, Hassler et al. 2014)
const COLUMN = { earth: 1033, mars: 20, moon: 0 };

const WIDTH = 640;
const HEIGHT = 380;

// ---- world plan (units ~ px, z up) ----
const PLATE = { x: -172, y: -56, w: 286, d: 112, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;

// dosimeter
const BODY = { x: -112, y: -50, w: 76, d: 30, r: 3 };
const BODY_H = 32;
const BODY_FACE = BODY.y + BODY.d;
const WIN = { x: -106, z: 15, w: 30, h: 10 };
const PUCK = { cx: -58, cy: -35, r: 9, h: 5 };
const PUCK_TOP = BODY_H + PUCK.h;
const STACK = { x: -71, y: -46, w: 26, d: 22, r: 2 };
const SHEET_FULL = 26; // Earth's column, 1033 g/cm²
const COIL_H = 5;

// token tray: 20 × 8 cells
const COLS = 20;
const ROWS = 8;
const PITCH = 5;
const CELL0 = [-122, -8];
const TRAY = { x: -126, y: -12, w: 108, d: 52, r: 3 };
const TRAY_H = 3;
const TOKEN = 4;
const TOKEN_H = 1.4;
const DROP = 16;

// thermometer
const FOOT = { x: 30, y: -40, w: 60, d: 24, r: 3 };
const FOOT_TOP = 12;
const FOOT_FACE = FOOT.y + FOOT.d;
const BOARD = { x: 36, y: -36, w: 48, d: 5, r: 1 };
const BOARD_TOP = 126;
const FACE = BOARD.y + BOARD.d;
const TUBE_X = 60;
const Z0 = 28;
const PER_C = 0.44; // world units per °C of swing
const MAX_C = 200;
const COL_PLAN = { x: TUBE_X - 1.1, y: FACE + 0.1, w: 2.2, d: 2.2, r: 0.4 };
const CLOCK = { x: 60, z: 6, r: 4.4 };

// selector
const SEL = { x: -4, y: 8, w: 48, d: 40, r: 4 };
const SEL_H = 3;
const KNOB = { cx: 20, cy: 28, r: 7 };
const KNOB_TOP = SEL_H + 6;
const WORLDS = ["earth", "moon", "mars"];
const SEL_ANGLE = { earth: 72, moon: 142, mars: 212 }; // degrees, measured on the floor from −y; all three seats face the viewer

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [BOARD.x, BOARD.y, BOARD_TOP + 4], [BOARD.x + BOARD.w, FACE, BOARD_TOP + 4], [STACK.x, STACK.y, PUCK_TOP + COIL_H + SHEET_FULL]],
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
const rect = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
const text = (x, y, z, s, size, tone = "mid", anchor = "middle") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "left"), s, { size, tone, anchor });

// A flat card standing in the x-z plane: a back copy gives it thickness.
function cardXZ(pts, y, depth, { tone = "hi", shade = 3 } = {}) {
  const back = xz(pts, y - depth);
  const front = xz(pts, y);
  return `<g class="iso-solid"><path class="iso-fill" d="${back}"/><path class="iso-shade" data-shade="0" d="${back}"/><path class="iso-line iso-edge" data-tone="lo" d="${back}"/><path class="iso-fill" d="${front}"/><path class="iso-shade" data-shade="${shade}" d="${front}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${front}"/></g>`;
}
const circleXZ = (cx, cz, r, steps = 48) => Array.from({ length: steps }, (_, i) => [cx + r * Math.cos((i / steps) * Math.PI * 2), cz + r * Math.sin((i / steps) * Math.PI * 2)]);

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  const feet = [...k.corners(PLATE, 20), [PLATE.x + PLATE.w / 2, PLATE.y + 20], [PLATE.x + PLATE.w / 2, PLATE.y + PLATE.d - 20]];
  for (const [x, y] of feet.sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid", inner: L([3.4, 6.8].map((z) => k.sideSeam(PLATE, -z, P)).join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip under the tray: one tick per token column, a major every 5
  const strip = { x: CELL0[0] - 3, y: PLATE.y + PLATE.d - 12, w: COLS * PITCH + 6, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(CELL0[0], CELL0[0] + COLS * PITCH, PITCH, 5, strip.y + 0.6, 0.6, [1.8, 3.4], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // label plate with three rule lines
  const label = { x: -166, y: PLATE.y + PLATE.d - 14, w: 34, d: 8, r: 1 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L([2, 4, 6].map((dy, i) => k.lineOnTop([label.x + 3, label.y + dy], [label.x + label.w - (i === 2 ? 12 : 3), label.y + dy], 0.8, P)).join(""), { tone: "faint", free: true }));
  out.push(D([at([label.x + 1.5, label.y + 4, 0.8]), at([label.x + label.w - 1.5, label.y + 4, 0.8])], { size: 0.4 }));
  return out.join("");
}

function dosimeter() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BODY, 0, BODY_H, P)}" style="filter:blur(6px)"/>`];
  for (const x of [BODY.x + 4, BODY.x + BODY.w - 12]) out.push(S(k.slabOf({ x, y: BODY.y + 2, w: 8, d: BODY.d - 4, r: 1 }, 0, 2, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf(BODY, 2, BODY_H - 2, P, 4, 0.8), { tone: "mid", inner: L([8, BODY_H - 5].map((z) => k.sideSeam(BODY, z, P, 4)).join(""), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(BODY, 3), BODY_H, P, 4), { tone: "faint" }));
  // counter window, recessed ink card with the live number
  out.push(cardXZ(rect(WIN.x - 1.6, WIN.z - 1.6, WIN.x + WIN.w + 1.6, WIN.z + WIN.h + 1.6), BODY_FACE + 0.6, 0.6, { tone: "hi", shade: 2 }));
  out.push(`<g class="c-ink">${cardXZ(rect(WIN.x, WIN.z, WIN.x + WIN.w, WIN.z + WIN.h), BODY_FACE + 0.8, 0.2, { tone: "lo", shade: 3 })}</g>`);
  out.push(`<g data-part="counter" class="ws-counter">${text(WIN.x + WIN.w / 2, BODY_FACE + 0.9, WIN.z + 3, "230", 5.2, "lit")}</g>`);
  // status lamp, two push buttons and a label plate beside the window
  const lamp = [WIN.x + WIN.w + 8, BODY_FACE, WIN.z + WIN.h - 2];
  out.push(L(k.sideRing(lamp, 2, "y", P, 16), { tone: "mid" }));
  out.push(`<circle data-part="lamp" class="ws-lamp" cx="${at(lamp)[0].toFixed(2)}" cy="${at(lamp)[1].toFixed(2)}" r="1.2"/>`);
  for (const dx of [4, 12]) {
    const c = [WIN.x + WIN.w + dx, BODY_FACE, WIN.z + 1];
    out.push(L(k.sideRing(c, 2.2, "y", P, 16), { tone: "lo" }), D([at(c)], { size: 0.8, tone: "mid" }));
  }
  out.push(cardXZ(rect(WIN.x, 5, WIN.x + 22, 9.5), BODY_FACE + 0.4, 0.4, { tone: "mid", shade: 1 }));
  out.push(L([6.6, 8].map((z, i) => seg([WIN.x + 2, BODY_FACE + 0.5, z], [WIN.x + (i ? 14 : 20), BODY_FACE + 0.5, z])).join(""), { tone: "faint", free: true }));
  const fc = [[BODY.x + 4, BODY_H - 2.5], [BODY.x + BODY.w - 4, BODY_H - 2.5], [BODY.x + 4, 4.5], [BODY.x + BODY.w - 4, 4.5]];
  out.push(D(fc.map(([x, z]) => at([x, BODY_FACE, z])), { size: 0.55 }));
  // carry handle on the lid
  for (const x of [BODY.x + 8, BODY.x + 28]) out.push(S(k.slabOf({ x, y: BODY.y + 12, w: 3, d: 6, r: 0.6 }, BODY_H, 6, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf({ x: BODY.x + 6, y: BODY.y + 12, w: 27, d: 6, r: 1.5 }, BODY_H + 6, 2.4, P, 4, 0.4), { tone: "mid" }));
  // detector puck with its grille
  out.push(S(k.cylinder(PUCK.cx, PUCK.cy, PUCK.r + 1.5, BODY_H, 1.2, P, 40), { tone: "lo" }));
  out.push(S(k.cylinder(PUCK.cx, PUCK.cy, PUCK.r, BODY_H + 1.2, PUCK.h - 1.2, P, 40, 0.5), { tone: "hi", inner: L(k.sideArc(PUCK.cx, PUCK.cy, PUCK.r, BODY_H + 3, P, 40), { tone: "lo" }) }));
  out.push(L([3, 5.5, 8 - 0.01].map((r) => k.ring(PUCK.cx, PUCK.cy, r, PUCK_TOP, P, 32)).join(""), { tone: "lo" }));
  out.push(D([at([PUCK.cx, PUCK.cy, PUCK_TOP])], { size: 0.9, tone: "hi" }));
  return out.join("");
}

// Shields: Earth's atmosphere in ten sheets on a magnetic coil, Mars a single thin sheet, the Moon nothing.
function shields() {
  const out = [];
  const coilPlan = k.insetPlan(STACK, -1);
  const earth = [];
  earth.push(S(k.slabOf(coilPlan, PUCK_TOP, COIL_H, P, 4), { tone: "hi", crease: "lo", inner: L([1, 2, 3, 4].map((z) => k.sideSeam(coilPlan, PUCK_TOP + z, P, 4)).join(""), { tone: "lo" }) }));
  const coil = `<g class="c-copper">${earth.join("")}</g>`;
  const z0 = PUCK_TOP + COIL_H;
  const sheetH = (SHEET_FULL * COLUMN.earth) / COLUMN.earth / 10;
  const seams = Array.from({ length: 9 }, (_, i) => k.sideSeam(STACK, z0 + (i + 1) * sheetH, P, 4)).join("");
  const sheets = `<g class="c-cream">${S(k.slabOf(STACK, z0, SHEET_FULL, P, 4, 0.5), { tone: "hi", crease: "lo", inner: L(seams, { tone: "lo" }) })}${D(k.corners(STACK, 3).map(([x, y]) => at([x, y, z0 + SHEET_FULL])), { size: 0.5, tone: "lo" })}</g>`;
  out.push(`<g data-shield="earth" class="ws-shield">${coil}${sheets}</g>`);
  const marsH = Math.max(0.5, (SHEET_FULL * COLUMN.mars) / COLUMN.earth);
  out.push(`<g data-shield="mars" class="ws-shield c-rust">${S(k.slabOf(STACK, PUCK_TOP, marsH, P, 4), { tone: "hi", crease: "lo" })}</g>`);
  out.push(`<g data-shield="moon" class="ws-shield"></g>`);
  return out.join("");
}

function tray() {
  const out = [`<path class="iso-halo" d="${k.haloOf(TRAY, 0, TRAY_H, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(TRAY, 0, TRAY_H, P, 4, 0.6), { tone: "mid" }));
  const inner = k.insetPlan(TRAY, 3);
  out.push(L(k.planOutline(inner, TRAY_H, P, 4), { tone: "faint" }));
  const grid = [];
  for (let j = 1; j < ROWS; j++) grid.push(k.lineOnTop([inner.x, CELL0[1] + j * PITCH], [inner.x + inner.w, CELL0[1] + j * PITCH], TRAY_H, P));
  for (let i = 1; i < COLS; i++) grid.push(k.lineOnTop([CELL0[0] + i * PITCH, inner.y], [CELL0[0] + i * PITCH, inner.y + inner.d], TRAY_H, P));
  out.push(L(grid.join(""), { tone: "faint" }));
  // grip at the front edge
  const grip = { x: TRAY.x + TRAY.w / 2 - 12, y: TRAY.y + TRAY.d, w: 24, d: 3, r: 1.2 };
  out.push(S(k.slabOf(grip, 0.5, 2, P, 4), { tone: "mid" }));
  return out.join("");
}

// Tokens: every cell pre-built at rest, painted back to front; that is also the fill order.
const CELLS = [];
for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) CELLS.push([CELL0[0] + i * PITCH + PITCH / 2, CELL0[1] + j * PITCH + PITCH / 2]);
CELLS.sort((a, b) => k.depthOf([...a, 0], P) - k.depthOf([...b, 0], P));
function tokens() {
  return CELLS.map(([cx, cy], n) => {
    const plan = { x: cx - TOKEN / 2, y: cy - TOKEN / 2, w: TOKEN, d: TOKEN, r: 0.5 };
    return `<g data-tok="${n}" class="c-sulfur" style="display:none">${S(k.slabOf(plan, TRAY_H, TOKEN_H, P, 2), { tone: "hi", crease: "none" })}</g>`;
  }).join("");
}

function thermometerBack() {
  const out = [`<path class="iso-halo" d="${k.haloOf(FOOT, 0, FOOT_TOP, P)}" style="filter:blur(6px)"/>`];
  out.push(S(k.slabOf(FOOT, 0, FOOT_TOP, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(FOOT, 3, P, 4), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(FOOT, 3), FOOT_TOP, P, 4), { tone: "faint" }));
  // 24-hour clock on the foot face; its hand is live
  out.push(cardXZ(circleXZ(CLOCK.x, CLOCK.z, CLOCK.r + 1.2), FOOT_FACE + 0.5, 0.5, { tone: "hi", shade: 2 }));
  out.push(`<g class="c-ink">${cardXZ(circleXZ(CLOCK.x, CLOCK.z, CLOCK.r), FOOT_FACE + 0.7, 0.2, { tone: "lo", shade: 3 })}</g>`);
  const ticks = [];
  for (let h = 0; h < 24; h += 3) {
    const a = Math.PI / 2 - (h / 24) * Math.PI * 2;
    const r0 = h % 6 === 0 ? CLOCK.r - 1.6 : CLOCK.r - 0.9;
    ticks.push(seg([CLOCK.x + r0 * Math.cos(a), FOOT_FACE + 0.8, CLOCK.z + r0 * Math.sin(a)], [CLOCK.x + CLOCK.r * Math.cos(a), FOOT_FACE + 0.8, CLOCK.z + CLOCK.r * Math.sin(a)]));
  }
  out.push(L(ticks.join(""), { tone: "mid" }));
  // half-disc day / night mark under the clock's top: sulfur for noon
  out.push(D([at([CLOCK.x, FOOT_FACE + 0.8, CLOCK.z])], { size: 0.6, tone: "hi" }));
  // corner screws and a reset knob (resets the indices, like the magnet of a Six's thermometer)
  out.push(D([[FOOT.x + 4, 3], [FOOT.x + FOOT.w - 4, 3], [FOOT.x + 4, FOOT_TOP - 3], [FOOT.x + FOOT.w - 4, FOOT_TOP - 3]].map(([x, z]) => at([x, FOOT_FACE, z])), { size: 0.55 }));
  out.push(S(k.cylinder(FOOT.x + FOOT.w - 8, FOOT.y + 7, 3.2, FOOT_TOP, 4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(FOOT.x + FOOT.w - 8, FOOT.y + 7, 3.2, FOOT_TOP, FOOT_TOP + 4, 16, P), { tone: "lo" }));
  // side brackets holding the board
  for (const x of [BOARD.x - 3, BOARD.x + BOARD.w]) out.push(S(k.slabOf({ x, y: BOARD.y - 1, w: 3, d: BOARD.d + 6, r: 0.6 }, FOOT_TOP, 16, P, 2, 0.3), { tone: "mid" }));
  // the board
  out.push(`<path class="iso-halo" d="${k.haloOf(BOARD, FOOT_TOP, BOARD_TOP - FOOT_TOP, P)}" style="filter:blur(5px);opacity:.5"/>`);
  out.push(S(k.slabOf(BOARD, FOOT_TOP, BOARD_TOP - FOOT_TOP, P, 3, 0.6), { tone: "mid" }));
  out.push(`<g class="c-cream">${cardXZ(rect(BOARD.x + 3, FOOT_TOP + 4, BOARD.x + BOARD.w - 3, BOARD_TOP - 4), FACE + 0.4, 0.4, { tone: "hi", shade: 3 })}</g>`);
  const y = FACE + 0.5;
  out.push('<g class="c-cream">');
  // the tube: a closed slot, the bulb below
  out.push(L(xz([[TUBE_X - 1.6, Z0 - 6], [TUBE_X + 1.6, Z0 - 6], [TUBE_X + 1.6, Z0 + MAX_C * PER_C + 4], [TUBE_X, Z0 + MAX_C * PER_C + 5.6], [TUBE_X - 1.6, Z0 + MAX_C * PER_C + 4]], y), { tone: "lo" }));
  // °C scale on the left, °F on the right, each on its own spine
  const scale = (unit, side, step, every, max, perUnit) => {
    const spine = TUBE_X + side * 3;
    const minor = [], major = [];
    for (let v = 0; v <= max + 1e-9; v += step) {
      const z = Z0 + v * perUnit;
      const big = Math.round(v / step) % every === 0;
      (big ? major : minor).push(seg([spine, y, z], [spine + side * (big ? 4 : 2.4), y, z]));
    }
    const nums = [];
    for (let v = 0; v <= max + 1e-9; v += step * every) nums.push(text(spine + side * 9, y, Z0 + v * perUnit + 1.1, String(v), 3, "lo"));
    return `<g data-scale="${unit}" class="ws-scale">${L(seg([spine, y, Z0], [spine, y, Z0 + max * perUnit]), { tone: "mid" })}${L(minor.join(""), { tone: "lo" })}${L(major.join(""), { tone: "lo" })}${nums.join("")}${text(spine + side * 7, y, Z0 + MAX_C * PER_C + 8, unit === "c" ? "°C" : "°F", 3.6, "lo")}</g>`;
  };
  out.push(scale("c", -1, 10, 5, MAX_C, PER_C));
  out.push(scale("f", 1, 20, 5, 360, PER_C / 1.8));
  out.push("</g>");
  // board screws and the hanging hole
  out.push(D([[BOARD.x + 1.6, FOOT_TOP + 20], [BOARD.x + BOARD.w - 1.6, FOOT_TOP + 20], [BOARD.x + 1.6, BOARD_TOP - 2], [BOARD.x + BOARD.w - 1.6, BOARD_TOP - 2]].map(([x, z]) => at([x, FACE, z])), { size: 0.5 }));
  return out.join("");
}

function thermometerFront() {
  const out = [];
  // bulb: a small vertical capsule tangent to the board
  const by = FACE + 2.6;
  out.push(`<g data-part="bulb" class="c-copper">${S(k.cylinder(TUBE_X, by, 2.6, Z0 - 12, 7, P, 24, 0.4), { tone: "hi", crease: "lo" })}</g>`);
  out.push(`<g data-part="column" class="c-copper"></g>`);
  out.push(`<g data-part="minidx" class="c-index">${S(k.slabOf({ x: TUBE_X - 1.9, y: FACE + 0.2, w: 3.8, d: 2.8, r: 0.5 }, Z0 - 1.6, 1.6, P, 2), { tone: "hi", crease: "none" })}</g>`);
  out.push(`<g data-part="maxidx" class="c-index">${S(k.slabOf({ x: TUBE_X - 1.9, y: FACE + 0.2, w: 3.8, d: 2.8, r: 0.5 }, Z0, 1.6, P, 2), { tone: "hi", crease: "none" })}</g>`);
  out.push(`<path data-part="hand" class="iso-line" data-tone="lit" data-free="end" d="" style="stroke-width:1"/>`);
  return out.join("");
}

function selector() {
  const out = [`<path class="iso-halo" d="${k.haloOf(SEL, 0, SEL_H, P)}" style="filter:blur(4px)"/>`];
  out.push(S(k.slabOf(SEL, 0, SEL_H, P, 4, 0.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(SEL, 3), SEL_H, P, 4), { tone: "faint" }));
  out.push(D(k.corners(SEL, 4).map(([x, y]) => at([x, y, SEL_H])), { size: 0.5 }));
  // knurled knob
  out.push(S(k.cylinder(KNOB.cx, KNOB.cy, KNOB.r + 1, SEL_H, 1.4, P, 36), { tone: "lo" }));
  out.push(S(k.cylinder(KNOB.cx, KNOB.cy, KNOB.r, SEL_H + 1.4, KNOB_TOP - SEL_H - 1.4, P, 36, 0.5), { tone: "mid" }));
  out.push(L(k.knurl(KNOB.cx, KNOB.cy, KNOB.r, SEL_H + 1.6, KNOB_TOP - 0.4, 24, P), { tone: "lo" }));
  // three positions, each a tick and a coloured seat
  const marks = [];
  for (const w of WORLDS) {
    const a = (SEL_ANGLE[w] * Math.PI) / 180;
    const dir = [Math.sin(a), -Math.cos(a)];
    marks.push(k.lineOnTop([KNOB.cx + dir[0] * (KNOB.r + 2.6), KNOB.cy + dir[1] * (KNOB.r + 2.6)], [KNOB.cx + dir[0] * (KNOB.r + 5), KNOB.cy + dir[1] * (KNOB.r + 5)], SEL_H, P));
    const c = at([KNOB.cx + dir[0] * (KNOB.r + 8), KNOB.cy + dir[1] * (KNOB.r + 8), SEL_H]);
    out.push(`<circle class="ws-seat" data-seat="${w}" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="2.1"/>`);
  }
  out.push(L(marks.join(""), { tone: "mid" }));
  out.push(L(k.ring(KNOB.cx, KNOB.cy, KNOB.r + 2.6, SEL_H, P, 40), { tone: "lo" }));
  out.push(`<path data-part="pointer" class="iso-line" data-tone="lit" data-free="end" d="" style="stroke-width:1.2"/>`);
  out.push(D([at([KNOB.cx, KNOB.cy, KNOB_TOP])], { size: 0.8, tone: "hi" }));
  return out.join("");
}

function svgFor(t) {
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: t.aria,
    body: [plate(), dosimeter(), shields(), tray(), `<g data-part="tokens">${tokens()}</g>`, thermometerBack(), thermometerFront(), selector()],
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
.c-cream{--anatomy-paper:#8f8777;--anatomy-top:#FFF2D7;--anatomy-shade-0:#8f8777;--anatomy-shade-1:#aba28e;--anatomy-shade-2:#c5bba5;--anatomy-shade-3:#dfd4bc;--anatomy-hi:#fffaf0;--anatomy-lo:#6d665a;--anatomy-mid:#6d665a;--anatomy-dot:#4a453c}
.c-sulfur{--anatomy-paper:#7b8131;--anatomy-top:#E4ED83;--anatomy-shade-0:#7b8131;--anatomy-shade-1:#959c3f;--anatomy-shade-2:#adb54f;--anatomy-shade-3:#c6cf62;--anatomy-hi:#fbffd2;--anatomy-lo:#5b6022;--anatomy-dot:#3d4016}
.c-index{--anatomy-paper:#0c1d21;--anatomy-top:#183A3A;--anatomy-shade-0:#0c1d21;--anatomy-shade-1:#10272a;--anatomy-shade-2:#143033;--anatomy-shade-3:#183A3A;--anatomy-hi:#FFF2D7;--anatomy-lo:#FFF2D7;--anatomy-dot:#FFF2D7}
.c-moon{--anatomy-paper:#4a463d;--anatomy-top:#8f8777;--anatomy-shade-0:#4a463d;--anatomy-shade-1:#5a554a;--anatomy-shade-2:#6d665a;--anatomy-shade-3:#7d7668;--anatomy-hi:#FFF2D7;--anatomy-lo:#3a372f;--anatomy-dot:#FFF2D7}
.c-ink{--anatomy-paper:#0c1d21;--anatomy-shade-0:#0a181b;--anatomy-shade-3:#0c1d21}
.ws-lamp{fill:#E4ED83;transition:opacity .2s}
.ws-seat{stroke:#101F24;stroke-width:.5px;vector-effect:non-scaling-stroke}
.ws-seat[data-seat="earth"]{fill:#E8A080}.ws-seat[data-seat="moon"]{fill:#FFF2D7}.ws-seat[data-seat="mars"]{fill:#C1440E}
.ws-shield{transition:opacity .45s}
.ws-scale{transition:opacity .3s}
.ws-scale[data-on="false"]{opacity:.38}
.ws-scale[data-on="true"] .iso-face-text{fill:#183A3A}
.iso-page{width:min(760px,100% - 24px);margin:12px auto 16px}
.iso-figure{margin:0}
.iso-plate{padding:40px 12px 16px}
.iso-plate-corners{inset:14px 14px auto 14px;height:12px}
.iso-plate-corner[data-corner="title"]{white-space:normal;text-align:right;max-width:70%}
.sm-hint{margin:10px 2px 0;color:var(--anatomy-text);font-size:13px;line-height:1.5}
.sm-readout{margin:8px 2px 0;color:var(--anatomy-strong);font-family:var(--anatomy-mono);font-size:12.5px;line-height:1.5;font-variant-numeric:tabular-nums;min-height:4.5em;overflow-wrap:anywhere}
.sm-readout span{display:block}
.sm-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.sm-seg{display:inline-flex;flex-wrap:wrap;gap:0;border:1px solid var(--anatomy-lo)}
.sm-btn{min-height:44px;min-width:44px;padding:0 14px;border:0;background:transparent;color:var(--anatomy-text);font:600 13px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.sm-seg .sm-btn[aria-pressed="true"]{background:#E8A080;color:#101F24}
.sm-seg .sm-btn[data-world="moon"][aria-pressed="true"]{background:#FFF2D7}
.sm-seg .sm-btn[data-world="mars"][aria-pressed="true"]{background:#C1440E;color:#FFF2D7}
.sm-seg.sm-units .sm-btn[aria-pressed="true"]{background:#FFF2D7;color:#101F24}
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
const LANG = T.lang;
const C = ${JSON.stringify({ TRAY_H, DROP, TUBE_X, Z0, PER_C, COL_PLAN, FACE, FOOT_FACE, CLOCK, KNOB, KNOB_TOP, SEL_ANGLE, WIN, BODY_FACE })};
const WORLDS = ["earth", "moon", "mars"];
const svg = document.querySelector(".iso-stage svg");
const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
const toks = [...svg.querySelectorAll("[data-tok]")];
const column = $("column"), bulb = $("bulb"), maxIdx = $("maxidx"), minIdx = $("minidx"), hand = $("hand"), pointer = $("pointer"), lamp = $("lamp");
const counter = $("counter").querySelector("text");
const shieldsEl = Object.fromEntries(WORLDS.map((w) => [w, svg.querySelector('[data-shield="' + w + '"]')]));
const scales = [...svg.querySelectorAll("[data-scale]")];
const lines = [...document.querySelectorAll("[data-readout] span")];
const yearBtn = document.querySelector("[data-run='year']"), dayBtn = document.querySelector("[data-run='day']");
const worldBtns = [...document.querySelectorAll("[data-world]")], doseBtns = [...document.querySelectorAll("[data-dose]")], tempBtns = [...document.querySelectorAll("[data-temp]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const fmt = (v, d) => v.toLocaleString(LANG, { minimumFractionDigits: d, maximumFractionDigits: d });
const at = (p) => iso(p, P);
const YEAR_S = 6.5, DAY_S = 7.5, FALL = 0.06;
const PEAK = 14 / 24, LOW = 5 / 24;
// illustrative day shape: lowest before dawn, highest after noon; only the amplitude is data
function shape(f) {
  const h = ((f % 1) + 1) % 1;
  if (h >= LOW && h <= PEAK) return 0.5 - 0.5 * Math.cos(Math.PI * (h - LOW) / (PEAK - LOW));
  const span = 1 - (PEAK - LOW);
  const s = ((h - PEAK + 1) % 1) / span;
  return 0.5 + 0.5 * Math.cos(Math.PI * s);
}
const params = new URLSearchParams(location.search);
const first = WORLDS.includes(params.get("world")) ? params.get("world") : "mars";
const state = {
  world: first, dose: "year", temp: "c",
  year: { run: false, p: 1 + FALL }, day: { run: false, f: PEAK, hi: 1, lo: 0 },
  swing: NUM.swing[first], knob: C.SEL_ANGLE[first],
};
const fmtDose = (v, unit) => unit === "year" ? fmt(v, v < 10 ? 1 : 0) : fmt(v, v < 0.1 ? 4 : 2);
const fmtTemp = (dc) => fmt(state.temp === "c" ? dc : dc * 1.8, 1);
const tu = () => (state.temp === "c" ? "°C" : "°F");
function tokenWord(n) { return n === 1 ? T.token1 : T.tokensN; }
function draw() {
  const w = state.world, N = NUM.tokens[w];
  // tokens
  const p = state.year.p;
  for (let i = 0; i < toks.length; i++) {
    const el = toks[i];
    if (i >= N) { if (el.style.display !== "none") el.style.display = "none"; continue; }
    const ti = (i + 0.5) / N;
    const f = Math.min(1, Math.max(0, (p - ti) / FALL));
    if (p < ti) { if (el.style.display !== "none") el.style.display = "none"; continue; }
    el.style.display = "";
    const e = 1 - (1 - f) * (1 - f);
    el.setAttribute("transform", f >= 1 ? "" : translateAlong(P, [0, 0, C.DROP * (1 - e)]));
    el.style.opacity = f >= 1 ? "" : String(Math.min(1, f * 3));
  }
  const landed = toks.slice(0, N).filter((_, i) => p >= (i + 0.5) / N).length;
  const yp = Math.min(1, p);
  // counter: cumulative dose during the year run, the rate otherwise
  const counted = state.year.run ? NUM.dose[w] * yp : (state.dose === "year" ? NUM.dose[w] : NUM.daily[w]);
  const shownUnit = state.year.run ? "year" : state.dose;
  const ct = fmtDose(counted, shownUnit);
  if (counter.textContent !== ct) counter.textContent = ct;
  lamp.style.opacity = state.year.run ? String(0.45 + 0.55 * (Math.floor(p * 180) % 2)) : "1";
  for (const x of WORLDS) shieldsEl[x].style.opacity = x === w ? "1" : "0";
  // thermometer
  const A = state.swing;
  const rel = A * shape(state.day.f);
  const h = Math.max(0.01, (rel + 0) * C.PER_C) + 10;
  column.innerHTML = solidSvg(slabOf(C.COL_PLAN, C.Z0 - 10, h, P, 2), { tone: "hi", crease: "none" });
  const cls = w === "earth" ? "c-copper" : w === "moon" ? "c-moon" : "c-rust";
  column.setAttribute("class", cls); bulb.setAttribute("class", cls);
  maxIdx.setAttribute("transform", translateAlong(P, [0, 0, A * state.day.hi * C.PER_C]));
  minIdx.setAttribute("transform", translateAlong(P, [0, 0, A * state.day.lo * C.PER_C]));
  const a = Math.PI / 2 - state.day.f * Math.PI * 2, y = C.FOOT_FACE + 0.9;
  hand.setAttribute("d", pathOf([at([C.CLOCK.x, y, C.CLOCK.z]), at([C.CLOCK.x + (C.CLOCK.r - 0.8) * Math.cos(a), y, C.CLOCK.z + (C.CLOCK.r - 0.8) * Math.sin(a)])]));
  scales.forEach((g) => g.setAttribute("data-on", String(g.dataset.scale === state.temp)));
  // selector knob
  const ka = state.knob * Math.PI / 180, dir = [Math.sin(ka), -Math.cos(ka)];
  pointer.setAttribute("d", lineOnTop([C.KNOB.cx, C.KNOB.cy], [C.KNOB.cx + dir[0] * (C.KNOB.r - 1), C.KNOB.cy + dir[1] * (C.KNOB.r - 1)], C.KNOB_TOP, P));
  // readout
  let l1;
  if (state.year.run) l1 = T.radRun.replace("{d}", String(Math.max(1, Math.ceil(yp * 365)))).replace("{dose}", fmtDose(NUM.dose[w] * yp, "year")).replace("{n}", String(landed)).replace("{tokens}", tokenWord(landed));
  else l1 = T.radRest.replace("{world}", T.worlds[w]).replace("{dose}", fmtDose(state.dose === "year" ? NUM.dose[w] : NUM.daily[w], state.dose)).replace("{unit}", state.dose === "year" ? T.perYear : T.perDay).replace("{note}", T.radNote[w]).replace("{n}", String(N)).replace("{tokens}", tokenWord(N));
  let l2;
  if (state.day.run) {
    const mins = Math.floor(state.day.f * 24 * 60) % (24 * 60);
    const hh = String(Math.floor(mins / 60)).padStart(2, "0") + ":" + String(Math.floor((mins % 60) / 15) * 15).padStart(2, "0");
    l2 = T.tempRun.replace("{h}", hh).replace("{v}", fmtTemp(rel)).replace("{tu}", tu());
  } else l2 = T.tempRest.replace("{dt}", fmtTemp(NUM.swing[w])).replace("{tu}", tu()).replace("{note}", T.tempNote[w]).replace("{len}", T.dayLen[w]);
  if (lines[0].textContent !== l1) lines[0].textContent = l1;
  if (lines[1].textContent !== l2) lines[1].textContent = l2;
  yearBtn.disabled = state.year.run; dayBtn.disabled = state.day.run;
  worldBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.world === w)));
  doseBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.dose === state.dose)));
  tempBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.temp === state.temp)));
}
const follow = (v, to, dt, tau, calm) => (calm ? to : v + (to - v) * (1 - Math.exp(-dt / tau)));
let frame = 0, last = 0, visible = false, touring = !still.matches, tourClock = 0, tourStep = 0;
const TOUR = [["year", 1.5], ["day", 9.5], ["wait", 19]];
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  let moving = false;
  if (touring && !state.year.run && !state.day.run) {
    tourClock += dt;
    const [what, when] = TOUR[tourStep % TOUR.length];
    if (tourClock >= when) {
      if (what === "year") startYear(true);
      if (what === "day") startDay(true);
      tourStep++;
      if (tourStep % TOUR.length === 0) tourClock = 0;
    }
  } else if (touring) tourClock += dt;
  if (state.year.run) {
    state.year.p = calm ? 1 + FALL : Math.min(1 + FALL, state.year.p + dt / YEAR_S);
    if (state.year.p >= 1 + FALL) state.year.run = false;
    moving = true;
  }
  if (state.day.run) {
    state.day.f = calm ? 1 : Math.min(1, state.day.f + dt / DAY_S);
    const s = shape(state.day.f);
    state.day.hi = calm ? 1 : Math.max(state.day.hi, s);
    state.day.lo = calm ? 0 : Math.min(state.day.lo, s);
    if (state.day.f >= 1) state.day.run = false;
    moving = true;
  }
  const sw = follow(state.swing, NUM.swing[state.world], dt, 0.25, calm);
  state.swing = Math.abs(sw - NUM.swing[state.world]) < 0.01 ? NUM.swing[state.world] : (moving = true, sw);
  const kn = follow(state.knob, C.SEL_ANGLE[state.world], dt, 0.12, calm);
  state.knob = Math.abs(kn - C.SEL_ANGLE[state.world]) < 0.05 ? C.SEL_ANGLE[state.world] : (moving = true, kn);
  draw();
  frame = visible && (moving || touring) ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } else if (!visible) draw(); };
function startYear(fromTour) {
  if (!fromTour) touring = false;
  if (state.year.run) return;
  state.year.run = true; state.year.p = 0;
  run();
}
function startDay(fromTour) {
  if (!fromTour) touring = false;
  if (state.day.run) return;
  state.day.run = true; state.day.f = 0;
  const s = shape(0); state.day.hi = s; state.day.lo = s;
  run();
}
function pick(w) {
  touring = false;
  state.world = w;
  state.year.run = false; state.year.p = 1 + FALL;
  if (!state.day.run) { state.day.hi = 1; state.day.lo = 0; }
  run();
}
yearBtn.addEventListener("click", () => startYear(false));
dayBtn.addEventListener("click", () => startDay(false));
worldBtns.forEach((b) => b.addEventListener("click", () => pick(b.dataset.world)));
doseBtns.forEach((b) => b.addEventListener("click", () => { touring = false; state.dose = b.dataset.dose; run(); }));
tempBtns.forEach((b) => b.addEventListener("click", () => { touring = false; state.temp = b.dataset.temp; run(); }));
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "80px 0px" }).observe(svg);
still.addEventListener?.("change", () => { if (still.matches) touring = false; run(); });
draw();
`;
}

const chip = (color) => `<span class="sm-chip" style="background:${color}" aria-hidden="true"></span>`;
function fmt(lang, v, d = 1) {
  return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
}
for (const t of STRINGS) {
  const svg = svgFor(t);
  const caption = t.caption
    .replace("{nm}", String(NUM.tokens.mars)).replace("{nl}", String(NUM.tokens.moon))
    .replace("{te}", fmt(t.lang, NUM.swing.earth)).replace("{tm}", fmt(t.lang, NUM.swing.mars)).replace("{tl}", fmt(t.lang, NUM.swing.moon));
  const btn = (attr, value, label, on) => `<button type="button" class="sm-btn" ${attr}="${value}" aria-pressed="${on}">${label}</button>`;
  const L0 = t.live;
  const restRad = L0.radRest.replace("{world}", L0.worlds.mars).replace("{dose}", "230").replace("{unit}", L0.perYear).replace("{note}", L0.radNote.mars).replace("{n}", String(NUM.tokens.mars)).replace("{tokens}", L0.tokensN);
  const restTemp = L0.tempRest.replace("{dt}", fmt(t.lang, NUM.swing.mars)).replace("{tu}", "°C").replace("{note}", L0.tempNote.mars).replace("{len}", L0.dayLen.mars);
  const body = `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 2</span><span class="iso-plate-corner" data-corner="title">${t.title}</span></div>
<div class="iso-stage" role="img" aria-label="${t.aria}">${svg}</div>
<p class="sm-hint">${t.hint}</p>
<div class="sm-controls"><div class="sm-seg" role="group" aria-label="${t.worldLabel}">${["earth", "moon", "mars"].map((w) => btn("data-world", w, t.worlds[w], w === "mars")).join("")}</div><button type="button" class="sm-btn sm-scan" data-run="year">${t.year}</button><button type="button" class="sm-btn sm-scan" data-run="day">${t.day}</button></div>
<div class="sm-controls"><div class="sm-seg sm-units" role="group" aria-label="${t.doseLabel}">${btn("data-dose", "year", t.perYear, true)}${btn("data-dose", "day", t.perDay, false)}</div><div class="sm-seg sm-units" role="group" aria-label="${t.tempLabel}">${btn("data-temp", "c", "°C", true)}${btn("data-temp", "f", "°F", false)}</div></div>
<p class="sm-readout" data-readout aria-live="polite"><span>${restRad}</span><span>${restTemp}</span></p></div>
<figcaption class="iso-legend"><span class="sm-keys"><span class="sm-key">${chip("#E4ED83")}${t.keys.token}</span><span class="sm-key">${chip("#FFF2D7")}${t.keys.sheet}</span><span class="sm-key">${chip("#E8A080")}${t.keys.coil}</span><span class="sm-key"><span class="sm-chip" style="background:#183A3A;border-color:#FFF2D7" aria-hidden="true"></span>${t.keys.index}</span></span><span class="iso-caption">${caption}</span><span class="sm-foot">${t.footer}</span></figcaption></figure>`;
  let html = k.pageHtml({ title: t.title, theme: "dark", body, script: kitScript() + live(t), width: 760 });
  html = html.replace('<html lang="en">', `<html lang="${t.lang}">`).replace("</style></head>", `${EXTRA_CSS}</style></head>`);
  const file = join(OUT, `weather-station-${t.lang}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, html.length);
}
