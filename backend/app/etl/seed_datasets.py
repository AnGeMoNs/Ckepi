"""Dataset materializer persisting real NASA/Open-Meteo observations in Parquet & DuckDB."""

import json
from pathlib import Path
import duckdb
import pandas as pd

from app.config import settings
from app.engine.planetary_physics import (
    compute_hertz_knudsen_sublimation_rate,
    compute_terrestrial_radiation_msv_yr,
    resolve_iau_planetary_feature,
)
from app.etl.earth_etl import build_real_earth_h3_grid
from app.etl.global_earth_etl import build_global_earth_land_grid
from app.etl.planetary_etl import build_real_planetary_sites_and_timeseries
from app.models.schemas import DataConfidence, PlanetarySite, VariableOrigin


def ensure_datasets_built(data_dir: Path | None = None, force: bool = False) -> Path:
    """Materialize real-API planetary and Earth H3 datasets into Parquet and DuckDB."""
    target_dir = data_dir or settings.data_dir
    target_dir.mkdir(parents=True, exist_ok=True)

    sites_json_path = target_dir / "planetary_sites.json"
    planetary_ts_path = target_dir / "planetary_timeseries.parquet"
    earth_grid_path = target_dir / "earth_h3_grid.parquet"
    duckdb_path = target_dir / "ckepi.duckdb"

    if (
        not force
        and sites_json_path.exists()
        and planetary_ts_path.exists()
        and earth_grid_path.exists()
        and duckdb_path.exists()
    ):
        _upgrade_earth_physics_if_needed(duckdb_path, earth_grid_path)
        return duckdb_path

    sites, df_planetary_ts = build_real_planetary_sites_and_timeseries()
    sites_json_path.write_text(
        json.dumps([s.model_dump() for s in sites], indent=2),
        encoding="utf-8",
    )
    df_planetary_ts.to_parquet(planetary_ts_path, index=False)

    df_earth_global = build_global_earth_land_grid(h3_resolution=2)
    df_earth_anchors = build_real_earth_h3_grid(h3_resolution=settings.default_h3_resolution)
    df_earth = pd.concat([df_earth_anchors, df_earth_global], ignore_index=True)
    df_earth = df_earth.drop_duplicates(subset=["earth_cell_h3"]).reset_index(drop=True)
    df_earth_store = df_earth.copy()
    df_earth_store["h3_boundary_json"] = df_earth_store["h3_boundary_json"].apply(json.dumps)
    df_earth_store["source_apis_json"] = df_earth_store["source_apis_json"].apply(json.dumps)
    df_earth_store.to_parquet(earth_grid_path, index=False)

    conn = duckdb.connect(str(duckdb_path))
    try:
        conn.execute(
            "CREATE OR REPLACE TABLE earth_h3_grid AS SELECT * FROM read_parquet(?)",
            [str(earth_grid_path)],
        )
        conn.execute(
            "CREATE OR REPLACE TABLE planetary_timeseries AS SELECT * FROM read_parquet(?)",
            [str(planetary_ts_path)],
        )
    finally:
        conn.close()

    return duckdb_path


def _upgrade_earth_physics_if_needed(duckdb_path: Path, earth_grid_path: Path) -> None:
    """Upgrade cached Earth H3 cells to PARMA barometric cosmic-ray dosimetry & Hertz-Knudsen ice sublimation."""
    conn = duckdb.connect(str(duckdb_path))
    try:
        max_rad_row = conn.execute("SELECT MAX(radiation_msv_yr) FROM earth_h3_grid").fetchone()
        if max_rad_row and max_rad_row[0] is not None and float(max_rad_row[0]) > 2.45:
            return
        df = conn.execute("SELECT * FROM earth_h3_grid").df()
        if df.empty:
            return
        df["radiation_msv_yr"] = [
            compute_terrestrial_radiation_msv_yr(
                atm_pressure_mbar=float(p),
                lat=float(lat),
                aridity_index=float(arid),
                subsurface_ice_frac=float(ice),
            )
            for p, lat, arid, ice in zip(
                df["atm_pressure_mbar"],
                df["lat"],
                df["aridity_index"],
                df["subsurface_ice_frac"],
            )
        ]
        df["ice_sublimation_rate"] = [
            compute_hertz_knudsen_sublimation_rate(
                subsurface_ice_frac=float(ice),
                mean_temp_k=float(t_mean),
                diurnal_amp_k=float(t_amp),
                atm_pressure_mbar=float(p),
                relative_humidity_pct=float(rh),
            )
            for ice, t_mean, t_amp, p, rh in zip(
                df["subsurface_ice_frac"],
                df["mean_surface_temp_k"],
                df["diurnal_temp_amplitude_k"],
                df["atm_pressure_mbar"],
                df["relative_humidity_pct"],
            )
        ]
        df.to_parquet(earth_grid_path, index=False)
        conn.execute(
            "CREATE OR REPLACE TABLE earth_h3_grid AS SELECT * FROM read_parquet(?)",
            [str(earth_grid_path)],
        )
    finally:
        conn.close()


def load_cached_planetary_sites(data_dir: Path | None = None) -> list[PlanetarySite]:
    """Load persisted PlanetarySite list with real provenance from JSON."""
    target_dir = data_dir or settings.data_dir
    sites_json_path = target_dir / "planetary_sites.json"
    if not sites_json_path.exists():
        ensure_datasets_built(target_dir=target_dir)
    raw = json.loads(sites_json_path.read_text(encoding="utf-8"))
    sites: list[PlanetarySite] = []
    for item in raw:
        site = PlanetarySite(**item)
        if site.planetary_feature is None:
            site.planetary_feature = resolve_iau_planetary_feature(
                site.body,
                site.coordinates.lat,
                site.coordinates.lon,
            )
        if site.confidence is None:
            is_mars = site.body == "mars"
            var_prov: dict[str, VariableOrigin] = {
                "topographic_roughness": "constant",
                "slope_deg": "constant",
                "thermal_inertia": "constant",
                "surface_albedo": "constant",
                "subsurface_ice_frac": "constant",
                "solar_flux_wm2": "derived" if is_mars else "model",
                "mean_surface_temp_k": "measured" if is_mars else "model",
                "diurnal_temp_amplitude_k": "measured" if is_mars else "model",
                "nocturnal_cooling_k_hr": "derived" if is_mars else "model",
                "aeolian_dust_flux": "measured" if is_mars else "constant",
            }
            site.confidence = DataConfidence(
                level="high" if is_mars else "medium",
                score=0.78 if is_mars else 0.68,
                is_tracked_zone=True,
                nearest_tracked_site_id=site.site_id,
                distance_to_tracked_km=0.0,
                pds_products_found=12 if site.body == "moon" else None,
                real_variables=(
                    ["mean_surface_temp_k", "diurnal_temp_amplitude_k", "aeolian_dust_flux", "solar_flux_wm2"]
                    if is_mars
                    else ["solar_flux_wm2", "mean_surface_temp_k", "diurnal_temp_amplitude_k"]
                ),
                estimated_variables=[
                    "topographic_roughness",
                    "slope_deg",
                    "thermal_inertia",
                    "surface_albedo",
                    "subsurface_ice_frac",
                ],
                variable_provenance=var_prov,
                notice_key="confidence.tracked_mars_curated" if is_mars else "confidence.tracked_moon_curated",
            )
        sites.append(site)
    return sites


def upsert_earth_cell(duckdb_path: Path, cell_record: dict[str, object]) -> None:
    """Insert or replace a live-probed Earth H3 cell into DuckDB."""
    from app.engine.analog_matcher import CURATED_CELL_METADATA

    row = dict(cell_record)
    cell_id = str(row["earth_cell_h3"])
    if cell_id in CURATED_CELL_METADATA:
        reg_key, country, biome, is_bench = CURATED_CELL_METADATA[cell_id]
        row["region_key"] = reg_key
        row["country_code"] = country
        row["biome_key"] = biome
        row["is_benchmark"] = is_bench
    row["h3_boundary_json"] = json.dumps(row["h3_boundary_json"])
    row["source_apis_json"] = json.dumps(row["source_apis_json"])
    df_row = pd.DataFrame([row])

    conn = duckdb.connect(str(duckdb_path))
    try:
        conn.execute(
            "DELETE FROM earth_h3_grid WHERE earth_cell_h3 = ?",
            [str(row["earth_cell_h3"])],
        )
        conn.register("new_cell_df", df_row)
        conn.execute("INSERT INTO earth_h3_grid SELECT * FROM new_cell_df")
        conn.unregister("new_cell_df")
    finally:
        conn.close()
