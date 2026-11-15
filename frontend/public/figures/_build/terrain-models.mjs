// Maquetas de terreno a 30 m — Anatomy figure (MIT kit), built for es / pt / en.
// Shape: terrain-heights-40.json (real 6 x 6 km windows, 150 m block means of the 30 m grids).
// Numbers: compare-<h3>.json (W1, 95 % CI, KS, medians at 30 m). Nothing else is shown.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { STRINGS, NAMES, DATASETS } from "./terrain-models-strings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");
const TERRAIN = JSON.parse(readFileSync(join(HERE, "terrain-heights-40.json"), "utf8"));
const W = TERRAIN.windows;
const GRID = TERRAIN.grid;
const CELL_M = TERRAIN.cell_m;
if (GRID !== 40 || CELL_M !== 150 || TERRAIN.window_m !== 6000) throw new Error("unexpected terrain shape");

const EARTH = ["83b224fffffffff", "control_yungay", "83b220fffffffff", "83b225fffffffff", "83b221fffffffff"];
const DEFAULT = EARTH[0];
const STATS = {};
let YUNGAY_W1 = null;
for (const cell of EARTH) {
  if (cell === "control_yungay") continue;
  const d = JSON.parse(readFileSync(join(HERE, `../../data/local/compare-${cell}.json`), "utf8"));
  const sd = d.statistical_distribution;
  const s = sd.slope_distribution;
  const s0 = sd.scale_sensitivity[0];
  if (s0.resolution_m !== 30 || sd.common_resolution_m !== 30) throw new Error("expected 30 m first");
  STATS[cell] = { w1: s.wasserstein_distance, ci: s.w1_ci_95, ks: s.ks_statistic, medE: s0.earth_slope_median_deg, medJ: s0.planetary_slope_median_deg };
  if (YUNGAY_W1 === null) YUNGAY_W1 = s.control_yungay_w1;
  else if (YUNGAY_W1 !== s.control_yungay_w1) throw new Error("control W1 differs between files");
}
STATS.control_yungay = { w1: YUNGAY_W1, ci: null, ks: null, medE: null, medJ: STATS[DEFAULT].medJ };

// ---- world: 1 unit = 50 m horizontally; heights x VE ----
const M_PER_UNIT = 50;
const VE = 4;
const ZPM = VE / M_PER_UNIT; // units per metre of relief
const STEP = CELL_M / M_PER_UNIT; // 3 units between block centres
const HALF = ((GRID - 1) * STEP) / 2; // 58.5
const LAYERS = 10;
const MAT = { x: -84, y: -84, w: 168, d: 168, r: 6 };
const MAT_H = 2.4;
const PLINTH = { x: -70, y: -70, w: 140, d: 140, r: 3 };
const PL_H = 12;
const BOARD = { x: -60, y: -60, w: 120, d: 120, r: 0.8 }; // exactly 6 km
const BOARD_H = 2;
const Z0 = PL_H + BOARD_H;
const POST = { x: -68.5, y: -68.5, w: 4.5, d: 4.5, r: 0.6 };
const BAR = { x: -60, y: 62.5, w: 120, d: 3.6 };
const WIDTH = 360;

const maxRelief = Math.max(...Object.values(W).map((w) => w.relief_m));
const postTop = (relief) => Z0 + Math.max(100, Math.ceil(relief / 100) * 100) * ZPM;
const fitPts = [...k.boxCorners(MAT, -MAT_H, 0), ...k.boxCorners(BOARD, 0, Z0 + maxRelief * ZPM), [POST.x, POST.y, postTop(maxRelief) + 2]];
const P = k.fitProjection(fitPts, WIDTH, 900, { pad: 10, azimuth: 45 });
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const RISE = k.screenRise(1, P);
const [VX, VY] = k.towardViewer(P);
const { sinA, cosA } = k.cameraOf(P);
const bottomY = Math.max(...k.boxCorners(MAT, -MAT_H, 0).map((p) => at(p)[1])) + 12;
const topYOf = (relief) => Math.min(at([BOARD.x, BOARD.y, Z0 + relief * ZPM])[1], at([POST.x, POST.y, postTop(relief) + 1.5])[1], at([MAT.x, MAT.y, 0])[1]) - 10;

// ---- contours: marching squares on the 40 x 40 grid, region = {h >= level} ----
function contours(H, level) {
  const n = GRID;
  const val = (r, c) => (r < 0 || c < 0 || r >= n || c >= n ? -1e9 : H[r][c]);
  const wx = (c) => -HALF + c * STEP;
  const wy = (r) => -HALF + r * STEP;
  const lerp = (a, b, va, vb) => a + (b - a) * Math.min(1, Math.max(0, (level - va) / (vb - va)));
  const pointOf = (key) => {
    const [t, r, c] = key.split(":");
    const R = +r, C = +c;
    if (t === "h") {
      const a = val(R, C), b = val(R, C + 1);
      const ca = Math.min(n - 1, Math.max(0, C)), cb = Math.min(n - 1, Math.max(0, C + 1));
      return [lerp(wx(ca), wx(cb), a, b), wy(Math.min(n - 1, Math.max(0, R)))];
    }
    const a = val(R, C), b = val(R + 1, C);
    const ra = Math.min(n - 1, Math.max(0, R)), rb = Math.min(n - 1, Math.max(0, R + 1));
    return [wx(Math.min(n - 1, Math.max(0, C))), lerp(wy(ra), wy(rb), a, b)];
  };
  const segs = [];
  for (let r = -1; r < n; r++) {
    for (let c = -1; c < n; c++) {
      const v0 = val(r, c), v1 = val(r, c + 1), v2 = val(r + 1, c + 1), v3 = val(r + 1, c);
      const code = (v0 >= level ? 1 : 0) | (v1 >= level ? 2 : 0) | (v2 >= level ? 4 : 0) | (v3 >= level ? 8 : 0);
      if (code === 0 || code === 15) continue;
      const e = [`h:${r}:${c}`, `v:${r}:${c + 1}`, `h:${r + 1}:${c}`, `v:${r}:${c}`];
      const centre = ([v0, v1, v2, v3].filter((v) => v > -1e8).reduce((a, b) => a + b, 0) / Math.max(1, [v0, v1, v2, v3].filter((v) => v > -1e8).length)) >= level;
      const T = {
        1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]],
        11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[3, 0]],
        5: centre ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]],
        10: centre ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]],
      }[code];
      for (const [a, b] of T) segs.push([e[a], e[b]]);
    }
  }
  const byKey = new Map();
  segs.forEach(([a, b], i) => {
    for (const key of [a, b]) {
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(i);
    }
  });
  const used = new Uint8Array(segs.length);
  const loops = [];
  for (let s = 0; s < segs.length; s++) {
    if (used[s]) continue;
    used[s] = 1;
    const keys = [segs[s][0]];
    let cur = segs[s][1];
    while (cur !== keys[0]) {
      keys.push(cur);
      const next = byKey.get(cur).find((i) => !used[i]);
      if (next === undefined) break;
      used[next] = 1;
      cur = segs[next][0] === cur ? segs[next][1] : segs[next][0];
    }
    const pts = dedupe(keys.map(pointOf));
    if (pts.length >= 3 && Math.abs(area(pts)) > 1.2) loops.push(simplify(pts, 0.35));
  }
  return loops.filter((p) => p.length >= 3);
}
function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-3) out.push(p);
  }
  if (out.length > 1 && Math.hypot(out[0][0] - out.at(-1)[0], out[0][1] - out.at(-1)[1]) < 1e-3) out.pop();
  return out;
}
function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0], [bx, by] = pts.at(-1);
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let best = -1, at = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
    if (d > best) { best = d; at = i; }
  }
  if (best <= tol) return [pts[0], pts.at(-1)];
  return [...dp(pts.slice(0, at + 1), tol).slice(0, -1), ...dp(pts.slice(at), tol)];
}
function simplify(pts, tol) {
  let far = 0, fd = -1;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]);
    if (d > fd) { fd = d; far = i; }
  }
  const a = dp(pts.slice(0, far + 1), tol);
  const b = dp([...pts.slice(far), pts[0]], tol);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}
function sampler(H) {
  return (x, y) => {
    const gc = (x + HALF) / STEP, gr = (y + HALF) / STEP;
    if (gc < 0 || gr < 0 || gc > GRID - 1 || gr > GRID - 1) return -Infinity;
    const c = Math.min(GRID - 2, Math.floor(gc)), r = Math.min(GRID - 2, Math.floor(gr));
    const u = gc - c, v = gr - r;
    return (H[r][c] * (1 - u) + H[r][c + 1] * u) * (1 - v) + (H[r + 1][c] * (1 - u) + H[r + 1][c + 1] * u) * v;
  };
}

// One contour layer: depth-sorted front-facing walls (four tones by facing, runs merged), then the top.
let PATHS = 0;
function layerSvg(H, i, relief, pal) {
  const lv = (j) => (relief * j) / LAYERS;
  const zb = Z0 + lv(i) * ZPM, zt = Z0 + lv(i + 1) * ZPM;
  const loops = contours(H, lv(i));
  const h = sampler(H);
  const walls = [];
  for (const loop of loops) {
    for (let j = 0; j < loop.length; j++) {
      const [ax, ay] = loop[j], [bx, by] = loop[(j + 1) % loop.length];
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 1e-6) continue;
      let nx = (by - ay) / len, ny = -(bx - ax) / len;
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      if (h(mx + nx * 0.6, my + ny * 0.6) > h(mx - nx * 0.6, my - ny * 0.6)) { nx = -nx; ny = -ny; }
      if (nx * VX + ny * VY <= 1e-9) continue;
      const lit = (nx * -sinA + ny * cosA + 1) / 2;
      const shade = Math.min(3, Math.max(0, Math.floor(lit * 4)));
      const quad = k.pathOf([at([ax, ay, zt]), at([bx, by, zt]), at([bx, by, zb]), at([ax, ay, zb])], true);
      walls.push({ depth: k.depthOf([mx, my, (zt + zb) / 2], P), shade, quad });
    }
  }
  walls.sort((a, b) => a.depth - b.depth);
  const runs = [];
  for (const w of walls) {
    const last = runs[runs.length - 1];
    if (last && last.shade === w.shade) last.d += w.quad;
    else runs.push({ shade: w.shade, d: w.quad });
  }
  const top = loops.map((loop) => k.pathOf(loop.map(([x, y]) => at([x, y, zt])), true)).join("");
  PATHS += runs.length + 2;
  return `<g class="tm-l tm-${pal}${i}" data-i="${i}">${runs.map((r) => `<path class="tm-w" data-shade="${r.shade}" d="${r.d}"/>`).join("")}<path class="tm-top" d="${top}"/><path class="iso-line iso-edge tm-edge" d="${top}"/></g>`;
}
const modelLayers = (cell, pal) => Array.from({ length: LAYERS }, (_, i) => layerSvg(W[cell].heights_rel_m, i, W[cell].relief_m, pal));

// Vertical rule at the back corner: same exaggeration on both plinths, a seam every 100 m.
function postSvg(relief) {
  const zt = postTop(relief);
  const marks = [];
  for (let m = 0; Z0 + m * ZPM <= zt + 1e-6; m += 100) marks.push(m);
  const minor = marks.filter((m) => m % 500).map((m) => k.sideSeam(POST, Z0 + m * ZPM, P, 2)).join("");
  const major = marks.filter((m) => m % 500 === 0).map((m) => k.sideSeam(POST, Z0 + m * ZPM, P, 2)).join("");
  return [
    S(k.slabOf(k.insetPlan(POST, -1.2), PL_H, 1.2, P, 3, 0.3), { tone: "mid" }),
    S(k.slabOf(POST, PL_H + 1.2, zt - PL_H - 1.2, P, 2, 0.3), { tone: "mid", inner: L(minor, { tone: "lo" }) + L(major, { tone: "hi" }) }),
    S(k.cylinder(POST.x + POST.w / 2, POST.y + POST.d / 2, 1.4, zt, 1.2, P, 16), { tone: "mid" }),
  ].join("");
}

// Plinth, mat and everything that sits behind the model.
function benchBack() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(MAT, -MAT_H, MAT_H, P)}" style="filter:blur(6px)"/>`);
  out.push(S(k.slabOf(MAT, -MAT_H, MAT_H, P, 8, 0.6), { tone: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(MAT, 4), 0, P), { tone: "faint" }));
  const ms = k.corners(MAT, 8);
  out.push(L(ms.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(ms.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  out.push(`<path class="iso-halo" d="${k.haloOf(PLINTH, 0, PL_H, P)}" style="filter:blur(4px)"/>`);
  const strata = [3, 6, 9].map((z) => k.sideSeam(PLINTH, z, P, 4)).join("");
  out.push(S(k.slabOf(PLINTH, 0, PL_H, P, 4, 1), { tone: "mid", inner: L(strata, { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(PLINTH, 3), PL_H, P, 4), { tone: "faint" }));
  // label plate on the front-left face (x-z plane at y = PLINTH max)
  const fy = PLINTH.y + PLINTH.d;
  const lp = [[-48, 3], [-14, 3], [-14, 9], [-48, 9]];
  out.push(cardXZ(lp, fy + 0.5, 0.5));
  out.push(L([5, 7].map((z, j) => k.segment([-45, fy + 0.6, z], [j ? -26 : -17, fy + 0.6, z], P)).join(""), { tone: "faint", free: true }));
  out.push(D([at([-46.5, fy + 0.6, 6]), at([-15.5, fy + 0.6, 6])], { size: 0.4 }));
  // screws on the front-right face (y-z plane at x = PLINTH max)
  const fx = PLINTH.x + PLINTH.w;
  out.push(D([-50, -10, 30].map((y) => at([fx, y, PL_H / 2])), { size: 0.5 }));
  // top corner screws (the back one is under the vertical rule)
  const pc = k.corners(PLINTH, 5).filter(([x, y]) => !(x < 0 && y < 0));
  out.push(L(pc.map(([x, y]) => k.ring(x, y, 1.6, PL_H, P, 14)).join(""), { tone: "lo" }));
  out.push(D(pc.map(([x, y]) => at([x, y, PL_H])), { size: 0.45 }));
  return out.join("");
}
function cardXZ(pts, y, depth) {
  const xz = (yy) => k.pathOf(pts.map(([x, z]) => at([x, yy, z])), true);
  return `<g class="iso-solid"><path class="iso-fill" d="${xz(y - depth)}"/><path class="iso-line iso-edge" data-tone="lo" d="${xz(y - depth)}"/><path class="iso-fill" d="${xz(y)}"/><path class="iso-shade" data-shade="2" d="${xz(y)}"/><path class="iso-line iso-edge" data-tone="mid" d="${xz(y)}"/></g>`;
}
const boardSvg = () => S(k.slabOf(BOARD, PL_H, BOARD_H, P, 2, 0.3), { tone: "lo" });

// Scale bar, registration pins and the engraved label: all in front of the model.
function benchFront() {
  const out = [];
  out.push(S(k.slabOf({ ...BAR, r: 0.4 }, PL_H, 0.5, P, 2), { tone: "lo", crease: "none" }));
  for (let s = 0; s < 6; s++) {
    if (s % 2) continue;
    out.push(`<g class="tm-bar">${S(k.slabOf({ x: BAR.x + s * 20 + 0.4, y: BAR.y + 0.4, w: 19.2, d: BAR.d - 0.8, r: 0.2 }, PL_H + 0.5, 0.3, P, 1), { tone: "hi", crease: "none" })}</g>`);
  }
  const ticks = [];
  for (let s = 0; s <= 6; s++) ticks.push(k.lineOnTop([BAR.x + s * 20, BAR.y + BAR.d], [BAR.x + s * 20, BAR.y + BAR.d + (s % 3 ? 1.4 : 2.4)], PL_H, P));
  out.push(L(ticks.join(""), { tone: "mid" }));
  out.push(k.faceTextSvg(k.topMatrix([BAR.x + 120, BAR.y + BAR.d + 3.1], PL_H, P), "6 km", { size: 3.4, tone: "hi", anchor: "end" }));
  for (const [x, y] of [[-64.5, 64.5], [64.5, -64.5], [64.5, 64.5]]) {
    out.push(S(k.cylinder(x, y, 1.7, PL_H, 0.6, P, 16), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 1.1, PL_H + 0.6, 2.4, P, 14), { tone: "mid" }));
  }
  return out.join("");
}

function svgOf({ label, part, layers, relief, frame = relief }) {
  const y0 = topYOf(frame);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="iso-svg" viewBox="0 ${y0.toFixed(1)} ${WIDTH} ${(bottomY - y0).toFixed(1)}" role="img" aria-label="${label}">${benchBack()}<g data-part="${part}-post">${postSvg(relief)}</g>${boardSvg()}<g data-part="${part}-layers">${layers.join("")}</g>${benchFront()}</svg>`;
}

// ---- palettes: layer colour climbs from the base to the top; walls take four tones by facing ----
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const toHex = (a) => "#" + a.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * t));
const ramp = (stops, t) => {
  const s = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
  return mix(stops[s], stops[s + 1], t * (stops.length - 1) - s);
};
function paletteCss(name, stops, edgeTo, edgeT) {
  let css = "";
  for (let i = 0; i < LAYERS; i++) {
    const top = ramp(stops, i / (LAYERS - 1));
    const w = [0.5, 0.6, 0.7, 0.82].map((f) => mix("#101F24", top, f));
    css += `.tm-${name}${i}{--tm-top:${top};--tm-w0:${w[0]};--tm-w1:${w[1]};--tm-w2:${w[2]};--tm-w3:${w[3]};--tm-edge:${mix(top, edgeTo, edgeT)}}`;
  }
  return css;
}
const EXTRA_CSS = `
.iso{--anatomy-page:#101F24;--anatomy-card:#13292d;--anatomy-text:#d9cfb8;--anatomy-strong:#FFF2D7;--anatomy-muted:#93a79f;
--anatomy-paper:#13292d;--anatomy-face:#1f4545;--anatomy-top:#24504f;
--anatomy-shade-0:#112a2c;--anatomy-shade-1:#163333;--anatomy-shade-2:#1b3d3d;--anatomy-shade-3:#204646;
--anatomy-lit-top:#2b5b59;--anatomy-lit-shade:#1f4545;
--anatomy-hi:#FFF2D7;--anatomy-mid:#a9a690;--anatomy-lo:#62807a;--anatomy-faint:#35595a;--anatomy-lit:#E4ED83;
--anatomy-halo:#050d0f;--anatomy-dot:#FFF2D7}
${paletteCss("j", ["#5a1f06", "#94350b", "#C1440E", "#d97a52", "#E8A080"], "#FFF2D7", 0.45)}
${paletteCss("e", ["#6d665a", "#9b927f", "#c5bba5", "#e6dcc3", "#FFF2D7"], "#183A3A", 0.42)}
.tm-w,.tm-top{stroke:none}
.tm-w[data-shade="0"]{fill:var(--tm-w0)}.tm-w[data-shade="1"]{fill:var(--tm-w1)}.tm-w[data-shade="2"]{fill:var(--tm-w2)}.tm-w[data-shade="3"]{fill:var(--tm-w3)}
.tm-top{fill:var(--tm-top);fill-rule:evenodd}
.iso-svg .tm-edge{stroke:var(--tm-edge);stroke-width:.5px;fill:none}
.tm-bar{--anatomy-top:#FFF2D7;--anatomy-paper:#c5bba5;--anatomy-shade-0:#8f8777;--anatomy-shade-1:#aba28e;--anatomy-shade-2:#c5bba5;--anatomy-shade-3:#dfd4bc;--anatomy-hi:#FFF2D7}
.iso-page{width:min(880px,100% - 24px);margin:12px auto 16px}
.iso-figure{margin:0}
.iso-plate{padding:40px 12px 16px}
.iso-plate-corners{inset:14px 14px auto 14px;height:12px}
.iso-plate-corner[data-corner="title"]{white-space:normal;text-align:right;max-width:80%}
.tm-bench{display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;align-items:end}
.tm-model{margin:0;min-width:0}
.tm-model .iso-svg{overflow:hidden}
.tm-cap{margin:2px 4px 0;font-size:12.5px;line-height:1.45;color:var(--anatomy-text);min-height:2.9em}
.tm-cap b{display:block;color:var(--anatomy-strong);font-weight:600}
.tm-exag{margin:8px 2px 0;color:var(--anatomy-muted);font-size:12px;line-height:1.45}
.tm-hint{margin:10px 2px 0;color:var(--anatomy-text);font-size:13px;line-height:1.5}
.tm-seg{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.tm-btn{min-height:44px;min-width:44px;padding:0 14px;border:1px solid var(--anatomy-lo);background:transparent;color:var(--anatomy-text);font:600 13px/1.2 ui-sans-serif,system-ui,sans-serif;cursor:pointer;border-radius:2px}
.tm-btn[aria-pressed="true"]{background:#E8A080;border-color:#E8A080;color:#101F24}
.tm-btn:focus-visible{outline:2px solid #E4ED83;outline-offset:2px}
.tm-readout{margin:12px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(128px,1fr));gap:8px 16px;font-family:var(--anatomy-mono);font-variant-numeric:tabular-nums}
.tm-readout div{min-width:0}
.tm-readout dt{color:var(--anatomy-muted);font-size:11.5px;line-height:1.4}
.tm-readout dd{margin:2px 0 0;color:var(--anatomy-strong);font-size:13px;line-height:1.4}
.tm-readout dd small{display:block;color:var(--anatomy-text);font-size:11.5px}
.tm-verdict{display:inline-flex;align-items:center;min-height:32px;margin-top:12px;padding:6px 12px;font:600 13px/1.3 ui-sans-serif,system-ui,sans-serif;border:1px solid currentColor;border-radius:2px}
.tm-verdict[data-v="closer"]{background:#E4ED83;border-color:#E4ED83;color:#101F24}
.tm-verdict[data-v="farther"]{color:#E8A080}
.tm-verdict[data-v="tie"],.tm-verdict[data-v="control"]{color:#FFF2D7}
.tm-keys{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0}
.tm-key{display:inline-flex;align-items:center;gap:7px}
.tm-chip{width:12px;height:10px;flex:none;border:1px solid #101F24}
.tm-chip[data-c="j"]{background:#C1440E}.tm-chip[data-c="e"]{background:#e6dcc3}.tm-chip[data-c="p"]{background:#a9a690}.tm-chip[data-c="s"]{background:#FFF2D7}
.tm-foot{margin-top:10px;font-size:11.5px;color:var(--anatomy-muted)}
@media (max-width:620px){.tm-bench{grid-template-columns:1fr}.iso-plate{padding:36px 8px 12px}.tm-btn{padding:0 10px}}
`;

// ---- text helpers ----
const num = (lang, v, d = 2) => v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
const fill = (s, map) => s.replace(/\{(\w+)\}/g, (m, key) => (key in map ? map[key] : m));
const chipOf = (cell, lang) => (typeof NAMES[cell].chip === "string" ? NAMES[cell].chip : NAMES[cell].chip[lang]);
const latLon = (t, w) => [
  `${num(t.lang, Math.abs(w.center_lat))}° ${w.center_lat >= 0 ? t.north : t.south}`,
  `${num(t.lang, Math.abs(w.center_lon))}° ${w.center_lon >= 0 ? t.east : t.west}`,
];
function modelCap(t, cell, name) {
  const w = W[cell];
  const [lat, lon] = latLon(t, w);
  return `<b>${name}</b>${fill(t.model, { lat, lon, r: num(t.lang, w.relief_m, 0), n: LAYERS, i: num(t.lang, w.relief_m / LAYERS, 1) })}`;
}
function readoutOf(t, cell) {
  const s = STATS[cell];
  const y = num(t.lang, YUNGAY_W1);
  const w1 = `${num(t.lang, s.w1)}°<small>${s.ci ? `${t.ci} ${num(t.lang, s.ci[0])}–${num(t.lang, s.ci[1])}°` : t.noCi}</small>`;
  const ks = s.ks === null ? t.na : num(t.lang, s.ks);
  const med = `${t.here} ${s.medE === null ? t.na : num(t.lang, s.medE) + "°"}<small>Jezero ${num(t.lang, s.medJ)}°</small>`;
  const rel = `${t.here} ${num(t.lang, W[cell].relief_m, 0)} m<small>Jezero ${num(t.lang, W.mars_jezero_crater.relief_m, 0)} m</small>`;
  let v;
  if (cell === "control_yungay") v = "control";
  else if (s.ci && s.ci[0] <= YUNGAY_W1 && YUNGAY_W1 <= s.ci[1]) v = "tie";
  else v = s.w1 < YUNGAY_W1 ? "closer" : "farther";
  const verdict = fill(t[v], { y });
  const dl = `<div><dt>${t.w1}</dt><dd>${w1}</dd></div><div><dt>${t.ks}</dt><dd>${ks}</dd></div><div><dt>${t.median}</dt><dd>${med}</dd></div><div><dt>${t.relief}</dt><dd>${rel}</dd></div>`;
  return { dl, v, verdict, cap: modelCap(t, cell, chipOf(cell, t.lang)) };
}

function live(t, models, rise) {
  return `
const MODELS = ${JSON.stringify(models)};
const ORDER = ${JSON.stringify(EARTH)};
const RISE = ${rise.toFixed(4)};
const root = document.querySelector(".iso-figure");
const layersG = document.querySelector('[data-part="e-layers"]');
const postG = document.querySelector('[data-part="e-post"]');
const dl = root.querySelector("[data-readout]");
const verdict = root.querySelector("[data-verdict]");
const cap = root.querySelector("[data-ecap]");
const btns = [...root.querySelectorAll("[data-cell]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const NS = "http://www.w3.org/2000/svg";
let current = ${JSON.stringify(DEFAULT)};
let items = [];
let frame = 0;
const ease = (u) => 1 - Math.pow(1 - u, 3);
const easeIn = (u) => u * u;
function make(html) {
  const g = document.createElementNS(NS, "g");
  g.innerHTML = html;
  return g.firstChild;
}
function readout(cell) {
  const m = MODELS[cell];
  if (dl.innerHTML !== m.dl) dl.innerHTML = m.dl;
  verdict.textContent = m.verdict;
  verdict.dataset.v = m.v;
  cap.innerHTML = m.cap;
  btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cell === cell)));
}
function select(cell, animate) {
  if (!MODELS[cell] || cell === current) { readout(current); return; }
  current = cell;
  readout(cell);
  const m = MODELS[cell];
  if (!animate || still.matches) {
    items = [];
    layersG.replaceChildren(...m.layers.map(make));
    postG.innerHTML = m.post;
    postG.style.opacity = "";
    return;
  }
  const now = performance.now();
  const old = [...layersG.children];
  items = items.filter((it) => it.kind === "post");
  old.forEach((el, i) => items.push({ el, kind: "out", start: now + (old.length - 1 - i) * 35, dur: 260, from: Number(el.dataset.y || 0), op: Number(el.style.opacity || 1) }));
  const tIn = now + (old.length - 1) * 35 + 220;
  items.push({ el: postG, kind: "post", start: tIn - 160, dur: 320, html: m.post, swapped: false });
  m.layers.forEach((html, i) => {
    const el = make(html);
    el.style.opacity = "0";
    el.setAttribute("transform", "translate(0 " + (-16 * RISE).toFixed(2) + ")");
    layersG.appendChild(el);
    items.push({ el, kind: "in", start: tIn + i * 70, dur: 460 });
  });
  if (!frame) frame = requestAnimationFrame(tick);
}
function tick(now) {
  items = items.filter((it) => {
    const u = Math.min(1, Math.max(0, (now - it.start) / it.dur));
    if (it.kind === "out") {
      const dz = it.from + 10 * easeIn(u);
      it.el.dataset.y = String(dz);
      it.el.setAttribute("transform", "translate(0 " + (-dz * RISE).toFixed(2) + ")");
      it.el.style.opacity = String(it.op * (1 - u));
      if (u >= 1) { it.el.remove(); return false; }
    } else if (it.kind === "in") {
      const dz = 16 * (1 - ease(u));
      it.el.dataset.y = String(dz);
      it.el.setAttribute("transform", "translate(0 " + (-dz * RISE).toFixed(2) + ")");
      it.el.style.opacity = String(Math.min(1, u * 2.2));
      if (u >= 1) { it.el.removeAttribute("transform"); it.el.style.opacity = ""; delete it.el.dataset.y; return false; }
    } else {
      if (u >= 0.5 && !it.swapped) { it.el.innerHTML = it.html; it.swapped = true; }
      it.el.style.opacity = String(Math.abs(1 - 2 * u));
      if (u >= 1) { it.el.style.opacity = ""; return false; }
    }
    return true;
  });
  frame = items.length ? requestAnimationFrame(tick) : 0;
}
// idle tour: only without ?cell, never under reduced motion, stops on the first touch
const param = new URLSearchParams(location.search).get("cell");
const wanted = param === "yungay" ? "control_yungay" : param;
let touring = !wanted && !still.matches, visible = false, idle = 0;
const stopTour = () => { touring = false; };
btns.forEach((b) => b.addEventListener("click", () => { stopTour(); select(b.dataset.cell, true); }));
root.querySelector("[data-group]").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  e.preventDefault();
  stopTour();
  const i = (ORDER.indexOf(current) + (e.key === "ArrowRight" ? 1 : ORDER.length - 1)) % ORDER.length;
  select(ORDER[i], true);
  btns.find((b) => b.dataset.cell === ORDER[i]).focus();
});
root.addEventListener("pointerdown", stopTour);
new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; }, { rootMargin: "40px 0px" }).observe(root);
setInterval(() => {
  if (!touring || !visible || still.matches || items.length) return;
  idle += 1;
  if (idle >= 6) { idle = 0; select(ORDER[(ORDER.indexOf(current) + 1) % ORDER.length], true); }
}, 1000);
if (wanted && MODELS[wanted]) select(wanted, false);
`;
}

// ---- build ----
const jezLayers = modelLayers("mars_jezero_crater", "j");
const earthLayers = Object.fromEntries(EARTH.map((cell) => [cell, modelLayers(cell, "e")]));
const posts = Object.fromEntries(EARTH.map((cell) => [cell, postSvg(W[cell].relief_m)]));
const jezPaths = jezLayers.join("").split("<path").length - 1;
const visibleMax = Math.max(...EARTH.map((c) => earthLayers[c].join("").split("<path").length - 1));

for (const t of STRINGS) {
  const models = {};
  for (const cell of EARTH) models[cell] = { ...readoutOf(t, cell), layers: earthLayers[cell], post: posts[cell] };
  const def = models[DEFAULT];
  const svgJ = svgOf({ label: t.ariaJ, part: "j", layers: jezLayers, relief: W.mars_jezero_crater.relief_m });
  const svgE = svgOf({ label: t.ariaE, part: "e", layers: earthLayers[DEFAULT], relief: W[DEFAULT].relief_m, frame: maxRelief });
  const caption = fill(t.caption, { n: LAYERS, ve: VE, mars: DATASETS.mars, earth: DATASETS.earth });
  const chips = EARTH.map((cell) => `<button type="button" class="tm-btn" data-cell="${cell}" aria-pressed="${cell === DEFAULT}">${chipOf(cell, t.lang)}</button>`).join("");
  const body = `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 2</span><span class="iso-plate-corner" data-corner="title">${t.title}</span></div>
<div class="tm-bench" role="group" aria-label="${t.aria}"><figure class="tm-model">${svgJ}<figcaption class="tm-cap">${modelCap(t, "mars_jezero_crater", t.jezero)}</figcaption></figure><figure class="tm-model">${svgE}<figcaption class="tm-cap" data-ecap>${def.cap}</figcaption></figure></div>
<p class="tm-exag">${fill(t.exag, { ve: VE })}</p>
<p class="tm-hint">${t.hint}</p>
<div class="tm-seg" role="group" aria-label="${t.groupLabel}" data-group>${chips}</div>
<dl class="tm-readout" data-readout aria-live="polite">${def.dl}</dl>
<span class="tm-verdict" data-verdict data-v="${def.v}">${def.verdict}</span></div>
<figcaption class="iso-legend"><span class="tm-keys"><span class="tm-key"><span class="tm-chip" data-c="j" aria-hidden="true"></span>${t.keyJ}</span><span class="tm-key"><span class="tm-chip" data-c="e" aria-hidden="true"></span>${t.keyE}</span><span class="tm-key"><span class="tm-chip" data-c="p" aria-hidden="true"></span>${t.keyP}</span><span class="tm-key"><span class="tm-chip" data-c="s" aria-hidden="true"></span>${t.keyS}</span></span><span class="iso-caption">${caption}</span><span class="tm-foot">${t.footer}</span></figcaption></figure>`;
  let html = k.pageHtml({ title: t.title, theme: "dark", body, script: live(t, models, RISE), width: 880 });
  html = html.replace('<html lang="en">', `<html lang="${t.lang}">`).replace("</style></head>", `${EXTRA_CSS}</style></head>`);
  const file = join(OUT, `terrain-models-${t.lang}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, html.length);
}
console.log("layer paths: jezero", jezPaths, "earth max", visibleMax, "all built", PATHS);
console.log("W1", Object.fromEntries(EARTH.map((c) => [c, STATS[c].w1])), "VE", VE);
