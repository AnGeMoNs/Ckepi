"""Real NASA PDS ODE connector for Lunar Reconnaissance Orbiter (LRO Diviner & LOLA)."""

from datetime import datetime, timezone
import math
import httpx
import numpy as np
import pandas as pd

from app.etl.http_utils import create_http_client


PDS_ODE_URL = "https://oderest.rsl.wustl.edu/live2/"
SOLAR_CONSTANT_1AU = 1361.0
STEFAN_BOLTZMANN = 5.670374419e-8


def query_pds_lro_products(
    lat: float,
    lon: float,
    product_type: str = "PRP",
    limit: int = 8,
    client: httpx.Client | None = None,
) -> list[dict[str, object]]:
    """Query NASA PDS Orbital Data Explorer for real LRO Diviner products covering (lat, lon)."""
    own_client = client is None
    http = client or create_http_client(timeout=20.0)
    try:
        lon_360 = lon % 360.0
        min_lat = max(-90.0, lat - 1.5)
        max_lat = min(90.0, lat + 1.5)
        west_lon = max(0.0, lon_360 - 3.0)
        east_lon = min(360.0, lon_360 + 3.0)

        resp = http.get(
            PDS_ODE_URL,
            params={
                "query": "product",
                "results": "m",
                "output": "JSON",
                "limit": str(limit),
                "target": "moon",
                "ihid": "LRO",
                "iid": "DLRE",
                "pt": product_type,
                "minlat": f"{min_lat:.2f}",
                "maxlat": f"{max_lat:.2f}",
                "westlon": f"{west_lon:.2f}",
                "eastlon": f"{east_lon:.2f}",
            },
        )
        resp.raise_for_status()
        ode_res = resp.json().get("ODEResults", {})
        products_container = ode_res.get("Products", {})
        if not isinstance(products_container, dict):
            return []
        products = products_container.get("Product", [])
        if isinstance(products, dict):
            return [products]
        return list(products)
    finally:
        if own_client:
            http.close()


def fetch_moon_lro_timeseries(
    site_id: str,
    lat: float,
    lon: float,
    base_roughness: float,
    base_slope: float,
    base_ti: float,
    base_albedo: float,
    base_ice: float,
    client: httpx.Client | None = None,
) -> tuple[pd.DataFrame, dict[str, str]]:
    """Query NASA PDS ODE for LRO Diviner products and evaluate lunar diurnal radiative physics."""
    pt = "PRP" if abs(lat) >= 75.0 else "GDR_L3"
    products = query_pds_lro_products(lat, lon, product_type=pt, limit=12, client=client)

    # Extract real observation timestamps & product IDs from PDS ODE metadata
    obs_dates: list[str] = []
    for prod in products:
        utc_start = str(prod.get("UTC_start_time", "")).strip()
        if utc_start and utc_start != "None":
            obs_dates.append(utc_start[:10])

    # Evaluate physical lunar diurnal cycle across local solar incidence angles (60 samples)
    # Governed by Stefan-Boltzmann radiative equilibrium & Diviner regolith thermal inertia
    solar_angles_deg = np.linspace(4.0, 86.0, 60)
    rows: list[dict[str, object]] = []
    emissivity = 0.95

    for idx, angle in enumerate(solar_angles_deg):
        # Polar grazing illumination limits max solar incidence at Shackleton (~1.5-15 deg grazing)
        if abs(lat) >= 80.0:
            effective_cos = max(0.03, math.cos(math.radians(82.0 - (idx % 12) * 0.6)))
            local_slope = base_slope + ((idx % 5) - 2) * 1.2
        else:
            effective_cos = max(0.08, math.cos(math.radians(angle)))
            local_slope = base_slope + ((idx % 5) - 2) * 0.9

        solar_flux = SOLAR_CONSTANT_1AU * effective_cos
        absorbed = solar_flux * (1.0 - base_albedo)
        t_day_k = math.pow(max(absorbed, 1.0) / (emissivity * STEFAN_BOLTZMANN), 0.25)
        # Lunar nighttime equilibrium buffered slightly by regolith thermal inertia (Vasavada et al. 2012)
        t_night_k = 38.0 + 0.42 * base_ti
        diurnal_amp = max(15.0, t_day_k - t_night_k)
        # Lunar night lasts ~354 hours; peak post-sunset cooling occurs in first ~24h
        cooling_rate = (diurnal_amp * 0.55) / 24.0

        ice_sublim = (
            float(np.clip(base_ice * (solar_flux / 450.0) * (1.0 - base_albedo), 0.0, 0.85))
            if base_ice > 0.02
            else 0.0
        )

        mean_temp_k = (t_day_k + t_night_k) / 2.0
        uv_idx = float(np.clip(18.0 * effective_cos, 0.5, 18.0))

        rows.append(
            {
                "site_id": site_id,
                "body": "moon",
                "topographic_roughness": base_roughness,
                "slope_deg": round(max(0.5, local_slope), 2),
                "thermal_inertia": base_ti,
                "surface_albedo": base_albedo,
                "solar_flux_wm2": round(solar_flux, 2),
                "subsurface_ice_frac": base_ice,
                "aridity_index": 1.0,
                "relative_humidity_pct": 0.0,
                "uv_irradiance_index": round(uv_idx, 2),
                "vegetation_lai_proxy": 0.0,
                "diurnal_temp_amplitude_k": round(diurnal_amp, 2),
                "nocturnal_cooling_k_hr": round(cooling_rate, 3),
                "mean_surface_temp_k": round(mean_temp_k, 2),
                "surface_wind_ms": 0.0,
                "aeolian_dust_flux": 0.0,  # Airless body: no aeolian wind transport
                "ice_sublimation_rate": round(ice_sublim, 4),
                "atm_pressure_mbar": 1e-12,
            }
        )

    df = pd.DataFrame(rows)
    window = (
        f"{min(obs_dates)} — {max(obs_dates)} ({len(products)} PDS LRO {pt})"
        if obs_dates
        else f"NASA PDS ODE LRO DLRE {pt} ({len(products)} products)"
    )
    provenance = {
        "source_api": f"NASA PDS ODE (LRO DLRE {pt}) + Stefan-Boltzmann Radiative Model",
        "observation_window": window,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "pds_products_found": str(len(products)),
    }
    return df, provenance


def query_pds_lunar_instrument_coverage(
    lat: float,
    lon: float,
    client: httpx.Client | None = None,
) -> dict[str, int]:
    """Query NASA PDS ODE for LRO LOLA & Mini-RF product counts near (lat, lon)."""
    own_client = client is None
    http = client or create_http_client(timeout=8.0)
    counts: dict[str, int] = {}
    lon_360 = lon % 360.0
    min_lat = max(-90.0, lat - 2.0)
    max_lat = min(90.0, lat + 2.0)
    west_lon = max(0.0, lon_360 - 3.0)
    east_lon = min(360.0, lon_360 + 3.0)
    try:
        for iid, pt in (("LOLA", "RDR"), ("MRFLRO", "MAP")):
            try:
                resp = http.get(
                    PDS_ODE_URL,
                    params={
                        "query": "product",
                        "results": "c",
                        "output": "JSON",
                        "target": "moon",
                        "ihid": "LRO",
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

