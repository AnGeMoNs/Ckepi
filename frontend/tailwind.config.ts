import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
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
        // Brand kit (frontend/public/img/ckepi/tokens.json)
        "ckepi-space": "#05070D",
        "ckepi-ink": "#132A38",
        "ckepi-earth": "#38BDF8",
        "ckepi-moon": "#CBD5E1",
        "ckepi-mars": "#FB923C",
        "ckepi-paper": "#F5F2EB",
        "ckepi-hex": "#1C1F26",
        "ckepi-hex-edge": "#2A2E37",
      },
      boxShadow: {
        elevated: "0 12px 32px -12px rgb(15 23 42 / 0.28)",
        "ckepi-glow": "0 0 32px rgb(251 146 60 / 0.45)",
      },
      dropShadow: {
        "ckepi-logo": "0 8px 24px rgb(0 0 0 / 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;

