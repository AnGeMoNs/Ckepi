/**
 * CKEPI pictograms: drawn for this project (no icon library), on a 32×32 grid with the
 * logo's language — round 2 px strokes, open hexagons and contour lines. They explain a
 * physical idea at a glance for STEAM readers; meaning is always repeated in text.
 */
import type { ReactNode } from "react";

export type PictogramName =
  | "gravity"
  | "pressure"
  | "radiation"
  | "temperature"
  | "thermalSwing"
  | "slope"
  | "terrain"
  | "hexCell";

const PATHS: Record<PictogramName, ReactNode> = {
  // A backpack weight pressing down: how heavy things feel.
  gravity: (
    <>
      <path d="M11 9 Q11 5 16 5 Q21 5 21 9" />
      <path d="M8 11 H24 L26 26 H6 Z" />
      <path d="M16 15 V21 M13 18.5 L16 21.5 L19 18.5" />
    </>
  ),
  // Stacked air layers, denser near the ground.
  pressure: (
    <>
      <path d="M4 8 Q10 5 16 8 T28 8" opacity="0.45" />
      <path d="M4 14 Q10 11 16 14 T28 14" opacity="0.7" />
      <path d="M4 20 Q10 17 16 20 T28 20" />
      <path d="M4 26 H28" />
    </>
  ),
  // Particles crossing a thin shield line.
  radiation: (
    <>
      <path d="M4 22 Q16 16 28 22" />
      <path d="M8 5 L11 13 M16 3 V12 M24 5 L21 13" strokeDasharray="2 3" />
      <circle cx="16" cy="27" r="1.5" />
    </>
  ),
  temperature: (
    <>
      <path d="M13 6 Q13 3 16 3 Q19 3 19 6 V18 A6 6 0 1 1 13 18 Z" />
      <path d="M16 11 V22" />
      <circle cx="16" cy="23" r="2.2" />
    </>
  ),
  // Half sun, half moon: the day–night swing.
  thermalSwing: (
    <>
      <path d="M16 6 A10 10 0 0 0 16 26" />
      <path d="M16 6 A10 10 0 0 1 16 26" strokeDasharray="2.5 3" />
      <path d="M4 16 H8 M24 16 H28" />
    </>
  ),
  // A hillside with its angle.
  slope: (
    <>
      <path d="M4 26 L26 8 V26 Z" />
      <path d="M11 26 A7 7 0 0 0 9.6 21.5" />
    </>
  ),
  // Contour lines of a terrain window.
  terrain: (
    <>
      <path d="M4 22 Q10 14 16 18 T28 12" />
      <path d="M4 27 Q11 20 17 23 T28 18" opacity="0.6" />
      <path d="M8 16 Q13 9 18 12 T26 7" opacity="0.4" />
    </>
  ),
  // One open H3 cell, as in the logo.
  hexCell: (
    <>
      <path d="M22 7 L16 3.5 L6 9.3 V22.7 L16 28.5 L22 25" />
      <circle cx="25" cy="16" r="2" />
    </>
  ),
};

interface PictogramProps {
  name: PictogramName;
  className?: string;
}

export function Pictogram({ name, className = "h-8 w-8" }: PictogramProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}

/** World marker: an open hexagon band in the world's brand colour (Earth salt, Moon sulfur, Mars copper). */
export function WorldMark({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M24 8 L16 3.5 L5 9.8 V22.2 L16 28.5 L24 24" />
    </svg>
  );
}
