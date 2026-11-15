import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { CardHeader, CardTitle } from "../ui/Card";
import { Pictogram } from "../worlds/Pictograms";

/**
 * Shared pieces so the 3D globe and the H3 Earth map read as the same kind of card:
 * same heading, same options menu, same cardboard zoom pins.
 */
export function MapCardHeading({ art, title, subtitle, children }: { art: string; title: string; subtitle: string; children?: ReactNode }) {
  return (
    <CardHeader className="flex flex-wrap items-center justify-between gap-3 rounded-t-[2rem] border-b-0 bg-transparent px-5 pt-5 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img src={art} alt="" width={64} height={64} draggable={false} className="h-12 w-12 shrink-0 object-contain drop-shadow-ckepi-logo sm:h-14 sm:w-14" />
        <div className="min-w-0">
          <CardTitle className="!text-lg sm:!text-xl">{title}</CardTitle>
          <p className="mt-0.5 text-sm text-content-muted">{subtitle}</p>
        </div>
      </div>
      {children}
    </CardHeader>
  );
}

export function MapOptionsMenu({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <details className="group relative">
      <summary className="ckepi-liquid flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-2xl border border-border-subtle px-4 text-sm font-semibold text-content transition hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
        {t("explore.maps.options")}
        <Pictogram name="chevronDown" className="h-4 w-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
      </summary>
      <div className="ckepi-liquid absolute right-0 top-full z-20 mt-2 flex w-72 max-w-[85vw] flex-col gap-2 rounded-2xl border border-border-subtle p-3 shadow-elevated">
        {children}
      </div>
    </details>
  );
}

/** Field style shared by the selects inside the options menu. */
export const MAP_OPTION_FIELD =
  "min-h-11 w-full rounded-xl border border-border-subtle bg-surface px-3 text-sm font-medium text-content focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function MapZoomControls({ onZoomIn, onZoomOut, onReset }: { onZoomIn: () => void; onZoomOut: () => void; onReset: () => void }) {
  const { t } = useTranslation();
  const buttons = [
    { label: t("planetaryMap.zoomIn"), onClick: onZoomIn, icon: <Pictogram name="zoomIn" className="h-6 w-6" /> },
    { label: t("planetaryMap.zoomOut"), onClick: onZoomOut, icon: <Pictogram name="zoomOut" className="h-6 w-6" /> },
    { label: t("planetaryMap.resetView"), onClick: onReset, icon: <Pictogram name="replay" className="h-5 w-5" /> },
  ];
  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={button.onClick}
          aria-label={button.label}
          className="ckepi-pin-control flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}

/** One legend entry: a coloured dot and its words. */
export function MapLegendItem({ dotClass, children }: { dotClass: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-3 w-3 rounded-full ${dotClass}`} />
      {children}
    </span>
  );
}
