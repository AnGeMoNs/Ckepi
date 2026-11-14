import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Globe, MapPin, Mountain, Sparkles, ZoomIn } from "lucide-react";
import * as maplibregl from "maplibre-gl";
import { useTranslation } from "react-i18next";

import { formatNumber, formatPercent } from "../../i18n";
import { MAP_COLORS } from "../../theme/mapColors";
import type { AnalogMatchItem, EarthOverlayLayer, ThemeMode } from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

interface AnalogMapProps {
  matches: AnalogMatchItem[];
  totalEvaluated: number;
  selectedH3: string | null;
  theme: ThemeMode;
  probingCoords: { lat: number; lon: number } | null;
  isRefining?: boolean;
  drilldownState?: { parentH3: string; childIds: string[] } | null;
  onSelectCell: (h3Index: string) => void;
  onProbeCoordinate: (lat: number, lon: number) => void;
  onRefineCell?: (h3Index: string) => void;
  onExitDrilldown?: () => void;
}

const GIBS_TILES: Record<Exclude<EarthOverlayLayer, "basemap">, string> = {
  satellite_hd:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  sentinel2_cloudless:
    "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg",
  gibs_truecolor:
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/2024-03-15/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg",
  gibs_lst:
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Land_Surface_Temp_Day/default/2024-03-15/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png",
  gibs_aerosol:
    "https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Aerosol/default/2024-03-15/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png",
};

const OPAQUE_IMAGERY_LAYERS = new Set<EarthOverlayLayer>([
  "satellite_hd",
  "sentinel2_cloudless",
  "gibs_truecolor",
]);

function buildRasterMapStyle(
  theme: ThemeMode,
  overlay: EarthOverlayLayer,
  isGlobe: boolean,
  isTerrain3d: boolean
): maplibregl.StyleSpecification {
  const cartoKey = import.meta.env.VITE_CARTO_API_KEY as string | undefined;
  const keyQuery = cartoKey ? `?key=${encodeURIComponent(cartoKey)}` : "";
  const baseTileUrl =
    theme === "dark"
      ? `https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${keyQuery}`
      : `https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png${keyQuery}`;

  const sources: maplibregl.StyleSpecification["sources"] = {
    carto: {
      type: "raster",
      tiles: [baseTileUrl],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors © CARTO",
    },
    "terrarium-dem": {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{y}/{x}.png"],
      tileSize: 256,
      maxzoom: 15,
      encoding: "terrarium",
      attribution: "AWS Open Data Terrarium DEM (SRTM/ASTER)",
    },
  };

  const layers: maplibregl.StyleSpecification["layers"] = [
    {
      id: "carto-basemap",
      type: "raster",
      source: "carto",
    },
  ];

  if (overlay !== "basemap") {
    sources.gibs = {
      type: "raster",
      tiles: [GIBS_TILES[overlay]],
      tileSize: 256,
      attribution:
        overlay === "satellite_hd"
          ? "ESRI World Imagery"
          : overlay === "sentinel2_cloudless"
          ? "ESA Sentinel-2 Cloudless (EOX)"
          : "NASA Worldview GIBS",
    };
    layers.push({
      id: "nasa-gibs-overlay",
      type: "raster",
      source: "gibs",
      paint: {
        "raster-opacity": OPAQUE_IMAGERY_LAYERS.has(overlay) ? 1.0 : 0.72,
      },
    });
  }

  return {
    version: 8,
    projection: {
      type: isGlobe ? "globe" : "mercator",
    },
    terrain: isTerrain3d
      ? {
          source: "terrarium-dem",
          exaggeration: 1.5,
        }
      : undefined,
    sources,
    layers,
  };
}

export function AnalogMap({
  matches,
  totalEvaluated,
  selectedH3,
  theme,
  probingCoords,
  isRefining = false,
  drilldownState = null,
  onSelectCell,
  onProbeCoordinate,
  onRefineCell,
  onExitDrilldown,
}: AnalogMapProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const onSelectRef = useRef(onSelectCell);
  const onProbeRef = useRef(onProbeCoordinate);
  onSelectRef.current = onSelectCell;
  onProbeRef.current = onProbeCoordinate;

  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [overlayLayer, setOverlayLayer] = useState<EarthOverlayLayer>("satellite_hd");
  const [isGlobe, setIsGlobe] = useState(true);
  const [isTerrain3d, setIsTerrain3d] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const displayedMatches = useMemo(() => {
    if (!drilldownState) return matches;
    const childSet = new Set(drilldownState.childIds);
    return matches.filter((m) => childSet.has(m.earth_cell_h3));
  }, [matches, drilldownState]);

  const selectedMatch = useMemo(
    () => matches.find((m) => m.earth_cell_h3 === selectedH3) ?? null,
    [matches, selectedH3]
  );

  const selectedRank = useMemo(() => {
    if (!selectedH3) return null;
    const idx = displayedMatches.findIndex((m) => m.earth_cell_h3 === selectedH3);
    return idx >= 0 ? idx + 1 : null;
  }, [displayedMatches, selectedH3]);

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(displayedMatches.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagedMatches = displayedMatches.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [displayedMatches]);

  useEffect(() => {
    if (!selectedH3) return;
    const idx = displayedMatches.findIndex((m) => m.earth_cell_h3 === selectedH3);
    if (idx >= 0) {
      const targetPage = Math.floor(idx / pageSize) + 1;
      setCurrentPage((prev) => (prev === targetPage ? prev : targetPage));
    }
  }, [selectedH3, displayedMatches]);

  // Unwrap & subdivide hexagon edges so large H3 cells follow the 3D globe curvature cleanly
  const densifyRing = (
    ring: number[][],
    refLon: number,
    segmentsPerEdge = 8
  ): number[][] => {
    if (ring.length < 2) return ring;
    const unwrapped = ring.map(([lon, lat]) => {
      let adj = lon;
      while (adj - refLon > 180) adj -= 360;
      while (adj - refLon < -180) adj += 360;
      return [adj, lat];
    });
    const out: number[][] = [];
    for (let i = 0; i < unwrapped.length - 1; i++) {
      const [lon1, lat1] = unwrapped[i];
      const [lon2, lat2] = unwrapped[i + 1];
      for (let s = 0; s < segmentsPerEdge; s++) {
        const t = s / segmentsPerEdge;
        out.push([lon1 + (lon2 - lon1) * t, lat1 + (lat2 - lat1) * t]);
      }
    }
    if (out.length > 0) {
      out.push(out[0]);
    }
    return out;
  };

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: matches
        .filter((m) => !drilldownState || m.earth_cell_h3 !== drilldownState.parentH3)
        .map((m) => ({
          type: "Feature" as const,
          properties: {
            earth_cell_h3: m.earth_cell_h3,
            combined_score: m.combined_score,
            is_selected: m.earth_cell_h3 === selectedH3 ? 1 : 0,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [
              densifyRing(
                m.h3_boundary,
                m.coordinates.lon,
                m.h3_resolution >= 3 ? 3 : 6
              ),
            ],
          },
        })),
    }),
    [matches, selectedH3, drilldownState]
  );

  const latestGeojsonRef = useRef(geojson);
  latestGeojsonRef.current = geojson;

  const attachAnalogLayers = (map: maplibregl.Map) => {
    if (!map.getSource("h3-analogs")) {
      map.addSource("h3-analogs", {
        type: "geojson",
        data: latestGeojsonRef.current,
        promoteId: "earth_cell_h3",
      });

      map.addLayer({
        id: "h3-analogs-fill",
        type: "fill",
        source: "h3-analogs",
        paint: {
          "fill-color": [
            "case",
            [">=", ["get", "combined_score"], 0.75],
            MAP_COLORS.matchHigh,
            [">=", ["get", "combined_score"], 0.55],
            MAP_COLORS.matchMid,
            MAP_COLORS.matchLow,
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "is_selected"], 1],
            0.46,
            0.28,
          ],
        },
      });

      map.addLayer({
        id: "h3-analogs-outline",
        type: "line",
        source: "h3-analogs",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "is_selected"], 1],
            MAP_COLORS.selectedOutline,
            [">=", ["get", "combined_score"], 0.75],
            MAP_COLORS.matchHigh,
            [">=", ["get", "combined_score"], 0.55],
            MAP_COLORS.matchMid,
            MAP_COLORS.matchLow,
          ],
          "line-width": [
            "case",
            ["==", ["get", "is_selected"], 1],
            4.5,
            2.2,
          ],
        },
      });
    }
  };

  // Initialize MapLibre instance
  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) {
      return;
    }

    try {
      const map = new maplibregl.Map({
        container,
        style: buildRasterMapStyle(theme, overlayLayer, isGlobe, isTerrain3d),
        center: [10, 18],
        zoom: 1.5,
        maxPitch: 70,
        attributionControl: false,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

      map.on("style.load", () => {
        attachAnalogLayers(map);
        setMapReady(true);
      });

      map.on("click", (ev: maplibregl.MapMouseEvent) => {
        const hasFill = Boolean(map.getLayer("h3-analogs-fill"));
        const features = hasFill
          ? map.queryRenderedFeatures(ev.point, { layers: ["h3-analogs-fill"] })
          : [];
        const h3Id = features[0]?.properties?.earth_cell_h3;
        if (typeof h3Id === "string") {
          onSelectRef.current(h3Id);
        } else {
          onProbeRef.current(ev.lngLat.lat, ev.lngLat.lng);
        }
      });

      map.on("mouseenter", "h3-analogs-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "h3-analogs-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("error", () => {
        // Keep map resilient if tile server is unreachable offline
      });

      mapRef.current = map;
    } catch {
      setMapFailed(true);
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update GeoJSON data whenever matches or selectedH3 changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const polySource = map.getSource("h3-analogs") as maplibregl.GeoJSONSource | undefined;
    polySource?.setData(geojson);
  }, [geojson, mapReady]);

  // Fly smoothly to selected H3 hexagon
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !selectedH3) return;
    const target = matches.find((m) => m.earth_cell_h3 === selectedH3);
    if (target) {
      const targetZoom =
        target.h3_resolution >= 5
          ? 7.2
          : target.h3_resolution === 4
          ? 6.0
          : target.h3_resolution === 3
          ? 4.6
          : 2.8;
      map.easeTo({
        center: [target.coordinates.lon, target.coordinates.lat],
        zoom: Math.max(map.getZoom(), targetZoom),
        pitch: isTerrain3d ? 30 : 0,
        duration: 650,
      });
    }
  }, [selectedH3, matches, mapReady, isTerrain3d]);

  // Switch basemap/GIBS overlay tiles on theme or overlay change and re-attach H3 layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.once("style.load", () => {
      attachAnalogLayers(map);
    });
    map.setStyle(buildRasterMapStyle(theme, overlayLayer, isGlobe, isTerrain3d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, overlayLayer]);

  // Toggle between 3D Globe and 2D Mercator projection without reloading layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setProjection({ type: isGlobe ? "globe" : "mercator" });
  }, [isGlobe, mapReady]);

  // Toggle 3D elevation terrain (Terrarium DEM)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    map.setTerrain(isTerrain3d ? { source: "terrarium-dem", exaggeration: 1.5 } : null);
  }, [isTerrain3d, mapReady]);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-accent" aria-hidden="true" />
          <CardTitle>{t("map.title")}</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="earth-gibs-layer" className="sr-only">
            {t("map.layerLabel")}
          </label>
          <select
            id="earth-gibs-layer"
            value={overlayLayer}
            onChange={(e) => setOverlayLayer(e.target.value as EarthOverlayLayer)}
            className="min-h-11 rounded border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <option value="satellite_hd">{t("map.layers.satellite_hd")}</option>
            <option value="sentinel2_cloudless">{t("map.layers.sentinel2_cloudless")}</option>
            <option value="gibs_truecolor">{t("map.layers.gibs_truecolor")}</option>
            <option value="gibs_lst">{t("map.layers.gibs_lst")}</option>
            <option value="gibs_aerosol">{t("map.layers.gibs_aerosol")}</option>
            <option value="basemap">{t("map.layers.basemap")}</option>
          </select>
          <button
            type="button"
            aria-pressed={isGlobe}
            onClick={() => setIsGlobe((prev) => !prev)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-content hover:bg-surface-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <Globe className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>{isGlobe ? t("map.globe3d") : t("map.flat2d")}</span>
          </button>
          <button
            type="button"
            aria-pressed={isTerrain3d}
            onClick={() => setIsTerrain3d((prev) => !prev)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 ${
              isTerrain3d
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border-subtle bg-surface text-content-muted hover:bg-surface-muted"
            }`}
          >
            <Mountain className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t("map.terrain3d")}</span>
          </button>
          {selectedH3 && onRefineCell && (
            <button
              type="button"
              disabled={isRefining}
              onClick={() => onRefineCell(selectedH3)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isRefining ? t("map.refiningZone") : t("map.refineZone")}</span>
            </button>
          )}
          <Badge variant="default">
            {t("map.evaluatedCount", { count: totalEvaluated })}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-content-muted">
          <span>
            {t("map.subtitle")} <strong className="text-accent">{t("map.probeHint")}</strong>
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-status-valid" />
              {t("map.legendHigh")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-status-warn" />
              {t("map.legendMid")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-content-muted" />
              {t("map.legendLow")}
            </span>
          </div>
        </div>

        {probingCoords && (
          <div
            role="status"
            aria-live="polite"
            className="rounded border border-accent/40 bg-accent/10 px-3 py-2 text-xs font-medium text-accent"
          >
            {t("map.probingLocation", {
              lat: probingCoords.lat.toFixed(2),
              lon: probingCoords.lon.toFixed(2),
            })}
          </div>
        )}

        {!mapFailed && (
          <div className="relative">
            <div
              ref={containerRef}
              className="h-64 w-full overflow-hidden rounded border border-border-subtle bg-surface-muted sm:h-80 lg:h-96"
            />
            {selectedMatch && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-border-subtle bg-surface/95 p-2.5 shadow-sm sm:absolute sm:bottom-3 sm:left-3 sm:mt-0 sm:max-w-sm sm:backdrop-blur">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    {selectedRank !== null && (
                      <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-bold tabular-nums text-accent">
                        {t("map.rankBadge", { rank: selectedRank })}
                      </span>
                    )}
                    <p className="truncate text-xs font-semibold text-content">
                      {selectedMatch.known_analog_name ?? t(selectedMatch.region_key)}
                    </p>
                  </div>
                  <p className="text-xs tabular-nums text-content-muted">
                    {t("map.resolutionBadge", { res: selectedMatch.h3_resolution })} ·{" "}
                    {formatPercent(selectedMatch.combined_score, lang)} ·{" "}
                    {formatNumber(selectedMatch.coordinates.lat, lang, 2)}°,{" "}
                    {formatNumber(selectedMatch.coordinates.lon, lang, 2)}°
                  </p>
                </div>

                {onRefineCell && (
                  <button
                    type="button"
                    disabled={isRefining || selectedMatch.h3_resolution >= 5}
                    onClick={() => onRefineCell(selectedMatch.earth_cell_h3)}
                    className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded border border-accent/40 bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {selectedMatch.h3_resolution >= 5
                        ? t("map.maxResReached")
                        : isRefining
                        ? t("map.refiningZone")
                        : t("map.subdivideAction")}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Accessible, mobile-friendly card selector for ranked H3 matches */}
        <div className="space-y-3">
          {drilldownState && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-accent/40 bg-accent/10 px-3 py-2">
              <span className="text-xs font-medium text-accent">
                {t("map.drilldownActive", {
                  parent: drilldownState.parentH3,
                  count: displayedMatches.length,
                })}
              </span>
              {onExitDrilldown && (
                <button
                  type="button"
                  onClick={onExitDrilldown}
                  className="min-h-11 rounded border border-accent/40 bg-surface px-2.5 py-1 text-xs font-medium text-content hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {t("map.exitDrilldown")}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-content">{t("map.topMatchesTitle")}</h3>
            {displayedMatches.length > 0 && (
              <span className="text-xs tabular-nums text-content-muted">
                {t("map.paginationStatus", {
                  page: safePage,
                  totalPages,
                  total: displayedMatches.length,
                })}
              </span>
            )}
          </div>

          {displayedMatches.length === 0 ? (
            <div className="rounded border border-border-subtle bg-surface p-4 text-sm text-content-muted">
              {t("map.emptyResults")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {pagedMatches.map((match, idx) => {
                  const globalRank = pageStart + idx + 1;
                  const isSelected = match.earth_cell_h3 === selectedH3;
                  const isPodium = globalRank <= 3;
                  return (
                    <button
                      key={match.earth_cell_h3}
                      type="button"
                      onClick={() => onSelectCell(match.earth_cell_h3)}
                      aria-pressed={isSelected}
                      className={`flex min-h-11 flex-col justify-between gap-2 rounded border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? "border-accent bg-accent/10"
                          : "border-border-subtle bg-surface hover:bg-surface-muted"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-xs font-bold tabular-nums ${
                                isPodium
                                  ? "bg-accent/20 text-accent"
                                  : "bg-surface-muted text-content-muted"
                              }`}
                            >
                              {t("map.rankBadge", { rank: globalRank })}
                            </span>
                            <p className="truncate text-sm font-semibold text-content">
                              {match.known_analog_name ?? t(match.region_key)}
                            </p>
                          </div>
                          <p className="truncate text-xs text-content-muted">
                            {t(match.biome_key)} · {formatNumber(match.coordinates.lat, lang, 1)}°,{" "}
                            {formatNumber(match.coordinates.lon, lang, 1)}°
                          </p>
                        </div>
                        <span className="shrink-0 tabular-nums text-sm font-bold text-accent">
                          {formatPercent(match.combined_score, lang)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <Badge
                          variant={match.is_benchmark ? "default" : "valid"}
                          className="shrink-0 whitespace-nowrap"
                        >
                          {!match.is_benchmark && (
                            <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            {match.is_benchmark
                              ? t("map.benchmarkBadge")
                              : t("map.discoveryBadge")}
                          </span>
                        </Badge>
                        <span className="text-xs tabular-nums text-content-muted">
                          S_ind {formatPercent(match.s_ind, lang)} · S_dep{" "}
                          {formatPercent(match.s_dep, lang)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-3">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span>{t("map.prevPage")}</span>
                  </button>

                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {(() => {
                      const pages = new Set<number>([1, totalPages]);
                      for (let p = Math.max(1, safePage - 1); p <= Math.min(totalPages, safePage + 1); p++) {
                        pages.add(p);
                      }
                      const sorted = Array.from(pages).sort((a, b) => a - b);
                      const items: Array<number | "ellipsis-left" | "ellipsis-right"> = [];
                      sorted.forEach((p, idx) => {
                        if (idx > 0 && p - sorted[idx - 1] > 1) {
                          items.push(idx === 1 ? "ellipsis-left" : "ellipsis-right");
                        }
                        items.push(p);
                      });
                      return items.map((item) =>
                        typeof item === "string" ? (
                          <span
                            key={item}
                            className="px-1.5 text-xs text-content-muted"
                            aria-hidden="true"
                          >
                            …
                          </span>
                        ) : (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setCurrentPage(item)}
                            aria-current={item === safePage ? "page" : undefined}
                            className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded border px-2 text-xs font-semibold tabular-nums transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                              item === safePage
                                ? "border-accent bg-accent text-white"
                                : "border-border-subtle bg-surface text-content hover:bg-surface-muted"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      );
                    })()}
                  </div>

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  >
                    <span>{t("map.nextPage")}</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

