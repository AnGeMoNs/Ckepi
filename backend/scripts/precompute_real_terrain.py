"""Precompute real metric DEM windows (30 m) for the Jezero <-> Antofagasta terrain comparison.

Reproducible offline step. It reads public DEMs that need no login:
- Mars: USGS Astrogeology "Mars 2020 Terrain Relative Navigation CTX DEM Mosaic" (NASA MRO CTX),
  Jezero crater, 20 m/px, Equirectangular with standard parallel 18.4663 N (true scale at Jezero).
- Earth: Copernicus DEM GLO-30 (ESA, DSM, 1 arcsec), AWS Open Data registry, reprojected to
  UTM zone 19S (EPSG:32719).

Output (committed, small): app/data/derived/terrain_windows_30m.npz + terrain_windows_30m.json.
The raw GeoTIFFs are NOT committed; their URLs and SHA-256 are recorded in the JSON.

Usage (needs rasterio, not a runtime dependency of the API):
    python scripts/precompute_real_terrain.py --dem-dir /path/to/downloads
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import h3
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.warp import Resampling, reproject

OUT_DIR = Path(__file__).resolve().parents[1] / "app" / "data" / "derived"
SPACING_M = 30.0
WINDOW_M = 6000.0
N_PX = int(WINDOW_M / SPACING_M)

CTX_FILE = "M20_JezeroCrater_CTXDEM_20m.tif"
CTX_URL = (
    "https://planetarymaps.usgs.gov/mosaic/mars2020_trn/CTX/ScienceInvestigationMaps_JPL/"
    "M20_JezeroCrater_CTXDEM_20m.tif"
)
COP_URL = "https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
MARS_RADIUS_M = 3396190.0
EARTH_CRS = "EPSG:32719"

# Centers: Mars site and Yungay control come from repo catalogs; Antofagasta nodes are H3 cell centers.
WINDOWS: dict[str, dict[str, object]] = {
    "mars_jezero_crater": {"body": "mars", "lat": 18.38, "lon": 77.58,
                            "center_origin": "app/data/planetary_sites.json"},
    "control_yungay": {"body": "earth", "lat": -24.08, "lon": -69.91,
                       "center_origin": "app/engine/known_analogs.py (Atacama Desert (Yungay))"},
    "83b220fffffffff": {"body": "earth", "h3": "83b220fffffffff"},
    "83b221fffffffff": {"body": "earth", "h3": "83b221fffffffff"},
    "83b225fffffffff": {"body": "earth", "h3": "83b225fffffffff"},
    "83b224fffffffff": {"body": "earth", "h3": "83b224fffffffff"},
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def copernicus_tile(lat: float, lon: float) -> str:
    lat_floor, lon_floor = int(np.floor(lat)), int(np.floor(lon))
    ns = f"{'N' if lat_floor >= 0 else 'S'}{abs(lat_floor):02d}"
    ew = f"{'E' if lon_floor >= 0 else 'W'}{abs(lon_floor):03d}"
    return f"Copernicus_DSM_COG_10_{ns}_00_{ew}_00_DEM"


def utm19s_center(lat: float, lon: float) -> tuple[float, float]:
    from rasterio.warp import transform

    xs, ys = transform("EPSG:4326", EARTH_CRS, [lon], [lat])
    return xs[0], ys[0]


def window_from(src: rasterio.io.DatasetReader, dst_crs, cx: float, cy: float, resampling) -> np.ndarray:
    half = WINDOW_M / 2.0
    dst_transform = from_origin(cx - half, cy + half, SPACING_M, SPACING_M)
    out = np.full((N_PX, N_PX), np.nan, dtype=np.float32)
    reproject(
        source=rasterio.band(src, 1),
        destination=out,
        src_nodata=src.nodata,
        dst_transform=dst_transform,
        dst_crs=dst_crs,
        dst_nodata=np.nan,
        resampling=resampling,
    )
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dem-dir", type=Path, required=True)
    args = parser.parse_args()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    arrays: dict[str, np.ndarray] = {}
    meta: dict[str, object] = {
        "generated_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "spacing_m": SPACING_M,
        "window_m": WINDOW_M,
        "grid_px": N_PX,
        "windows": {},
    }

    for key, spec in WINDOWS.items():
        if "h3" in spec:
            lat, lon = h3.cell_to_latlng(str(spec["h3"]))
            origin = f"H3 cell center of {spec['h3']}"
        else:
            lat, lon = float(spec["lat"]), float(spec["lon"])
            origin = str(spec["center_origin"])

        if spec["body"] == "mars":
            path = args.dem_dir / CTX_FILE
            with rasterio.open(path) as src:
                phi1 = np.deg2rad(18.4663)
                cx = MARS_RADIUS_M * np.cos(phi1) * np.deg2rad(lon)
                cy = MARS_RADIUS_M * np.deg2rad(lat)
                # 20 m -> 30 m: area-average to avoid aliasing high-frequency relief.
                dem = window_from(src, src.crs, cx, cy, Resampling.average)
                crs_label = "Mars 2000 sphere, Equirectangular (std parallel 18.4663 N), metres"
            source = {"dataset": "USGS Astrogeology Mars 2020 TRN CTX DEM Mosaic (NASA MRO CTX), 20 m/px",
                      "url": CTX_URL, "file": CTX_FILE, "sha256": sha256(path), "license": "Public domain (USGS)"}
        else:
            name = copernicus_tile(lat, lon)
            path = args.dem_dir / f"{name}.tif"
            with rasterio.open(path) as src:
                cx, cy = utm19s_center(lat, lon)
                dem = window_from(src, EARTH_CRS, cx, cy, Resampling.bilinear)
                crs_label = "WGS 84 / UTM zone 19S (EPSG:32719), metres"
            source = {"dataset": "Copernicus DEM GLO-30 (ESA, DSM, 1 arcsec)", "url": COP_URL.format(name=name),
                      "file": f"{name}.tif", "sha256": sha256(path),
                      "license": "Copernicus DEM licence (free, attribution: (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved)"}

        valid = float(np.isfinite(dem).mean())
        if valid < 0.98:
            raise SystemExit(f"{key}: only {valid:.1%} valid pixels; window falls outside the DEM")
        arrays[key] = dem.astype(np.float32)
        meta["windows"][key] = {
            "body": spec["body"], "center_lat": round(lat, 5), "center_lon": round(lon, 5),
            "center_origin": origin, "crs": crs_label, "valid_fraction": round(valid, 4),
            "elev_min_m": round(float(np.nanmin(dem)), 1), "elev_max_m": round(float(np.nanmax(dem)), 1),
            "source": source,
        }
        print(f"{key}: {N_PX}x{N_PX} @ {SPACING_M:.0f} m, elev {np.nanmin(dem):.0f}..{np.nanmax(dem):.0f} m")

    np.savez_compressed(OUT_DIR / "terrain_windows_30m.npz", **arrays)
    (OUT_DIR / "terrain_windows_30m.json").write_text(json.dumps(meta, indent=2, ensure_ascii=False) + "\n")
    print(f"wrote {OUT_DIR}")


if __name__ == "__main__":
    main()
