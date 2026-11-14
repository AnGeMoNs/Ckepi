import type { ThemeMode } from "../types/analog";

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

const MAP_PALETTES: Record<ThemeMode, MapColorsPalette> = {
  light: {
    matchHigh: "#059669",
    matchMid: "#d97706",
    matchLow: "#dc2626",
    selectedOutline: "#0f172a",
    defaultOutline: "#475569",
  },
  dark: {
    matchHigh: "#2ee57a",
    matchMid: "#ffb000",
    matchLow: "#ff453a",
    selectedOutline: "#ffffff",
    defaultOutline: "#0b0d10",
  },
};

const PLANET_MARKER_PALETTES: Record<ThemeMode, PlanetMarkerPalette> = {
  light: {
    spaceBackground: 0x0b0d10,
    sphereFallback: 0x475569,
    activeTarget: 0xffffff,
    trackedZone: 0x10b981,
    estimatedProbe: 0xf59e0b,
  },
  dark: {
    spaceBackground: 0x0b0d10,
    sphereFallback: 0x2a2f36,
    activeTarget: 0xffffff,
    trackedZone: 0x2ee57a,
    estimatedProbe: 0xffb000,
  },
};

export function getMapColors(theme: ThemeMode): MapColorsPalette {
  return MAP_PALETTES[theme];
}

export function getPlanetMarkerColors(theme: ThemeMode): PlanetMarkerPalette {
  return PLANET_MARKER_PALETTES[theme];
}

export const MAP_COLORS = MAP_PALETTES.dark;
export const PLANET_MARKER_COLORS = PLANET_MARKER_PALETTES.dark;
