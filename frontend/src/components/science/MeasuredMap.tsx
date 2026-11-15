import { useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useTranslation } from "react-i18next";

import { YUNGAY_CONTROL, type MeasuredCell } from "./measuredCells";

/** NASA GIBS true-colour mosaic (VIIRS SNPP) as the base: NASA imagery, no API key. */
const GIBS_VIIRS =
  "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2024-03-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg";
const CARTO_LABELS = "https://basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png";

interface MeasuredMapProps {
  cells: MeasuredCell[];
  selected: string;
  onSelect: (h3: string) => void;
  format: (value: number, digits?: number) => string;
}

/**
 * Only the zones that matter: the Antofagasta cells measured at 30 m and the classic control.
 * Each cell carries its W₁ on the map itself, so the closest one is visible at a glance.
 */
export function MeasuredMap({ cells, selected, onSelect, format }: MeasuredMapProps) {
  const { t } = useTranslation();
  const container = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [failed, setFailed] = useState(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    const created: Marker[] = [];
    (async () => {
      // MapLibre is loaded only here, so the rest of the app stays light.
      const [lib, worker] = await Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl-worker.mjs?url")]);
      if (cancelled || !container.current) return;
      lib.setWorkerUrl(worker.default);
      const yungayW1 = cells[0]?.yungayW1Deg ?? 0;
      const map = new lib.Map({
        container: container.current,
        attributionControl: { compact: true },
        style: {
          version: 8,
          sources: {
            gibs: {
              type: "raster",
              tiles: [GIBS_VIIRS],
              tileSize: 256,
              maxzoom: 9,
              attribution: "Imagery: NASA EOSDIS GIBS · VIIRS SNPP",
            },
            labels: {
              type: "raster",
              tiles: [CARTO_LABELS],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors © CARTO",
            },
            cells: {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: cells.map((c) => ({
                  type: "Feature",
                  properties: { h3: c.h3, closer: c.w1Deg < yungayW1 },
                  geometry: { type: "Polygon", coordinates: [[...c.boundary, c.boundary[0]]] },
                })),
              },
            },
          },
          layers: [
            { id: "gibs", type: "raster", source: "gibs" },
            { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.8 } },
            {
              id: "cells-fill",
              type: "fill",
              source: "cells",
              paint: { "fill-color": ["case", ["get", "closer"], "#E8A080", "#C1440E"], "fill-opacity": 0.28 },
            },
            {
              id: "cells-line",
              type: "line",
              source: "cells",
              paint: { "line-color": ["case", ["get", "closer"], "#E8A080", "#FFF2D7"], "line-width": 1.5 },
            },
            {
              id: "cells-selected",
              type: "line",
              source: "cells",
              filter: ["==", ["get", "h3"], selected],
              paint: { "line-color": "#E4ED83", "line-width": 4 },
            },
          ],
        },
        bounds: [
          [Math.min(...cells.map((c) => c.lon), YUNGAY_CONTROL.lon) - 1, Math.min(...cells.map((c) => c.lat), YUNGAY_CONTROL.lat) - 0.9],
          [Math.max(...cells.map((c) => c.lon), YUNGAY_CONTROL.lon) + 1, Math.max(...cells.map((c) => c.lat), YUNGAY_CONTROL.lat) + 0.9],
        ],
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.addControl(new lib.NavigationControl({ showCompass: false }), "top-right");
      map.on("error", () => { if (!cancelled) setFailed(true); });
      map.on("click", "cells-fill", (e) => {
        const h3 = e.features?.[0]?.properties?.h3;
        if (typeof h3 === "string") onSelectRef.current(h3);
      });
      mapRef.current = map;

      // One readable tag per cell: its W₁ in degrees. Buttons, so they work with keyboard and touch.
      markers.current.clear();
      for (const cell of cells) {
        const el = document.createElement("button");
        el.type = "button";
        el.className = "ckepi-map-tag";
        el.textContent = `${format(cell.w1Deg)}°`;
        el.setAttribute("aria-label", t("science.map.cellAria", { cell: cell.h3, w1: format(cell.w1Deg) }));
        el.addEventListener("click", () => onSelectRef.current(cell.h3));
        markers.current.set(cell.h3, el);
        created.push(new lib.Marker({ element: el }).setLngLat([cell.lon, cell.lat]).addTo(map));
      }
      const control = document.createElement("span");
      control.className = "ckepi-map-tag ckepi-map-tag-control";
      control.textContent = `${t("science.map.yungay")} ${format(yungayW1)}°`;
      created.push(new lib.Marker({ element: control, anchor: "right", offset: [-10, 0] }).setLngLat([YUNGAY_CONTROL.lon, YUNGAY_CONTROL.lat]).addTo(map));
    })().catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => {
      cancelled = true;
      created.forEach((m) => m.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // The map is built once per cell set; selection is applied in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cells]);

  useEffect(() => {
    const map = mapRef.current;
    const apply = () => map?.setFilter("cells-selected", ["==", ["get", "h3"], selected]);
    if (map?.isStyleLoaded()) apply();
    else map?.once("load", apply);
    markers.current.forEach((el, h3) => el.setAttribute("aria-pressed", String(h3 === selected)));
  }, [selected]);

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div ref={container} className="h-80 w-full sm:h-[28rem]" role="region" aria-label={t("science.map.label")} />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center bg-surface/90 p-6 text-center text-base" role="status">
          {t("science.map.failed")}
        </p>
      )}
    </div>
  );
}
