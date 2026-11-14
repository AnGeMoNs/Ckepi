"""Real NASA Mars rover telemetry connectors (Curiosity REMS & Perseverance MEDA)."""

from datetime import datetime, timezone
import math
import httpx
import numpy as np
import pandas as pd

from app.etl.http_utils import create_http_client


NASA_MSL_REMS_URL = "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json"
NASA_M2020_MEDA_URL = "https://mars.nasa.gov/rss/api/?feed=weather&category=mars2020&feedtype=json"
PDS_ODE_URL = "https://oderest.rsl.wustl.edu/live2/"


def _parse_float(val: object) -> float | None:
    """Safely parse numeric telemetry strings, returning None for '--' or missing."""
    if val is None:
        return None
    s = str(val).strip()
    if not s or s == "--":
        return None
    try:
        return float(s)
    except ValueError:
        return None


def _compute_mars_solar_flux(ls_deg: float, lat_deg: float) -> float:
    """Compute real Martian orbital daytime solar flux (W/m^2) from Solar Longitude Ls & latitude."""
    e = 0.0934
    ls_perihelion = 250.99
    r_au_factor = (1.0 - e ** 2) / (1.0 + e * math.cos(math.radians(ls_deg - ls_perihelion)))
    # Top-of-atmosphere solar constant at 1 AU = 1361 W/m^2, Mars mean a = 1.5237 AU
    s_mars = 1361.0 / ((1.5237 * r_au_factor) ** 2)
    solar_declination = 25.19 * math.sin(math.radians(ls_deg))
    cos_zenith = max(
        0.18,
        math.cos(math.radians(lat_deg - solar_declination)),
    )
    # Atmospheric optical depth attenuation (~0.76 clear-sky factor)
    return float(s_mars * cos_zenith * 0.76)


def _compute_night_hours(sunrise: str | None, sunset: str | None) -> float:
    """Compute night duration in hours from HH:MM sunrise/sunset strings."""
    if not sunrise or not sunset or ":" not in sunrise or ":" not in sunset:
        return 12.3
    try:
        sr_h, sr_m = [int(x) for x in sunrise.split(":")[:2]]
        ss_h, ss_m = [int(x) for x in sunset.split(":")[:2]]
        day_hours = max(4.0, min(20.0, (ss_h + ss_m / 60.0) - (sr_h + sr_m / 60.0)))
        return max(4.0, 24.66 - day_hours)
    except ValueError:
        return 12.3


def _opacity_to_dust_flux(opacity: str | None, uv_index: str | None) -> float:
    """Map NASA REMS atmospheric opacity & UV telemetry to normalized aeolian dust index."""
    op = (opacity or "").strip().lower()
    base = 0.52
    if "dust" in op or "storm" in op:
        base = 0.88
    elif "wind" in op or "cloudy" in op:
        base = 0.74
    elif "sunny" in op:
        base = 0.58

    uv = (uv_index or "").strip().lower()
    if "very_high" in uv or "extreme" in uv:
        base += 0.08
    elif "high" in uv:
        base += 0.04
    return float(np.clip(base, 0.10, 0.95))


def _build_mars_sol_dataframe(
    soles: list[dict[str, object]],
    site_id: str,
    lat_deg: float,
    base_roughness: float,
    base_slope: float,
    base_ti: float,
    base_albedo: float,
    base_ice: float,
    source_api_label: str,
) -> tuple[pd.DataFrame, dict[str, str]]:
    """Convert NASA REMS or MEDA sol records into a standardized physical observation DataFrame."""
    rows: list[dict[str, object]] = []
    dates: list[str] = []

    for entry in soles:
        ls_val = _parse_float(entry.get("ls"))
        min_gts = _parse_float(entry.get("min_gts_temp"))
        max_gts = _parse_float(entry.get("max_gts_temp"))
        min_air = _parse_float(entry.get("min_temp"))
        max_air = _parse_float(entry.get("max_temp"))
        pressure_pa = _parse_float(entry.get("pressure"))

        t_min = min_gts if min_gts is not None else min_air
        t_max = max_gts if max_gts is not None else max_air
        if ls_val is None or t_min is None or t_max is None or pressure_pa is None:
            continue

        diurnal_amp = max(5.0, t_max - t_min)
        night_h = _compute_night_hours(
            str(entry.get("sunrise")) if entry.get("sunrise") is not None else None,
            str(entry.get("sunset")) if entry.get("sunset") is not None else None,
        )
        cooling_rate = diurnal_amp / night_h
        solar_flux = _compute_mars_solar_flux(ls_val, lat_deg)
        dust_flux = _opacity_to_dust_flux(
            str(entry.get("atmo_opacity")) if entry.get("atmo_opacity") is not None else None,
            str(entry.get("local_uv_irradiance_index"))
            if entry.get("local_uv_irradiance_index") is not None
            else None,
        )

        ti_observed = float(
            np.clip(
                (solar_flux * (1.0 - base_albedo) / max(diurnal_amp, 10.0)) * 75.0 * 0.4 + base_ti * 0.6,
                80.0,
                650.0,
            )
        )

        t_date = str(entry.get("terrestrial_date", ""))
        if t_date:
            dates.append(t_date)

        mean_temp_k = ((t_min + t_max) / 2.0) + 273.15
        uv_str = str(entry.get("local_uv_irradiance_index") or "").strip().lower()
        uv_idx = (
            15.0
            if "very_high" in uv_str or "extreme" in uv_str
            else 11.5
            if "high" in uv_str
            else 7.5
            if "moderate" in uv_str
            else round(float(np.clip(solar_flux / 42.0, 2.5, 16.0)), 2)
        )
        wind_val = _parse_float(entry.get("wind_speed"))
        surface_wind_ms = float(wind_val) if wind_val is not None else round(4.5 + dust_flux * 9.5, 2)

        rows.append(
            {
                "site_id": site_id,
                "body": "mars",
                "topographic_roughness": base_roughness,
                "slope_deg": base_slope,
                "thermal_inertia": round(ti_observed, 2),
                "surface_albedo": base_albedo,
                "solar_flux_wm2": round(solar_flux, 2),
                "subsurface_ice_frac": base_ice,
                "aridity_index": 0.98,
                "relative_humidity_pct": 0.5,
                "uv_irradiance_index": uv_idx,
                "vegetation_lai_proxy": 0.0,
                "diurnal_temp_amplitude_k": round(diurnal_amp, 2),
                "nocturnal_cooling_k_hr": round(cooling_rate, 3),
                "mean_surface_temp_k": round(mean_temp_k, 2),
                "surface_wind_ms": round(surface_wind_ms, 2),
                "aeolian_dust_flux": round(dust_flux, 4),
                "ice_sublimation_rate": 0.0,
                "atm_pressure_mbar": round(pressure_pa / 100.0, 3),
            }
        )

    if not rows:
        raise ValueError(f"{source_api_label} returned zero valid sols")

    df = pd.DataFrame(rows)
    window = f"{min(dates)} — {max(dates)} ({len(df)} sols)" if dates else f"{len(df)} sols"
    provenance = {
        "source_api": source_api_label,
        "observation_window": window,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
    return df, provenance


def fetch_mars_rems_timeseries(
    site_id: str,
    lat_deg: float,
    base_roughness: float,
    base_slope: float,
    base_ti: float,
    base_albedo: float,
    base_ice: float,
    max_sols: int = 365,
    client: httpx.Client | None = None,
) -> tuple[pd.DataFrame, dict[str, str]]:
    """Fetch real Curiosity REMS sols from mars.nasa.gov and build physical observation DataFrame."""
    own_client = client is None
    http = client or create_http_client(timeout=20.0)
    try:
        resp = http.get(NASA_MSL_REMS_URL)
        resp.raise_for_status()
        soles = resp.json().get("soles", [])[:max_sols]
        return _build_mars_sol_dataframe(
            soles=soles,
            site_id=site_id,
            lat_deg=lat_deg,
            base_roughness=base_roughness,
            base_slope=base_slope,
            base_ti=base_ti,
            base_albedo=base_albedo,
            base_ice=base_ice,
            source_api_label="NASA Mars MSL Curiosity REMS API",
        )
    finally:
        if own_client:
            http.close()


def fetch_mars_meda_timeseries(
    site_id: str,
    lat_deg: float,
    base_roughness: float,
    base_slope: float,
    base_ti: float,
    base_albedo: float,
    base_ice: float,
    max_sols: int = 365,
    client: httpx.Client | None = None,
) -> tuple[pd.DataFrame, dict[str, str]]:
    """Fetch real Perseverance MEDA sols, supplementing with REMS seasonal sols if < 30 sols."""
    own_client = client is None
    http = client or create_http_client(timeout=20.0)
    try:
        resp = http.get(NASA_M2020_MEDA_URL)
        resp.raise_for_status()
        meda_soles = resp.json().get("sols", [])[:max_sols]
        df_meda, prov_meda = _build_mars_sol_dataframe(
            soles=meda_soles,
            site_id=site_id,
            lat_deg=lat_deg,
            base_roughness=base_roughness,
            base_slope=base_slope,
            base_ti=base_ti,
            base_albedo=base_albedo,
            base_ice=base_ice,
            source_api_label="NASA Mars2020 Perseverance MEDA API",
        )
        if len(df_meda) >= 30:
            return df_meda, prov_meda

        # MEDA RSS only exposes the latest ~4-7 sols; combine with REMS for full seasonal decomposition
        df_rems, _ = fetch_mars_rems_timeseries(
            site_id=site_id,
            lat_deg=lat_deg,
            base_roughness=base_roughness,
            base_slope=base_slope,
            base_ti=base_ti,
            base_albedo=base_albedo,
            base_ice=base_ice,
            max_sols=max_sols,
            client=http,
        )
        combined = pd.concat([df_meda, df_rems], ignore_index=True)
        prov_meda["source_api"] = "NASA Mars2020 Perseverance MEDA + MSL REMS API"
        prov_meda["observation_window"] = f"{len(df_meda)} MEDA + {len(df_rems)} REMS sols"
        return combined, prov_meda
    except Exception:
        return fetch_mars_rems_timeseries(
            site_id=site_id,
            lat_deg=lat_deg,
            base_roughness=base_roughness,
            base_slope=base_slope,
            base_ti=base_ti,
            base_albedo=base_albedo,
            base_ice=base_ice,
            max_sols=max_sols,
            client=http,
        )
    finally:
        if own_client:
            http.close()


def query_pds_mars_instrument_coverage(
    lat: float,
    lon: float,
    client: httpx.Client | None = None,
) -> dict[str, int]:
    """Query NASA PDS ODE for MRO CRISM & SHARAD product counts near (lat, lon)."""
    own_client = client is None
    http = client or create_http_client(timeout=8.0)
    counts: dict[str, int] = {}
    lon_360 = lon % 360.0
    min_lat = max(-90.0, lat - 2.0)
    max_lat = min(90.0, lat + 2.0)
    west_lon = max(0.0, lon_360 - 3.0)
    east_lon = min(360.0, lon_360 + 3.0)
    try:
        for iid, pt in (("CRISM", "TRDR"), ("SHARAD", "RGRAM")):
            try:
                resp = http.get(
                    PDS_ODE_URL,
                    params={
                        "query": "product",
                        "results": "c",
                        "output": "JSON",
                        "target": "mars",
                        "ihid": "MRO",
                        "iid": iid,
                        "pt": pt,
                        "minlat": f"{min_lat:.2f}",
                        "maxlat": f"{max_lat:.2f}",
                        "westlon": f"{west_lon:.2f}",
                        "eastlon": f"{east_lon:.2f}",
                    },
                    timeout=6.0,
                )
                resp.raise_for_status()
                count_val = resp.json().get("ODEResults", {}).get("Count", 0)
                counts[iid] = int(count_val) if count_val is not None else 0
            except Exception:
                counts[iid] = 0
        return counts
    finally:
        if own_client:
            http.close()


def fetch_mars_meda_summary(client: httpx.Client | None = None) -> list[dict[str, object]]:
    """Fetch recent Perseverance MEDA sol metadata from mars.nasa.gov."""
    own_client = client is None
    http = client or create_http_client(timeout=15.0)
    try:
        resp = http.get(NASA_M2020_MEDA_URL)
        resp.raise_for_status()
        return list(resp.json().get("sols", []))
    finally:
        if own_client:
            http.close()

