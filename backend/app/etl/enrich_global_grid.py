"""Multi-API incremental enrichment pipeline for the global H3 Res-3 Earth grid."""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import json
import math
from pathlib import Path
import time
import duckdb
import httpx
import numpy as np
import pandas as pd

from app.config import settings
from app.engine.planetary_physics import (
    compute_hertz_knudsen_sublimation_rate,
    compute_terrestrial_radiation_msv_yr,
)
from app.etl.earth_api import (
    OPEN_METEO_ELEV_URL,
    OPENTOPODATA_ASTER_URL,
    fetch_nasa_power_climatology,
    fetch_soilgrids_metrics,
)
from app.etl.geology_and_habitability import fetch_macrostrat_geology
from app.etl.http_utils import create_http_client

CKPT_DEM_PATH = settings.data_dir / "ckpt_dem_res3.jsonl"
CKPT_POWER_PATH = settings.data_dir / "ckpt_nasa_power_res3.jsonl"
CKPT_SOIL_GEO_PATH = settings.data_dir / "ckpt_soil_geo_res3.jsonl"


def _load_checkpoint(path: Path) -> dict[str, dict[str, object]]:
    """Load keyed JSONL checkpoint records into a dict indexed by earth_cell_h3."""
    records: dict[str, dict[str, object]] = {}
    if not path.exists():
        return records
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        item = json.loads(line)
        cell_id = item.get("earth_cell_h3")
        if isinstance(cell_id, str):
            records[cell_id] = item
    return records


def _append_checkpoint(path: Path, items: list[dict[str, object]]) -> None:
    """Append a batch of JSONL records to a checkpoint file."""
    if not items:
        return
    with path.open("a", encoding="utf-8") as fh:
        for item in items:
            fh.write(json.dumps(item) + "\n")


def _stencil_coords(lat: float, lon: float) -> tuple[list[float], list[float], float, float]:
    """Build 5-point ~3.3 km DEM finite-difference stencil around (lat, lon)."""
    d_lat = 0.015
    cos_lat = max(math.cos(math.radians(lat)), 0.20)
    d_lon = d_lat / cos_lat
    lats = [
        lat,
        min(89.9, lat + d_lat),
        max(-89.9, lat - d_lat),
        lat,
        lat,
    ]
    lons = [
        lon,
        lon,
        lon,
        ((lon + d_lon + 180.0) % 360.0) - 180.0,
        ((lon - d_lon + 180.0) % 360.0) - 180.0,
    ]
    dy_m = 2.0 * d_lat * 111_320.0
    dx_m = 2.0 * d_lon * 111_320.0 * cos_lat
    return lats, lons, dx_m, dy_m


def _fetch_dem_batch_elevations(
    coords: list[tuple[float, float]],
    client: httpx.Client,
    use_aster: bool,
) -> tuple[list[float], bool]:
    """Fetch elevations for up to 100 coordinates via Open-Meteo DEM with ASTER 30m fallback."""
    if not use_aster:
        lats_str = ",".join(f"{la:.5f}" for la, _ in coords)
        lons_str = ",".join(f"{lo:.5f}" for _, lo in coords)
        for attempt in range(4):
            try:
                resp = client.get(
                    OPEN_METEO_ELEV_URL,
                    params={"latitude": lats_str, "longitude": lons_str},
                )
                if resp.status_code == 429:
                    reason = resp.text[:160]
                    if "Daily" in reason or "Hourly" in reason:
                        use_aster = True
                        break
                    time.sleep(min(float(resp.headers.get("Retry-After", 4.0 * (attempt + 1))), 20.0))
                    continue
                if resp.status_code == 200:
                    return [float(v) for v in resp.json()["elevation"]], False
                use_aster = True
                break
            except httpx.HTTPError:
                if attempt == 3:
                    use_aster = True
                else:
                    time.sleep(1.5 * (attempt + 1))

    locs = "|".join(f"{la:.5f},{lo:.5f}" for la, lo in coords)
    for attempt in range(5):
        resp = client.get(OPENTOPODATA_ASTER_URL, params={"locations": locs})
        if resp.status_code == 429:
            time.sleep(3.0 * (attempt + 1))
            continue
        resp.raise_for_status()
        elevs = [
            float(item["elevation"]) if item.get("elevation") is not None else 0.0
            for item in resp.json()["results"]
        ]
        time.sleep(1.05)
        return elevs, True
    resp.raise_for_status()
    return [], True


def run_dem_phase(df_target: pd.DataFrame) -> None:
    """Phase 1: Hydrate local 5-point stencil slope & roughness from Copernicus 90m / ASTER 30m DEM."""
    done = _load_checkpoint(CKPT_DEM_PATH)
    pending = df_target[~df_target["earth_cell_h3"].isin(done)]
    print(f"[DEM] Loaded {len(done)}/{len(df_target)} from checkpoint; {len(pending)} remaining.", flush=True)
    if pending.empty:
        return

    rows = list(pending[["earth_cell_h3", "lat", "lon"]].itertuples(index=False, name=None))
    batch_cells = 20  # 20 * 5 = 100 coordinates per request
    use_aster = False

    with create_http_client(timeout=30.0) as client:
        for i in range(0, len(rows), batch_cells):
            chunk = rows[i : i + batch_cells]
            flat_coords: list[tuple[float, float]] = []
            spans: list[tuple[float, float]] = []
            for _, lat, lon in chunk:
                lats, lons, dx_m, dy_m = _stencil_coords(float(lat), float(lon))
                flat_coords.extend(zip(lats, lons))
                spans.append((dx_m, dy_m))

            elevs, use_aster = _fetch_dem_batch_elevations(flat_coords, client, use_aster)
            out_items: list[dict[str, object]] = []
            for idx, (cell_id, _, _) in enumerate(chunk):
                e = elevs[idx * 5 : (idx + 1) * 5]
                dx_m, dy_m = spans[idx]
                dz_dy = (e[1] - e[2]) / max(dy_m, 1.0)
                dz_dx = (e[3] - e[4]) / max(dx_m, 1.0)
                slope_deg = float(math.degrees(math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2))))
                roughness = float(np.clip(np.std(e) / 110.0, 0.03, 0.96))
                out_items.append(
                    {
                        "earth_cell_h3": cell_id,
                        "slope_deg": round(slope_deg, 3),
                        "topographic_roughness": round(roughness, 4),
                        "elevation_m": round(e[0], 1),
                        "dem_source": "NASA/METI ASTER 30m" if use_aster else "Open-Meteo Copernicus DEM",
                    }
                )
            _append_checkpoint(CKPT_DEM_PATH, out_items)
            done_count = len(done) + i + len(chunk)
            if ((i // batch_cells) % 25 == 0) or (i + batch_cells >= len(rows)):
                print(f"[DEM] Progress: {done_count}/{len(df_target)}", flush=True)
            if not use_aster:
                time.sleep(0.20)


def _fetch_power_one(cell_id: str, lat: float, lon: float, client: httpx.Client) -> dict[str, object]:
    """Fetch NASA POWER 20+ year annual climatology for one H3 cell centroid."""
    power = fetch_nasa_power_climatology(lat, lon, client)
    return {"earth_cell_h3": cell_id, **power}


def run_nasa_power_phase(df_target: pd.DataFrame, workers: int = 8) -> None:
    """Phase 2: Hydrate 20+ year annual climatology from NASA POWER."""
    done = _load_checkpoint(CKPT_POWER_PATH)
    pending = df_target[~df_target["earth_cell_h3"].isin(done)]
    print(f"[NASA POWER] Loaded {len(done)}/{len(df_target)} from checkpoint; {len(pending)} remaining.", flush=True)
    if pending.empty:
        return

    rows = list(pending[["earth_cell_h3", "lat", "lon"]].itertuples(index=False, name=None))
    chunk_size = 80

    with create_http_client(timeout=30.0) as client:
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i : i + chunk_size]
            batch_items: list[dict[str, object]] = []
            with ThreadPoolExecutor(max_workers=workers) as pool:
                futures = {
                    pool.submit(_fetch_power_one, cell_id, float(lat), float(lon), client): cell_id
                    for cell_id, lat, lon in chunk
                }
                for fut in as_completed(futures):
                    cell_id = futures[fut]
                    try:
                        batch_items.append(fut.result())
                    except Exception as exc:
                        print(f"[NASA POWER] Warning {cell_id}: {exc}", flush=True)
            _append_checkpoint(CKPT_POWER_PATH, batch_items)
            done_count = len(done) + i + len(chunk)
            if ((i // chunk_size) % 5 == 0) or (i + chunk_size >= len(rows)):
                print(f"[NASA POWER] Progress: {done_count}/{len(df_target)}", flush=True)


def _fetch_soil_geo_one(cell_id: str, lat: float, lon: float, client: httpx.Client) -> dict[str, object]:
    """Fetch ISRIC SoilGrids v2.0 + Macrostrat geologic unit for one H3 cell."""
    soil = fetch_soilgrids_metrics(lat, lon) or {}
    geo = fetch_macrostrat_geology(lat, lon, client)
    return {
        "earth_cell_h3": cell_id,
        "sand_pct": soil.get("sand_pct"),
        "clay_pct": soil.get("clay_pct"),
        "bdod_g_cm3": soil.get("bdod_g_cm3"),
        "soc_pct": soil.get("soc_pct"),
        "lithology": geo.lithology if geo else None,
        "rock_name": geo.rock_name if geo else None,
        "geologic_age": geo.age_name if geo else None,
    }


def run_soil_geo_phase(df_target: pd.DataFrame, mode: str = "priority", workers: int = 2) -> None:
    """Phase 4: Hydrate SoilGrids v2.0 & Macrostrat geology with strict rate-limit handling."""
    done = _load_checkpoint(CKPT_SOIL_GEO_PATH)
    if mode == "priority":
        mask = (
            (df_target["aridity_index"] >= 0.55)
            | (df_target["subsurface_ice_frac"] >= 0.10)
            | (df_target["slope_deg"] >= 5.0)
        )
        subset = df_target[mask]
    else:
        subset = df_target

    pending = subset[~subset["earth_cell_h3"].isin(done)]
    print(
        f"[SoilGrids+Macrostrat] Mode={mode}, target={len(subset)}, "
        f"loaded={len(done)}, remaining={len(pending)}.",
        flush=True,
    )
    if pending.empty:
        return

    rows = list(pending[["earth_cell_h3", "lat", "lon"]].itertuples(index=False, name=None))
    chunk_size = 20
    with create_http_client(timeout=10.0) as client:
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i : i + chunk_size]
            batch_items: list[dict[str, object]] = []
            with ThreadPoolExecutor(max_workers=workers) as pool:
                futures = {
                    pool.submit(_fetch_soil_geo_one, cell_id, float(lat), float(lon), client): cell_id
                    for cell_id, lat, lon in chunk
                }
                for fut in as_completed(futures):
                    try:
                        batch_items.append(fut.result())
                    except Exception:
                        pass
            _append_checkpoint(CKPT_SOIL_GEO_PATH, batch_items)
            print(f"[SoilGrids+Macrostrat] Progress: {min(len(done) + i + len(chunk), len(subset))}/{len(subset)}", flush=True)


def consolidate_to_duckdb() -> None:
    """Merge all available checkpoints + planetary physics into DuckDB & Parquet."""
    db_path = settings.data_dir / "ckepi.duckdb"
    pq_path = settings.data_dir / "earth_h3_grid.parquet"

    dem_map = _load_checkpoint(CKPT_DEM_PATH)
    power_map = _load_checkpoint(CKPT_POWER_PATH)
    soil_map = _load_checkpoint(CKPT_SOIL_GEO_PATH)

    conn = duckdb.connect(str(db_path))
    try:
        df_all = conn.execute("SELECT * FROM earth_h3_grid").df()
    finally:
        conn.close()

    now_iso = datetime.now(timezone.utc).isoformat()
    enrichment_rows: list[dict[str, object]] = []

    for idx, row in df_all.iterrows():
        if bool(row["is_benchmark"]) or int(row["h3_resolution"]) >= 4:
            continue

        cell_id = str(row["earth_cell_h3"])
        lat = float(row["lat"])
        sources: list[str] = ["Open-Meteo ERA5"]

        dem = dem_map.get(cell_id)
        if dem:
            df_all.at[idx, "slope_deg"] = float(dem["slope_deg"])
            df_all.at[idx, "topographic_roughness"] = float(dem["topographic_roughness"])
            sources.append(str(dem.get("dem_source", "Open-Meteo Copernicus DEM")))
        else:
            sources.append("Open-Meteo Copernicus DEM")

        power = power_map.get(cell_id)
        if power:
            df_all.at[idx, "solar_flux_wm2"] = float(power["solar_flux_wm2"])
            df_all.at[idx, "surface_albedo"] = float(power["surface_albedo"])
            df_all.at[idx, "atm_pressure_mbar"] = float(power["atm_pressure_mbar"])
            df_all.at[idx, "aridity_index"] = float(power["aridity_index"])
            df_all.at[idx, "relative_humidity_pct"] = float(power["relative_humidity_pct"])
            df_all.at[idx, "uv_irradiance_index"] = float(power["uv_irradiance_index"])
            df_all.at[idx, "surface_wind_ms"] = float(power["surface_wind_ms"])
            df_all.at[idx, "aeolian_dust_flux"] = float(power["aeolian_dust_flux"])
            if power.get("clim_mean_temp_c") is not None:
                df_all.at[idx, "mean_surface_temp_k"] = round(float(power["clim_mean_temp_c"]) + 273.15, 2)
            frost_days = power.get("frost_days_yr")
            if frost_days is not None and float(frost_days) >= 200.0 and float(df_all.at[idx, "subsurface_ice_frac"]) < 0.05:
                df_all.at[idx, "subsurface_ice_frac"] = round(float(np.clip(float(frost_days) / 730.0, 0.02, 0.45)), 4)
            if power.get("is_climatology"):
                df_all.at[idx, "observation_window"] = "climatology_multiyear (20+ yr ANN) + ERA5"
            sources.insert(0, "NASA POWER")

        # Recompute thermal inertia & planetary physics equations
        albedo = float(df_all.at[idx, "surface_albedo"])
        solar_flux = float(df_all.at[idx, "solar_flux_wm2"])
        diurnal_amp = float(df_all.at[idx, "diurnal_temp_amplitude_k"])
        absorbed = max(solar_flux * (1.0 - albedo), 20.0)
        ti = float(np.clip((absorbed / max(diurnal_amp, 2.5)) * 12.5, 45.0, 850.0))

        soil = soil_map.get(cell_id)
        if soil and soil.get("bdod_g_cm3") is not None:
            bd_factor = float(np.clip(float(soil["bdod_g_cm3"]) / 1.35, 0.7, 1.45))
            ti = float(np.clip(ti * bd_factor, 45.0, 950.0))
            sand_pct = float(soil.get("sand_pct") or 40.0)
            clay_pct = float(soil.get("clay_pct") or 20.0)
            sand_erod = float(np.clip(0.85 + 0.35 * (sand_pct / 100.0) - 0.15 * (clay_pct / 100.0), 0.75, 1.2))
            df_all.at[idx, "aeolian_dust_flux"] = round(float(np.clip(float(df_all.at[idx, "aeolian_dust_flux"]) * sand_erod, 0.01, 0.96)), 4)
            sources.append("ISRIC SoilGrids v2.0")

        if soil and soil.get("lithology"):
            sources.append("Macrostrat")

        if soil:
            enrichment_rows.append(soil)

        subsurface_ice = float(df_all.at[idx, "subsurface_ice_frac"])
        mean_temp_k = float(df_all.at[idx, "mean_surface_temp_k"])
        atm_p = float(df_all.at[idx, "atm_pressure_mbar"])
        rel_hum = float(df_all.at[idx, "relative_humidity_pct"])
        aridity = float(df_all.at[idx, "aridity_index"])

        df_all.at[idx, "thermal_inertia"] = round(ti, 1)
        df_all.at[idx, "ice_sublimation_rate"] = compute_hertz_knudsen_sublimation_rate(
            subsurface_ice_frac=subsurface_ice,
            mean_temp_k=mean_temp_k,
            diurnal_amp_k=diurnal_amp,
            atm_pressure_mbar=atm_p,
            relative_humidity_pct=rel_hum,
        )
        df_all.at[idx, "radiation_msv_yr"] = compute_terrestrial_radiation_msv_yr(
            atm_pressure_mbar=atm_p,
            lat=lat,
            aridity_index=aridity,
            subsurface_ice_frac=subsurface_ice,
        )
        df_all.at[idx, "source_apis_json"] = json.dumps(list(dict.fromkeys(sources)))
        df_all.at[idx, "fetched_at"] = now_iso

    df_all.to_parquet(pq_path, index=False)
    conn = duckdb.connect(str(db_path))
    try:
        conn.execute("CREATE OR REPLACE TABLE earth_h3_grid AS SELECT * FROM read_parquet(?)", [str(pq_path)])
        if enrichment_rows:
            df_enrich = pd.DataFrame(enrichment_rows).drop_duplicates(subset=["earth_cell_h3"])
            conn.register("df_enrich_view", df_enrich)
            conn.execute("CREATE OR REPLACE TABLE earth_cell_enrichment AS SELECT * FROM df_enrich_view")
    finally:
        conn.close()
    print(f"[Consolidate] Updated {len(df_all)} rows in DuckDB & Parquet (enrichment rows: {len(enrichment_rows)}).", flush=True)


def main() -> None:
    parser = argparse.ArgumentParser(description="Multi-API global H3 Res-3 enrichment pipeline")
    parser.add_argument(
        "--phase",
        choices=["dem", "nasa_power", "soil_geo", "consolidate", "all-fast"],
        default="all-fast",
    )
    parser.add_argument("--soil-geo-mode", choices=["priority", "all"], default="priority")
    parser.add_argument("--power-workers", type=int, default=8)
    args = parser.parse_args()

    conn = duckdb.connect(str(settings.data_dir / "ckepi.duckdb"), read_only=True)
    try:
        df_target = conn.execute(
            "SELECT earth_cell_h3, lat, lon, aridity_index, subsurface_ice_frac, slope_deg "
            "FROM earth_h3_grid WHERE is_benchmark = FALSE AND h3_resolution = 3"
        ).df()
    finally:
        conn.close()

    if args.phase in ("dem", "all-fast"):
        run_dem_phase(df_target)
    if args.phase in ("nasa_power", "all-fast"):
        run_nasa_power_phase(df_target, workers=args.power_workers)
    if args.phase == "soil_geo":
        run_soil_geo_phase(df_target, mode=args.soil_geo_mode)
    if args.phase in ("consolidate", "all-fast"):
        consolidate_to_duckdb()


if __name__ == "__main__":
    main()
