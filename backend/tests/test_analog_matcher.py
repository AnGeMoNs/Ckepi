"""Tests for real NASA POWER + Open-Meteo Earth probing and analog matching."""

from app.engine.analog_matcher import match_terrestrial_analogs
from app.engine.causal_decomposer import decompose_planetary_site
from app.etl.earth_api import probe_earth_location
from app.etl.planetary_etl import build_real_planetary_sites_and_timeseries
import pandas as pd


def test_real_earth_probe_atacama_vs_amazon() -> None:
    """Verify real NASA POWER + Open-Meteo data ranks Atacama dramatically above Amazon."""
    atacama = probe_earth_location(
        lat=-24.10,
        lon=-69.90,
        region_key="regions.atacama_yungay",
        country_code="CL",
        biome_key="biomes.hyperarid_desert",
        is_benchmark=True,
        is_live_probed=False,
    )
    amazon = probe_earth_location(
        lat=-3.12,
        lon=-60.02,
        region_key="regions.amazon_central_basin",
        country_code="BR",
        biome_key="biomes.tropical_rainforest",
        is_benchmark=False,
        is_live_probed=False,
    )

    assert float(atacama["aridity_index"]) > 0.70  # type: ignore[arg-type]
    assert float(amazon["aridity_index"]) < 0.45  # type: ignore[arg-type]

    sites, df_ts = build_real_planetary_sites_and_timeseries()
    jezero = next(s for s in sites if s.site_id == "mars_jezero_crater")
    decomp = decompose_planetary_site(jezero, df_ts, model_type="ridge")

    df_earth = pd.DataFrame([atacama, amazon])
    res = match_terrestrial_analogs(
        site=jezero,
        causal_weights=decomp.global_iv_weights,
        df_earth=df_earth,
        limit=10,
    )

    assert res.matches[0].region_key == "regions.atacama_yungay"
    assert res.matches[0].combined_score > res.matches[1].combined_score + 0.20
    assert "NASA POWER" in res.matches[0].provenance.source_apis
