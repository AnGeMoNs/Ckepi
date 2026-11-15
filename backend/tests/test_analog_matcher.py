"""Tests for real NASA POWER + Open-Meteo Earth probing and analog matching."""

from app.engine.analog_matcher import match_terrestrial_analogs
from app.engine.causal_decomposer import decompose_planetary_site
from app.engine.terrain_statistics import compute_terrain_distribution_comparison
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

    # Verify statistical terrain distribution (Wasserstein-1, KS, block bootstrap 95% CI, 30/60/90m scales)
    stat_dist = compute_terrain_distribution_comparison(jezero, res.matches[0])
    assert stat_dist.common_resolution_m == 30
    assert [pt.resolution_m for pt in stat_dist.scale_sensitivity] == [30, 60, 90]
    w1_low, w1_high = stat_dist.slope_distribution.w1_ci_95
    assert 0.0 <= w1_low <= stat_dist.slope_distribution.wasserstein_distance <= w1_high
    ks_low, ks_high = stat_dist.slope_distribution.ks_ci_95
    assert 0.0 <= ks_low <= stat_dist.slope_distribution.ks_statistic <= ks_high <= 1.0
    assert len(stat_dist.slope_distribution.bin_centers) == 16
    assert stat_dist.slope_distribution.control_yungay_w1 > 0.0
