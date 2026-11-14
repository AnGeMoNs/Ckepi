import type { ThemeMode } from "../types/analog";

function readCssToken(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

function hexToNumber(hex: string, fallback: number): number {
  const cleaned = hex.replace(/^#/, "");
  const parsed = Number.parseInt(cleaned, 16);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export interface MapColorsPalette {
  matchHigh: string;
  matchMid: string;
  matchLow: string;
  selectedOutline: string;
  defaultOutline: string;
}

export interface PlanetMarkerPalette {
  spaceBackground: number;
  sphereFallback: number;
  activeTarget: number;
  trackedZone: number;
  estimatedProbe: number;
}

export function getMapColors(theme: ThemeMode): MapColorsPalette {
  const isDark = theme === "dark";
  return {
    matchHigh: readCssToken("--color-map-match-high", isDark ? "#2ee57a" : "#059669"),
    matchMid: readCssToken("--color-map-match-mid", isDark ? "#ffb000" : "#d97706"),
    matchLow: readCssToken("--color-map-match-low", isDark ? "#ff453a" : "#dc2626"),
    selectedOutline: readCssToken(
      "--color-map-outline-selected",
      isDark ? "#ffffff" : "#0f172a"
    ),
    defaultOutline: readCssToken(
      "--color-map-outline-default",
      isDark ? "#0b0d10" : "#475569"
    ),
  };
}

export function getPlanetMarkerColors(theme: ThemeMode): PlanetMarkerPalette {
  const isDark = theme === "dark";
  return {
    spaceBackground: hexToNumber(readCssToken("--color-planet-space", "#0b0d10"), 0x0b0d10),
    sphereFallback: hexToNumber(
      readCssToken("--color-planet-sphere", isDark ? "#2a2f36" : "#475569"),
      isDark ? 0x2a2f36 : 0x475569
    ),
    activeTarget: hexToNumber(readCssToken("--color-planet-active", "#ffffff"), 0xffffff),
    trackedZone: hexToNumber(
      readCssToken("--color-planet-tracked", isDark ? "#2ee57a" : "#10b981"),
      isDark ? 0x2ee57a : 0x10b981
    ),
    estimatedProbe: hexToNumber(
      readCssToken("--color-planet-estimated", isDark ? "#ffb000" : "#f59e0b"),
      isDark ? 0xffb000 : 0xf59e0b
    ),
  };
}

export const MAP_COLORS: MapColorsPalette = {
  matchHigh: "#2EE57A",
  matchMid: "#FFB000",
  matchLow: "#FF453A",
  selectedOutline: "#FFFFFF",
  defaultOutline: "#0B0D10",
};

export const PLANET_MARKER_COLORS: PlanetMarkerPalette = {
  spaceBackground: 0x0b0d10,
  sphereFallback: 0x2a2f36,
  activeTarget: 0xffffff,
  trackedZone: 0x2ee57a,
  estimatedProbe: 0xffb000,
};
