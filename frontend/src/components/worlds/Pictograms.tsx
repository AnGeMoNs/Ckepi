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
  | "hexCell"
  | "rover"
  | "sun"
  | "learn"
  | "research"
  | "observe"
  | "measure"
  | "compare"
  | "notSimilar"
  | "decide"
  | "listen"
  | "crescent"
  | "skip"
  | "replay"
  | "globe"
  | "zoomIn"
  | "zoomOut"
  | "chevronDown"
  | "tune"
  | "share"
  | "check"
  | "close"
  | "download"
  | "info";

const PATHS: Record<PictogramName, ReactNode> = {
  // Info: a lower-case "i" inside the open hexagon.
  info: (
    <>
      <path d="M16 3.5 L27 9.8 V22.2 L16 28.5 L5 22.2 V9.8 Z" opacity="0.55" />
      <path d="M16 14.5 V22" />
      <circle cx="16" cy="10.5" r="0.6" fill="currentColor" />
    </>
  ),
  // Download: an arrow dropping into a paper tray.
  download: (
    <>
      <path d="M16 4 V19 M10 13.5 L16 19.5 L22 13.5" />
      <path d="M5 21 V26 Q5 27.5 6.5 27.5 H25.5 Q27 27.5 27 26 V21" />
    </>
  ),
  // Close: a cross inside the open hexagon.
  close: (
    <>
      <path d="M16 3.5 L27 9.8 V22.2 L16 28.5 L5 22.2 V9.8 Z" opacity="0.5" />
      <path d="M12 12 L20 20 M20 12 L12 20" />
    </>
  ),
  // Zoom in / out: a plus or minus inside the open H3 hexagon of the logo.
  zoomIn: (
    <>
      <path d="M16 3.5 L27 9.8 V22.2 L16 28.5 L5 22.2 V9.8 Z" />
      <path d="M16 11 V21 M11 16 H21" />
    </>
  ),
  zoomOut: (
    <>
      <path d="M16 3.5 L27 9.8 V22.2 L16 28.5 L5 22.2 V9.8 Z" />
      <path d="M11 16 H21" />
    </>
  ),
  // A soft fold: open / close a panel.
  chevronDown: <path d="M9 13 L16 20 L23 13" />,
  // Three contour lines with knobs: fine-tune the analysis.
  tune: (
    <>
      <path d="M4 9 Q16 6 28 9 M4 16 Q16 13 28 16 M4 23 Q16 20 28 23" opacity="0.7" />
      <circle cx="11" cy="8" r="2.6" />
      <circle cx="21" cy="15" r="2.6" />
      <circle cx="14" cy="22" r="2.6" />
    </>
  ),
  // Three linked cells: share the analysis link.
  share: (
    <>
      <circle cx="9" cy="16" r="3.2" />
      <circle cx="23" cy="8.5" r="3.2" />
      <circle cx="23" cy="23.5" r="3.2" />
      <path d="M12 14.4 L20 10.1 M12 17.6 L20 21.9" />
    </>
  ),
  // A drawn tick: done / copied.
  check: <path d="M7 17 L13 23 L25 9.5" />,
  // A globe with one meridian and one parallel: the 3D planetary globe.
  globe: (
    <>
      <circle cx="16" cy="16" r="12" />
      <path d="M16 4 Q8 16 16 28 Q24 16 16 4" />
      <path d="M4.5 13 Q16 17 27.5 13" />
    </>
  ),
  // Two paper chevrons and a stop bar: jump to the end of the intro.
  skip: (
    <>
      <path d="M6 8 L14 16 L6 24" />
      <path d="M14 8 L22 16 L14 24" />
      <path d="M26 8 V24" />
    </>
  ),
  // An open orbit arrow returning to its start: watch the intro again.
  replay: (
    <>
      <path d="M8 11 A10 10 0 1 1 6 18" />
      <path d="M4 7 L8 11 L12 7" />
      <circle cx="16" cy="16" r="2" />
    </>
  ),
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
  // A small rover: body, mast camera and three wheels.
  rover: (
    <>
      <path d="M7 18 H25 V22 H7 Z" />
      <path d="M12 18 V12 H16 M16 9 H20 V13 H16 Z" />
      <circle cx="9" cy="25" r="2.5" />
      <circle cx="16" cy="25" r="2.5" />
      <circle cx="23" cy="25" r="2.5" />
    </>
  ),
  // Strong sun over a dry horizon.
  sun: (
    <>
      <circle cx="16" cy="13" r="5" />
      <path d="M16 3 V5 M16 21 V23 M6 13 H8 M24 13 H26 M9 6 L10.5 7.5 M23 6 L21.5 7.5" />
      <path d="M3 28 Q10 24 16 27 T29 26" />
    </>
  ),
  // One open H3 cell, as in the logo.
  hexCell: (
    <>
      <path d="M22 7 L16 3.5 L6 9.3 V22.7 L16 28.5 L22 25" />
      <circle cx="25" cy="16" r="2" />
    </>
  ),
  // Open notebook with a small star: learning by doing (entry door "Learn").
  learn: (
    <>
      <path d="M4 8 Q10 6 16 9 Q22 6 28 8 V25 Q22 23 16 26 Q10 23 4 25 Z" />
      <path d="M16 9 V26" />
      <path d="M22 11.5 L22.9 13.6 L25 13.8 L23.4 15.2 L23.9 17.3 L22 16.2 L20.1 17.3 L20.6 15.2 L19 13.8 L21.1 13.6 Z" />
    </>
  ),
  // Magnifier over an open H3 hexagon: looking closely at one cell (entry door "Research").
  research: (
    <>
      <path d="M17 6 L12 3.2 L5 7.2 V15.2 L12 19.2 L17 16.4" />
      <circle cx="18.5" cy="15" r="6" />
      <path d="M23 19.5 L28.5 25" />
    </>
  ),
  // An eye whose pupil is a small hexagon: observe.
  observe: (
    <>
      <path d="M3 16 Q16 4 29 16 Q16 28 3 16 Z" />
      <path d="M19 13.5 L16 11.8 L13 13.5 V18.5 L16 20.2 L19 18.5 Z" />
    </>
  ),
  // A cardboard plank tilted on a block, with its angle arc: measure a slope.
  measure: (
    <>
      <path d="M3 26 H29" />
      <path d="M4 25 L27 15 L28 17.4 L5 27.4" />
      <path d="M22 26 V18.5 H26 V26" />
      <path d="M11 26 A7 7 0 0 0 10.4 22.6" />
    </>
  ),
  // Two small piles (histograms) side by side: compare distributions.
  compare: (
    <>
      <path d="M3 27 H29" />
      <path d="M5 27 V20 H8 V13 H11 V18 H14 V27" />
      <path d="M18 27 V21 H21 V12 H24 V17 H27 V27" opacity="0.6" />
    </>
  ),
  // "Not equal" sign inside an open hexagon: what is NOT similar.
  notSimilar: (
    <>
      <path d="M23 6.5 L16 2.8 L5 9 V23 L16 29.2 L23 25.5" />
      <path d="M10 13.5 H22 M10 19 H22 M19 9.5 L13 23" />
    </>
  ),
  // A flag planted on a contour hill: decide where and what to test.
  decide: (
    <>
      <path d="M3 27 Q10 20 16 22 T29 19" />
      <path d="M14 22 V5" />
      <path d="M14 5 H24 L21 8.5 L24 12 H14" />
    </>
  ),
  // Speaker with sound waves: listen (Web Speech API).
  listen: (
    <>
      <path d="M5 12 H10 L16 7 V25 L10 20 H5 Z" />
      <path d="M20 12 Q22.5 16 20 20" />
      <path d="M23.5 9 Q28 16 23.5 23" />
    </>
  ),
  // Crescent: dark theme / night.
  crescent: (
    <>
      <path d="M20 5 A11 11 0 1 0 27 21 A9 9 0 0 1 20 5 Z" />
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
