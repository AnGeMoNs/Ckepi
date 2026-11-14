import { lazy, Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { HexReveal } from "./components/home/HexReveal";
import { AppBackdrop } from "./components/ui/AppBackdrop";
import { HomePage } from "./pages/HomePage";
import { IntroStoryPage } from "./pages/IntroStoryPage";
import { LocalExplorePage } from "./pages/LocalExplorePage";
import { getLocalSites } from "./api/localData";
import type { PlanetarySite } from "./types/analog";
import type { ReadingMode, ThemeMode } from "./types/analog";

// The software loads only after the intro, so the home stays light.
const Header = lazy(() =>
  import("./components/layout/Header").then((m) => ({ default: m.Header }))
);
const ExplorerPage = lazy(() =>
  import("./pages/ExplorerPage").then((m) => ({ default: m.ExplorerPage }))
);

type View = "home" | "story" | "explore" | "app";

/** Home → presentation (?view=intro) → software. Shared links (?site=, ?tab=, ?profile=) open the software directly. */
function viewFromLocation(): View {
  if (typeof window === "undefined") return "home";
  const params = new URLSearchParams(window.location.search);
  if (params.get("view") === "intro") return "story";
  if (params.get("view") === "explore") return "explore";
  return ["view", "site", "tab", "profile"].some((key) => params.has(key)) ? "app" : "home";
}

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
  // Brand default is dark so the jump from the intro into the app stays coherent.
  return "dark";
}

export default function App() {
  const { t, i18n } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const [readingMode, setReadingMode] = useState<ReadingMode>("mission");
  const [view, setView] = useState<View>(viewFromLocation);
  // True only when arriving from the presentation, to play the hex-wave reveal.
  const [revealing, setRevealing] = useState(false);
  // Planetary catalog for the local mode (the science mode loads its own through hooks).
  const [sites, setSites] = useState<PlanetarySite[]>([]);
  useEffect(() => {
    if (view !== "explore" || sites.length > 0) return;
    const controller = new AbortController();
    getLocalSites(controller.signal).then(setSites).catch(() => undefined);
    return () => controller.abort();
  }, [view, sites.length]);

  useEffect(() => {
    const onPopState = () => setView(viewFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const goTo = (next: View) => {
    window.history.pushState({}, "", next === "story" ? "?view=intro" : next === "explore" ? "?view=explore" : "?view=app");
    if (next === "app") setRevealing(true);
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
    return <HomePage onEnter={() => goTo("explore")} />;
  }
  if (view === "explore") {
    return <LocalExplorePage sites={sites} onOpenScience={() => goTo("app")} />;
  }
  if (view === "story") {
    return <IntroStoryPage onEnter={() => goTo("app")} />;
  }

  return (
    <div className="relative isolate min-h-screen bg-surface text-content transition-colors">
      <AppBackdrop />
      {revealing && <HexReveal onDone={() => setRevealing(false)} />}
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
          onChangeReadingMode={setReadingMode}
        />
        <ExplorerPage theme={theme} readingMode={readingMode} />
      </Suspense>
    </div>
  );
}

