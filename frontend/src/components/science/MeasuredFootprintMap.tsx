import { useTranslation } from "react-i18next";
import { YUNGAY_CONTROL, type MeasuredCell } from "./measuredCells";

interface Props { cells: MeasuredCell[]; selected: string; onSelect: (h3: string) => void; format: (value: number, digits?: number) => string }

/** Lightweight lon/lat schematic using real H3 boundaries, not a generated terrain image. */
export function MeasuredFootprintMap({ cells, selected, onSelect, format }: Props) {
  const { t } = useTranslation();
  if (!cells.length) return null;
  const points = cells.flatMap((c) => [...c.boundary, [c.lon, c.lat] as [number, number]]);
  points.push([YUNGAY_CONTROL.lon, YUNGAY_CONTROL.lat]);
  const minLon = Math.min(...points.map((p) => p[0])) - 0.25;
  const maxLon = Math.max(...points.map((p) => p[0])) + 0.25;
  const minLat = Math.min(...points.map((p) => p[1])) - 0.2;
  const maxLat = Math.max(...points.map((p) => p[1])) + 0.2;
  const x = (lon: number) => 55 + (lon - minLon) / (maxLon - minLon) * 610;
  const y = (lat: number) => 35 + (maxLat - lat) / (maxLat - minLat) * 310;
  return (
    <div className="bg-surface-muted/50 px-2 py-4">
      <svg viewBox="0 0 720 400" className="w-full" role="group" aria-label={t("dashboard.geographicMap")}>
        <defs><pattern id="dashboard-map-grid" width="36" height="36" patternUnits="userSpaceOnUse"><path d="M36 0 H0 V36" fill="none" className="stroke-content/10" /></pattern></defs>
        <rect x="45" y="25" width="640" height="335" rx="16" fill="url(#dashboard-map-grid)" />
        {cells.map((cell) => <g key={cell.h3} role="button" tabIndex={0} aria-pressed={selected === cell.h3} aria-label={t("science.map.cellAria", { cell: cell.h3, w1: format(cell.w1Deg) })} className="cursor-pointer outline-none focus:opacity-60" onClick={() => onSelect(cell.h3)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(cell.h3); } }}>
          <polygon points={cell.boundary.map(([lon, lat]) => `${x(lon)},${y(lat)}`).join(" ")} className={selected === cell.h3 ? "fill-ckepi-copper/25 stroke-accent" : "fill-content/5 stroke-content/30"} strokeWidth={selected === cell.h3 ? 3 : 1.5} />
          <image href="/img/science-accessories/ckepi-pin-location.webp" x={x(cell.lon) - 18} y={y(cell.lat) - 58} width="36" height="36" />
          <circle cx={x(cell.lon)} cy={y(cell.lat)} r="25" className="fill-surface stroke-accent" strokeWidth="1.5" />
          <text x={x(cell.lon)} y={y(cell.lat) + 5} textAnchor="middle" className="fill-content font-mono text-sm font-bold">{format(cell.w1Deg)}°</text>
        </g>)}
        <circle cx={x(YUNGAY_CONTROL.lon)} cy={y(YUNGAY_CONTROL.lat)} r="6" className="fill-ckepi-sulfur stroke-content" />
        <text x={x(YUNGAY_CONTROL.lon) - 12} y={y(YUNGAY_CONTROL.lat) + 25} textAnchor="end" className="fill-content text-xs">{t("science.map.yungay")}</text>
        {[minLon, (minLon + maxLon) / 2, maxLon].map((lon) => <text key={lon} x={x(lon)} y="385" textAnchor="middle" className="fill-content-muted font-mono text-xs">{format(lon, 1)}°</text>)}
        {[minLat, maxLat].map((lat) => <text key={lat} x="8" y={y(lat) + 4} className="fill-content-muted font-mono text-xs">{format(lat, 1)}°</text>)}
      </svg>
      <p className="px-3 text-xs text-content-muted">{t("dashboard.geographicMap")}</p>
    </div>
  );
}
