"""Live planetary coordinate probing for any Moon or Mars (lat, lon) via NASA PDS ODE & REMS."""

from datetime import datetime, timezone
from functools import lru_cache
import math
from pathlib import Path
import httpx
import numpy as np
import pandas as pd
from PIL import Image

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES
from app.engine.planetary_physics import (
    compute_hertz_knudsen_sublimation_rate,
    compute_mars_hypsometric_state,
    resolve_iau_planetary_feature,
    sample_orbital_regolith_properties,
)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
from app.etl.mars_api import (
    fetch_mars_meda_timeseries,
    fetch_mars_rems_timeseries,
    query_pds_mars_instrument_coverage,
)
from app.etl.moon_api import (
    fetch_moon_lro_timeseries,
    query_pds_lunar_instrument_coverage,
)
from app.models.schemas import (
    ConfidenceLevel,
    Coordinates,
    DataConfidence,
    DataProvenance,
    PhysicalVariables,
    PlanetaryBody,
    PlanetarySite,
    VariableOrigin,
)

TRACKED_REFERENCE_COORDS: dict[PlanetaryBody, list[tuple[str, float, float]]] = {
    "moon": [
        ("moon_shackleton_pole", -89.68, 129.78),
        ("moon_tranquillitatis_lava", 8.33, 33.22),
    ],
    "mars": [
        ("mars_jezero_crater", 18.38, 77.58),
        ("mars_gale_crater", -5.4, 137.8),
        ("mars_arcadia_planitia", 46.7, -172.0),
    ],
}

BODY_RADIUS_KM: dict[PlanetaryBody, float] = {
    "moon": 1737.4,
    "mars": 3389.5,
}


def _nearest_tracked_site(body: PlanetaryBody, lat: float, lon: float) -> tuple[str, float]:
    """Return (site_id, surface_distance_km) to the closest tracked mission site."""
    radius = BODY_RADIUS_KM[body]
    lat1 = math.radians(lat)
    lon1 = math.radians(lon)
    best_id = ""
    best_dist = float("inf")
    for site_id, t_lat, t_lon in TRACKED_REFERENCE_COORDS[body]:
        lat2 = math.radians(t_lat)
        lon2 = math.radians(t_lon)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2.0) ** 2 + math.cos(lat1) * math.cos(lat2) * (math.sin(dlon / 2.0) ** 2)
        dist = 2.0 * radius * math.asin(min(1.0, math.sqrt(a)))
        if dist < best_dist:
            best_dist = dist
            best_id = site_id
    return best_id, round(best_dist, 1)


@lru_cache(maxsize=2)
def _load_dem_array(body: PlanetaryBody) -> np.ndarray | None:
    """Load equirectangular LOLA (Moon) or MOLA (Mars) grayscale elevation texture."""
    filename = (
        "planet_texture_moon_moon_lola.jpg"
        if body == "moon"
        else "planet_texture_mars_mars_mola.jpg"
    )
    path: Path = DATA_DIR / filename
    if not path.exists():
        return None
    try:
        with Image.open(path) as img:
            return np.asarray(img.convert("L"), dtype=np.float32)
    except Exception:
        return None


def _sample_dem_topography(body: PlanetaryBody, lat: float, lon: float) -> tuple[float, float] | None:
    """Sample local 3x3 slope_deg and topographic_roughness from LOLA/MOLA DEM texture."""
    arr = _load_dem_array(body)
    if arr is None:
        return None
    h, w = arr.shape
    px = int(round(((lon + 180.0) / 360.0) * (w - 1)))
    py = int(round(((90.0 - lat) / 180.0) * (h - 1)))
    px = max(1, min(w - 2, px))
    py = max(1, min(h - 2, py))
    patch = arr[py - 1 : py + 2, px - 1 : px + 2]
    center = float(patch[1, 1])
    max_diff = float(np.max(np.abs(patch - center)))
    std_val = float(np.std(patch))
    slope_deg = round(min(32.0, max(1.2, max_diff * 0.42)), 2)
    roughness = round(min(0.95, max(0.10, std_val / 26.0)), 3)
    return slope_deg, roughness


def probe_planetary_coordinate(
    body: PlanetaryBody,
    lat: float,
    lon: float,
    client: httpx.Client | None = None,
) -> tuple[PlanetarySite, pd.DataFrame]:
    """Query NASA PDS ODE / Mars REMS & MEDA for an arbitrary Moon or Mars coordinate."""
    site_id = f"probe_{body}_{lat:.2f}_{lon:.2f}"
    nearest_id, dist_km = _nearest_tracked_site(body, lat, lon)
    extra_pds_count = 0

    dem_topo = _sample_dem_topography(body, lat, lon)
    orbital_props = sample_orbital_regolith_properties(body, lat, lon)
    iau_feature = resolve_iau_planetary_feature(body, lat, lon, client=client)

    if body == "moon":
        is_polar = abs(lat) >= 75.0
        is_mare_basin = abs(lat) < 45.0 and -60.0 <= lon <= 65.0
        base_albedo = orbital_props["surface_albedo"]
        base_ti = orbital_props["thermal_inertia"]
        base_slope = dem_topo[0] if dem_topo else (17.5 if is_polar else (9.5 if is_mare_basin else 14.0))
        base_roughness = dem_topo[1] if dem_topo else (0.66 if is_polar else (0.45 if is_mare_basin else 0.58))
        base_ice = orbital_props["subsurface_ice_frac"]

        df, prov = fetch_moon_lro_timeseries(
            site_id=site_id,
            lat=lat,
            lon=lon,
            base_roughness=base_roughness,
            base_slope=base_slope,
            base_ti=base_ti,
            base_albedo=base_albedo,
            base_ice=base_ice,
            client=client,
        )
        if base_ice > 0.01:
            df["ice_sublimation_rate"] = [
                compute_hertz_knudsen_sublimation_rate(
                    subsurface_ice_frac=float(ice_val),
                    mean_temp_k=float(t_mean),
                    diurnal_amp_k=float(t_amp),
                    atm_pressure_mbar=1e-12,
                    relative_humidity_pct=0.0,
                )
                for ice_val, t_mean, t_amp in zip(
                    df["subsurface_ice_frac"],
                    df["mean_surface_temp_k"],
                    df["diurnal_temp_amplitude_k"],
                )
            ]
        lunar_cov = query_pds_lunar_instrument_coverage(lat, lon, client=client)
        extra_pds_count = sum(lunar_cov.values())
        breakage = {"gravity_g": 0.165, "atm_pressure_mbar": 1e-12, "radiation_msv_yr": 380.0}
        data_sources = ["NASA PDS ODE LRO DLRE", iau_feature.gazetteer_source]
        if dem_topo is not None:
            data_sources.append("NASA LRO LOLA DEM")
        if lunar_cov.get("LOLA", 0) > 0:
            data_sources.append(f"NASA LRO LOLA ({lunar_cov['LOLA']})")
        if lunar_cov.get("MRFLRO", 0) > 0:
            data_sources.append(f"NASA LRO Mini-RF ({lunar_cov['MRFLRO']})")
    else:
        is_polar_ice = abs(lat) >= 44.0
        base_albedo = orbital_props["surface_albedo"]
        base_ti = orbital_props["thermal_inertia"]
        base_slope = dem_topo[0] if dem_topo else (4.2 if is_polar_ice else 7.8)
        base_roughness = dem_topo[1] if dem_topo else (0.28 if is_polar_ice else 0.46)
        base_ice = orbital_props["subsurface_ice_frac"]

        use_meda = nearest_id == "mars_jezero_crater"
        mars_fetcher = fetch_mars_meda_timeseries if use_meda else fetch_mars_rems_timeseries
        ref_elev_m = -2560.0 if use_meda else -4501.0
        df, prov = mars_fetcher(
            site_id=site_id,
            lat_deg=lat,
            base_roughness=base_roughness,
            base_slope=base_slope,
            base_ti=base_ti,
            base_albedo=base_albedo,
            base_ice=base_ice,
            max_sols=180,
            client=client,
        )
        # Apply hypsometric barometric scaling P(z) = P_ref * exp(-(z - z_ref) / H(T)) from MOLA elevation
        ref_p_mbar = float(df["atm_pressure_mbar"].mean())
        mean_t_k = float(df["mean_surface_temp_k"].mean())
        hypso = compute_mars_hypsometric_state(
            lat=lat,
            lon=lon,
            rover_ref_pressure_mbar=ref_p_mbar,
            rover_ref_elevation_m=ref_elev_m,
            mean_temp_k=mean_t_k,
        )
        df["atm_pressure_mbar"] = (df["atm_pressure_mbar"] * hypso["pressure_scale_factor"]).round(3)
        df["diurnal_temp_amplitude_k"] = (
            df["diurnal_temp_amplitude_k"] * hypso["diurnal_amp_multiplier"]
        ).round(2)
        df["nocturnal_cooling_k_hr"] = (
            df["nocturnal_cooling_k_hr"] * hypso["diurnal_amp_multiplier"]
        ).round(3)

        if base_ice > 0.01:
            df["ice_sublimation_rate"] = [
                compute_hertz_knudsen_sublimation_rate(
                    subsurface_ice_frac=float(ice_val),
                    mean_temp_k=float(t_mean),
                    diurnal_amp_k=float(t_amp),
                    atm_pressure_mbar=float(p_mbar),
                    relative_humidity_pct=0.5,
                )
                for ice_val, t_mean, t_amp, p_mbar in zip(
                    df["subsurface_ice_frac"],
                    df["mean_surface_temp_k"],
                    df["diurnal_temp_amplitude_k"],
                    df["atm_pressure_mbar"],
                )
            ]

        mars_cov = query_pds_mars_instrument_coverage(lat, lon, client=client)
        extra_pds_count = sum(mars_cov.values())
        breakage = {
            "gravity_g": 0.378,
            "atm_pressure_mbar": round(float(df["atm_pressure_mbar"].mean()), 2),
            "radiation_msv_yr": hypso["radiation_msv_yr"],
        }
        data_sources = [
            prov.get("source_api", "NASA Mars REMS API"),
            iau_feature.gazetteer_source,
            "MGS TES / Odyssey GRS",
        ]
        if dem_topo is not None:
            data_sources.append("NASA MGS MOLA DEM")
        if mars_cov.get("CRISM", 0) > 0:
            data_sources.append(f"NASA MRO CRISM ({mars_cov['CRISM']})")
        if mars_cov.get("SHARAD", 0) > 0:
            data_sources.append(f"NASA MRO SHARAD ({mars_cov['SHARAD']})")
    topo_origin: VariableOrigin = "derived" if dem_topo is not None else "model"
    estimated_terrain_vars = [
        *([] if dem_topo is not None else ["topographic_roughness", "slope_deg"]),
        "thermal_inertia",
        "surface_albedo",
        "subsurface_ice_frac",
    ]
    if body == "moon":
        pds_count = int(prov.get("pds_products_found", "0")) + extra_pds_count
        if dist_km <= 150.0:
            conf_level: ConfidenceLevel = "high"
            conf_score = 0.90
            is_tracked = True
            notice_key = "confidence.tracked_high"
        elif pds_count > 0:
            conf_level = "medium"
            conf_score = 0.64
            is_tracked = False
            notice_key = "confidence.moon_pds_partial"
        else:
            conf_level = "estimated"
            conf_score = 0.38
            is_tracked = False
            notice_key = "confidence.moon_estimated"
        moon_prov: dict[str, VariableOrigin] = {
            "topographic_roughness": topo_origin,
            "slope_deg": topo_origin,
            "thermal_inertia": "model",
            "surface_albedo": "model",
            "subsurface_ice_frac": "model",
            "solar_flux_wm2": "model",
            "mean_surface_temp_k": "model",
            "diurnal_temp_amplitude_k": "model",
            "nocturnal_cooling_k_hr": "model",
        }
        confidence = DataConfidence(
            level=conf_level,
            score=conf_score,
            is_tracked_zone=is_tracked,
            nearest_tracked_site_id=nearest_id,
            distance_to_tracked_km=dist_km,
            pds_products_found=pds_count,
            real_variables=[
                "solar_flux_wm2",
                "mean_surface_temp_k",
                "diurnal_temp_amplitude_k",
                "nocturnal_cooling_k_hr",
            ],
            estimated_variables=[] if is_tracked else estimated_terrain_vars,
            variable_provenance=moon_prov,
            notice_key=notice_key,
        )
    else:
        if dist_km <= 150.0:
            conf_level = "high"
            conf_score = 0.90
            is_tracked = True
            notice_key = "confidence.tracked_high"
        elif dist_km <= 500.0:
            conf_level = "medium"
            conf_score = 0.58
            is_tracked = False
            notice_key = "confidence.mars_extrapolated"
        else:
            conf_level = "estimated"
            conf_score = 0.38
            is_tracked = False
            notice_key = "confidence.mars_extrapolated"
        mars_prov: dict[str, VariableOrigin] = {
            "topographic_roughness": topo_origin,
            "slope_deg": topo_origin,
            "thermal_inertia": "model",
            "surface_albedo": "model",
            "subsurface_ice_frac": "model",
            "solar_flux_wm2": "derived",
            "mean_surface_temp_k": "measured" if is_tracked else "derived",
            "diurnal_temp_amplitude_k": "measured" if is_tracked else "derived",
            "aeolian_dust_flux": "measured" if is_tracked else "derived",
        }
        confidence = DataConfidence(
            level=conf_level,
            score=conf_score,
            is_tracked_zone=is_tracked,
            nearest_tracked_site_id=nearest_id,
            distance_to_tracked_km=dist_km,
            pds_products_found=extra_pds_count if extra_pds_count > 0 else None,
            real_variables=[
                "solar_flux_wm2",
                "mean_surface_temp_k",
                "diurnal_temp_amplitude_k",
                "atm_pressure_mbar",
                "aeolian_dust_flux",
            ],
            estimated_variables=[] if is_tracked else estimated_terrain_vars,
            variable_provenance=mars_prov,
            notice_key=notice_key,
        )

    site = PlanetarySite(
        site_id=site_id,
        body=body,
        name_key=f"sites.custom_{body}",
        mission_context_key=f"sites.custom_{body}_context",
        data_sources=data_sources,
        coordinates=Coordinates(lat=round(lat, 3), lon=round(lon, 3)),
        variables=PhysicalVariables(
            independent={
                col: round(float(df[col].mean()), 4)
                for col in INDEPENDENT_VARIABLES
            },
            dependent={
                col: round(float(df[col].mean()), 4)
                for col in DEPENDENT_VARIABLES
            },
            breakage=breakage,
        ),
        provenance=DataProvenance(
            source_apis=[prov.get("source_api", "NASA API"), *data_sources[:1]],
            observation_window=prov.get("observation_window", "N/A"),
            fetched_at=prov.get("fetched_at", datetime.now(timezone.utc).isoformat()),
            is_live_probed=True,
        ),
        confidence=confidence,
        planetary_feature=iau_feature,
    )
    return site, df

