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
      },
    },
  },
  plugins: [],
};

export default config;

