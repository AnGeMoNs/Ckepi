"""Tests for causal variable decomposition engine using real planetary telemetry."""

import numpy as np
import pandas as pd

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES
from app.engine.causal_decomposer import decompose_planetary_site
from app.etl.mars_api import fetch_mars_rems_timeseries
from app.etl.planetary_etl import build_real_planetary_sites_and_timeseries


def test_synthetic_causal_weight_recovery() -> None:
    """Verify Ridge decomposition recovers known dominant independent drivers."""
    sites, _ = build_real_planetary_sites_and_timeseries()
    jezero = next(s for s in sites if s.site_id == "mars_jezero_crater")
    rng = np.random.default_rng(123)
    n = 200

    data: dict[str, object] = {"site_id": [jezero.site_id] * n, "body": [jezero.body] * n}
    for col in INDEPENDENT_VARIABLES:
        data[col] = rng.normal(0.0, 1.0, n)

    df = pd.DataFrame(data)
    df["diurnal_temp_amplitude_k"] = (
        4.0 * df["solar_flux_wm2"]
        - 1.5 * df["thermal_inertia"]
        + rng.normal(0.0, 0.15, n)
    )
    for dv in DEPENDENT_VARIABLES:
        if dv != "diurnal_temp_amplitude_k":
            df[dv] = rng.normal(0.0, 0.01, n)

    result = decompose_planetary_site(jezero, df, model_type="ridge")
    diurnal_model = next(m for m in result.dependent_models if m.dv_name == "diurnal_temp_amplitude_k")

    assert diurnal_model.r2_score > 0.85
    assert diurnal_model.weights["solar_flux_wm2"] > diurnal_model.weights["thermal_inertia"]
    assert diurnal_model.weights["thermal_inertia"] > diurnal_model.weights["slope_deg"]


def test_real_mars_rems_and_moon_lro_decomposition() -> None:
    """Verify real NASA Mars REMS & Moon LRO PDS data decompose cleanly."""
    df_rems, prov = fetch_mars_rems_timeseries(
        site_id="mars_gale_crater",
        lat_deg=-5.40,
        base_roughness=0.51,
        base_slope=9.8,
        base_ti=360.0,
        base_albedo=0.21,
        base_ice=0.02,
        max_sols=180,
    )
    assert len(df_rems) >= 100
    assert "NASA Mars MSL Curiosity REMS API" in prov["source_api"]

    sites, df_all = build_real_planetary_sites_and_timeseries()
    assert len(sites) == 5
    for site in sites:
        res = decompose_planetary_site(site, df_all, model_type="ridge")
        assert abs(sum(res.global_iv_weights.values()) - 1.0) < 0.02
        assert all(b.is_broken for b in res.breakage_profile)
        assert len(res.provenance.source_apis) > 0
