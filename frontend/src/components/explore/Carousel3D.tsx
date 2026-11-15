import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Pictogram } from "../worlds/Pictograms";

export interface Carousel3DPanel<T extends string> {
  id: T;
  title: string;
  /** Short status under the title, e.g. "8 of 10 active". */
  meta?: string;
  content: ReactNode;
}

interface Carousel3DProps<T extends string> {
  panels: [Carousel3DPanel<T>, Carousel3DPanel<T>];
  active: T;
  onChange: (id: T) => void;
  ariaLabel: string;
}

/**
 * Two panels on the two faces of one cardboard sheet. Turning always continues in the same
 * direction (a loop), the hidden face never shows through (backface hidden + inert), and the
 * sheet dips slightly while it turns so the rotation reads as physical.
 */
export function Carousel3D<T extends string>({ panels, active, onChange, ariaLabel }: Carousel3DProps<T>) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  const activeIndex = panels[1].id === active ? 1 : 0;
  // Half-turns made so far; its parity is the face shown. It only grows or shrinks by one.
  const [turns, setTurns] = useState(activeIndex);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (((turns % 2) + 2) % 2 !== activeIndex) setTurns((n) => n + direction);
  }, [activeIndex, turns, direction]);

  const turn = (step: 1 | -1) => {
    setDirection(step);
    onChange(panels[activeIndex === 0 ? 1 : 0].id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    turn(event.key === "ArrowRight" ? 1 : -1);
  };

  const arrow = (step: 1 | -1) => (
    <button
      type="button"
      onClick={() => turn(step)}
      aria-label={t("explore.carousel.show", { name: panels[activeIndex === 0 ? 1 : 0].title })}
      className="ckepi-pin-control flex shrink-0 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Pictogram name="chevronDown" className={`h-6 w-6 ${step === 1 ? "-rotate-90" : "rotate-90"}`} />
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="mx-auto flex max-w-4xl items-center gap-2 sm:gap-4">
        {arrow(-1)}
        <LayoutGroup id={`carousel-${ariaLabel}`}>
          <div role="group" aria-label={ariaLabel} onKeyDown={onKeyDown} className="ckepi-liquid grid min-w-0 flex-1 grid-cols-2 gap-1 rounded-3xl p-1.5">
            {panels.map((panel, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={panel.id}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => !isActive && turn(index > activeIndex ? 1 : -1)}
                  className={`relative flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 py-2 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "text-content" : "text-content-muted hover:text-content"}`}
                >
                  {isActive && (
                    <motion.span layoutId={`carousel-lens-${ariaLabel}`} aria-hidden="true" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} className="ckepi-liquid ckepi-liquid-glow absolute inset-0 rounded-2xl" />
                  )}
                  <span className="relative text-sm font-bold leading-snug sm:text-base">{panel.title}</span>
                  {panel.meta && <span className="relative mt-0.5 font-mono text-xs tabular-nums text-content-muted">{panel.meta}</span>}
                </button>
              );
            })}
          </div>
        </LayoutGroup>
        {arrow(1)}
      </div>

      <div className="[perspective:2200px]">
        <motion.div
          className="grid [transform-style:preserve-3d]"
          initial={false}
          animate={reduceMotion ? { rotateY: 0 } : { rotateY: -turns * 180 }}
          transition={{ type: "spring", stiffness: 70, damping: 16, mass: 1.1 }}
        >
          {panels.map((panel, index) => (
            <Face key={panel.id} isActive={index === activeIndex} flipped={index === 1} reduceMotion={reduceMotion}>
              {panel.content}
            </Face>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function Face({ isActive, flipped, reduceMotion, children }: { isActive: boolean; flipped: boolean; reduceMotion: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  // The face turned away cannot be reached by keyboard or screen readers.
  useEffect(() => {
    if (ref.current) ref.current.inert = !isActive;
  }, [isActive]);

  const hiddenWhenReduced = reduceMotion && !isActive ? "hidden" : "";
  return (
    <div
      ref={ref}
      aria-hidden={!isActive}
      className={`min-w-0 [backface-visibility:hidden] [grid-area:1/1] ${flipped && !reduceMotion ? "[transform:rotateY(180deg)]" : ""} ${hiddenWhenReduced}`}
    >
      {children}
    </div>
  );
}
