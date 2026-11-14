import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Header } from "./components/layout/Header";
import { ExplorerPage } from "./pages/ExplorerPage";
import type { ReadingMode, ThemeMode } from "./types/analog";

export default function App() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [readingMode, setReadingMode] = useState<ReadingMode>("mission");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

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

