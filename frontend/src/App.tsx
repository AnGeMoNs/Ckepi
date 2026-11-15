import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { HomePage } from "./pages/HomePage";
import { IntroStoryPage } from "./pages/IntroStoryPage";
import type { ReadingMode, ThemeMode } from "./types/analog";

// The software loads only after the intro, so the home stays light.
const Header = lazy(() =>
  import("./components/layout/Header").then((m) => ({ default: m.Header }))
);
const ExplorerPage = lazy(() =>
  import("./pages/ExplorerPage").then((m) => ({ default: m.ExplorerPage }))
);

type View = "home" | "story" | "app";

/** Home → presentation (?view=intro) → software. Shared links (?site=, ?tab=, ?profile=, ?mode=) open the software directly. */
function viewFromLocation(): View {
  if (typeof window === "undefined") return "home";
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "intro") return "story";
  return ["view", "site", "tab", "profile", "mode"].some((key) => params.has(key)) ? "app" : "home";
}

const THEME_STORAGE_KEY = "ckepi-theme";
const MODE_STORAGE_KEY = "ckepi-reading-mode";

function parseModeParam(raw: string | null): ReadingMode | null {
  if (!raw) return null;
  const val = raw.toLowerCase();
  if (val === "explorer" || val === "student" || val === "divulgacion") return "explorer";
  if (val === "mission" || val === "science" || val === "scientific") return "mission";
  return null;
}

function getInitialReadingMode(): ReadingMode {
  if (typeof window === "undefined") return "explorer";
  const params = new URLSearchParams(window.location.search);
  const fromUrl = parseModeParam(params.get("mode"));
  if (fromUrl) return fromUrl;
  try {
    const stored = parseModeParam(window.localStorage.getItem(MODE_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // Ignore storage access errors
  }
  // Preserve scientific mode if opening a deep technical query directly
  if (["tab", "site", "profile", "cell"].some((key) => params.has(key))) {
    return "mission";
  }
  return "explorer";
}

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
  // Brand default is dark so the jump from the intro into the app stays coherent.
  return "dark";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [readingMode, setReadingMode] = useState<ReadingMode>(getInitialReadingMode);
  const [view, setView] = useState<View>(viewFromLocation);

  const handleChangeReadingMode = (nextMode: ReadingMode) => {
    setReadingMode(nextMode);
    try {
      window.localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    } catch {
      // Ignore storage access errors
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("mode", nextMode === "explorer" ? "student" : "science");
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    const onPopState = () => {
      setView(viewFromLocation());
      const params = new URLSearchParams(window.location.search);
      const fromUrl = parseModeParam(params.get("mode"));
      if (fromUrl) setReadingMode(fromUrl);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goTo = (next: View, overrideMode?: ReadingMode) => {
    const targetMode = overrideMode ?? readingMode;
    if (overrideMode) {
      setReadingMode(overrideMode);
      try {
        window.localStorage.setItem(MODE_STORAGE_KEY, overrideMode);
      } catch {
        // Ignore storage access errors
      }
    }
    const url = new URL(window.location.href);
    url.searchParams.set("view", next === "story" ? "intro" : "app");
    url.searchParams.set("mode", targetMode === "explorer" ? "student" : "science");
    window.history.pushState({}, "", url.toString());
    setView(next);
    window.scrollTo({ top: 0 });
  };

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

  if (view === "home") {
    return <HomePage onEnter={(chosenMode) => goTo("story", chosenMode)} />;
  }
  if (view === "story") {
    return <IntroStoryPage onEnter={() => goTo("app")} />;
  }

  return (
    <div className="min-h-screen bg-surface text-content transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-accent-foreground focus:shadow-lg"
      >
        {t("nav.skipToContent")}
      </a>
      <Suspense fallback={<div className="min-h-screen bg-ckepi-space" aria-busy="true" />}>
        <Header
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          readingMode={readingMode}
          onChangeReadingMode={handleChangeReadingMode}
        />
        <ExplorerPage
          theme={theme}
          readingMode={readingMode}
          onChangeReadingMode={handleChangeReadingMode}
        />
      </Suspense>
    </div>
  );
}

