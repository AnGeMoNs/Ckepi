"""Global terrestrial H3 Resolution-2 land grid hydrated from Open-Meteo Copernicus DEM & ERA5."""

from datetime import datetime, timezone
import json
import math
from pathlib import Path
import time
import h3
import httpx
import numpy as np
import pandas as pd

from app.etl.earth_api import cell_boundary_lon_lat

OPEN_METEO_ELEV_URL = "https://api.open-meteo.com/v1/elevation"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

GLOBAL_START_DATE = "2024-03-01"
GLOBAL_END_DATE = "2024-03-07"


def _classify_biome_from_telemetry(
    lat: float,
    aridity: float,
    subsurface_ice: float,
    diurnal_amp: float,
) -> str:
    """Assign a physically consistent biome i18n key from real Earth telemetry."""
    if subsurface_ice >= 0.25 and abs(lat) >= 55.0:
        return "biomes.polar_cold_desert" if aridity >= 0.75 else "biomes.polar_permafrost"
    if aridity >= 0.85:
        return "biomes.hyperarid_desert"
    if aridity >= 0.65:
        return "biomes.aeolian_basin" if diurnal_amp >= 20.0 else "biomes.evaporite_playa"
    if aridity <= 0.35 and abs(lat) <= 25.0:
        return "biomes.tropical_rainforest"
    return "biomes.probed_location"


def _batch_elevations(
    coords: list[tuple[float, float]],
    client: httpx.Client,
    batch_size: int = 100,
) -> list[float]:
    """Fetch Copernicus 90m / ASTER 30m DEM elevations in batches of 100 coordinates."""
    results: list[float] = []
    use_opentopodata = False
    for i in range(0, len(coords), batch_size):
        chunk = coords[i : i + batch_size]
        if not use_opentopodata:
            for attempt in range(4):
                try:
                    lats = ",".join(f"{lat:.4f}" for lat, _ in chunk)
                    lons = ",".join(f"{lon:.4f}" for _, lon in chunk)
                    resp = client.get(
                        OPEN_METEO_ELEV_URL,
                        params={"latitude": lats, "longitude": lons},
                    )
                    if resp.status_code == 429:
                        time.sleep(2.0 * (attempt + 1))
                        continue
                    if resp.status_code == 200:
                        results.extend(float(v) for v in resp.json()["elevation"])
                        time.sleep(0.22)
                        break
                    use_opentopodata = True
                    break
                except httpx.HTTPError:
                    if attempt == 3:
                        use_opentopodata = True
                    else:
                        time.sleep(1.5 * (attempt + 1))
            if not use_opentopodata and len(results) >= i + len(chunk):
                continue

        # Fallback to NASA/METI ASTER 30m DEM via OpenTopoData (max 100 locations/req, 1 req/s)
        locs = "|".join(f"{lat:.4f},{lon:.4f}" for lat, lon in chunk)
        for attempt in range(5):
            topo_resp = client.get(
                "https://api.opentopodata.org/v1/aster30m",
                params={"locations": locs},
            )
            if topo_resp.status_code == 429:
                time.sleep(2.0 * (attempt + 1))
                continue
            topo_resp.raise_for_status()
            results.extend(
                float(item["elevation"]) if item.get("elevation") is not None else 0.0
                for item in topo_resp.json()["results"]
            )
            break
        else:
            topo_resp.raise_for_status()
        time.sleep(1.1)
    return results


def _batch_era5(
    coords: list[tuple[float, float]],
    client: httpx.Client,
    batch_size: int = 80,
    checkpoint_path: Path | None = None,
) -> list[dict[str, object]]:
    """Fetch 7-day hourly ERA5-Land climate variables in batches with checkpoint resume."""
    all_items: list[dict[str, object]] = []
    if checkpoint_path and checkpoint_path.exists():
        for line in checkpoint_path.read_text(encoding="utf-8").splitlines():
            if line.strip():
                all_items.append(json.loads(line))
        if all_items:
            print(f"Resumed {len(all_items)}/{len(coords)} coordinates from checkpoint", flush=True)

    start_idx = len(all_items)
    for i in range(start_idx, len(coords), batch_size):
        chunk = coords[i : i + batch_size]
        lats = ",".join(f"{lat:.4f}" for lat, _ in chunk)
        lons = ",".join(f"{lon:.4f}" for _, lon in chunk)

        for attempt in range(4):
            try:
                resp = client.get(
                    OPEN_METEO_ARCHIVE_URL,
                    params={
                        "latitude": lats,
                        "longitude": lons,
                        "start_date": GLOBAL_START_DATE,
                        "end_date": GLOBAL_END_DATE,
                        "hourly": "temperature_2m,soil_temperature_0_to_7cm,soil_moisture_0_to_7cm,shortwave_radiation,surface_pressure,wind_speed_10m,relative_humidity_2m,et0_fao_evapotranspiration",
                        "timezone": "UTC",
                    },
                )
                if resp.status_code == 429:
                    reason = resp.text[:160]
                    if "Hourly" in reason or "Daily" in reason:
                        raise RuntimeError(
                            f"Open-Meteo quota limit reached at {len(all_items)}/{len(coords)}: {reason}"
                        )
                    retry_after = float(resp.headers.get("Retry-After", 5.0 * (attempt + 1)))
                    time.sleep(min(retry_after, 30.0))
                    continue
                resp.raise_for_status()
                payload = resp.json()
                batch_items = payload if isinstance(payload, list) else [payload]
                all_items.extend(batch_items)
                if checkpoint_path:
                    with checkpoint_path.open("a", encoding="utf-8") as fh:
                        for item in batch_items:
                            fh.write(json.dumps(item) + "\n")
                break
            except httpx.HTTPError:
                if attempt == 3:
                    raise
                time.sleep(2.0 * (attempt + 1))
        time.sleep(0.35)
        if ((i - start_idx) // batch_size) % 15 == 0:
            print(f"ERA5 progress: {len(all_items)}/{len(coords)}", flush=True)
    return all_items


def build_global_earth_land_grid(
    h3_resolution: int = 3,
    seed_parent_cells: list[str] | None = None,
    checkpoint_path: Path | None = None,
) -> pd.DataFrame:
    """Build a global terrestrial H3 land grid from real Open-Meteo ERA5 & embedded DEM elevation."""
    if seed_parent_cells:
        all_cells: list[str] = []
        for parent in seed_parent_cells:
            p_res = h3.get_resolution(parent)
            if p_res < h3_resolution:
                all_cells.extend(h3.cell_to_children(parent, h3_resolution))
            elif p_res == h3_resolution:
                all_cells.append(parent)
        all_cells = sorted(set(all_cells))
    else:
        all_cells = []
        for res0 in h3.get_res0_cells():
            all_cells.extend(h3.cell_to_children(res0, h3_resolution))

    valid_cells: list[str] = []
    centers: list[tuple[float, float]] = []
    for cell in all_cells:
        lat, lon = h3.cell_to_latlng(cell)
        if -85.0 <= lat <= 85.0:
            valid_cells.append(cell)
            centers.append((float(lat), float(lon)))

    with httpx.Client(timeout=45.0) as client:
        if seed_parent_cells:
            era5_items = _batch_era5(centers, client, checkpoint_path=checkpoint_path)
            elev_by_cell = {
                cell: float(item.get("elevation") or 0.0)
                for cell, item in zip(valid_cells, era5_items)
            }
            land_indices = [
                idx for idx, cell in enumerate(valid_cells) if elev_by_cell.get(cell, 0.0) > 1.0
            ]
            land_cells = [valid_cells[i] for i in land_indices]
            land_centers = [centers[i] for i in land_indices]
            land_elevs = [elev_by_cell[c] for c in land_cells]
            land_era5 = [era5_items[i] for i in land_indices]
        else:
            center_elevs = _batch_elevations(centers, client)
            land_cells = []
            land_centers = []
            land_elevs = []
            for cell, (lat, lon), elev in zip(valid_cells, centers, center_elevs):
                if elev > 1.0:
                    land_cells.append(cell)
                    land_centers.append((lat, lon))
                    land_elevs.append(elev)
            land_era5 = _batch_era5(land_centers, client, checkpoint_path=checkpoint_path)
            elev_by_cell = dict(zip(land_cells, land_elevs))

    now_iso = datetime.now(timezone.utc).isoformat()
    records: list[dict[str, object]] = []
    spacing_m = 103_000.0 if h3_resolution == 3 else (275_000.0 if h3_resolution == 2 else 680_000.0)

    for idx, (cell, (lat, lon), c_elev) in enumerate(zip(land_cells, land_centers, land_elevs)):
        neighbor_elevs = [
            elev_by_cell[n]
            for n in h3.grid_ring(cell, 1)
            if n in elev_by_cell
        ]
        if neighbor_elevs:
            max_dz = max(abs(c_elev - ne) for ne in neighbor_elevs)
            slope_deg = float(math.degrees(math.atan(max_dz / max(spacing_m * 0.15, 1.0))))
            roughness = float(np.clip(np.std([c_elev, *neighbor_elevs]) / 180.0, 0.03, 0.96))
        else:
            slope_deg = 1.5
            roughness = 0.08

        hourly = land_era5[idx].get("hourly", {}) if idx < len(land_era5) else {}
        if not isinstance(hourly, dict):
            hourly = {}

        soil_t = hourly.get("soil_temperature_0_to_7cm") or []
        air_t = hourly.get("temperature_2m") or []
        soil_m = hourly.get("soil_moisture_0_to_7cm") or []
        sw_rad = hourly.get("shortwave_radiation") or []
        press = hourly.get("surface_pressure") or []
        wind = hourly.get("wind_speed_10m") or []
        rel_hum = hourly.get("relative_humidity_2m") or []
        et0_vals = hourly.get("et0_fao_evapotranspiration") or []

        raw_temps = [t if t is not None else a for t, a in zip(soil_t, air_t)]
        valid_temps = [float(t) for t in raw_temps if t is not None]

        daily_amps: list[float] = []
        for j in range(0, len(valid_temps) - 23, 24):
            day_slice = valid_temps[j : j + 24]
            daily_amps.append(max(day_slice) - min(day_slice))
        diurnal_amp = float(np.mean(daily_amps)) if daily_amps else 14.0

        night_drops: list[float] = []
        for j in range(1, min(len(raw_temps), len(sw_rad))):
            t_prev, t_curr, sw = raw_temps[j - 1], raw_temps[j], sw_rad[j]
            if t_prev is not None and t_curr is not None and sw is not None and float(sw) <= 5.0:
                drop = float(t_prev) - float(t_curr)
                if drop > 0:
                    night_drops.append(drop)
        nocturnal_cooling = float(np.mean(night_drops)) if night_drops else diurnal_amp / 12.0

        valid_sw = [float(s) for s in sw_rad if s is not None and float(s) > 10.0]
        solar_flux_wm2 = float(np.mean(valid_sw)) if valid_sw else 180.0

        valid_m = [float(m) for m in soil_m if m is not None]
        mean_moisture = float(np.mean(valid_m)) if valid_m else 0.15
        aridity_index = float(np.clip(1.0 - (mean_moisture / 0.45), 0.04, 0.99))

        valid_p = [float(p) for p in press if p is not None]
        atm_pressure_mbar = float(np.mean(valid_p)) if valid_p else 1013.25

        valid_w = [float(w) for w in wind if w is not None]
        wind_kmh = float(np.mean(valid_w)) if valid_w else 12.0
        wind_ms = wind_kmh / 3.6
        aeolian_dust = float(np.clip((wind_ms / 9.5) * (aridity_index ** 1.6), 0.01, 0.96))

        mean_temp_c = float(np.mean(valid_temps)) if valid_temps else 15.0
        mean_temp_k = mean_temp_c + 273.15

        valid_rh = [float(r) for r in rel_hum if r is not None]
        rel_humidity = float(np.clip(np.mean(valid_rh), 2.0, 100.0)) if valid_rh else 45.0

        valid_et0 = [float(e) for e in et0_vals if e is not None]
        mean_et0 = float(np.mean(valid_et0)) if valid_et0 else 0.1
        if mean_temp_c < 2.0 or aridity_index >= 0.72:
            vegetation_lai = 0.0
        else:
            vegetation_lai = float(np.clip(mean_et0 * (1.0 - aridity_index) * 18.0, 0.0, 6.5))

        # Clear-sky UV proxy scaled by solar flux & altitude (elev_km increases UV ~6% per km)
        uv_index = float(np.clip((solar_flux_wm2 / 48.0) * (1.0 + 0.06 * (c_elev / 1000.0)), 0.2, 18.0))

        if mean_temp_c < -1.0:
            subsurface_ice = float(np.clip(mean_moisture * 1.4 + 0.15, 0.05, 0.85))
        elif mean_temp_c < 2.0:
            subsurface_ice = float(np.clip(mean_moisture * 0.6, 0.0, 0.35))
        else:
            subsurface_ice = 0.0

        # Estimate albedo from climate & snow/ice cover (higher for cold ice/desert, lower for forest)
        est_albedo = 0.36 if subsurface_ice >= 0.25 else (0.27 if aridity_index >= 0.80 else 0.15)
        absorbed = max(solar_flux_wm2 * (1.0 - est_albedo), 20.0)
        apparent_ti = float(np.clip((absorbed / max(diurnal_amp, 2.5)) * 12.5, 45.0, 850.0))
        ice_sublimation = (
            float(np.clip(subsurface_ice * (solar_flux_wm2 / 450.0) * aridity_index, 0.0, 0.85))
            if subsurface_ice > 0.02
            else 0.0
        )

        biome_key = _classify_biome_from_telemetry(lat, aridity_index, subsurface_ice, diurnal_amp)

        records.append(
            {
                "earth_cell_h3": cell,
                "h3_resolution": h3_resolution,
                "lat": round(lat, 5),
                "lon": round(lon, 5),
                "h3_boundary_json": cell_boundary_lon_lat(cell),
                "region_key": "regions.global_h3_cell",
                "country_code": "--",
                "biome_key": biome_key,
                "is_benchmark": False,
                "topographic_roughness": round(roughness, 4),
                "slope_deg": round(slope_deg, 3),
                "thermal_inertia": round(apparent_ti, 1),
                "surface_albedo": round(est_albedo, 4),
                "solar_flux_wm2": round(solar_flux_wm2, 2),
                "subsurface_ice_frac": round(subsurface_ice, 4),
                "aridity_index": round(aridity_index, 4),
                "relative_humidity_pct": round(rel_humidity, 2),
                "uv_irradiance_index": round(uv_index, 2),
                "vegetation_lai_proxy": round(vegetation_lai, 3),
                "diurnal_temp_amplitude_k": round(diurnal_amp, 2),
                "nocturnal_cooling_k_hr": round(nocturnal_cooling, 3),
                "mean_surface_temp_k": round(mean_temp_k, 2),
                "surface_wind_ms": round(wind_ms, 2),
                "aeolian_dust_flux": round(aeolian_dust, 4),
                "ice_sublimation_rate": round(ice_sublimation, 4),
                "gravity_g": 1.0,
                "atm_pressure_mbar": round(atm_pressure_mbar, 2),
                "radiation_msv_yr": 2.4,
                "source_apis_json": ["Open-Meteo Copernicus DEM", "Open-Meteo ERA5"],
                "observation_window": f"{GLOBAL_START_DATE} / {GLOBAL_END_DATE}",
                "fetched_at": now_iso,
                "is_live_probed": False,
            }
        )

    return pd.DataFrame(records)


if __name__ == "__main__":
    import duckdb
    from app.config import settings

    db_path = settings.data_dir / "ckepi.duckdb"
    pq_path = settings.data_dir / "earth_h3_grid.parquet"
    ckpt_path = settings.data_dir / "era5_res3_checkpoint.jsonl"

    conn = duckdb.connect(str(db_path), read_only=True)
    try:
        parents = [
            r[0]
            for r in conn.execute(
                "SELECT earth_cell_h3 FROM earth_h3_grid WHERE h3_resolution = 2"
            ).fetchall()
        ]
        df_keep = conn.execute(
            "SELECT * FROM earth_h3_grid WHERE is_benchmark = TRUE OR h3_resolution >= 4"
        ).df()
    finally:
        conn.close()

    df_res3 = build_global_earth_land_grid(
        h3_resolution=3,
        seed_parent_cells=parents,
        checkpoint_path=ckpt_path,
    )
    df_res3["h3_boundary_json"] = df_res3["h3_boundary_json"].apply(json.dumps)
    df_res3["source_apis_json"] = df_res3["source_apis_json"].apply(json.dumps)

    df_all = (
        pd.concat([df_keep, df_res3], ignore_index=True)
        .drop_duplicates(subset=["earth_cell_h3"])
        .reset_index(drop=True)
    )
    df_all.to_parquet(pq_path, index=False)
    conn = duckdb.connect(str(db_path))
    try:
        conn.execute("CREATE OR REPLACE TABLE earth_h3_grid AS SELECT * FROM read_parquet(?)", [str(pq_path)])
    finally:
        conn.close()
    ckpt_path.unlink(missing_ok=True)
    print(f"Res-3 upgrade complete: {len(df_all)} cells stored in DuckDB.", flush=True)
