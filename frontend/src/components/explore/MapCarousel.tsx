import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export interface MapSlide<T extends string> {
  id: T;
  label: string;
  art: string;
  node: ReactNode;
}

interface MapCarouselProps<T extends string> {
  slides: [MapSlide<T>, MapSlide<T>];
  active: T;
  onChange: (id: T) => void;
  /** Wide screens show both cards side by side so they can be compared at a glance. */
  wide: boolean;
  ariaLabel: string;
}

/**
 * The two map cards: side by side on wide screens, one at a time behind a liquid switcher on
 * narrow ones.
 */
export function MapCarousel<T extends string>({ slides, active, onChange, wide, ariaLabel }: MapCarouselProps<T>) {
  const reduceMotion = Boolean(useReducedMotion());

  if (wide) {
    return (
      <div className="grid grid-cols-2 items-stretch gap-6">
        {slides.map((slide) => (
          <div key={slide.id} className="h-full min-w-0">{slide.node}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LayoutGroup id="map-carousel-switch">
        <div role="group" aria-label={ariaLabel} className="ckepi-liquid mx-auto grid max-w-md grid-cols-2 gap-1 rounded-full p-1.5">
          {slides.map((slide) => {
            const isActive = slide.id === active;
            return (
              <button
                key={slide.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onChange(slide.id)}
                className={`relative flex min-h-12 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${isActive ? "text-content" : "text-content-muted hover:text-content"}`}
              >
                {isActive && (
                  <motion.span layoutId="map-carousel-lens" aria-hidden="true" transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} className="ckepi-liquid ckepi-liquid-glow absolute inset-0 rounded-full" />
                )}
                <img src={slide.art} alt="" width={40} height={40} draggable={false} className="relative h-8 w-8 object-contain" />
                <span className="relative">{slide.label}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      {/* One map at a time; the other stays mounted (hidden) so it keeps its camera and layers. */}
      {slides.map((slide) => (
        <motion.div
          key={slide.id}
          hidden={slide.id !== active}
          initial={false}
          animate={slide.id === active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="min-w-0"
        >
          {slide.node}
        </motion.div>
      ))}
    </div>
  );
}
