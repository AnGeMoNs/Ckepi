import type { MeasuredCell } from "./measuredCells";

const COPERNICUS_NOTICE =
  "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved. The organisations in charge of the Copernicus programme by law or by delegation do not incur any liability for any use of the Copernicus WorldDEM-30.";

/** Column order of both exports: the scientist gets the measurement, its uncertainty and its source. */
function row(cell: MeasuredCell, rank: number) {
  return {
    rank,
    h3_index: cell.h3,
    lat: cell.lat,
    lon: cell.lon,
    target: "mars_jezero_crater",
    resolution_m: cell.resolutionM,
    w1_slope_deg: cell.w1Deg,
    w1_ci95_low_deg: cell.w1CiDeg[0],
    w1_ci95_high_deg: cell.w1CiDeg[1],
    ks_slope: cell.ks,
    w1_slope_60m_deg: cell.w1At.m60,
    w1_slope_90m_deg: cell.w1At.m90,
    median_slope_earth_deg: cell.earthMedianDeg,
    median_slope_jezero_deg: cell.jezeroMedianDeg,
    w1_relief_m: cell.reliefW1M,
    control_yungay_w1_slope_deg: cell.yungayW1Deg,
    closer_than_yungay: cell.w1Deg < cell.yungayW1Deg,
    earth_dem_source: cell.earthDem,
    mars_dem_source: cell.marsDem,
    copernicus_notice: COPERNICUS_NOTICE,
    note: "Field-study shortlist from one 6 x 6 km window per cell; slope and relief only; not a certification.",
  };
}

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const csvValue = (v: string | number | boolean | null) => {
  if (v === null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(cells: MeasuredCell[]) {
  const rows = cells.map((c, i) => row(c, i + 1));
  const headers = Object.keys(rows[0] ?? {});
  const lines = [headers.join(","), ...rows.map((r) => headers.map((h) => csvValue(r[h as keyof typeof r])).join(","))];
  download("ckepi-jezero-analogs-30m.csv", lines.join("\n"), "text/csv;charset=utf-8");
}

export function downloadGeoJson(cells: MeasuredCell[]) {
  const collection = {
    type: "FeatureCollection",
    features: cells.map((c, i) => {
      const ring = [...c.boundary];
      if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) ring.push(ring[0]);
      return { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] }, properties: row(c, i + 1) };
    }),
  };
  download("ckepi-jezero-analogs-30m.geojson", JSON.stringify(collection, null, 2), "application/geo+json");
}
