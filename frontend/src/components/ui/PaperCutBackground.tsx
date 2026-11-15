import { useEffect, useRef, useState, type ReactNode } from "react";
import { SHOW_AI_WATERMARKS } from "../../config/aiDisclosure";
import "./PaperCutBackground.css";

export type PaperCutScene =
  | "home"
  | "el-problema"
  | "que-hace-ckepi"
  | "el-hallazgo"
  | "el-limite-honesto"
  | "explorador";

interface PaperCutBackgroundProps {
  scene: PaperCutScene;
  children: ReactNode;
  /** Set false for inactive steps; hidden steps never request an image. */
  active?: boolean;
  className?: string;
}

/** Decorative AI illustration; neither orbital imagery nor measured terrain. */
export function PaperCutBackground({
  scene,
  children,
  active = true,
  className = "",
}: PaperCutBackgroundProps) {
  const root = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const element = root.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: "0px", threshold: 0 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  const base = `/img/backgrounds/ckepi-${scene}`;
  return (
    <div ref={root} className={`ckepi-paper-section ${className}`} data-paper-scene={scene}>
      {active && visible && (
        <>
          <picture className="ckepi-paper-art" aria-hidden="true">
            <source media="(max-width: 767px)" srcSet={`${base}-mobile.webp`} type="image/webp" />
            <img src={`${base}-desktop.webp`} alt="" width={2560} height={1440} decoding="async" />
          </picture>
          {SHOW_AI_WATERMARKS && <span className="ckepi-paper-watermark">AI-generated · Ckepi</span>}
        </>
      )}
      <div className="ckepi-paper-content">{children}</div>
    </div>
  );
}
