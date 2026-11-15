import { motion } from "framer-motion";
import { useMemo } from "react";

/**
 * Paper hexagon field that takes over from the last frame of the home video
 * (dark hexagons with a few glowing orange cells — the H3 grid metaphor).
 * "idle": orange cells breathe. "exit": cells fly out in a wave from the centre.
 */

const VIEW_W = 1600;
const VIEW_H = 900;
const R = 52;
const HEX_H = Math.sqrt(3) * R;

// Column/row pairs that glow, placed like the clusters at the end of the video.
// Kept away from the centre so the logo and the call to action stay legible.
const GLOWING = new Set(["2-6", "3-7", "4-6", "4-8", "6-9", "19-2", "20-6", "18-8"]);

interface Cell {
  key: string;
  x: number;
  y: number;
  glow: boolean;
  delay: number;
}

function hexPoints(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
  }).join(" ");
}

function buildCells(): Cell[] {
  const cells: Cell[] = [];
  const cols = Math.ceil(VIEW_W / (1.5 * R)) + 1;
  const rows = Math.ceil(VIEW_H / HEX_H) + 1;
  const maxDist = Math.hypot(VIEW_W / 2, VIEW_H / 2);
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const x = c * 1.5 * R;
      const y = r * HEX_H + (c % 2 === 1 ? HEX_H / 2 : 0);
      const dist = Math.hypot(x - VIEW_W / 2, y - VIEW_H / 2);
      cells.push({ key: `${c}-${r}`, x, y, glow: GLOWING.has(`${c}-${r}`), delay: (dist / maxDist) * 0.5 });
    }
  }
  return cells;
}

function renderCell(cell: Cell, state: "idle" | "exit", reduceMotion: boolean) {
  const exit = state === "exit";
  return (
    <motion.polygon
      key={cell.key}
      points={hexPoints(cell.x, cell.y, R - 4)}
      className={cell.glow ? "fill-ckepi-copper" : "fill-ckepi-hex stroke-ckepi-hex-edge"}
      strokeWidth={cell.glow ? 0 : 2}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      initial={false}
      animate={
        exit
          ? reduceMotion
            ? { opacity: 0 }
            : { scale: [1, 1.12, 0], opacity: [1, 1, 0], rotate: [0, 0, 60] }
          : cell.glow && !reduceMotion
            ? { scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75], rotate: 0 }
            : { scale: 1, opacity: 1, rotate: 0 }
      }
      transition={
        exit
          ? { duration: reduceMotion ? 0.15 : 0.55, delay: reduceMotion ? 0 : cell.delay, times: [0, 0.35, 1], ease: "easeInOut" }
          : cell.glow
            ? { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: cell.delay }
            : { duration: 0.3 }
      }
    />
  );
}

interface HexFieldProps {
  state: "idle" | "exit";
  reduceMotion: boolean;
  /** Also fade the dark base on exit, so whatever is underneath shows through. */
  revealBase?: boolean;
}

export function HexField({ state, reduceMotion, revealBase = false }: HexFieldProps) {
  const cells = useMemo(buildCells, []);

  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter id="hex-paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="black" floodOpacity="0.55" />
        </filter>
        <filter id="hex-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <motion.rect
        width={VIEW_W}
        height={VIEW_H}
        className="fill-ckepi-hex-bg"
        initial={false}
        animate={{ opacity: revealBase && state === "exit" ? 0 : 1 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.45, delay: reduceMotion ? 0 : 0.15 }}
      />
      {/* One filter per layer (not per cell) keeps the field cheap on phones. */}
      <g filter="url(#hex-paper-shadow)">
        {cells.filter((cell) => !cell.glow).map((cell) => renderCell(cell, state, reduceMotion))}
      </g>
      <g filter="url(#hex-glow)">
        {cells.filter((cell) => cell.glow).map((cell) => renderCell(cell, state, reduceMotion))}
      </g>
    </svg>
  );
}
