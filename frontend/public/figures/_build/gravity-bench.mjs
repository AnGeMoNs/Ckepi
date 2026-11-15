// El banco de gravedad — Anatomy figure (MIT kit), built for es / pt / en.
// Surface gravity from the NASA NSSDCA Planetary Fact Sheets (Williams, 2024); everything else is derived here.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../../.claude/skills/anatomy/kit/iso-kit.mjs";
import { kitScript } from "../../../../.claude/skills/anatomy/scripts/inline-kit.mjs";
import { GRAVITY_STRINGS } from "./gravity-strings.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");

// ---- the model (one source for geometry, motion, readout and caption) ----
const G0 = 9.80665; // standard gravity, for the "g" unit
const SURFACE = { earth: 9.8, moon: 1.62, mars: 3.71 }; // m/s², NSSDCA fact sheets
const MASS = 10; // kg
const EARTH_JUMP = 0.5; // m
const V0 = Math.sqrt(2 * SURFACE.earth * EARTH_JUMP); // m/s, same launch speed on every world
const IDS = ["earth", "moon", "mars"];
const MODEL = Object.fromEntries(
  IDS.map((id) => {
    const g = SURFACE[id];
    return [id, { ms2: g, g: g / G0, kg: (MASS * g) / SURFACE.earth, cm: (100 * V0 * V0) / (2 * g), flight: (2 * V0) / g }];
  }),
);

const WIDTH = 640;
const HEIGHT = 420;

// ---- world plan (units ~ px, z up) ----
const PLATE = { x: -170, y: -62, w: 352, d: 114, r: 8 };
const PLATE_H = 10;
const FOOT_H = 5;
const COLS = IDS.map((id, i) => ({ id, cx: -110 + 110 * i, cls: ["c-earth", "c-cream", "c-rust"][i] }));
const BOARD_TOP = 176;
const ARM_Z = 164;
const COLLAR_TOP = 159;
const L0 = 20; // unloaded spring length
const K_PER_KG = 4.2; // spring stretch per felt kg
const SPRING_R = 4;
const TURNS = 9;
const lengthOf = (kg) => L0 + K_PER_KG * kg;
const DIAL_R = 14;
const DIAL_Z = 152;
const DIAL_MAX = 12;
const SWEEP = [225, -45];
const U = 0.42; // tower units per cm
const BALL_R = 3.2;
const LAUNCH_TOP = 10;
const RULER0 = LAUNCH_TOP + 2 * BALL_R; // ball top at rest = 0 cm
const RULER_MAX = 320;
const POST_TOP = RULER0 + U * (RULER_MAX + 12);

const geo = (cx) => {
  const SX = cx - 20, SY = -26, TX = cx + 50, TY = 16;
  return {
    SX, SY, TX, TY,
    base: { x: cx - 46, y: -55, w: 72, d: 14, r: 2 },
    board: { x: cx - 42, y: -50, w: 64, d: 5, r: 1 },
    face: -45,
    DX: cx + 8,
    ball: [TX - 2.8, TY - 1],
    post: { x: TX + 2, y: TY - 3, w: 4, d: 4, r: 0 },
    foot: { x: TX - 9, y: TY - 7, w: 17, d: 14, r: 2 },
    plate: { x: cx - 26, y: 36, w: 48, d: 9, r: 1.5 },
  };
};

const P = k.fitProjection(
  [
    ...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
    ...COLS.flatMap(({ cx }) => k.boxCorners(geo(cx).board, 0, BOARD_TOP + 3)),
  ],
  WIDTH,
  HEIGHT,
  { pad: 12, azimuth: 50 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const seg = (a, b) => k.segment(a, b, P);
const xz = (pts, y, closed = true) => k.pathOf(pts.map(([x, z]) => at([x, y, z])), closed);
const angleOf = (kg) => ((SWEEP[0] + (SWEEP[1] - SWEEP[0]) * Math.min(1, Math.max(0, kg / DIAL_MAX))) * Math.PI) / 180;
// screen radius of a sphere: the longest projected unit vector
const SPH = Math.max(...Array.from({ length: 90 }, (_, i) => {
  const a = (i / 90) * Math.PI * 2, o = at([0, 0, 0]);
  return Math.max(...[[Math.cos(a), Math.sin(a), 0], [Math.cos(a), 0, Math.sin(a)], [0, Math.cos(a), Math.sin(a)]].map((u) => { const q = at(u); return Math.hypot(q[0] - o[0], q[1] - o[1]); }));
}));

// Vertical coil split into back and front halves; the same source runs in the page.
const VCOIL = `function vcoil(x, y, r, zTop, zBot, turns) {
  const n = Math.max(1, Math.round(turns * 18)), back = [], front = [];
  let run = [], near = null;
  for (let i = 0; i <= n; i++) {
    const s = i / n, a = s * turns * Math.PI * 2 + Math.PI / 2;
    const flat = iso([x + r * Math.cos(a), y + r * Math.sin(a), zTop + (zBot - zTop) * s], P);
    const facing = depthOf([Math.cos(a), Math.sin(a), 0], P) > 0;
    if (near === null) near = facing;
    if (facing !== near) { run.push(flat); (near ? front : back).push(pathOf(run)); run = [flat]; near = facing; continue; }
    run.push(flat);
  }
  if (run.length > 1) (near ? front : back).push(pathOf(run));
  return { back: back.join(""), front: front.join("") };
}`;
const vcoil = new Function("iso", "depthOf", "pathOf", "P", `${VCOIL}; return vcoil;`)(k.iso, k.depthOf, k.pathOf, P);

function cardXZ(pts, y, depth, { tone = "hi", shade = 3 } = {}) {
  const back = xz(pts, y - depth);
  const front = xz(pts, y);
  return `<g class="iso-solid"><path class="iso-fill" d="${back}"/><path class="iso-shade" data-shade="0" d="${back}"/><path class="iso-line iso-edge" data-tone="lo" d="${back}"/><path class="iso-fill" d="${front}"/><path class="iso-shade" data-shade="${shade}" d="${front}"/><path class="iso-line iso-edge" data-tone="${tone}" d="${front}"/></g>`;
}
const circleXZ = (cx, cz, r, steps = 72) => Array.from({ length: steps }, (_, i) => [cx + r * Math.cos((i / steps) * Math.PI * 2), cz + r * Math.sin((i / steps) * Math.PI * 2)]);

function bench(t) {
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
  // engraved name plates along the front edge
  COLS.forEach(({ id, cx }, i) => {
    const g = geo(cx);
    out.push(`<g class="${COLS[i].cls}">${S(k.slabOf(g.plate, 0, 0.9, P, 3), { tone: "lo", crease: "none" })}</g>`);
    out.push(D([at([g.plate.x + 2, g.plate.y + g.plate.d / 2, 0.9]), at([g.plate.x + g.plate.w - 2, g.plate.y + g.plate.d / 2, 0.9])], { size: 0.4 }));
    out.push(`<g class="${COLS[i].cls}">${k.faceTextSvg(k.topMatrix([g.plate.x + g.plate.w / 2, g.plate.y + g.plate.d / 2 + 2], 0.9, P, "x"), t.plates[id], { size: 5.6, tone: "hi", anchor: "middle" })}</g>`);
    out.push(`<g data-part="mark${i}" class="c-sulfur gb-mark" style="opacity:${id === "mars" ? 1 : 0}">${S(k.slabOf({ x: g.plate.x + 6, y: g.plate.y + g.plate.d + 1.6, w: g.plate.w - 12, d: 1.8, r: 0.6 }, 0, 0.5, P, 2), { tone: "hi", crease: "none" })}</g>`);
  });
  return out.join("");
}

function scaleBack(col, i) {
  const { cx } = col;
  const g = geo(cx);
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(g.base, 0, 6, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(g.base, 0, 6, P, 4, 0.6), { tone: "mid" }));
  const bs = [[g.base.x + 4, g.base.y + 4], [g.base.x + g.base.w - 4, g.base.y + 4], [g.base.x + 4, g.base.y + g.base.d - 4], [g.base.x + g.base.w - 4, g.base.y + g.base.d - 4]];
  out.push(L(bs.map(([x, y]) => k.ring(x, y, 1.6, 6, P, 14)).join(""), { tone: "lo" }), D(bs.map(([x, y]) => at([x, y, 6])), { size: 0.45 }));
  // backboard with a seam near the foot and a cap on top
  out.push(S(k.slabOf(g.board, 6, BOARD_TOP - 6, P, 3, 0.5), { tone: "mid", inner: L([16, BOARD_TOP - 10].map((z) => k.sideSeam(g.board, z, P, 3)).join(""), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: g.board.x - 1.5, y: g.board.y - 1.5, w: g.board.w + 3, d: g.board.d + 3, r: 1.4 }, BOARD_TOP, 3, P, 3, 0.4), { tone: "mid" }));
  const fs = [[g.board.x + 4, 22], [g.board.x + g.board.w - 4, 22], [g.board.x + 4, BOARD_TOP - 14], [g.board.x + g.board.w - 4, BOARD_TOP - 14]];
  out.push(D(fs.map(([x, z]) => at([x, g.face, z])), { size: 0.55 }));
  // dial: bezel, ink face, ticks every 0.5 kg, numbers every 4 kg
  out.push(cardXZ(circleXZ(g.DX, DIAL_Z, DIAL_R + 2.6), g.face + 0.9, 0.9, { tone: "hi", shade: 2 }));
  out.push(`<g class="c-ink">${cardXZ(circleXZ(g.DX, DIAL_Z, DIAL_R), g.face + 1.2, 0.3, { tone: "lo", shade: 3 })}</g>`);
  const y = g.face + 1.3;
  const onDial = (r, a) => [g.DX + r * Math.cos(a), y, DIAL_Z + r * Math.sin(a)];
  const minor = [], major = [];
  for (let s = 0; s <= DIAL_MAX * 2; s++) {
    const a = angleOf(s / 2), big = s % 8 === 0;
    const r0 = DIAL_R - (big ? 4 : s % 2 === 0 ? 2.8 : 1.9);
    (big ? major : minor).push(seg(onDial(r0, a), onDial(DIAL_R - 0.7, a)));
  }
  out.push(L(k.pathOf(Array.from({ length: 61 }, (_, s) => at(onDial(DIAL_R - 0.7, angleOf((s / 60) * DIAL_MAX))))), { tone: "lo" }));
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "hi" }));
  for (let v = 0; v <= DIAL_MAX; v += 4) {
    const [tx, , tz] = onDial(DIAL_R - 7.2, angleOf(v));
    out.push(k.faceTextSvg(k.sideMatrix([tx, y], tz - 1.1, P, "left"), String(v), { size: 3, tone: "hi", anchor: "middle" }));
  }
  out.push(k.faceTextSvg(k.sideMatrix([g.DX, y], DIAL_Z - 6.5, P, "left"), "kg", { size: 2.6, tone: "mid", anchor: "middle" }));
  // label plate under the dial, with two rule lines
  const lp = [[g.DX - 10, DIAL_Z - 27], [g.DX + 10, DIAL_Z - 27], [g.DX + 10, DIAL_Z - 21], [g.DX - 10, DIAL_Z - 21]];
  out.push(cardXZ(lp, g.face + 0.6, 0.6, { tone: "mid", shade: 1 }));
  out.push(L([-23, -25].map((dz) => seg([g.DX - 7, g.face + 0.7, DIAL_Z + dz], [g.DX + (dz < -24 ? 2 : 7), g.face + 0.7, DIAL_Z + dz])).join(""), { tone: "faint", free: true }));
  out.push(L(k.sideRing([g.DX + 9.5, g.face + 0.7, DIAL_Z - 24], 1.2, "y", P, 14), { tone: "mid" }));
  // needle and hub (moved in the page)
  out.push(`<path data-part="needle${i}" class="iso-line" data-tone="hi" data-free="start" d="" style="stroke-width:1.2"/>`);
  const hub = at([g.DX, g.face + 1.8, DIAL_Z]);
  out.push(`<circle class="gb-hub" cx="${hub[0].toFixed(1)}" cy="${hub[1].toFixed(1)}" r="1.4"/>`);
  // arm with gusset, top collar, spring and the hanging load
  out.push(S(k.slabOf({ x: g.SX - 1, y: g.board.y + g.board.d, w: 2, d: 8, r: 0.4 }, ARM_Z - 12, 12, P, 2), { tone: "mid", crease: "none" }));
  const arm = { x: g.SX - 4, y: g.board.y + g.board.d, w: 8, d: g.SY + 5 - (g.board.y + g.board.d), r: 1 };
  out.push(S(k.slabOf(arm, ARM_Z, 6, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([g.SX, g.SY, ARM_Z + 6]), at([g.SX, arm.y + 4, ARM_Z + 6])], { size: 0.45 }));
  out.push(S(k.cylinder(g.SX, g.SY, 4.6, COLLAR_TOP, ARM_Z - COLLAR_TOP, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(g.SX, g.SY, 4.6, COLLAR_TOP + 0.6, ARM_Z - 0.6, 16, P), { tone: "lo" }));
  const len = lengthOf(MODEL[col.id].kg);
  const c = vcoil(g.SX, g.SY, SPRING_R, COLLAR_TOP, COLLAR_TOP - len, TURNS);
  out.push(`<path data-part="sb${i}" class="iso-line gb-coil" data-tone="lo" d="${c.back}"/>`);
  out.push(`<path data-part="sf${i}" class="iso-line gb-coil" data-tone="hi" d="${c.front}"/>`);
  out.push(`<g data-part="hang${i}">${hanging(g, len)}</g>`);
  return out.join("");
}

function hanging(g, len) {
  const { SX, SY } = g;
  const collarBot = COLLAR_TOP - len - 4;
  const barTop = collarBot - 4;
  const packTop = barTop - 1.6 - 4;
  const out = [];
  out.push(S(k.cylinder(SX, SY, 4.6, collarBot, 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(SX, SY, 0.8, barTop, 4, P, 10), { tone: "mid", crease: "none" }));
  out.push(`<g class="c-copper">`);
  out.push(S(k.cylinder(SX - 4, SY, 0.8, packTop, 4, P, 10), { tone: "hi", crease: "none" }));
  out.push(S(k.slabOf({ x: SX - 5, y: SY - 0.9, w: 10, d: 1.8, r: 0.6 }, barTop - 1.6, 1.6, P, 2), { tone: "hi", crease: "none" }));
  out.push(S(k.cylinder(SX + 4, SY, 0.8, packTop, 4, P, 10), { tone: "hi", crease: "none" }));
  const body = { x: SX - 13, y: SY - 7, w: 26, d: 14, r: 4 };
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(body, 2), packTop - 30, 0.1, P)}" style="filter:blur(4px);opacity:.25"/>`);
  out.push(S(k.slabOf(body, packTop - 30, 24, P, 6, 0.8), { tone: "hi", crease: "lo", inner: L([packTop - 27, packTop - 9].map((z) => k.sideSeam(body, z, P, 6)).join(""), { tone: "lo" }) }));
  const pocket = { x: SX - 9, y: SY + 7, w: 18, d: 3, r: 1.4 };
  out.push(S(k.slabOf(pocket, packTop - 27, 13, P, 3, 0.5), { tone: "hi", crease: "lo", inner: L(k.sideSeam(pocket, packTop - 17, P, 3), { tone: "lo" }) }));
  out.push(S(k.slabOf({ x: SX - 2, y: SY + 10, w: 4, d: 1, r: 0.3 }, packTop - 19, 5, P, 1), { tone: "mid", crease: "none" }));
  const lid = { x: SX - 13.6, y: SY - 7.6, w: 27.2, d: 15.2, r: 4.4 };
  out.push(S(k.slabOf(lid, packTop - 6, 6, P, 6, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.planOutline(k.insetPlan(lid, 2.4), packTop, P, 6), { tone: "lo" }));
  out.push(D([-8, -4, 0, 4, 8].map((dx) => at([SX + dx, SY + 7.6, packTop - 3])), { size: 0.4, tone: "lo" }));
  out.push(`</g>`);
  return out.join("");
}

function towerFront(col, i) {
  const g = geo(col.cx);
  const [bx, by] = g.ball;
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(g.foot, 0, 3, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(g.foot, 0, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(D([[g.foot.x + 3, g.foot.y + 3], [g.foot.x + 3, g.foot.y + g.foot.d - 3], [g.foot.x + g.foot.w - 3, g.foot.y + g.foot.d - 3]].map(([x, y]) => at([x, y, 3])), { size: 0.45 }));
  // launcher: barrel, knurled ring, plunger (moved in the page)
  out.push(S(k.cylinder(bx, by, 4.2, 3, LAUNCH_TOP - 4, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(bx, by, 4.6, LAUNCH_TOP - 4, 2, P, 24), { tone: "mid" }));
  out.push(L(k.knurl(bx, by, 4.6, LAUNCH_TOP - 3.6, LAUNCH_TOP - 2.4, 18, P), { tone: "lo" }));
  out.push(`<g data-part="plunger${i}">${S(k.cylinder(bx, by, 3.2, LAUNCH_TOP - 2, 2, P, 20), { tone: "hi" })}</g>`);
  out.push(`<path data-part="shadow${i}" class="gb-shadow" d="${k.ring(bx, by, BALL_R * 0.9, LAUNCH_TOP, P, 20)}"/>`);
  const c = at([bx, by, LAUNCH_TOP + BALL_R]);
  out.push(`<g data-part="ball${i}"><circle class="gb-ball" cx="${c[0].toFixed(2)}" cy="${c[1].toFixed(2)}" r="${(BALL_R * SPH).toFixed(2)}"/><circle class="gb-shine" cx="${(c[0] - BALL_R * SPH * 0.35).toFixed(2)}" cy="${(c[1] - BALL_R * SPH * 0.4).toFixed(2)}" r="${(BALL_R * SPH * 0.28).toFixed(2)}"/></g>`);
  // ruler post: ticks every 20 cm on the front face, major every 100 cm, cap on top
  const p = g.post;
  const fy = p.y + p.d;
  const minor = [], major = [];
  for (let cm = 0; cm <= RULER_MAX; cm += 20) {
    const z = RULER0 + U * cm, big = cm % 100 === 0;
    (big ? major : minor).push(seg([p.x, fy, z], [p.x + (big ? 3 : 1.6), fy, z]));
  }
  out.push(S(k.slabOf(p, 3, POST_TOP - 3, P, 2, 0), { tone: "mid", crease: "lo", inner: L(minor.join(""), { tone: "lo" }) + L(major.join(""), { tone: "hi" }) }));
  out.push(S(k.slabOf({ x: p.x - 1, y: p.y - 1, w: p.w + 2, d: p.d + 2, r: 0.8 }, POST_TOP, 2.4, P, 2, 0.3), { tone: "mid" }));
  out.push(D([at([p.x + p.w / 2, p.y + p.d / 2, POST_TOP + 2.4])], { size: 0.45 }));
  // peak flag: a friction slider the ball pushes up (moved in the page)
  const z0 = RULER0;
  const flag = [
    S(k.slabOf({ x: p.x - 0.6, y: p.y - 0.6, w: p.w + 1.2, d: p.d + 1.2, r: 0.6 }, z0, 2, P, 2, 0.3), { tone: "hi" }),
    S(k.slabOf({ x: bx - 1.6, y: by - 1.2, w: p.x - 0.6 - (bx - 1.6), d: 2.4, r: 0.4 }, z0, 1, P, 1), { tone: "hi", crease: "none" }),
  ].join("");
  out.push(`<g data-part="flag${i}" class="c-sulfur">${flag}</g>`);
  return out.join("");
}

function svgFor(t) {
  const backs = COLS.map((c, i) => scaleBack(c, i));
  const fronts = COLS.map((c, i) => towerFront(c, i));
  return k.figureSvg({
    width: WIDTH,
    height: HEIGHT,
    label: t.aria,
    body: [
      `<defs><radialGradient id="gb-ball-grad" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffe3d3"/><stop offset=".45" stop-color="#E8A080"/><stop offset="1" stop-color="#8a5039"/></radialGradient></defs>`,
      bench(t),
      ...COLS.map((c, i) => `<g class="${c.cls}-col">${backs[i]}</g>`),
      ...fronts,
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
.c-earth{--anatomy-top:#2f6664;--anatomy-hi:#FFF2D7}
.c-sulfur{--anatomy-paper:#6f7330;--anatomy-top:#E4ED83;--anatomy-shade-0:#6f7330;--anatomy-shade-1:#868b3c;--anatomy-shade-2:#a0a649;--anatomy-shade-3:#bac156;--anatomy-hi:#f6f9cf;--anatomy-lo:#4c4f21;--anatomy-dot:#33351a}
.c-ink{--anatomy-paper:#0c1d21;--anatomy-shade-0:#0a181b;--anatomy-shade-3:#0c1d21}
.c-cream .iso-face-text[data-tone="hi"]{fill:#183A3A}
.gb-mark{transition:opacity .3s}
.gb-coil{stroke-width:1.1px}
.gb-hub{fill:#FFF2D7}
.gb-ball{fill:url(#gb-ball-grad);stroke:#ffe3d3;stroke-width:.5px;vector-effect:non-scaling-stroke}
.gb-shine{fill:#fffaf0;opacity:.55}
.gb-shadow{fill:#050d0f;opacity:.5;filter:blur(1px)}
.iso-page{width:min(760px,100% - 24px);margin:12px auto 16px}
.iso-figure{margin:0}
.iso-plate{padding:40px 12px 16px}
.iso-plate-corners{inset:14px 14px auto 14px;height:12px}
.iso-plate-corner[data-corner="title"]{white-space:normal;text-align:right;max-width:70%}
.sm-hint{margin:10px 2px 0;color:var(--anatomy-text);font-size:13px;line-height:1.5}
.sm-readout{margin:8px 2px 0;color:var(--anatomy-text);font-family:var(--anatomy-mono);font-size:12.5px;line-height:1.5;font-variant-numeric:tabular-nums;min-height:4.5em}
.sm-readout span{display:block}
.sm-readout span[data-on="true"]{color:var(--anatomy-strong);font-weight:700}
.sm-controls{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
.sm-seg{display:inline-flex;flex-wrap:wrap;gap:0;border:1px solid var(--anatomy-lo)}
.sm-btn{min-height:44px;min-width:44px;padding:0 14px;border:0;background:transparent;color:var(--anatomy-text);font:600 13px/1 ui-sans-serif,system-ui,sans-serif;cursor:pointer}
.sm-seg .sm-btn[aria-pressed="true"]{background:#E8A080;color:#101F24}
.sm-seg .sm-btn[data-world="moon"][aria-pressed="true"]{background:#FFF2D7}
.sm-seg .sm-btn[data-world="mars"][aria-pressed="true"]{background:#C1440E;color:#FFF2D7}
.sm-seg .sm-btn[data-unit][aria-pressed="true"]{background:#FFF2D7;color:#101F24}
.sm-scan{border:1px solid #E4ED83;color:#E4ED83}
.sm-scan:disabled{opacity:.55;cursor:default}
.sm-btn:focus-visible{outline:2px solid #E4ED83;outline-offset:2px}
.sm-keys{display:flex;flex-wrap:wrap;gap:6px 16px;margin:0}
.sm-key{display:inline-flex;align-items:center;gap:7px}
.sm-chip{width:12px;height:10px;flex:none;border:1px solid #101F24}
.sm-chip[data-round]{border-radius:50%}
.sm-foot{margin-top:10px;font-size:11.5px;color:var(--anatomy-muted)}
.iso-stage{outline:none}
@media (max-width:420px){.iso-plate{padding:36px 8px 12px}.sm-btn{padding:0 10px}}
`;

function live(t) {
  const C = {
    IDS, MODEL, V0, L0, K_PER_KG, SPRING_R, TURNS, COLLAR_TOP, DIAL_R, DIAL_Z, DIAL_MAX, SWEEP, U, BALL_R, LAUNCH_TOP, RULER0,
    G: COLS.map((c) => { const g = geo(c.cx); return { SX: g.SX, SY: g.SY, DX: g.DX, face: g.face, built: lengthOf(MODEL[c.id].kg) }; }),
  };
  return `
const P = ${JSON.stringify(P)};
const C = ${JSON.stringify(C)};
const T = ${JSON.stringify(t.live)};
const NAMES = ${JSON.stringify(t.worlds)};
const LANG = ${JSON.stringify(t.lang)};
${VCOIL}
const svg = document.querySelector(".iso-stage svg");
const $ = (name) => svg.querySelector('[data-part="' + name + '"]');
const cols = C.IDS.map((id, i) => ({ id, i, sb: $("sb" + i), sf: $("sf" + i), hang: $("hang" + i), needle: $("needle" + i), ball: $("ball" + i), shadow: $("shadow" + i), flag: $("flag" + i), plunger: $("plunger" + i), mark: $("mark" + i) }));
const lines = Object.fromEntries(C.IDS.map((id) => [id, document.querySelector('[data-line="' + id + '"]')]));
const jumpBtn = document.querySelector("[data-jump]");
const unitBtns = [...document.querySelectorAll("[data-unit]")];
const worldBtns = [...document.querySelectorAll("[data-world]")];
const still = matchMedia("(prefers-reduced-motion: reduce)");
const fmt = (v, d) => v.toLocaleString(LANG, { minimumFractionDigits: d, maximumFractionDigits: d });
const at = (p) => iso(p, P);
const angleOf = (kg) => (C.SWEEP[0] + (C.SWEEP[1] - C.SWEEP[0]) * Math.min(1, Math.max(0, kg / C.DIAL_MAX))) * Math.PI / 180;
const param = new URLSearchParams(location.search).get("world");
const state = {
  world: C.IDS.includes(param) ? param : "mars", unit: "g", t: -1, arming: 0, firing: false,
  springs: C.IDS.map((id) => ({ x: still.matches ? C.MODEL[id].kg * C.K_PER_KG : 0, v: 0 })),
  flags: C.IDS.map((id) => C.MODEL[id].cm), z: C.IDS.map(() => 0),
};
function draw() {
  cols.forEach((c) => {
    const g = C.G[c.i], s = state.springs[c.i], len = C.L0 + s.x;
    const coil = vcoil(g.SX, g.SY, C.SPRING_R, C.COLLAR_TOP, C.COLLAR_TOP - len, C.TURNS);
    c.sb.setAttribute("d", coil.back); c.sf.setAttribute("d", coil.front);
    c.hang.setAttribute("transform", translateAlong(P, [0, 0, g.built - len]));
    const a = angleOf(s.x / C.K_PER_KG), y = g.face + 1.7;
    const on = (r) => at([g.DX + r * Math.cos(a), y, C.DIAL_Z + r * Math.sin(a)]);
    c.needle.setAttribute("d", pathOf([on(-3.2), on(C.DIAL_R - 1.6)]));
    const lit = c.id === state.world;
    c.needle.setAttribute("data-tone", lit ? "lit" : "hi");
    c.mark.style.opacity = lit ? "1" : "0";
    const zu = state.z[c.i] * C.U;
    c.ball.setAttribute("transform", translateAlong(P, [0, 0, zu]));
    c.shadow.style.opacity = String(0.5 * Math.max(0, 1 - zu / 30));
    c.flag.setAttribute("transform", translateAlong(P, [0, 0, state.flags[c.i] * C.U]));
    c.plunger.setAttribute("transform", translateAlong(P, [0, 0, -1.6 * state.arming]));
  });
  C.IDS.forEach((id) => {
    const m = C.MODEL[id];
    const g = state.unit === "g" ? fmt(m.g, 2) + " " + T.unitG : fmt(m.ms2, 2) + " " + T.unitMs;
    const text = T.line.replace("{world}", NAMES[id]).replace("{g}", g).replace("{w}", fmt(m.kg, 1)).replace("{h}", fmt(Math.round(m.cm), 0));
    if (lines[id].textContent !== text) lines[id].textContent = text;
    lines[id].dataset.on = String(id === state.world);
  });
  unitBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.unit === state.unit)));
  worldBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.world === state.world)));
}
const follow = (v, to, dt, tau) => v + (to - v) * (1 - Math.exp(-dt / tau));
let frame = 0, last = 0, visible = false, touring = !still.matches, tourClock = 0;
const OMEGA = 7, ZETA = 0.18; // one spring, one period on every world: only the rest point moves with g
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  let moving = false;
  state.springs.forEach((s, i) => {
    const want = C.MODEL[C.IDS[i]].kg * C.K_PER_KG;
    if (still.matches) { s.x = want; s.v = 0; return; }
    for (let n = 0; n < 4; n++) { const h = dt / 4; s.v += (-(OMEGA * OMEGA) * (s.x - want) - 2 * ZETA * OMEGA * s.v) * h; s.x += s.v * h; }
    if (Math.abs(s.x - want) < 1e-3 && Math.abs(s.v) < 1e-3) { s.x = want; s.v = 0; } else moving = true;
  });
  if (state.t >= 0) {
    if (state.arming < 1 && !state.firing) {
      state.arming = Math.min(1, state.arming + dt / 0.35);
      state.flags = state.flags.map((f) => follow(f, 0, dt, 0.08));
      if (state.arming >= 1) { state.firing = true; state.t = 0; state.flags = state.flags.map(() => 0); }
    } else {
      state.t += dt;
      state.arming = Math.max(0, state.arming - dt / 0.05);
      let flying = false;
      C.IDS.forEach((id, i) => {
        const g = C.MODEL[id].ms2;
        const zc = Math.max(0, 100 * (C.V0 * state.t - 0.5 * g * state.t * state.t));
        if (state.t < 2 * C.V0 / g) flying = true;
        state.z[i] = state.t < 2 * C.V0 / g ? zc : 0;
        state.flags[i] = Math.max(state.flags[i], state.z[i]);
      });
      if (!flying) { state.t = -1; state.firing = false; state.arming = 0; state.flags = C.IDS.map((id) => C.MODEL[id].cm); }
    }
    moving = true;
  }
  if (touring && visible && state.t < 0) {
    tourClock += dt;
    if (tourClock > 7) { tourClock = 0; jump(true); }
    moving = true;
  }
  draw();
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function jump(fromTour) {
  if (!fromTour) touring = false;
  if (still.matches) { state.z = C.IDS.map((id) => C.MODEL[id].cm); state.flags = state.z.slice(); draw(); return; }
  if (state.t >= 0) return;
  state.t = 0; state.arming = 0; state.firing = false;
  run();
}
jumpBtn.addEventListener("click", () => jump(false));
unitBtns.forEach((b) => b.addEventListener("click", () => { state.unit = b.dataset.unit; draw(); }));
worldBtns.forEach((b) => b.addEventListener("click", () => { state.world = b.dataset.world; draw(); }));
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) { tourClock = 5.8; run(); } }, { rootMargin: "80px 0px" }).observe(svg);
still.addEventListener?.("change", () => { if (still.matches) { touring = false; state.t = -1; state.firing = false; state.arming = 0; state.z = C.IDS.map(() => 0); state.flags = C.IDS.map((id) => C.MODEL[id].cm); } run(); draw(); });
draw();
`;
}

function fmt(lang, v, d) {
  return v.toLocaleString(lang, { minimumFractionDigits: d, maximumFractionDigits: d });
}
const chip = (color, round) => `<span class="sm-chip"${round ? " data-round" : ""} style="background:${color}" aria-hidden="true"></span>`;
for (const t of GRAVITY_STRINGS) {
  const svg = svgFor(t);
  const M = MODEL;
  const caption = t.caption
    .replace("{ge}", fmt(t.lang, M.earth.ms2, 2)).replace("{gm}", fmt(t.lang, M.moon.ms2, 2)).replace("{gr}", fmt(t.lang, M.mars.ms2, 2))
    .replace("{we}", fmt(t.lang, M.earth.kg, 1)).replace("{wm}", fmt(t.lang, M.moon.kg, 1)).replace("{wr}", fmt(t.lang, M.mars.kg, 1))
    .replace("{v0}", fmt(t.lang, V0, 2)).replace("{he}", fmt(t.lang, Math.round(M.earth.cm), 0))
    .replace("{hm}", fmt(t.lang, Math.round(M.moon.cm), 0)).replace("{hr}", fmt(t.lang, Math.round(M.mars.cm), 0));
  const line = (id) => t.live.line.replace("{world}", t.worlds[id]).replace("{g}", `${fmt(t.lang, M[id].g, 2)} ${t.live.unitG}`).replace("{w}", fmt(t.lang, M[id].kg, 1)).replace("{h}", fmt(t.lang, Math.round(M[id].cm), 0));
  const readout = IDS.map((id) => `<span data-line="${id}" data-on="${id === "mars"}">${line(id)}</span>`).join("");
  const body = `<figure class="iso-figure"><div class="iso-plate"><div class="iso-plate-corners" aria-hidden="true"><span class="iso-plate-corner" data-corner="fig">Fig 2</span><span class="iso-plate-corner" data-corner="title">${t.title}</span></div>
<div class="iso-stage" role="img" aria-label="${t.aria}">${svg}</div>
<p class="sm-hint">${t.hint}</p>
<div class="sm-controls"><button type="button" class="sm-btn sm-scan" data-jump>${t.jump}</button><div class="sm-seg" role="group" aria-label="${t.unitLabel}"><button type="button" class="sm-btn" data-unit="g" aria-pressed="true">${t.live.unitG}</button><button type="button" class="sm-btn" data-unit="ms2" aria-pressed="false">${t.live.unitMs}</button></div><div class="sm-seg" role="group" aria-label="${t.worldLabel}">${IDS.map((id) => `<button type="button" class="sm-btn" data-world="${id}" aria-pressed="${id === "mars"}">${t.worlds[id]}</button>`).join("")}</div></div>
<p class="sm-readout" data-readout aria-live="polite">${readout}</p></div>
<figcaption class="iso-legend"><span class="sm-keys"><span class="sm-key">${chip("#E8A080")}${t.keyPack}</span><span class="sm-key">${chip("#E8A080", true)}${t.keyBall}</span><span class="sm-key">${chip("#E4ED83")}${t.keyNeedle}</span></span><span class="iso-caption">${caption}</span><span class="sm-foot">${t.footer}</span></figcaption></figure>`;
  let html = k.pageHtml({ title: t.title, theme: "dark", body, script: kitScript() + live(t), width: 760 });
  html = html.replace('<html lang="en">', `<html lang="${t.lang}">`).replace("</style></head>", `${EXTRA_CSS}</style></head>`);
  const file = join(OUT, `gravity-bench-${t.lang}.html`);
  writeFileSync(file, html);
  console.log("wrote", file, html.length);
}
console.log(Object.fromEntries(IDS.map((id) => [id, { g: MODEL[id].g.toFixed(3), kg: MODEL[id].kg.toFixed(2), cm: MODEL[id].cm.toFixed(1), flight: MODEL[id].flight.toFixed(2) }])), "v0", V0.toFixed(3));
