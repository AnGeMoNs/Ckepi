"""Curated weather proxies must not become local measurements after a cache reload."""

import json
from pathlib import Path

import pandas as pd
import pytest

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES
from app.etl import planetary_etl
from app.etl.seed_datasets import load_cached_planetary_sites
from app.models.schemas import Coordinates, DataConfidence, DataProvenance, PhysicalVariables, PlanetarySite


def _site(site_id: str, lat: float, lon: float, legacy: bool = False) -> PlanetarySite:
    return PlanetarySite(
        site_id=site_id,
        body="moon" if site_id.startswith("moon") else "mars",
        name_key=f"sites.{site_id}.name",
        mission_context_key=f"sites.{site_id}.context",
        coordinates=Coordinates(lat=lat, lon=lon),
        data_sources=["Perseverance MEDA"],
        variables=PhysicalVariables(
            independent={key: 0.5 for key in INDEPENDENT_VARIABLES},
            dependent={key: 2.0 for key in DEPENDENT_VARIABLES},
            breakage={"gravity_g": 0.378, "atm_pressure_mbar": 6.0, "radiation_msv_yr": 230.0},
        ),
        provenance=DataProvenance(
            source_apis=["NASA Mars 2020 MEDA + MSL REMS API"],
            observation_window="fixture observation window",
            fetched_at="2026-11-13T00:00:00Z",
        ),
        confidence=DataConfidence(
            level="high", score=0.99, is_tracked_zone=True,
            nearest_tracked_site_id=site_id, distance_to_tracked_km=0.0,
            pds_products_found=12, real_variables=["mean_surface_temp_k", "aeolian_dust_flux"],
            variable_provenance={"mean_surface_temp_k": "measured", "aeolian_dust_flux": "measured"},
            notice_key="confidence.tracked_mars_curated",
        ) if legacy else None,
    )


def _cache_load(tmp_path: Path, site: PlanetarySite) -> PlanetarySite:
    path = tmp_path / "planetary_sites.json"
    path.write_text(json.dumps([site.model_dump()]), encoding="utf-8")
    before = path.read_bytes()
    loaded = load_cached_planetary_sites(tmp_path)[0]
    assert path.read_bytes() == before  # Normalization is in memory, not a dataset migration.
    assert loaded.variables == site.variables
    assert loaded.provenance.observation_window == site.provenance.observation_window
    assert loaded.provenance.fetched_at == site.provenance.fetched_at
    return loaded


@pytest.mark.parametrize("legacy", [False, True])
@pytest.mark.parametrize("site_id,lat,lon", [
    ("mars_jezero_crater", 18.38, 77.58),
    ("mars_arcadia_planitia", 46.70, -172.0),
])
def test_cached_weather_proxies_never_claim_local_observations(
    tmp_path: Path, site_id: str, lat: float, lon: float, legacy: bool,
) -> None:
    site = _cache_load(tmp_path, _site(site_id, lat, lon, legacy))
    confidence = site.confidence
    assert confidence is not None
    assert confidence.level == "estimated"
    assert not confidence.is_tracked_zone
    assert confidence.nearest_tracked_site_id == "mars_gale_crater"
    assert confidence.distance_to_tracked_km is not None
    assert 2000 < confidence.distance_to_tracked_km < 8000
    assert confidence.notice_key == "confidence.mars_curated_proxy"
    assert confidence.real_variables == []
    for key in ("mean_surface_temp_k", "diurnal_temp_amplitude_k", "atm_pressure_mbar", "aeolian_dust_flux"):
        assert confidence.variable_provenance[key] == "model"
        assert key in confidence.estimated_variables
    assert "Gale" in site.provenance.source_apis[0]
    assert "not local in-situ measurements" in site.provenance.source_apis[0]
    assert not any("MEDA" in label for label in site.data_sources + site.provenance.source_apis)
    if site_id == "mars_jezero_crater":
        assert any("CTX" in label and "separate 30 m" in label for label in site.data_sources)


def test_gale_dust_proxy_is_derived_even_with_legacy_confidence(tmp_path: Path) -> None:
    site = _cache_load(tmp_path, _site("mars_gale_crater", -5.40, 137.80, legacy=True))
    confidence = site.confidence
    assert confidence is not None
    assert confidence.is_tracked_zone
    assert confidence.distance_to_tracked_km == 0.0
    assert confidence.variable_provenance["aeolian_dust_flux"] == "derived"
    assert "aeolian_dust_flux" not in confidence.real_variables
    assert confidence.variable_provenance["thermal_inertia"] == "model"
    assert confidence.variable_provenance["atm_pressure_mbar"] == "measured"


@pytest.mark.parametrize("site_id,lat,lon", [
    ("moon_shackleton_pole", -89.68, 129.78),
    ("moon_tranquillitatis_lava", 8.33, 33.22),
])
def test_lunar_scenarios_do_not_claim_measured_thermal_series_or_product_counts(
    tmp_path: Path, site_id: str, lat: float, lon: float,
) -> None:
    site = _cache_load(tmp_path, _site(site_id, lat, lon, legacy=True))
    confidence = site.confidence
    assert confidence is not None
    assert confidence.pds_products_found is None
    assert not confidence.is_tracked_zone
    assert confidence.nearest_tracked_site_id is None
    assert confidence.distance_to_tracked_km is None
    assert confidence.real_variables == []
    for key in ("solar_flux_wm2", "mean_surface_temp_k", "diurnal_temp_amplitude_k"):
        assert confidence.variable_provenance[key] == "model"


def test_custom_site_retains_its_explicit_provenance(tmp_path: Path) -> None:
    original = _site("custom_future_mars_site", 1.0, 2.0, legacy=True)
    loaded = _cache_load(tmp_path, original)
    assert loaded.confidence == original.confidence
    assert loaded.provenance == original.provenance
    assert loaded.data_sources == original.data_sources


def test_fresh_materialization_marks_proxies_without_claiming_meda(monkeypatch) -> None:
    def weather(**kwargs):
        row = {key: 0.5 for key in (*INDEPENDENT_VARIABLES, *DEPENDENT_VARIABLES)}
        row.update(site_id=kwargs["site_id"], body="mars", atm_pressure_mbar=6.0)
        return pd.DataFrame([row]), {
            "source_api": "NASA Mars MSL Curiosity REMS API",
            "observation_window": "fixture",
        }

    monkeypatch.setattr(planetary_etl, "fetch_mars_rems_timeseries", weather)
    monkeypatch.setattr(planetary_etl, "fetch_moon_lro_timeseries", weather)
    sites, _ = planetary_etl.build_real_planetary_sites_and_timeseries(client=object())
    for site in sites:
        assert site.confidence is not None
        if site.site_id in {"mars_jezero_crater", "mars_arcadia_planitia"}:
            assert site.confidence.level == "estimated"
            assert site.confidence.real_variables == []
            assert all("MEDA" not in source for source in site.provenance.source_apis)
