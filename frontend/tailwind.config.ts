import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Public Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        "surface-muted": "rgb(var(--color-surface-muted) / <alpha-value>)",
        content: "rgb(var(--color-content) / <alpha-value>)",
        "content-muted": "rgb(var(--color-content-muted) / <alpha-value>)",
        "border-subtle": "rgb(var(--color-border-subtle) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-foreground": "rgb(var(--color-accent-foreground) / <alpha-value>)",
        "status-valid": "rgb(var(--color-status-valid) / <alpha-value>)",
        "status-warn": "rgb(var(--color-status-warn) / <alpha-value>)",
        "status-break": "rgb(var(--color-status-break) / <alpha-value>)",
        "planet-mars": "rgb(var(--color-planet-mars) / <alpha-value>)",
        "planet-moon": "rgb(var(--color-planet-moon) / <alpha-value>)",
        "world-earth": "rgb(var(--color-world-earth) / <alpha-value>)",
        "world-moon": "rgb(var(--color-world-moon) / <alpha-value>)",
        "world-mars": "rgb(var(--color-world-mars) / <alpha-value>)",
        // Brand kit V2 «sal · cobre · azufre» (frontend/public/img/ckepi/tokens.json),
        // named by Atacama mineral. Copper is the primary action colour.
        "ckepi-space": "#101F24",
        "ckepi-ink": "#183A3A",
        "ckepi-salt": "#FFF2D7",
        "ckepi-copper": "#E8A080",
        "ckepi-sulfur": "#E4ED83",
        "ckepi-paper": "#FFF2D7",
        // Charcoal paper hexagons, matching the last frame of the home video.
        "ckepi-hex-bg": "#0E1013",
        "ckepi-hex": "#1C1F26",
        "ckepi-hex-edge": "#2A2E37",
      },
      boxShadow: {
        elevated: "0 12px 32px -12px rgb(15 23 42 / 0.28)",
        "ckepi-glow": "0 0 32px rgb(232 160 128 / 0.40)",
      },
      dropShadow: {
        "ckepi-logo": "0 8px 24px rgb(0 0 0 / 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;

