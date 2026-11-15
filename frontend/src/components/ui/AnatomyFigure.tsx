import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

export type FigureName = "slope-machine" | "gravity-bench" | "pressure-chamber" | "weather-station" | "terrain-models";

interface AnatomyFigureProps {
  name: FigureName;
  title: string;
  /** Optional world to highlight when the figure supports `?world=`. */
  world?: "earth" | "moon" | "mars";
  className?: string;
}

/**
 * Interactive isometric figure built with the open-source Anatomy skill (MIT), drawn by code from
 * real values. Each language has its own self-contained page in /public/figures.
 */
export function AnatomyFigure({ name, title, world, className = "min-h-[34rem]" }: AnatomyFigureProps) {
  const { i18n } = useTranslation();
  const frame = useRef<HTMLIFrameElement | null>(null);
  const lang = i18n.language.slice(0, 2);
  const file = `${name}-${lang === "pt" || lang === "en" ? lang : "es"}.html`;

  // Same-origin page: grow the frame to the figure's real height so its controls are never cut off.
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    let observer: ResizeObserver | null = null;
    const fit = () => {
      const doc = el.contentDocument?.documentElement;
      if (!doc) return;
      el.style.height = `${doc.scrollHeight}px`;
      observer?.disconnect();
      observer = new ResizeObserver(() => {
        el.style.height = `${doc.scrollHeight}px`;
      });
      observer.observe(doc);
    };
    el.addEventListener("load", fit);
    return () => {
      el.removeEventListener("load", fit);
      observer?.disconnect();
    };
  }, [file, world]);

  return (
    <iframe
      ref={frame}
      key={`${file}-${world ?? ""}`}
      src={`/figures/${file}${world ? `?world=${world}` : ""}`}
      title={title}
      className={`w-full rounded-3xl border-0 bg-ckepi-space ${className}`}
    />
  );
}

/**
 * True once the figure page exists. In dev the SPA fallback answers missing files with the app's
 * index.html, so the check looks for the app root instead of trusting the status code.
 */
export function useFigureAvailable(name: FigureName): boolean {
  const [available, setAvailable] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/figures/${name}-es.html`, { signal: controller.signal })
      .then(async (res) => setAvailable(res.ok && !(await res.text()).includes('id="root"')))
      .catch(() => undefined);
    return () => controller.abort();
  }, [name]);
  return available;
}
