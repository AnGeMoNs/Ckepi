/**
 * Centralized color tokens for MapLibre GL and Three.js renderers
 * (which require numeric/hex strings rather than Tailwind utility classes).
 */
export const MAP_COLORS = {
  matchHigh: "#2EE57A",
  matchMid: "#FFB000",
  matchLow: "#FF453A",
  selectedOutline: "#FFFFFF",
  defaultOutline: "#0B0D10",
} as const;

export const PLANET_MARKER_COLORS = {
  spaceBackground: 0x0B0D10,
  sphereFallback: 0x2A2F36,
  activeTarget: 0xFFFFFF,
  trackedZone: 0x2EE57A,
  estimatedProbe: 0xFFB000,
} as const;

