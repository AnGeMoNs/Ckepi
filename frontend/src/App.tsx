import { useEffect, useState } from "react";

import { Header } from "./components/layout/Header";
import { ExplorerPage } from "./pages/ExplorerPage";
import type { ReadingMode, ThemeMode } from "./types/analog";

export default function App() {
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

