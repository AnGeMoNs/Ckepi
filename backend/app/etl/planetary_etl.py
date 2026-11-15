"""Planetary ETL integrating real NASA Mars REMS/MEDA & NASA PDS LRO APIs."""

from datetime import datetime, timezone
from pathlib import Path
import httpx
import numpy as np
import pandas as pd

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES
from app.engine.planetary_physics import _spherical_distance_km
from app.etl.http_utils import create_http_client
from app.etl.mars_api import fetch_mars_rems_timeseries
from app.etl.moon_api import fetch_moon_lro_timeseries
from app.models.schemas import (
    Coordinates, DataConfidence, DataProvenance, PhysicalVariables, PlanetarySite, VariableOrigin,
)


def normalize_curated_site_provenance(site: PlanetarySite) -> PlanetarySite:
    """Correct lineage of the five current curated products without changing their physical values.

    Jezero/Arcadia weather is transferred from Gale REMS; LRO metadata only
    anchors the lunar radiative model. Apply on cache reads too so legacy
    confidence labels cannot turn those products into local observations.
    """
    proxy_ids = {"mars_jezero_crater", "mars_arcadia_planitia"}
    lunar_ids = {"moon_shackleton_pole", "moon_tranquillitatis_lava"}
    if site.site_id not in proxy_ids | lunar_ids | {"mars_gale_crater"}:
        return site

    is_proxy = site.site_id in proxy_ids
    is_mars = site.body == "mars"
    origins: dict[str, VariableOrigin] = {
        key: "constant" for key in (*INDEPENDENT_VARIABLES, *site.variables.breakage)
    }
    origins.update({key: "model" for key in DEPENDENT_VARIABLES})
    origins.update({
        "thermal_inertia": "model" if is_mars else "constant",
        "solar_flux_wm2": "derived" if is_mars else "model",
        "uv_irradiance_index": "derived" if is_mars else "model",
        "slope_deg": "constant" if is_mars else "model",
    })
    if is_mars:
        origins.update({
            "mean_surface_temp_k": "model" if is_proxy else "measured",
            "diurnal_temp_amplitude_k": "model" if is_proxy else "measured",
            "nocturnal_cooling_k_hr": "model" if is_proxy else "derived",
            "aeolian_dust_flux": "model" if is_proxy else "derived",
            "atm_pressure_mbar": "model" if is_proxy else "measured",
        })

    if is_proxy:
        label = "NASA MSL Curiosity REMS (Gale) — weather proxy; not local in-situ measurements"
        site.data_sources = [label, "Regional terrain/ice catalog constants"]
        if site.site_id == "mars_jezero_crater":
            site.data_sources.append("NASA MRO CTX / USGS Jezero DEM (separate 30 m terrain comparison)")
        site.provenance = site.provenance.model_copy(update={"source_apis": [label]})

    measured = [key for key, origin in origins.items() if origin == "measured"]
    site.confidence = DataConfidence(
        level="estimated" if is_proxy else ("high" if is_mars else "medium"),
        # Same conservative proxy tier as planetary_probe; a metadata score, not
        # a calibrated probability. Existing physical values remain untouched.
        score=0.38 if is_proxy else (0.78 if is_mars else 0.68),
        is_tracked_zone=is_mars and not is_proxy,
        nearest_tracked_site_id="mars_gale_crater" if is_mars else None,
        distance_to_tracked_km=(
            round(_spherical_distance_km("mars", site.coordinates.lat, site.coordinates.lon, -5.40, 137.80), 2)
            if is_mars else None
        ),
        # Cached catalog entries contain no verified product count. Never infer
        # twelve observations from the connector's request limit.
        pds_products_found=None,
        real_variables=measured,
        estimated_variables=[key for key in origins if key not in measured],
        variable_provenance=origins,
        notice_key=(
            "confidence.mars_curated_proxy" if is_proxy
            else "confidence.tracked_mars_curated" if is_mars
            else "confidence.tracked_moon_curated"
        ),
    )
    return site


def read_pds_product_with_pdr(pds_path: Path) -> pd.DataFrame:
    """Read a NASA PDS3/PDS4 label or table using MillionConcepts/pdr."""
    import pdr

    data = pdr.read(str(pds_path))
    for key in data.keys():
        obj: object = data[key]
        if isinstance(obj, pd.DataFrame):
            return obj
    raise ValueError(f"No tabular DataFrame found in PDS product: {pds_path}")


def build_real_planetary_sites_and_timeseries(
    client: httpx.Client | None = None,
) -> tuple[list[PlanetarySite], pd.DataFrame]:
    """Build Gale observations, regional REMS weather proxies and lunar radiative scenarios."""
    own_client = client is None
    http = client or create_http_client(timeout=25.0)
    try:
        # 1. Mars Gale Crater (Curiosity REMS live API: 4,700+ real sols)
        df_gale, gale_prov = fetch_mars_rems_timeseries(
            site_id="mars_gale_crater",
            lat_deg=-5.40,
            base_roughness=0.51,
            base_slope=9.8,
            base_ti=360.0,
            base_albedo=0.21,
            base_ice=0.02,
            max_sols=365,
            client=http,
        )

        # 2. Jezero weather proxy from Gale REMS, not local Perseverance MEDA observations.
        df_jezero, jezero_prov = fetch_mars_rems_timeseries(
            site_id="mars_jezero_crater",
            lat_deg=18.38,
            base_roughness=0.42,
            base_slope=6.4,
            base_ti=295.0,
            base_albedo=0.23,
            base_ice=0.03,
            max_sols=240,
            client=http,
        )

        # 3. Mars Arcadia Planitia (Northern high-latitude orbital solar/ice regime calibrated to REMS)
        df_arcadia, arcadia_prov = fetch_mars_rems_timeseries(
            site_id="mars_arcadia_planitia",
            lat_deg=46.70,
            base_roughness=0.22,
            base_slope=2.1,
            base_ti=210.0,
            base_albedo=0.27,
            base_ice=0.62,
            max_sols=200,
            client=http,
        )
        # Estimate ice sublimation from orbital solar flux & catalog ice fraction.
        df_arcadia["ice_sublimation_rate"] = np.clip(
            df_arcadia["subsurface_ice_frac"] * (df_arcadia["solar_flux_wm2"] / 450.0) * 0.65,
            0.0,
            0.85,
        ).round(4)

        # 4. Moon Shackleton Crater (NASA PDS ODE LRO Diviner PRP)
        df_shackleton, shackleton_prov = fetch_moon_lro_timeseries(
            site_id="moon_shackleton_pole",
            lat=-89.68,
            lon=129.78,
            base_roughness=0.68,
            base_slope=18.5,
            base_ti=58.0,
            base_albedo=0.16,
            base_ice=0.35,
            client=http,
        )

        # 5. Moon Mare Tranquillitatis (NASA PDS ODE LRO Diviner GDR_L3)
        df_tranq, tranq_prov = fetch_moon_lro_timeseries(
            site_id="moon_tranquillitatis_lava",
            lat=8.33,
            lon=33.22,
            base_roughness=0.58,
            base_slope=14.2,
            base_ti=85.0,
            base_albedo=0.09,
            base_ice=0.0,
            client=http,
        )

        all_ts = pd.concat(
            [df_gale, df_jezero, df_arcadia, df_shackleton, df_tranq],
            ignore_index=True,
        )

        sites = [
            _build_site_from_df(
                site_id="moon_shackleton_pole",
                body="moon",
                name_key="sites.moon_shackleton_pole.name",
                mission_context_key="sites.moon_shackleton_pole.context",
                data_sources=["NASA PDS ODE LRO DLRE", "NASA LRO LOLA", "NASA LRO LEND"],
                lat=-89.68,
                lon=129.78,
                df=df_shackleton,
                breakage={"gravity_g": 0.165, "atm_pressure_mbar": 1e-12, "radiation_msv_yr": 380.0},
                prov=shackleton_prov,
            ),
            _build_site_from_df(
                site_id="moon_tranquillitatis_lava",
                body="moon",
                name_key="sites.moon_tranquillitatis_lava.name",
                mission_context_key="sites.moon_tranquillitatis_lava.context",
                data_sources=["NASA PDS ODE LRO DLRE", "NASA LRO LROC", "NASA LRO LOLA"],
                lat=8.33,
                lon=33.22,
                df=df_tranq,
                breakage={"gravity_g": 0.165, "atm_pressure_mbar": 1e-12, "radiation_msv_yr": 380.0},
                prov=tranq_prov,
            ),
            _build_site_from_df(
                site_id="mars_jezero_crater",
                body="mars",
                name_key="sites.mars_jezero_crater.name",
                mission_context_key="sites.mars_jezero_crater.context",
                data_sources=["Perseverance MEDA", "NASA Mars REMS API", "MRO THEMIS"],
                lat=18.38,
                lon=77.58,
                df=df_jezero,
                breakage={
                    "gravity_g": 0.378,
                    "atm_pressure_mbar": round(float(df_jezero["atm_pressure_mbar"].mean()), 2),
                    "radiation_msv_yr": 230.0,
                },
                prov=jezero_prov,
            ),
            _build_site_from_df(
                site_id="mars_gale_crater",
                body="mars",
                name_key="sites.mars_gale_crater.name",
                mission_context_key="sites.mars_gale_crater.context",
                data_sources=["Curiosity REMS API", "MRO THEMIS", "MRO CRISM"],
                lat=-5.40,
                lon=137.80,
                df=df_gale,
                breakage={
                    "gravity_g": 0.378,
                    "atm_pressure_mbar": round(float(df_gale["atm_pressure_mbar"].mean()), 2),
                    "radiation_msv_yr": 220.0,
                },
                prov=gale_prov,
            ),
            _build_site_from_df(
                site_id="mars_arcadia_planitia",
                body="mars",
                name_key="sites.mars_arcadia_planitia.name",
                mission_context_key="sites.mars_arcadia_planitia.context",
                data_sources=["MRO SHARAD", "NASA Mars REMS API", "Mars Odyssey GRS"],
                lat=46.70,
                lon=-172.00,
                df=df_arcadia,
                breakage={
                    "gravity_g": 0.378,
                    "atm_pressure_mbar": round(float(df_arcadia["atm_pressure_mbar"].mean()), 2),
                    "radiation_msv_yr": 235.0,
                },
                prov=arcadia_prov,
            ),
        ]

        return sites, all_ts
    finally:
        if own_client:
            http.close()


def _build_site_from_df(
    site_id: str,
    body: str,
    name_key: str,
    mission_context_key: str,
    data_sources: list[str],
    lat: float,
    lon: float,
    df: pd.DataFrame,
    breakage: dict[str, float],
    prov: dict[str, str],
) -> PlanetarySite:
    """Aggregate observations or modeled scenarios with their actual source lineage."""
    return normalize_curated_site_provenance(PlanetarySite(
        site_id=site_id,
        body=body,  # type: ignore[arg-type]
        name_key=name_key,
        mission_context_key=mission_context_key,
        data_sources=data_sources,
        coordinates=Coordinates(lat=lat, lon=lon),
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
            is_live_probed=False,
        ),
    ))
