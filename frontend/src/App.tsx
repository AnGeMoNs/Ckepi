import { useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Header } from "./components/layout/Header";
import { ExplorerPage } from "./pages/ExplorerPage";
import type { ReadingMode, ThemeMode } from "./types/analog";

const THEME_STORAGE_KEY = "ckepi-theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }
  if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }
  return "dark";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [readingMode, setReadingMode] = useState<ReadingMode>("mission");

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage access errors
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = i18n.language.slice(0, 2) || "es";
  }, [i18n.language]);

  return (
    <div className="min-h-screen bg-surface text-content transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-foreground focus:shadow-lg"
      >
        {t("nav.skipToContent")}
      </a>
      <Header
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        readingMode={readingMode}
        onChangeReadingMode={setReadingMode}
      />
      <ExplorerPage theme={theme} readingMode={readingMode} />
    </div>
  );
}

