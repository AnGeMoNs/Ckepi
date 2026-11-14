"""Real-time & cached Earth observation API connectors (NASA POWER + Open-Meteo Copernicus DEM & ERA5)."""

from datetime import datetime, timezone
import math
import time
import h3
import httpx
import numpy as np

from app.etl.http_utils import create_http_client


def _get_with_retry(
    client: httpx.Client,
    url: str,
    params: dict[str, str],
    max_attempts: int = 5,
) -> httpx.Response:
    """Perform HTTP GET with exponential backoff on 429 rate limits."""
    for attempt in range(max_attempts):
        resp = client.get(url, params=params)
        if resp.status_code == 429:
            retry_after = float(resp.headers.get("Retry-After", 3.0 * (attempt + 1)))
            time.sleep(min(retry_after, 25.0))
            continue
        resp.raise_for_status()
        return resp
    resp.raise_for_status()
    return resp


NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
NASA_POWER_CLIMATOLOGY_URL = "https://power.larc.nasa.gov/api/temporal/climatology/point"
ISRIC_SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
OPEN_METEO_ELEV_URL = "https://api.open-meteo.com/v1/elevation"
OPENTOPODATA_ASTER_URL = "https://api.opentopodata.org/v1/aster30m"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"

DEFAULT_START_POWER = "20240301"
DEFAULT_END_POWER = "20240320"
DEFAULT_START_ERA5 = "2024-03-01"
DEFAULT_END_ERA5 = "2024-03-14"


def _clean_power_series(values: dict[str, float]) -> list[float]:
    """Filter out NASA POWER -999 fill values."""
    return [float(v) for v in values.values() if v is not None and float(v) > -900.0]


def fetch_copernicus_terrain_metrics(
    lat: float,
    lon: float,
    client: httpx.Client,
) -> dict[str, float]:
    """Compute real terrain slope (deg) and roughness from Copernicus 90m DEM 5-point stencil."""
    d_lat = 0.015
    cos_lat = max(math.cos(math.radians(lat)), 0.20)
    d_lon = d_lat / cos_lat

    # Clamp latitudes to [-89.9, 89.9] and wrap longitudes
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

    resp = client.get(
        OPEN_METEO_ELEV_URL,
        params={
            "latitude": ",".join(f"{v:.5f}" for v in lats),
            "longitude": ",".join(f"{v:.5f}" for v in lons),
        },
    )
    if resp.status_code == 200:
        elevs = [float(e) for e in resp.json()["elevation"]]
    else:
        # Fallback to NASA/METI ASTER 30m DEM via OpenTopoData when Open-Meteo Elevation is rate-limited
        locs = "|".join(f"{la:.5f},{lo:.5f}" for la, lo in zip(lats, lons))
        topo_resp = _get_with_retry(client, OPENTOPODATA_ASTER_URL, {"locations": locs})
        elevs = [
            float(item["elevation"]) if item.get("elevation") is not None else 0.0
            for item in topo_resp.json()["results"]
        ]

    # Central finite difference over ~3.3 km span
    dy_m = 2.0 * d_lat * 111_320.0
    dx_m = 2.0 * d_lon * 111_320.0 * cos_lat
    dz_dy = (elevs[1] - elevs[2]) / max(dy_m, 1.0)
    dz_dx = (elevs[3] - elevs[4]) / max(dx_m, 1.0)

    slope_deg = float(math.degrees(math.atan(math.sqrt(dz_dx ** 2 + dz_dy ** 2))))
    roughness = float(np.clip(np.std(elevs) / 110.0, 0.03, 0.96))
    return {
        "slope_deg": round(slope_deg, 3),
        "topographic_roughness": round(roughness, 4),
        "elevation_m": round(elevs[0], 1),
    }


def fetch_nasa_power_metrics(
    lat: float,
    lon: float,
    client: httpx.Client,
    start_date: str = DEFAULT_START_POWER,
    end_date: str = DEFAULT_END_POWER,
) -> dict[str, float]:
    """Fetch real satellite-derived irradiance, albedo, pressure, topsoil wetness & wind from NASA POWER."""
    resp = _get_with_retry(
        client,
        NASA_POWER_URL,
        {
            "parameters": "ALLSKY_SFC_SW_DWN,ALLSKY_SRF_ALB,TS,PS,GWETTOP,WS10M,RH2M,ALLSKY_SFC_UV_INDEX",
            "community": "RE",
            "longitude": f"{lon:.4f}",
            "latitude": f"{lat:.4f}",
            "start": start_date,
            "end": end_date,
            "format": "JSON",
        },
    )
    params = resp.json()["properties"]["parameter"]

    sw_kwh = _clean_power_series(params.get("ALLSKY_SFC_SW_DWN", {}))
    albedo_vals = _clean_power_series(params.get("ALLSKY_SRF_ALB", {}))
    ps_kpa = _clean_power_series(params.get("PS", {}))
    gwet = _clean_power_series(params.get("GWETTOP", {}))
    ws10 = _clean_power_series(params.get("WS10M", {}))
    rh2m = _clean_power_series(params.get("RH2M", {}))
    uv_vals = _clean_power_series(params.get("ALLSKY_SFC_UV_INDEX", {}))

    # Convert daily kWh/m^2/day to daytime-average W/m^2 (12h equivalent insolation window)
    solar_flux_wm2 = float(np.mean(sw_kwh) * (1000.0 / 12.0)) if sw_kwh else 180.0
    surface_albedo = float(np.mean(albedo_vals)) if albedo_vals else 0.25
    atm_pressure_mbar = float(np.mean(ps_kpa) * 10.0) if ps_kpa else 1013.25
    aridity_index = float(np.clip(1.0 - np.mean(gwet), 0.02, 0.99)) if gwet else 0.75
    wind_ms = float(np.mean(ws10)) if ws10 else 3.5
    rel_humidity = float(np.clip(np.mean(rh2m), 2.0, 100.0)) if rh2m else 45.0
    uv_index = float(np.clip(np.mean(uv_vals), 0.1, 18.0)) if uv_vals else round(solar_flux_wm2 / 45.0, 2)

    aeolian_dust = float(np.clip((wind_ms / 9.5) * (aridity_index ** 1.6), 0.01, 0.96))

    return {
        "solar_flux_wm2": round(solar_flux_wm2, 2),
        "surface_albedo": round(surface_albedo, 4),
        "atm_pressure_mbar": round(atm_pressure_mbar, 2),
        "aridity_index": round(aridity_index, 4),
        "relative_humidity_pct": round(rel_humidity, 2),
        "uv_irradiance_index": round(uv_index, 2),
        "surface_wind_ms": round(wind_ms, 2),
        "aeolian_dust_flux": round(aeolian_dust, 4),
    }


def _extract_climatology_ann(params: dict[str, dict[str, float]], key: str) -> float | None:
    """Extract valid annual climatology (ANN) value from NASA POWER Climatology response."""
    val = params.get(key, {}).get("ANN")
    if val is None or float(val) <= -900.0:
        return None
    return float(val)


def fetch_nasa_power_climatology(
    lat: float,
    lon: float,
    client: httpx.Client,
) -> dict[str, object]:
    """Fetch 20+ year annual climatology (eliminates seasonal bias) with daily fallback."""
    try:
        resp = _get_with_retry(
            client,
            NASA_POWER_CLIMATOLOGY_URL,
            {
                "parameters": "ALLSKY_SFC_SW_DWN,ALLSKY_SRF_ALB,T2M,T2M_RANGE,PS,GWETTOP,WS10M,RH2M,ALLSKY_SFC_UV_INDEX,CLOUD_AMT,PRECTOTCORR,FROST_DAYS",
                "community": "RE",
                "longitude": f"{lon:.4f}",
                "latitude": f"{lat:.4f}",
                "format": "JSON",
            },
            max_attempts=3,
        )
        params = resp.json()["properties"]["parameter"]
        sw = _extract_climatology_ann(params, "ALLSKY_SFC_SW_DWN")
        alb = _extract_climatology_ann(params, "ALLSKY_SRF_ALB")
        ps = _extract_climatology_ann(params, "PS")
        gwet = _extract_climatology_ann(params, "GWETTOP")
        ws10 = _extract_climatology_ann(params, "WS10M")
        rh2m = _extract_climatology_ann(params, "RH2M")
        uv = _extract_climatology_ann(params, "ALLSKY_SFC_UV_INDEX")
        t2m = _extract_climatology_ann(params, "T2M")
        t2m_range = _extract_climatology_ann(params, "T2M_RANGE")
        cloud_amt = _extract_climatology_ann(params, "CLOUD_AMT")
        precip = _extract_climatology_ann(params, "PRECTOTCORR")
        frost_days = _extract_climatology_ann(params, "FROST_DAYS")

        solar_flux_wm2 = (sw * (1000.0 / 12.0)) if sw is not None else 180.0
        surface_albedo = float(np.clip(alb, 0.04, 0.88)) if alb is not None else 0.25
        atm_pressure_mbar = (ps * 10.0) if ps is not None else 1013.25
        aridity_index = float(np.clip(1.0 - gwet, 0.02, 0.99)) if gwet is not None else 0.75
        if precip is not None and precip < 0.25:
            aridity_index = float(np.clip(max(aridity_index, 0.86), 0.02, 0.99))
        wind_ms = ws10 if ws10 is not None else 3.5
        rel_humidity = float(np.clip(rh2m, 2.0, 100.0)) if rh2m is not None else 45.0
        uv_index = float(np.clip(uv, 0.1, 18.0)) if uv is not None else round(solar_flux_wm2 / 45.0, 2)
        aeolian_dust = float(np.clip((wind_ms / 9.5) * (aridity_index ** 1.6), 0.01, 0.96))

        return {
            "solar_flux_wm2": round(solar_flux_wm2, 2),
            "surface_albedo": round(surface_albedo, 4),
            "atm_pressure_mbar": round(atm_pressure_mbar, 2),
            "aridity_index": round(aridity_index, 4),
            "relative_humidity_pct": round(rel_humidity, 2),
            "uv_irradiance_index": round(uv_index, 2),
            "surface_wind_ms": round(wind_ms, 2),
            "aeolian_dust_flux": round(aeolian_dust, 4),
            "clim_mean_temp_c": t2m,
            "clim_diurnal_range_k": t2m_range,
            "cloud_amt_pct": cloud_amt,
            "frost_days_yr": frost_days,
            "is_climatology": True,
        }
    except Exception:
        daily = fetch_nasa_power_metrics(lat, lon, client)
        return {**daily, "clim_mean_temp_c": None, "clim_diurnal_range_k": None, "is_climatology": False}


def fetch_soilgrids_metrics(lat: float, lon: float) -> dict[str, float] | None:
    """Query ISRIC SoilGrids v2.0 (0-5cm) for clay, sand, bulk density & organic carbon (best-effort)."""
    try:
        with create_http_client(timeout=4.0) as soil_client:
            resp = soil_client.get(
                ISRIC_SOILGRIDS_URL,
                params=[
                    ("lon", f"{lon:.4f}"),
                    ("lat", f"{lat:.4f}"),
                    ("property", "clay"),
                    ("property", "sand"),
                    ("property", "bdod"),
                    ("property", "soc"),
                    ("depth", "0-5cm"),
                    ("value", "mean"),
                ],
            )
            resp.raise_for_status()
            layers = resp.json().get("properties", {}).get("layers", [])
            parsed: dict[str, float] = {}
            for layer in layers:
                name = str(layer.get("name", ""))
                depths = layer.get("depths", [])
                if depths:
                    val = depths[0].get("values", {}).get("mean")
                    if val is not None:
                        parsed[name] = float(val)
            if not parsed or ("sand" not in parsed and "clay" not in parsed):
                return None
            # Convert SoilGrids units: g/kg -> %, cg/cm^3 -> g/cm^3, dg/kg -> %
            sand_pct = parsed.get("sand", 400.0) / 10.0
            clay_pct = parsed.get("clay", 200.0) / 10.0
            bdod_g_cm3 = parsed.get("bdod", 135.0) / 100.0
            soc_pct = parsed.get("soc", 10.0) / 100.0
            return {
                "sand_pct": round(sand_pct, 2),
                "clay_pct": round(clay_pct, 2),
                "bdod_g_cm3": round(bdod_g_cm3, 3),
                "soc_pct": round(soc_pct, 3),
            }
    except Exception:
        return None


def fetch_open_meteo_thermal_metrics(
    lat: float,
    lon: float,
    albedo: float,
    solar_flux_wm2: float,
    aridity_index: float,
    client: httpx.Client,
    start_date: str = DEFAULT_START_ERA5,
    end_date: str = DEFAULT_END_ERA5,
) -> dict[str, float]:
    """Fetch real hourly ERA5 soil/air thermal cycles & moisture from Open-Meteo Archive."""
    resp = _get_with_retry(
        client,
        OPEN_METEO_ARCHIVE_URL,
        {
            "latitude": f"{lat:.4f}",
            "longitude": f"{lon:.4f}",
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "temperature_2m,soil_temperature_0_to_7cm,soil_moisture_0_to_7cm,shortwave_radiation,et0_fao_evapotranspiration",
            "timezone": "UTC",
        },
    )
    hourly = resp.json()["hourly"]

    soil_t = hourly.get("soil_temperature_0_to_7cm") or []
    air_t = hourly.get("temperature_2m") or []
    soil_m = hourly.get("soil_moisture_0_to_7cm") or []
    sw_rad = hourly.get("shortwave_radiation") or []
    et0_vals = hourly.get("et0_fao_evapotranspiration") or []

    # Prefer skin/topsoil temperature; fallback to 2m air temperature if glaciated/missing
    raw_temps = [t if t is not None else a for t, a in zip(soil_t, air_t)]
    valid_temps = [float(t) for t in raw_temps if t is not None]

    daily_amps: list[float] = []
    for i in range(0, len(valid_temps) - 23, 24):
        day_slice = valid_temps[i : i + 24]
        daily_amps.append(max(day_slice) - min(day_slice))

    diurnal_amp = float(np.mean(daily_amps)) if daily_amps else 15.0

    # Nocturnal cooling rate dT/dt (K/hr) during hours with zero shortwave radiation
    night_drops: list[float] = []
    for i in range(1, min(len(raw_temps), len(sw_rad))):
        t_prev = raw_temps[i - 1]
        t_curr = raw_temps[i]
        sw = sw_rad[i]
        if t_prev is not None and t_curr is not None and sw is not None and float(sw) <= 5.0:
            drop = float(t_prev) - float(t_curr)
            if drop > 0:
                night_drops.append(drop)

    nocturnal_cooling = float(np.mean(night_drops)) if night_drops else diurnal_amp / 12.0

    # Apparent thermal inertia derived from real absorbed insolation & observed diurnal swing
    absorbed = max(solar_flux_wm2 * (1.0 - albedo), 20.0)
    apparent_ti = float(np.clip((absorbed / max(diurnal_amp, 2.5)) * 12.5, 45.0, 850.0))

    # Subsurface ice fraction: frozen topsoil moisture when mean temperature < 0 C
    mean_temp_c = float(np.mean(valid_temps)) if valid_temps else 15.0
    mean_temp_k = mean_temp_c + 273.15
    valid_moisture = [float(m) for m in soil_m if m is not None]
    mean_moisture = float(np.mean(valid_moisture)) if valid_moisture else 0.1

    valid_et0 = [float(e) for e in et0_vals if e is not None]
    mean_et0 = float(np.mean(valid_et0)) if valid_et0 else 0.1
    if mean_temp_c < 2.0 or aridity_index >= 0.72:
        vegetation_lai = 0.0
    else:
        vegetation_lai = float(np.clip(mean_et0 * (1.0 - aridity_index) * 18.0, 0.0, 6.5))

    if mean_temp_c < -1.0:
        subsurface_ice = float(np.clip(mean_moisture * 1.4 + 0.15, 0.05, 0.85))
    elif mean_temp_c < 2.0:
        subsurface_ice = float(np.clip(mean_moisture * 0.6, 0.0, 0.35))
    else:
        subsurface_ice = 0.0

    ice_sublimation = (
        float(np.clip(subsurface_ice * (solar_flux_wm2 / 450.0) * aridity_index, 0.0, 0.85))
        if subsurface_ice > 0.02
        else 0.0
    )

    return {
        "diurnal_temp_amplitude_k": round(diurnal_amp, 2),
        "nocturnal_cooling_k_hr": round(nocturnal_cooling, 3),
        "mean_surface_temp_k": round(mean_temp_k, 2),
        "thermal_inertia": round(apparent_ti, 1),
        "subsurface_ice_frac": round(subsurface_ice, 4),
        "ice_sublimation_rate": round(ice_sublimation, 4),
        "vegetation_lai_proxy": round(vegetation_lai, 3),
    }


def cell_boundary_lon_lat(cell_id: str) -> list[list[float]]:
    """Convert h3 cell boundary [(lat, lon), ...] into closed GeoJSON [lon, lat] ring."""
    boundary_lat_lon = h3.cell_to_boundary(cell_id)
    ring = [[round(float(lon), 5), round(float(lat), 5)] for lat, lon in boundary_lat_lon]
    if ring and ring[0] != ring[-1]:
        ring.append(ring[0])
    return ring


def probe_earth_location(
    lat: float,
    lon: float,
    region_key: str = "regions.custom_probed_cell",
    country_code: str = "--",
    biome_key: str = "biomes.probed_location",
    is_benchmark: bool = False,
    h3_resolution: int = 3,
    is_live_probed: bool = True,
    client: httpx.Client | None = None,
) -> dict[str, object]:
    """Fetch real NASA POWER + Copernicus DEM + ERA5 metrics for any Earth coordinate."""
    own_client = client is None
    http = client or create_http_client(timeout=25.0)
    try:
        cell_id = h3.latlng_to_cell(lat, lon, h3_resolution)
        c_lat, c_lon = h3.cell_to_latlng(cell_id)

        terrain = fetch_copernicus_terrain_metrics(c_lat, c_lon, http)
        power = fetch_nasa_power_climatology(c_lat, c_lon, http)
        thermal = fetch_open_meteo_thermal_metrics(
            c_lat,
            c_lon,
            albedo=float(power["surface_albedo"]),  # type: ignore[arg-type]
            solar_flux_wm2=float(power["solar_flux_wm2"]),  # type: ignore[arg-type]
            aridity_index=float(power["aridity_index"]),  # type: ignore[arg-type]
            client=http,
        )

        # Prefer multi-year climatology mean temperature to avoid seasonal bias, while keeping soil diurnal swing
        mean_surface_temp_k = thermal["mean_surface_temp_k"]
        diurnal_amp_k = thermal["diurnal_temp_amplitude_k"]
        if power.get("clim_mean_temp_c") is not None:
            mean_surface_temp_k = round(float(power["clim_mean_temp_c"]) + 273.15, 2)  # type: ignore[arg-type]

        # Optional ISRIC SoilGrids 250m substrate enrichment (bulk density & sand/clay/SOC physics)
        soil = fetch_soilgrids_metrics(c_lat, c_lon)
        thermal_inertia = thermal["thermal_inertia"]
        aeolian_dust = float(power["aeolian_dust_flux"])  # type: ignore[arg-type]
        subsurface_ice = thermal["subsurface_ice_frac"]
        frost_days = power.get("frost_days_yr")
        if frost_days is not None and float(frost_days) >= 200.0 and subsurface_ice < 0.05:
            # High-latitude/altitude freeze-thaw persistence from NASA POWER FROST_DAYS
            subsurface_ice = round(float(np.clip(float(frost_days) / 730.0, 0.02, 0.45)), 4)

        source_apis = [
            "NASA POWER",
            "Open-Meteo Copernicus DEM",
            "Open-Meteo ERA5",
        ]
        if soil is not None:
            # Physically grounded substrate inertia & erodibility from real bulk density, sand & clay
            bd_factor = float(np.clip(soil["bdod_g_cm3"] / 1.35, 0.7, 1.45))
            thermal_inertia = round(float(np.clip(thermal_inertia * bd_factor, 45.0, 950.0)), 1)
            sand_erodibility = float(np.clip(0.85 + 0.35 * (soil["sand_pct"] / 100.0) - 0.15 * (soil["clay_pct"] / 100.0), 0.75, 1.2))
            aeolian_dust = round(float(np.clip(aeolian_dust * sand_erodibility, 0.01, 0.96)), 4)
            source_apis.append("ISRIC SoilGrids v2.0")

        return {
            "earth_cell_h3": cell_id,
            "h3_resolution": h3_resolution,
            "lat": round(float(c_lat), 5),
            "lon": round(float(c_lon), 5),
            "h3_boundary_json": cell_boundary_lon_lat(cell_id),
            "region_key": region_key,
            "country_code": country_code,
            "biome_key": biome_key,
            "is_benchmark": is_benchmark,
            "topographic_roughness": terrain["topographic_roughness"],
            "slope_deg": terrain["slope_deg"],
            "thermal_inertia": thermal_inertia,
            "surface_albedo": float(power["surface_albedo"]),  # type: ignore[arg-type]
            "solar_flux_wm2": float(power["solar_flux_wm2"]),  # type: ignore[arg-type]
            "subsurface_ice_frac": subsurface_ice,
            "aridity_index": float(power["aridity_index"]),  # type: ignore[arg-type]
            "relative_humidity_pct": float(power["relative_humidity_pct"]),  # type: ignore[arg-type]
            "uv_irradiance_index": float(power["uv_irradiance_index"]),  # type: ignore[arg-type]
            "vegetation_lai_proxy": thermal["vegetation_lai_proxy"],
            "diurnal_temp_amplitude_k": diurnal_amp_k,
            "nocturnal_cooling_k_hr": thermal["nocturnal_cooling_k_hr"],
            "mean_surface_temp_k": mean_surface_temp_k,
            "surface_wind_ms": float(power["surface_wind_ms"]),  # type: ignore[arg-type]
            "aeolian_dust_flux": aeolian_dust,
            "ice_sublimation_rate": thermal["ice_sublimation_rate"],
            "gravity_g": 1.0,
            "atm_pressure_mbar": float(power["atm_pressure_mbar"]),  # type: ignore[arg-type]
            "radiation_msv_yr": 2.4,
            "source_apis_json": source_apis,
            "observation_window": "climatology_multiyear (20+ yr ANN)" if power.get("is_climatology") else f"{DEFAULT_START_ERA5} / {DEFAULT_END_ERA5}",
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "is_live_probed": is_live_probed,
        }
    finally:
        if own_client:
            http.close()

