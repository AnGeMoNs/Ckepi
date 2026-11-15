import { LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { PaperPlanetImage } from "../ui/PaperPlanetImage";
import { Pictogram, type PictogramName } from "../worlds/Pictograms";

export interface RouteStation {
  id: string;
  label: string;
  pictogram: PictogramName;
}

interface MissionRouteProps {
  stations: RouteStation[];
  current: number;
  earned: ReadonlySet<string>;
  onGo: (index: number) => void;
}

/**
 * The mission as a route from Earth to Mars: one cardboard hexagon per station. Earned stations
 * are stamped copper with a tick; a small rover rides to the current one.
 */
export function MissionRoute({ stations, current, earned, onGo }: MissionRouteProps) {
  const { t } = useTranslation();
  const reduceMotion = Boolean(useReducedMotion());
  return (
    <nav aria-label={t("steam.route.label")} className="ckepi-liquid rounded-[2rem] px-3 py-4 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden shrink-0 flex-col items-center sm:flex">
          <PaperPlanetImage planet="earth" floating={false} className="h-14 w-14" />
          <span className="mt-1 text-xs font-semibold text-content-muted">{t("steam.route.earth")}</span>
        </span>

        <LayoutGroup id="mission-route">
          <ol className="relative flex min-w-0 flex-1 items-start justify-between gap-1">
            {/* Dotted orbit the stations sit on. */}
            <span aria-hidden="true" className="absolute left-6 right-6 top-6 border-t-2 border-dashed border-content-muted/40" />
            {stations.map((station, index) => {
              const done = earned.has(station.id);
              const isCurrent = index === current;
              return (
                <li key={station.id} className="relative flex min-w-0 flex-1 flex-col items-center">
                  <button
                    type="button"
                    onClick={() => onGo(index)}
                    aria-current={isCurrent ? "step" : undefined}
                    aria-label={`${station.label}${done ? ` · ${t("steam.route.done")}` : ""}`}
                    className="relative grid h-12 w-12 place-items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:h-14 sm:w-14"
                  >
                    <motion.span
                      aria-hidden="true"
                      className={`absolute inset-0 [clip-path:polygon(25%_4%,75%_4%,100%_50%,75%_96%,25%_96%,0%_50%)] ${
                        done ? "bg-accent" : isCurrent ? "bg-ckepi-salt" : "bg-surface-muted"
                      }`}
                      initial={false}
                      animate={done && !reduceMotion ? { scale: [1.5, 0.92, 1], rotate: [-12, 4, 0] } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                    <Pictogram
                      name={done ? "check" : station.pictogram}
                      className={`relative h-6 w-6 sm:h-7 sm:w-7 ${done || isCurrent ? "text-ckepi-ink" : "text-content-muted"}`}
                    />
                  </button>
                  {isCurrent && (
                    <motion.span
                      layoutId="mission-rover"
                      aria-hidden="true"
                      className="mt-1 text-accent"
                      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 22 }}
                    >
                      <Pictogram name="rover" className="h-6 w-6" />
                    </motion.span>
                  )}
                  <span className={`mt-1 hidden max-w-full truncate text-center text-xs font-semibold md:block ${isCurrent ? "text-content" : "text-content-muted"}`}>
                    {station.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </LayoutGroup>

        <span className="hidden shrink-0 flex-col items-center sm:flex">
          <PaperPlanetImage planet="mars" floating={false} className="h-14 w-14" />
          <span className="mt-1 text-xs font-semibold text-content-muted">{t("steam.route.mars")}</span>
        </span>
      </div>
    </nav>
  );
}
