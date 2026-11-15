"""Fast unit tests for confidence scoring, manual variable filters, validation, and tile security."""

from fastapi.testclient import TestClient
import pandas as pd

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES
from app.engine.analog_matcher import match_terrestrial_analogs
from app.main import app
from app.models.schemas import (
    Coordinates,
    DataConfidence,
    DataProvenance,
    PhysicalVariables,
    PlanetarySite,
)


def _make_dummy_site(confidence_score: float = 0.40) -> PlanetarySite:
    return PlanetarySite(
        site_id="test_mars_site",
        body="mars",
        name_key="sites.mars_jezero_crater.name",
        mission_context_key="sites.mars_jezero_crater.context",
        data_sources=["Test"],
        coordinates=Coordinates(lat=18.38, lon=77.58),
        variables=PhysicalVariables(
            independent={k: 0.5 for k in INDEPENDENT_VARIABLES},
            dependent={k: 0.5 for k in DEPENDENT_VARIABLES},
            breakage={"gravity_g": 0.378, "atm_pressure_mbar": 6.5, "radiation_msv_yr": 230.0},
        ),
        provenance=DataProvenance(
            source_apis=["Test"],
            observation_window="2024",
            fetched_at="2026-01-01T00:00:00Z",
            is_live_probed=False,
        ),
        confidence=DataConfidence(
            level="estimated",
            score=confidence_score,
            is_tracked_zone=False,
            nearest_tracked_site_id="mars_jezero_crater",
            distance_to_tracked_km=1200.0,
            variable_provenance={"slope_deg": "model"},
            notice_key="confidence.mars_extrapolated",
        ),
    )


def _make_earth_df() -> pd.DataFrame:
    row_good = {
        "earth_cell_h3": "837b59fffffffff",
        "h3_resolution": 3,
        "lat": -24.1,
        "lon": -69.9,
        "h3_boundary_json": "[[0,0],[0,1],[1,1]]",
        "source_apis_json": '["NASA POWER"]',
        "region_key": "regions.atacama_yungay",
        "country_code": "CL",
        "biome_key": "biomes.hyperarid_desert",
        "is_benchmark": True,
        "observation_window": "2024-03",
        "fetched_at": "2026-01-01T00:00:00Z",
        "is_live_probed": False,
        "gravity_g": 1.0,
        "atm_pressure_mbar": 1013.25,
        "radiation_msv_yr": 2.4,
    }
    for k in INDEPENDENT_VARIABLES:
        row_good[k] = 0.5
    for k in DEPENDENT_VARIABLES:
        row_good[k] = 0.5

    row_bad = dict(row_good)
    row_bad["earth_cell_h3"] = "837b58fffffffff"
    row_bad["slope_deg"] = 25.0
    row_bad["mean_surface_temp_k"] = 90.0
    return pd.DataFrame([row_good, row_bad])


def test_manual_custom_weights_and_min_similarity_iv_and_dv() -> None:
    site = _make_dummy_site(confidence_score=0.40)
    df_earth = _make_earth_df()
    causal_w = {k: 1.0 / len(INDEPENDENT_VARIABLES) for k in INDEPENDENT_VARIABLES}

    res = match_terrestrial_analogs(
        site=site,
        causal_weights=causal_w,
        df_earth=df_earth,
        custom_weights={"slope_deg": 1.0},
        custom_dv_weights={"mean_surface_temp_k": 1.0},
        custom_min_similarity={"slope_deg": 0.9, "mean_surface_temp_k": 0.9},
        penalize_estimated=True,
    )
    assert res.returned_count == 1
    match = res.matches[0]
    assert match.earth_cell_h3 == "837b59fffffffff"
    assert match.confidence_adjusted_score < match.combined_score
    assert match.score_uncertainty > 0.0


def test_api_tile_bounds_and_invalid_weights_rejected() -> None:
    with TestClient(app) as client:
        bad_tile = client.get("/api/v1/tiles/trek/moon/12/0/0.jpg")
        assert bad_tile.status_code == 400

        bad_body = client.get("/api/v1/tiles/trek/venus/0/0/0.jpg")
        assert bad_body.status_code == 404

        bad_weights = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "mars_jezero_crater",
                "custom_iv_weights": {"nonexistent_var": 0.5},
            },
        )
        assert bad_weights.status_code == 422

        bad_range = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "mars_jezero_crater",
                "custom_min_similarity": {"slope_deg": 1.5},
            },
        )
        assert bad_range.status_code == 422

        bad_refine = client.post(
            "/api/v1/analogs/refine",
            json={
                "earth_cell_h3": "not-an-h3-cell",
                "site_id": "mars_jezero_crater",
            },
        )
        assert bad_refine.status_code == 400


def test_zero_custom_block_skips_ignored_threshold() -> None:
    """Zeroing all DV weights in manual mode must not trigger fallback or min_s_dep cutoff."""
    site = _make_dummy_site()
    df = _make_earth_df()
    res = match_terrestrial_analogs(
        site=site,
        causal_weights={k: 1.0 for k in INDEPENDENT_VARIABLES},
        df_earth=df,
        min_s_ind=0.2,
        min_s_dep=0.9,
        custom_weights={k: 1.0 for k in INDEPENDENT_VARIABLES},
        custom_dv_weights={k: 0.0 for k in DEPENDENT_VARIABLES},
    )
    assert res.returned_count >= 1
    assert res.matches[0].earth_cell_h3 == "837b59fffffffff"
    assert res.matches[0].s_dep == 1.0


def test_mars_meda_and_pds_multi_instrument_probe() -> None:
    """Verify Perseverance MEDA & PDS ODE multi-instrument coverage work for Jezero & Moon."""
    from app.etl.planetary_probe import probe_planetary_coordinate

    site, df = probe_planetary_coordinate("mars", 18.38, 77.58)
    assert len(df) > 10
    assert any("MEDA" in s or "REMS" in s for s in site.data_sources)
    assert site.confidence is not None
    assert site.confidence.is_tracked_zone is True


def test_compact_tail_preserves_scores_and_hover_telemetry() -> None:
    """Compact tail mode omits bulky breakdowns past detail_limit while keeping ranking & telemetry."""
    site = _make_dummy_site()
    base_df = _make_earth_df()
    # Create 5 distinct cells by cloning and slightly shifting slope/temp
    rows = []
    for i in range(5):
        row = base_df.iloc[i % len(base_df)].copy()
        row["earth_cell_h3"] = f"837b5{i}fffffffff"
        row["slope_deg"] = float(row["slope_deg"]) + i * 1.5
        rows.append(row)
    df = pd.DataFrame(rows)

    full = match_terrestrial_analogs(
        site=site,
        causal_weights={k: 1.0 for k in INDEPENDENT_VARIABLES},
        df_earth=df,
        limit=10,
        compact_tail=False,
    )
    compact = match_terrestrial_analogs(
        site=site,
        causal_weights={k: 1.0 for k in INDEPENDENT_VARIABLES},
        df_earth=df,
        limit=10,
        compact_tail=True,
        detail_limit=1,
    )

    assert [m.earth_cell_h3 for m in compact.matches] == [m.earth_cell_h3 for m in full.matches]
    assert [m.combined_score for m in compact.matches] == [m.combined_score for m in full.matches]
    assert [m.is_pareto_optimal for m in compact.matches] == [m.is_pareto_optimal for m in full.matches]
    assert compact.matches[0].breakage_alerts != []
    tail = compact.matches[-1]
    assert "slope_deg" in tail.earth_variables.independent
    assert "mean_surface_temp_k" in tail.earth_variables.dependent
    assert "radiation_msv_yr" in tail.earth_variables.breakage


