import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  ExternalLink,
  Filter,
  Globe,
  History,
  Layers,
  MapPin,
  Mountain,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  X,
  ZoomIn,
} from "lucide-react";
import * as maplibregl from "maplibre-gl";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { useTranslation } from "react-i18next";

import { fetchMultiAgencyDatasets } from "../../api/client";
import { formatNumber, formatPercent } from "../../i18n";
import { getMapColors } from "../../theme/mapColors";
import type {
  AnalogMatchItem,
  EarthOverlayLayer,
  MultiAgencyCatalogResponse,
  ReadingMode,
  ThemeMode,
} from "../../types/analog";
import { Badge } from "../ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";

// Explicitly register the bundled MapLibre GL v6 WebWorker so GeoJSON H3 polygons
// tessellate reliably in production builds (Vite/Rollup + Nginx SPA).
maplibregl.setWorkerUrl(maplibreWorkerUrl);

interface AnalogMapProps {
  matches: AnalogMatchItem[];
  totalEvaluated: number;
  selectedH3: string | null;
  selectedMatchOverride?: AnalogMatchItem | null;
  theme: ThemeMode;
  readingMode?: ReadingMode;
  probingCoords: { lat: number; lon: number } | null;
  isRefining?: boolean;
  earthDensity?: "global" | "top";
  onChangeEarthDensity?: (density: "global" | "top") => void;
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
  selectedMatchOverride = null,
  theme,
  readingMode = "mission",
  probingCoords,
  isRefining = false,
  earthDensity = "global",
  onChangeEarthDensity,
  drilldownState = null,
  onSelectCell,
  onProbeCoordinate,
  onRefineCell,
  onExitDrilldown,
}: AnalogMapProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isStudent = readingMode === "explorer";
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
  const [isTerrain3d, setIsTerrain3d] = useState(false);
  const [hexMetric, setHexMetric] = useState<"combined" | "s_ind" | "s_dep" | "r_break">("combined");
  const [selectedCatalog, setSelectedCatalog] = useState<MultiAgencyCatalogResponse | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [hoveredH3, setHoveredH3] = useState<string | null>(null);
  const hoveredH3Ref = useRef<string | null>(null);
  const prevStyleKeyRef = useRef<string>(`${theme}:${overlayLayer}`);
  const prevGlobeRef = useRef<boolean>(isGlobe);
  const prevTerrainRef = useRef<boolean>(isTerrain3d);

  // Filtering, classification & sorting states
  type SortOption =
    | "combined_desc"
    | "combined_asc"
    | "s_ind_desc"
    | "s_dep_desc"
    | "r_break_asc"
    | "r_break_desc"
    | "lat_desc";
  type CategoryFilter = "all" | "discovery" | "benchmark" | "pareto" | "pinned";
  type ScoreBandFilter = "all" | "high" | "mid" | "low";

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("combined_desc");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [scoreBandFilter, setScoreBandFilter] = useState<ScoreBandFilter>("all");
  const [biomeFilter, setBiomeFilter] = useState<string>("all");
  const [pageSize, setPageSize] = useState<number>(9);

  useEffect(() => {
    if (isStudent) {
      setHexMetric("combined");
      if (categoryFilter === "pareto") setCategoryFilter("all");
      if (sortBy !== "combined_desc" && sortBy !== "combined_asc" && sortBy !== "lat_desc") {
        setSortBy("combined_desc");
      }
    }
  }, [isStudent, categoryFilter, sortBy]);
  const [pinnedH3, setPinnedH3] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("ckepi-pinned-h3");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  // Smart pagination & history state so users never lose their page (e.g. Page 65 <-> Page 1)
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisitedPage, setLastVisitedPage] = useState<number | null>(null);
  const [recentPages, setRecentPages] = useState<number[]>([]);
  const prevSelectedH3Ref = useRef<string | null>(selectedH3);

  const togglePinCell = useCallback((h3Index: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedH3((prev) => {
      const exists = prev.includes(h3Index);
      const next = exists ? prev.filter((id) => id !== h3Index) : [...prev, h3Index];
      try {
        window.localStorage.setItem("ckepi-pinned-h3", JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const baseMatches = useMemo(() => {
    if (!drilldownState) return matches;
    const childSet = new Set(drilldownState.childIds);
    return matches.filter((m) => childSet.has(m.earth_cell_h3));
  }, [matches, drilldownState]);

  // Preserve original global rank for every cell
  const originalRankMap = useMemo(() => {
    const map = new Map<string, number>();
    baseMatches.forEach((m, idx) => {
      map.set(m.earth_cell_h3, idx + 1);
    });
    return map;
  }, [baseMatches]);

  // Available biomes with counts
  const availableBiomes = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of baseMatches) {
      counts.set(m.biome_key, (counts.get(m.biome_key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [baseMatches]);

  // Category counts for quick classification tabs
  const categoryCounts = useMemo(() => {
    const pinnedSet = new Set(pinnedH3);
    let discovery = 0;
    let benchmark = 0;
    let pareto = 0;
    let pinned = 0;
    for (const m of baseMatches) {
      if (m.is_benchmark) benchmark++;
      else discovery++;
      if (m.is_pareto_optimal) pareto++;
      if (pinnedSet.has(m.earth_cell_h3)) pinned++;
    }
    return {
      all: baseMatches.length,
      discovery,
      benchmark,
      pareto,
      pinned,
    };
  }, [baseMatches, pinnedH3]);

  // Filtered and sorted matches
  const displayedMatches = useMemo(() => {
    const pinnedSet = new Set(pinnedH3);
    const q = searchQuery.trim().toLowerCase();

    const filtered = baseMatches.filter((m) => {
      if (categoryFilter === "discovery" && m.is_benchmark) return false;
      if (categoryFilter === "benchmark" && !m.is_benchmark) return false;
      if (categoryFilter === "pareto" && !m.is_pareto_optimal) return false;
      if (categoryFilter === "pinned" && !pinnedSet.has(m.earth_cell_h3)) return false;

      if (scoreBandFilter === "high" && m.combined_score < 0.75) return false;
      if (scoreBandFilter === "mid" && (m.combined_score < 0.55 || m.combined_score >= 0.75)) {
        return false;
      }
      if (scoreBandFilter === "low" && m.combined_score >= 0.55) return false;

      if (biomeFilter !== "all" && m.biome_key !== biomeFilter) return false;

      if (q) {
        const regionName = (m.known_analog_name ?? t(m.region_key)).toLowerCase();
        const biomeName = t(m.biome_key).toLowerCase();
        const h3Id = m.earth_cell_h3.toLowerCase();
        if (!regionName.includes(q) && !biomeName.includes(q) && !h3Id.includes(q)) {
          return false;
        }
      }
      return true;
    });

    if (sortBy === "combined_desc") {
      return [...filtered].sort((a, b) => b.combined_score - a.combined_score);
    }
    if (sortBy === "combined_asc") {
      return [...filtered].sort((a, b) => a.combined_score - b.combined_score);
    }
    if (sortBy === "s_ind_desc") {
      return [...filtered].sort((a, b) => b.s_ind - a.s_ind);
    }
    if (sortBy === "s_dep_desc") {
      return [...filtered].sort((a, b) => b.s_dep - a.s_dep);
    }
    if (sortBy === "r_break_asc") {
      return [...filtered].sort((a, b) => a.r_break_overall - b.r_break_overall);
    }
    if (sortBy === "r_break_desc") {
      return [...filtered].sort((a, b) => b.r_break_overall - a.r_break_overall);
    }
    if (sortBy === "lat_desc") {
      return [...filtered].sort((a, b) => b.coordinates.lat - a.coordinates.lat);
    }
    return filtered;
  }, [
    baseMatches,
    pinnedH3,
    searchQuery,
    categoryFilter,
    scoreBandFilter,
    biomeFilter,
    sortBy,
    t,
  ]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    sortBy !== "combined_desc" ||
    categoryFilter !== "all" ||
    scoreBandFilter !== "all" ||
    biomeFilter !== "all";

  const clearAllFilters = () => {
    setSearchQuery("");
    setSortBy("combined_desc");
    setCategoryFilter("all");
    setScoreBandFilter("all");
    setBiomeFilter("all");
  };

  const selectedMatch = useMemo(
    () =>
      (selectedMatchOverride && selectedMatchOverride.earth_cell_h3 === selectedH3
        ? selectedMatchOverride
        : null) ??
      matches.find((m) => m.earth_cell_h3 === selectedH3) ??
      null,
    [selectedMatchOverride, matches, selectedH3]
  );

  useEffect(() => {
    const h3Id = selectedMatch?.earth_cell_h3;
    if (!h3Id) {
      setSelectedCatalog(null);
      setCatalogLoading(false);
      return;
    }
    let cancelled = false;
    setCatalogLoading(true);
    fetchMultiAgencyDatasets(h3Id)
      .then((res) => {
        if (!cancelled) setSelectedCatalog(res);
      })
      .catch(() => {
        if (!cancelled) setSelectedCatalog(null);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMatch?.earth_cell_h3]);

  const matchLookup = useMemo(() => {
    const map = new Map<string, { match: AnalogMatchItem; rank: number }>();
    displayedMatches.forEach((m, idx) => {
      map.set(m.earth_cell_h3, {
        match: m,
        rank: originalRankMap.get(m.earth_cell_h3) ?? idx + 1,
      });
    });
    matches.forEach((m, idx) => {
      if (!map.has(m.earth_cell_h3)) {
        map.set(m.earth_cell_h3, {
          match: m,
          rank: originalRankMap.get(m.earth_cell_h3) ?? idx + 1,
        });
      }
    });
    return map;
  }, [displayedMatches, matches, originalRankMap]);

  const hoveredEntry = useMemo(
    () => (hoveredH3 ? matchLookup.get(hoveredH3) ?? null : null),
    [matchLookup, hoveredH3]
  );

  const selectedRank = useMemo(() => {
    if (!selectedH3) return null;
    return originalRankMap.get(selectedH3) ?? null;
  }, [originalRankMap, selectedH3]);

  const totalPages = Math.max(1, Math.ceil(displayedMatches.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pagedMatches = displayedMatches.slice(pageStart, pageStart + pageSize);

  const selectedCellPage = useMemo(() => {
    if (!selectedH3) return null;
    const idx = displayedMatches.findIndex((m) => m.earth_cell_h3 === selectedH3);
    return idx >= 0 ? Math.floor(idx / pageSize) + 1 : null;
  }, [displayedMatches, selectedH3, pageSize]);

  // Navigate to a page while preserving previous page & recent history
  const goToPage = useCallback(
    (nextPage: number) => {
      const clamped = Math.max(1, Math.min(totalPages, nextPage));
      setCurrentPage((prev) => {
        const currentSafe = Math.min(prev, totalPages);
        if (currentSafe !== clamped) {
          setLastVisitedPage(currentSafe);
          setRecentPages((history) => {
            const without = history.filter((p) => p !== currentSafe && p !== clamped);
            return [currentSafe, ...without].slice(0, 5);
          });
        }
        return clamped;
      });
    },
    [totalPages]
  );

  // Reset to page 1 when filter criteria or dataset changes, but keep history if valid
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, scoreBandFilter, biomeFilter, sortBy, pageSize, baseMatches]);

  // Only jump page automatically when the user explicitly selects a different H3 cell
  useEffect(() => {
    if (prevSelectedH3Ref.current === selectedH3) return;
    prevSelectedH3Ref.current = selectedH3;
    if (!selectedH3) return;
    const idx = displayedMatches.findIndex((m) => m.earth_cell_h3 === selectedH3);
    if (idx >= 0) {
      const targetPage = Math.floor(idx / pageSize) + 1;
      goToPage(targetPage);
    }
  }, [selectedH3, displayedMatches, pageSize, goToPage]);

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

  const geojson = useMemo(() => {
    const visibleList = matches.filter(
      (m) => !drilldownState || m.earth_cell_h3 !== drilldownState.parentH3
    );
    const highCount = Math.max(12, Math.min(45, Math.ceil(visibleList.length * 0.04)));
    const midCount = Math.max(36, Math.min(200, Math.ceil(visibleList.length * 0.18)));
    const largeGrid = visibleList.length > 2500;

    return {
      type: "FeatureCollection" as const,
      features: visibleList.map((m, idx) => {
        let colorTier = 0;
        if (hexMetric === "r_break") {
          colorTier = m.r_break_overall <= 0.25 ? 2 : m.r_break_overall <= 0.45 ? 1 : 0;
        } else if (hexMetric === "s_ind") {
          colorTier = m.s_ind >= 0.72 ? 2 : m.s_ind >= 0.55 ? 1 : 0;
        } else if (hexMetric === "s_dep") {
          colorTier = m.s_dep >= 0.72 ? 2 : m.s_dep >= 0.55 ? 1 : 0;
        } else {
          colorTier =
            m.combined_score >= 0.72 || idx < highCount
              ? 2
              : m.combined_score >= 0.55 || idx < midCount
              ? 1
              : 0;
        }
        const segments = largeGrid ? 1 : m.h3_resolution >= 3 ? 3 : 6;
        return {
          type: "Feature" as const,
          properties: {
            earth_cell_h3: m.earth_cell_h3,
            combined_score: m.combined_score,
            color_tier: colorTier,
            is_selected: m.earth_cell_h3 === selectedH3 ? 1 : 0,
          },
          geometry: {
            type: "Polygon" as const,
            coordinates: [densifyRing(m.h3_boundary, m.coordinates.lon, segments)],
          },
        };
      }),
    };
  }, [matches, selectedH3, drilldownState, hexMetric]);

  const latestGeojsonRef = useRef(geojson);
  latestGeojsonRef.current = geojson;

  const attachAnalogLayers = (map: maplibregl.Map, activeTheme: ThemeMode = theme) => {
    const mapColors = getMapColors(activeTheme);

    if (!map.getSource("h3-analogs")) {
      map.addSource("h3-analogs", {
        type: "geojson",
        data: latestGeojsonRef.current,
        promoteId: "earth_cell_h3",
      });
    } else {
      const existing = map.getSource("h3-analogs") as maplibregl.GeoJSONSource | undefined;
      existing?.setData(latestGeojsonRef.current);
    }

    if (!map.getLayer("h3-analogs-fill")) {
      map.addLayer({
        id: "h3-analogs-fill",
        type: "fill",
        source: "h3-analogs",
        paint: {
          "fill-color": [
            "case",
            ["==", ["get", "color_tier"], 2],
            mapColors.matchHigh,
            ["==", ["get", "color_tier"], 1],
            mapColors.matchMid,
            mapColors.matchLow,
          ],
          "fill-opacity": [
            "case",
            ["==", ["get", "is_selected"], 1],
            0.62,
            ["boolean", ["feature-state", "hover"], false],
            0.56,
            ["==", ["get", "color_tier"], 2],
            0.46,
            ["==", ["get", "color_tier"], 1],
            0.30,
            0.14,
          ],
        },
      });
    }

    if (!map.getLayer("h3-analogs-outline")) {
      map.addLayer({
        id: "h3-analogs-outline",
        type: "line",
        source: "h3-analogs",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "is_selected"], 1],
            mapColors.selectedOutline,
            ["boolean", ["feature-state", "hover"], false],
            mapColors.selectedOutline,
            ["==", ["get", "color_tier"], 2],
            mapColors.matchHigh,
            ["==", ["get", "color_tier"], 1],
            mapColors.matchMid,
            mapColors.matchLow,
          ],
          "line-width": [
            "case",
            ["==", ["get", "is_selected"], 1],
            4.2,
            ["boolean", ["feature-state", "hover"], false],
            3.2,
            ["==", ["get", "color_tier"], 2],
            2.4,
            ["==", ["get", "color_tier"], 1],
            1.5,
            0.8,
          ],
          "line-opacity": [
            "case",
            ["==", ["get", "is_selected"], 1],
            1.0,
            ["boolean", ["feature-state", "hover"], false],
            0.95,
            ["==", ["get", "color_tier"], 2],
            0.92,
            ["==", ["get", "color_tier"], 1],
            0.72,
            0.38,
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

      const handleStyleReady = () => {
        attachAnalogLayers(map);
        setMapReady(true);
      };

      map.on("style.load", handleStyleReady);
      map.on("load", handleStyleReady);

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

      map.on("mousemove", "h3-analogs-fill", (ev) => {
        map.getCanvas().style.cursor = "pointer";
        const h3Id = ev.features?.[0]?.properties?.earth_cell_h3;
        if (typeof h3Id === "string" && h3Id !== hoveredH3Ref.current) {
          if (hoveredH3Ref.current && map.getSource("h3-analogs")) {
            map.setFeatureState(
              { source: "h3-analogs", id: hoveredH3Ref.current },
              { hover: false }
            );
          }
          hoveredH3Ref.current = h3Id;
          if (map.getSource("h3-analogs")) {
            map.setFeatureState({ source: "h3-analogs", id: h3Id }, { hover: true });
          }
          setHoveredH3(h3Id);
        }
      });

      map.on("mouseleave", "h3-analogs-fill", () => {
        map.getCanvas().style.cursor = "";
        if (hoveredH3Ref.current && map.getSource("h3-analogs")) {
          map.setFeatureState(
            { source: "h3-analogs", id: hoveredH3Ref.current },
            { hover: false }
          );
        }
        hoveredH3Ref.current = null;
        setHoveredH3(null);
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

  // Keep the WebGL canvas in sync with its container (hidden tabs, drawer, rotation)
  useEffect(() => {
    const container = containerRef.current;
    const map = mapRef.current;
    if (!container || !map || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      map.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReady]);

  // Update GeoJSON data whenever matches or selectedH3 changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    attachAnalogLayers(map, theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const nextKey = `${theme}:${overlayLayer}`;
    if (prevStyleKeyRef.current === nextKey) return;
    prevStyleKeyRef.current = nextKey;

    map.once("style.load", () => {
      attachAnalogLayers(map, theme);
    });
    map.setStyle(buildRasterMapStyle(theme, overlayLayer, isGlobe, isTerrain3d), {
      diff: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, overlayLayer, mapReady]);

  // Toggle between 3D Globe and 2D Mercator projection without reloading layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (prevGlobeRef.current === isGlobe) return;
    prevGlobeRef.current = isGlobe;
    map.setProjection({ type: isGlobe ? "globe" : "mercator" });
  }, [isGlobe, mapReady]);

  // Toggle 3D elevation terrain (Terrarium DEM)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (prevTerrainRef.current === isTerrain3d) return;
    prevTerrainRef.current = isTerrain3d;
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
          {!isStudent && (
            <>
              <label htmlFor="earth-hex-metric" className="sr-only">
                {t("map.hexMetricLabel")}
              </label>
              <select
                id="earth-hex-metric"
                value={hexMetric}
                onChange={(e) =>
                  setHexMetric(e.target.value as "combined" | "s_ind" | "s_dep" | "r_break")
                }
                aria-label={t("map.hexMetricLabel")}
                className="min-h-11 rounded border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              >
                <option value="combined">{t("map.metricCombined")}</option>
                <option value="s_ind">{t("map.metricSInd")}</option>
                <option value="s_dep">{t("map.metricSDep")}</option>
                <option value="r_break">{t("map.metricRBreak")}</option>
              </select>
            </>
          )}
          {onChangeEarthDensity && (
            <button
              type="button"
              aria-pressed={earthDensity === "global"}
              onClick={() =>
                onChangeEarthDensity(earthDensity === "global" ? "top" : "global")
              }
              className={`inline-flex min-h-11 items-center gap-1.5 rounded border px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                earthDensity === "global"
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border-subtle bg-surface text-content-muted hover:bg-surface-muted"
              }`}
            >
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {earthDensity === "global"
                  ? t("map.densityGlobal", { count: totalEvaluated })
                  : t("map.densityTop", { count: 1500 })}
              </span>
            </button>
          )}
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
          <button
            type="button"
            onClick={() => {
              mapRef.current?.flyTo({
                center: [0, 15],
                zoom: 1.45,
                pitch: isTerrain3d ? 25 : 0,
                duration: 750,
              });
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-content hover:bg-surface-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
          >
            <RotateCcw className="h-3.5 w-3.5 text-content-muted" aria-hidden="true" />
            <span>{t("map.resetView")}</span>
          </button>
          {!isStudent && selectedH3 && onRefineCell && (
            <button
              type="button"
              disabled={isRefining || (selectedMatch?.h3_resolution ?? 0) >= 5}
              onClick={() => onRefineCell(selectedH3)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2.5 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/40"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {selectedMatch && selectedMatch.h3_resolution >= 5
                  ? t("map.maxResReached")
                  : isRefining
                  ? t("map.refiningZone")
                  : t("map.refineZone")}
              </span>
            </button>
          )}
          <Badge variant="default">
            {matches.length < totalEvaluated
              ? t("map.renderedEvaluatedCount", {
                  rendered: formatNumber(matches.length, lang, 0),
                  total: formatNumber(totalEvaluated, lang, 0),
                })
              : t("map.evaluatedCount", { count: totalEvaluated })}
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
              {hexMetric === "r_break" ? t("map.legendLowRisk") : t("map.legendHigh")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-status-warn" />
              {hexMetric === "r_break" ? t("map.legendMidRisk") : t("map.legendMid")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-content-muted" />
              {hexMetric === "r_break" ? t("map.legendHighRisk") : t("map.legendLow")}
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
              lat: formatNumber(probingCoords.lat, i18n.language, 2),
              lon: formatNumber(probingCoords.lon, i18n.language, 2),
            })}
          </div>
        )}

        {!mapFailed && (
          <div className="relative">
            <div
              ref={containerRef}
              className="h-72 w-full overflow-hidden rounded border border-border-subtle bg-surface-muted sm:h-80 lg:h-96"
            />

            {/* Live Hover Telemetry HUD when moving cursor over any H3 hexagon */}
            {hoveredEntry && (
              <div
                aria-live="polite"
                className="pointer-events-none absolute left-3 top-3 z-10 w-72 max-w-[calc(100%-3.5rem)] space-y-2 rounded-lg border border-accent/50 bg-surface/95 p-3 shadow-lg backdrop-blur sm:w-80"
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                    <Activity className="h-3 w-3" aria-hidden="true" />
                    {t("map.hoverHudBadge")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {!isStudent && hoveredEntry.match.is_pareto_optimal && (
                      <Badge variant="valid">{t("map.paretoBadge")}</Badge>
                    )}
                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-content">
                      {t("map.rankBadge", { rank: hoveredEntry.rank })}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="truncate text-xs font-bold text-content">
                    {hoveredEntry.match.known_analog_name ?? t(hoveredEntry.match.region_key)}
                  </p>
                  {!isStudent && (
                    <p className="truncate font-mono text-[11px] text-content-muted">
                      {hoveredEntry.match.earth_cell_h3} ·{" "}
                      {t("map.resolutionBadge", { res: hoveredEntry.match.h3_resolution })} (
                      {t("map.scaleLabel", {
                        km: formatNumber(hoveredEntry.match.effective_scale_km ?? 158.2, lang, 1),
                      })}
                      )
                    </p>
                  )}
                </div>

                {isStudent ? (
                  <div className="grid grid-cols-3 gap-1 rounded border border-border-subtle bg-surface-elevated p-1.5 text-center">
                    <div>
                      <span className="block text-[10px] text-content-muted">
                        {t("studentPanel.overallLabel")}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-accent">
                        {formatPercent(hoveredEntry.match.combined_score, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-content-muted">
                        {t("studentPanel.terrainShort")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-status-valid">
                        {formatPercent(hoveredEntry.match.s_ind, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-content-muted">
                        {t("studentPanel.climateShort")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-status-warn">
                        {formatPercent(hoveredEntry.match.s_dep, lang)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1 rounded border border-border-subtle bg-surface-elevated p-1.5 text-center">
                    <div>
                      <span className="block text-[10px] text-content-muted">
                        {t("map.metricCombined")}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-accent">
                        {formatPercent(hoveredEntry.match.combined_score, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-content-muted">S_ind</span>
                      <span className="text-xs font-semibold tabular-nums text-status-valid">
                        {formatPercent(hoveredEntry.match.s_ind, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-content-muted">S_dep</span>
                      <span className="text-xs font-semibold tabular-nums text-status-warn">
                        {formatPercent(hoveredEntry.match.s_dep, lang)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-content-muted">R_break</span>
                      <span className="text-xs font-semibold tabular-nums text-status-break">
                        {formatPercent(hoveredEntry.match.r_break_overall, lang)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="rounded bg-surface-muted/70 px-2 py-1">
                    <span className="block text-[10px] text-content-muted">
                      {t("map.cellTempLabel")}
                    </span>
                    <span className="font-semibold tabular-nums text-content">
                      {formatNumber(
                        (hoveredEntry.match.earth_variables.dependent.mean_surface_temp_k ??
                          273.15) - 273.15,
                        lang,
                        1
                      )}
                      °C
                      {!isStudent && (
                        <>
                          {" "}
                          (
                          {formatNumber(
                            hoveredEntry.match.earth_variables.dependent.mean_surface_temp_k ??
                              273.15,
                            lang,
                            0
                          )}{" "}
                          K)
                        </>
                      )}
                    </span>
                  </div>
                  <div className="rounded bg-surface-muted/70 px-2 py-1">
                    <span className="block text-[10px] text-content-muted">
                      {t("map.cellSlopeLabel")}
                    </span>
                    <span className="font-semibold tabular-nums text-content">
                      {formatNumber(
                        hoveredEntry.match.earth_variables.independent.slope_deg ?? 0,
                        lang,
                        1
                      )}
                      °
                    </span>
                  </div>
                  {!isStudent && (
                    <>
                      <div className="rounded bg-surface-muted/70 px-2 py-1">
                        <span className="block text-[10px] text-content-muted">
                          {t("map.cellAridityLabel")}
                        </span>
                        <span className="font-semibold tabular-nums text-content">
                          {formatNumber(
                            hoveredEntry.match.earth_variables.independent.aridity_index ?? 0,
                            lang,
                            3
                          )}
                        </span>
                      </div>
                      <div className="rounded bg-surface-muted/70 px-2 py-1">
                        <span className="block text-[10px] text-content-muted">
                          {t("map.cellRadiationLabel")}
                        </span>
                        <span className="font-semibold tabular-nums text-content">
                          {formatNumber(
                            hoveredEntry.match.earth_variables.breakage.radiation_msv_yr ?? 0,
                            lang,
                            2
                          )}{" "}
                          mSv/yr
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <p className="text-[11px] font-medium text-accent">{t("map.clickToPinHint")}</p>
              </div>
            )}

            {/* Selected H3 Hexagon Inspector Card */}
            {selectedMatch && (
              <div className="mt-2 space-y-2.5 rounded-lg border border-border-subtle bg-surface/95 p-3 shadow-sm sm: backdrop-blur">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[11px] font-semibold text-accent">
                        {t("map.selectedHudBadge")}
                      </span>
                      {selectedRank !== null && (
                        <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-bold tabular-nums text-accent">
                          {t("map.rankBadge", { rank: selectedRank })}
                        </span>
                      )}
                      {!isStudent && selectedMatch.is_pareto_optimal && (
                        <Badge variant="valid">{t("map.paretoBadge")}</Badge>
                      )}
                      <Badge variant="default">
                        {t("map.validTestsBadge", {
                          count: selectedMatch.engineering_recommendations.valid_tests.length,
                        })}
                      </Badge>
                    </div>
                    <p className="truncate text-sm font-bold text-content">
                      {selectedMatch.known_analog_name ?? t(selectedMatch.region_key)}
                    </p>
                    <p className="text-xs tabular-nums text-content-muted">
                      {!isStudent && (
                        <>
                          <span className="font-mono">{selectedMatch.earth_cell_h3}</span> ·{" "}
                          {t("map.resolutionBadge", { res: selectedMatch.h3_resolution })} (
                          {t("map.scaleLabel", {
                            km: formatNumber(selectedMatch.effective_scale_km ?? 158.2, lang, 1),
                          })}
                          ) ·{" "}
                        </>
                      )}
                      {t(selectedMatch.biome_key)} · {selectedMatch.country_code} ·{" "}
                      {formatNumber(selectedMatch.coordinates.lat, lang, 2)}°,{" "}
                      {formatNumber(selectedMatch.coordinates.lon, lang, 2)}°
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!isStudent && onRefineCell && (
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
                    <button
                      type="button"
                      onClick={() => {
                        document
                          .getElementById(
                            isStudent ? "section-student-comparison" : "section-diagnostics"
                          )
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded border border-border-subtle bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-content hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                    >
                      <span>
                        {isStudent
                          ? t("studentPanel.jumpToComparison")
                          : t("map.jumpToDiagnostics")}
                      </span>
                    </button>
                  </div>
                </div>

                {isStudent ? (
                  <div className="grid grid-cols-2 gap-2 border-t border-border-subtle pt-2.5 sm:grid-cols-4">
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("studentPanel.overallLabel")}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-accent">
                        {formatPercent(selectedMatch.combined_score, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("studentPanel.terrainShort")} / {t("studentPanel.climateShort")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatPercent(selectedMatch.s_ind, lang)} ·{" "}
                        {formatPercent(selectedMatch.s_dep, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellTempLabel")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          (selectedMatch.earth_variables.dependent.mean_surface_temp_k ?? 273.15) -
                            273.15,
                          lang,
                          1
                        )}
                        °C
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellSlopeLabel")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          selectedMatch.earth_variables.independent.slope_deg ?? 0,
                          lang,
                          1
                        )}
                        °
                      </span>
                    </div>
                  </div>
                ) : (
                <>
                <div className="space-y-2 border-t border-border-subtle pt-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-content-muted">
                      {t("map.earthProfileTitle")}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-content-muted">
                      {selectedMatch.provenance?.is_live_probed && (
                        <Badge variant="accent">{t("provenance.liveProbed")}</Badge>
                      )}
                      {selectedMatch.provenance?.source_apis?.map((api) => (
                        <Badge key={api} variant="default">
                          {api}
                        </Badge>
                      ))}
                      {selectedMatch.provenance?.observation_window && (
                        <span>· {selectedMatch.provenance.observation_window}</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.metricCombined")}
                      </span>
                      <span className="text-xs font-bold tabular-nums text-accent">
                        {formatPercent(selectedMatch.combined_score, lang)} · S_ind{" "}
                        {formatPercent(selectedMatch.s_ind, lang)} · S_dep{" "}
                        {formatPercent(selectedMatch.s_dep, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellTempLabel")} / {t("map.cellDiurnalLabel")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          (selectedMatch.earth_variables.dependent.mean_surface_temp_k ?? 273.15) -
                            273.15,
                          lang,
                          1
                        )}
                        °C · Δ{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.dependent.diurnal_temp_amplitude_k ?? 0,
                          lang,
                          1
                        )}{" "}
                        K
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellAridityLabel")} / {t("map.cellSlopeLabel")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        AI{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.independent.aridity_index ?? 0,
                          lang,
                          3
                        )}{" "}
                        ·{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.independent.slope_deg ?? 0,
                          lang,
                          1
                        )}
                        °
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellRadiationLabel")} / {t("map.metricRBreak")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          selectedMatch.earth_variables.breakage.radiation_msv_yr ?? 0,
                          lang,
                          2
                        )}{" "}
                        mSv/yr · {formatPercent(selectedMatch.r_break_overall, lang)}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellThermalRoughness")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          selectedMatch.earth_variables.independent.topographic_roughness ?? 0,
                          lang,
                          2
                        )}{" "}
                        ·{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.independent.thermal_inertia ?? 0,
                          lang,
                          0
                        )}{" "}
                        TIU
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellOpticsSolar")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          selectedMatch.earth_variables.independent.surface_albedo ?? 0,
                          lang,
                          2
                        )}{" "}
                        ·{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.independent.solar_flux_wm2 ?? 0,
                          lang,
                          0
                        )}{" "}
                        W/m²
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellHumidityUv")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          selectedMatch.earth_variables.independent.relative_humidity_pct ?? 0,
                          lang,
                          0
                        )}
                        % · UV{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.independent.uv_irradiance_index ?? 0,
                          lang,
                          1
                        )}
                      </span>
                    </div>
                    <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5">
                      <span className="block text-[11px] text-content-muted">
                        {t("map.cellWindDust")}
                      </span>
                      <span className="text-xs font-semibold tabular-nums text-content">
                        {formatNumber(
                          selectedMatch.earth_variables.dependent.surface_wind_ms ?? 0,
                          lang,
                          1
                        )}{" "}
                        m/s ·{" "}
                        {formatNumber(
                          selectedMatch.earth_variables.dependent.aeolian_dust_flux ?? 0,
                          lang,
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Geological & Multi-Agency Earth Context */}
                {(catalogLoading || selectedCatalog) && (
                  <div className="space-y-2 border-t border-border-subtle pt-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-content-muted">
                      <Database className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                      <span>{t("map.cellCatalogTitle")}</span>
                    </div>
                    {catalogLoading && !selectedCatalog ? (
                      <p className="text-xs text-content-muted">{t("agencies.loading")}</p>
                    ) : (
                      selectedCatalog && (
                        <div className="space-y-2">
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {selectedCatalog.geology && (
                              <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5 text-xs">
                                <span className="block text-[11px] text-content-muted">
                                  {t("map.cellCatalogGeology")}
                                </span>
                                <span className="font-semibold text-content">
                                  {selectedCatalog.geology.unit_name} ·{" "}
                                  {selectedCatalog.geology.lithology} ({selectedCatalog.geology.age})
                                </span>
                              </div>
                            )}
                            {(selectedCatalog.regolith_simulant || selectedCatalog.habitability) && (
                              <div className="rounded border border-border-subtle bg-surface-elevated px-2.5 py-1.5 text-xs">
                                <span className="block text-[11px] text-content-muted">
                                  {t("map.cellCatalogSimulant")}
                                </span>
                                <span className="font-semibold text-content">
                                  {selectedCatalog.regolith_simulant
                                    ? `${selectedCatalog.regolith_simulant.recommended_code} (${formatPercent(selectedCatalog.regolith_simulant.affinity_score, lang)})`
                                    : ""}
                                  {selectedCatalog.regolith_simulant && selectedCatalog.habitability
                                    ? " · "
                                    : ""}
                                  {selectedCatalog.habitability
                                    ? `HI ${formatNumber(selectedCatalog.habitability.habitability_index, lang, 2)}`
                                    : ""}
                                </span>
                              </div>
                            )}
                          </div>
                          {selectedCatalog.products.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {selectedCatalog.products.slice(0, 4).map((prod) => (
                                <a
                                  key={`${prod.agency}-${prod.product_id}`}
                                  href={prod.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-9 items-center gap-1 rounded border border-border-subtle bg-surface-elevated px-2 py-1 text-[11px] font-medium text-content transition hover:border-accent hover:text-accent"
                                >
                                  <span>
                                    {prod.agency} · {prod.mission}
                                  </span>
                                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
                </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Accessible, mobile-friendly card selector for ranked H3 matches */}
        <div className="space-y-3.5">
          {drilldownState && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2">
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
                  className="min-h-10 rounded-lg border border-accent/40 bg-surface px-2.5 py-1 text-xs font-medium text-content hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {t("map.exitDrilldown")}
                </button>
              )}
            </div>
          )}

          {/* Header + Quick Return to Previous Page / Active Cell */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-content">{t("map.topMatchesTitle")}</h3>
              {lastVisitedPage !== null &&
                lastVisitedPage !== safePage &&
                lastVisitedPage <= totalPages && (
                  <button
                    type="button"
                    onClick={() => goToPage(lastVisitedPage)}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent shadow-sm transition hover:bg-accent/25"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>{t("map.nav.returnToPrevPage", { page: lastVisitedPage })}</span>
                  </button>
                )}
              {selectedCellPage !== null && selectedCellPage !== safePage && (
                <button
                  type="button"
                  onClick={() => goToPage(selectedCellPage)}
                  className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-muted/80 px-2.5 py-1 text-xs font-medium text-content transition hover:border-accent/50 hover:text-accent"
                >
                  <span>{t("map.nav.goToSelectedCellPage", { page: selectedCellPage })}</span>
                </button>
              )}
            </div>
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

          {/* Classification & Sorting Toolbar */}
          <div className="rounded-xl border border-border-subtle bg-surface-muted/30 p-3 space-y-2.5">
            {/* Row 1: Category Filter Pills */}
            <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5">
              {(
                [
                  { id: "all", label: t("map.filters.category.all"), count: categoryCounts.all },
                  {
                    id: "discovery",
                    label: t("map.filters.category.discovery"),
                    count: categoryCounts.discovery,
                  },
                  {
                    id: "benchmark",
                    label: t("map.filters.category.benchmark"),
                    count: categoryCounts.benchmark,
                  },
                  ...(!isStudent
                    ? [
                        {
                          id: "pareto" as const,
                          label: t("map.filters.category.pareto"),
                          count: categoryCounts.pareto,
                        },
                      ]
                    : []),
                  {
                    id: "pinned",
                    label: t("map.filters.category.pinned"),
                    count: categoryCounts.pinned,
                  },
                ] as const
              ).map((cat) => {
                const active = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "border-accent bg-accent text-accent-foreground shadow-sm"
                        : "border-border-subtle bg-surface text-content-muted hover:bg-surface-muted hover:text-content"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                        active
                          ? "bg-white/20 text-accent-foreground"
                          : "bg-surface-muted text-content-muted"
                      }`}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Row 2: Search input + Sort By + Score Tier + Biome + Page Size */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-12">
              {/* Search Box */}
              <div className="relative lg:col-span-4">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("map.filters.searchPlaceholder")}
                  aria-label={t("map.filters.searchPlaceholder")}
                  className="min-h-10 w-full rounded-lg border border-border-subtle bg-surface pl-8 pr-7 py-1.5 text-xs text-content placeholder:text-content-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label={t("map.filters.clearFilters")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-content-muted hover:text-content"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Sort By Selector */}
              <div className="flex items-center gap-1.5 lg:col-span-3">
                <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                <select
                  aria-label={t("map.filters.sortByLabel")}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="min-h-10 w-full rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="combined_desc">{t("map.filters.sort.combined_desc")}</option>
                  <option value="combined_asc">{t("map.filters.sort.combined_asc")}</option>
                  {!isStudent && (
                    <>
                      <option value="s_ind_desc">{t("map.filters.sort.s_ind_desc")}</option>
                      <option value="s_dep_desc">{t("map.filters.sort.s_dep_desc")}</option>
                      <option value="r_break_asc">{t("map.filters.sort.r_break_asc")}</option>
                      <option value="r_break_desc">{t("map.filters.sort.r_break_desc")}</option>
                    </>
                  )}
                  <option value="lat_desc">{t("map.filters.sort.lat_desc")}</option>
                </select>
              </div>

              {/* Similarity Score Tier Filter */}
              <div className="flex items-center gap-1.5 lg:col-span-2">
                <Filter className="h-3.5 w-3.5 shrink-0 text-content-muted" aria-hidden="true" />
                <select
                  aria-label={t("map.filters.scoreBandLabel")}
                  value={scoreBandFilter}
                  onChange={(e) => setScoreBandFilter(e.target.value as ScoreBandFilter)}
                  className="min-h-10 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="all">{t("map.filters.scoreBand.all")}</option>
                  <option value="high">{t("map.filters.scoreBand.high")}</option>
                  <option value="mid">{t("map.filters.scoreBand.mid")}</option>
                  <option value="low">{t("map.filters.scoreBand.low")}</option>
                </select>
              </div>

              {/* Biome Filter */}
              <div className="lg:col-span-2">
                <select
                  aria-label={t("map.filters.biomeAll")}
                  value={biomeFilter}
                  onChange={(e) => setBiomeFilter(e.target.value)}
                  className="min-h-10 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-medium text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  <option value="all">
                    {t("map.filters.biomeAll")} ({baseMatches.length})
                  </option>
                  {availableBiomes.map(([bKey, count]) => (
                    <option key={bKey} value={bKey}>
                      {t(bKey)} ({count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Size Selector */}
              <div className="lg:col-span-1">
                <select
                  aria-label="Items per page"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="min-h-10 w-full rounded-lg border border-border-subtle bg-surface px-2 py-1.5 text-xs font-medium tabular-nums text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {[9, 18, 27, 45].map((sz) => (
                    <option key={sz} value={sz}>
                      {t("map.filters.perPage", { count: sz })}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center justify-end pt-0.5">
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-accent hover:bg-accent/10"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t("map.filters.clearFilters")}</span>
                </button>
              </div>
            )}
          </div>

          {displayedMatches.length === 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface p-4 text-sm text-content-muted">
              <span>{t("map.emptyResults")}</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="min-h-11 rounded border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {t("map.filters.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                {pagedMatches.map((match, idx) => {
                  const globalRank =
                    originalRankMap.get(match.earth_cell_h3) ?? pageStart + idx + 1;
                  const isSelected = match.earth_cell_h3 === selectedH3;
                  const isPinned = pinnedH3.includes(match.earth_cell_h3);
                  const isPodium = globalRank <= 3;
                  return (
                    <div
                      key={match.earth_cell_h3}
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectCell(match.earth_cell_h3)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectCell(match.earth_cell_h3);
                        }
                      }}
                      aria-pressed={isSelected}
                      className={`group flex min-h-11 cursor-pointer flex-col justify-between gap-2 rounded-xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        isSelected
                          ? "border-accent bg-accent/10 shadow-sm"
                          : "border-border-subtle bg-surface hover:border-accent/40 hover:bg-surface-muted/60"
                      }`}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex shrink-0 items-center rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${
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

                        <div className="flex shrink-0 items-center gap-1.5">
                          <span className="tabular-nums text-sm font-bold text-accent">
                            {formatPercent(match.combined_score, lang)}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => togglePinCell(match.earth_cell_h3, e)}
                            title={
                              isPinned
                                ? t("map.filters.unpinCell")
                                : t("map.filters.pinCell")
                            }
                            aria-label={
                              isPinned
                                ? t("map.filters.unpinCell")
                                : t("map.filters.pinCell")
                            }
                            className={`rounded-md p-1 transition-colors ${
                              isPinned
                                ? "text-yellow-500 hover:bg-yellow-500/10"
                                : "text-content-muted/50 hover:bg-surface-muted hover:text-content"
                            }`}
                          >
                            <Star
                              className="h-3.5 w-3.5"
                              fill={isPinned ? "currentColor" : "none"}
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1">
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
                          {!isStudent && match.is_pareto_optimal && (
                            <Badge variant="accent" className="shrink-0 whitespace-nowrap">
                              Pareto
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] tabular-nums text-content-muted">
                          {isStudent
                            ? `${t("studentPanel.terrainShort")} ${formatPercent(
                                match.s_ind,
                                lang
                              )} · ${t("studentPanel.climateShort")} ${formatPercent(
                                match.s_dep,
                                lang
                              )}`
                            : `S_ind ${formatPercent(match.s_ind, lang)} · S_dep ${formatPercent(
                                match.s_dep,
                                lang
                              )} · R ${formatPercent(match.r_break_overall, lang)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="space-y-2.5 border-t border-border-subtle pt-3">
                  {/* Primary Pagination Controls: -10, Prev, Smart Numbers (including lastVisitedPage!), Next, +10 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {totalPages > 10 && (
                        <button
                          type="button"
                          disabled={safePage <= 1}
                          onClick={() => goToPage(safePage - 10)}
                          title={t("map.nav.back10")}
                          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold tabular-nums text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="hidden sm:inline">10</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={safePage <= 1}
                        onClick={() => goToPage(safePage - 1)}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                      >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        <span>{t("map.prevPage")}</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {(() => {
                        const pages = new Set<number>([1, totalPages]);
                        for (
                          let p = Math.max(1, safePage - 1);
                          p <= Math.min(totalPages, safePage + 1);
                          p++
                        ) {
                          pages.add(p);
                        }
                        // Keep the previously visited page (e.g. Page 65) and active cell page directly in the bar so the user never loses it!
                        if (lastVisitedPage && lastVisitedPage >= 1 && lastVisitedPage <= totalPages) {
                          pages.add(lastVisitedPage);
                        }
                        if (
                          selectedCellPage &&
                          selectedCellPage >= 1 &&
                          selectedCellPage <= totalPages
                        ) {
                          pages.add(selectedCellPage);
                        }
                        const sorted = Array.from(pages).sort((a, b) => a - b);
                        const items: Array<number | string> = [];
                        sorted.forEach((p, idx) => {
                          if (idx > 0 && p - sorted[idx - 1] > 1) {
                            items.push(`ellipsis-${sorted[idx - 1]}-${p}`);
                          }
                          items.push(p);
                        });
                        return items.map((item) =>
                          typeof item === "string" ? (
                            <span
                              key={item}
                              className="px-1 text-xs text-content-muted"
                              aria-hidden="true"
                            >
                              …
                            </span>
                          ) : (
                            <button
                              key={item}
                              type="button"
                              onClick={() => goToPage(item)}
                              aria-current={item === safePage ? "page" : undefined}
                              title={
                                item === lastVisitedPage && item !== safePage
                                  ? t("map.nav.returnToPrevPage", { page: item })
                                  : undefined
                              }
                              className={`relative inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-xs font-semibold tabular-nums transition focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                                item === safePage
                                  ? "border-accent bg-accent text-accent-foreground shadow-sm"
                                  : item === lastVisitedPage
                                  ? "border-accent/60 bg-accent/15 text-accent hover:bg-accent/25"
                                  : "border-border-subtle bg-surface text-content hover:bg-surface-muted"
                              }`}
                            >
                              <span>{item}</span>
                              {item === lastVisitedPage && item !== safePage && (
                                <span
                                  className="ml-0.5 text-[10px] opacity-80"
                                  aria-hidden="true"
                                >
                                  ↩
                                </span>
                              )}
                            </button>
                          )
                        );
                      })()}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={safePage >= totalPages}
                        onClick={() => goToPage(safePage + 1)}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                      >
                        <span>{t("map.nextPage")}</span>
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                      {totalPages > 10 && (
                        <button
                          type="button"
                          disabled={safePage >= totalPages}
                          onClick={() => goToPage(safePage + 10)}
                          title={t("map.nav.forward10")}
                          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-xs font-semibold tabular-nums text-content hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        >
                          <span className="hidden sm:inline">10</span>
                          <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Secondary Navigation Bar: Direct Page Dropdown (with % range preview) + Recent Pages History */}
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border-subtle/80 bg-surface-muted/30 px-3 py-2 text-xs">
                    {/* Direct Page Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        htmlFor="analog-direct-page-select"
                        className="font-medium text-content-muted"
                      >
                        {t("map.nav.jumpToPageLabel")}:
                      </label>
                      <select
                        id="analog-direct-page-select"
                        value={safePage}
                        onChange={(e) => goToPage(Number(e.target.value))}
                        className="min-h-9 rounded-lg border border-border-subtle bg-surface px-2.5 py-1 text-xs font-semibold tabular-nums text-content focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
                      >
                        {Array.from({ length: totalPages }, (_, i) => {
                          const p = i + 1;
                          const sIdx = i * pageSize;
                          const eIdx = Math.min(displayedMatches.length, sIdx + pageSize);
                          const firstMatch = displayedMatches[sIdx];
                          const scoreLabel = firstMatch
                            ? formatPercent(firstMatch.combined_score, lang)
                            : "";
                          return (
                            <option key={p} value={p}>
                              {t("map.nav.pageOption", {
                                page: p,
                                start: sIdx + 1,
                                end: eIdx,
                                score: scoreLabel,
                              })}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Recent Visited Pages History Strip */}
                    {recentPages.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-content-muted">
                          <History className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                          <span>{t("map.nav.recentPagesLabel")}</span>
                        </span>
                        {recentPages
                          .filter((p) => p <= totalPages)
                          .map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => goToPage(p)}
                              className={`rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums transition ${
                                p === safePage
                                  ? "border-accent bg-accent/15 text-accent"
                                  : "border-border-subtle bg-surface text-content hover:border-accent/50 hover:text-accent"
                              }`}
                            >
                              {t("map.nav.pageShort", { page: p })}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

