"""Offline regression tests for profile/weight consistency across endpoints, health metrics, and refinement reuse."""

from pathlib import Path
import shutil

from fastapi.testclient import TestClient
import h3

from app.config import settings
from app.main import app, state


def test_health_reports_duckdb_grid_and_site_counts() -> None:
    """Health check returns both status=ok and positive H3 cell & planetary ROI counts."""
    with TestClient(app) as client:
        sites_res = client.get("/api/v1/planetary-sites")
        assert sites_res.status_code == 200
        res = client.get("/api/v1/health")
        assert res.status_code == 200
        body = res.json()
        assert body["status"] == "ok"
        assert body["earth_cells_count"] > 0
        assert body["planetary_sites_count"] == len(sites_res.json())
        assert body["planetary_sites_count"] >= 5


def test_compare_endpoint_honors_test_profile_and_manual_weights() -> None:
    """Side-by-side comparison matches search_analogs scores for preset profiles and custom weights."""
    with TestClient(app) as client:
        profile_search = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "mars_jezero_crater",
                "model_type": "ridge",
                "test_profile": "navigation_landing",
                "limit": 1,
            },
        )
        assert profile_search.status_code == 200
        top_match = profile_search.json()["matches"][0]
        h3_id = top_match["earth_cell_h3"]

        comp = client.get(
            f"/api/v1/analogs/{h3_id}/compare/mars_jezero_crater",
            params={"model_type": "ridge", "test_profile": "navigation_landing"},
        )
        assert comp.status_code == 200
        comp_match = comp.json()["match"]
        assert comp_match["s_ind"] == top_match["s_ind"]
        assert comp_match["s_dep"] == top_match["s_dep"]
        assert comp_match["combined_score"] == top_match["combined_score"]

        manual_comp = client.get(
            f"/api/v1/analogs/{h3_id}/compare/mars_jezero_crater",
            params={
                "model_type": "ridge",
                "test_profile": "manual_custom",
                "iv_weights": '{"slope_deg": 1.0}',
                "dv_weights": '{"mean_surface_temp_k": 1.0}',
            },
        )
        assert manual_comp.status_code == 200
        deltas = {d["variable"]: d for d in manual_comp.json()["variable_deltas"]}
        assert deltas["slope_deg"]["weight"] == 1.0
        assert deltas["mean_surface_temp_k"]["weight"] == 1.0

        invalid_comp = client.get(
            f"/api/v1/analogs/{h3_id}/compare/mars_jezero_crater",
            params={"iv_weights": '{"unknown_var": 1.0}'},
        )
        assert invalid_comp.status_code == 422


def test_earth_probe_and_refine_apply_custom_weights_and_reuse_cached_cells(
    tmp_path: Path, monkeypatch
) -> None:
    """Earth probe and cell refinement propagate custom weights and avoid re-fetching cached children."""
    orig_data_dir = settings.data_dir
    shutil.copytree(orig_data_dir, tmp_path / "data")
    monkeypatch.setattr(settings, "data_dir", tmp_path / "data")
    monkeypatch.setattr(state, "duckdb_path", None)

    try:
        with TestClient(app) as client:
            search = client.post(
                "/api/v1/analogs/search",
                json={"site_id": "mars_jezero_crater", "limit": 1},
            )
            assert search.status_code == 200
            sample = search.json()["matches"][0]

            def fake_probe(**kwargs):
                lat = float(kwargs["lat"])
                lon = float(kwargs["lon"])
                res = int(kwargs.get("h3_resolution", sample["h3_resolution"]))
                cell_id = h3.latlng_to_cell(lat, lon, res)
                boundary = [[p[0], p[1]] for p in h3.cell_to_boundary(cell_id)]
                return {
                    "earth_cell_h3": cell_id,
                    "h3_resolution": res,
                    "lat": lat,
                    "lon": lon,
                    "h3_boundary_json": boundary,
                    "source_apis_json": sample["provenance"]["source_apis"],
                    "region_key": sample["region_key"],
                    "country_code": sample["country_code"],
                    "biome_key": sample["biome_key"],
                    "is_benchmark": sample["is_benchmark"],
                    "observation_window": sample["provenance"]["observation_window"],
                    "fetched_at": sample["provenance"]["fetched_at"],
                    "is_live_probed": True,
                    **sample["earth_variables"]["independent"],
                    **sample["earth_variables"]["dependent"],
                    **sample["earth_variables"]["breakage"],
                }

            monkeypatch.setattr("app.main.probe_earth_location", fake_probe)
            probe_res = client.post(
                "/api/v1/earth/probe",
                json={
                    "lat": sample["coordinates"]["lat"],
                    "lon": sample["coordinates"]["lon"],
                    "site_id": "mars_jezero_crater",
                    "model_type": "ridge",
                    "test_profile": "manual_custom",
                    "custom_iv_weights": {"slope_deg": 1.0},
                    "custom_dv_weights": {"mean_surface_temp_k": 1.0},
                },
            )
            assert probe_res.status_code == 200
            probe_deltas = {d["variable"]: d for d in probe_res.json()["variable_deltas"]}
            assert probe_deltas["slope_deg"]["weight"] == 1.0
            assert probe_deltas["mean_surface_temp_k"]["weight"] == 1.0

            # First refine populates all 7 child cells into DuckDB
            first_refine = client.post(
                "/api/v1/analogs/refine",
                json={
                    "earth_cell_h3": sample["earth_cell_h3"],
                    "site_id": "mars_jezero_crater",
                    "model_type": "ridge",
                    "test_profile": "manual_custom",
                    "custom_iv_weights": {"slope_deg": 1.0},
                    "custom_dv_weights": {"mean_surface_temp_k": 1.0},
                },
            )
            assert first_refine.status_code == 200
            assert len(first_refine.json()["matches"]) == 7

            # Second refine on same cell must hit DuckDB cache without calling probe_earth_location
            def fail_if_called(**kwargs):
                raise AssertionError("probe_earth_location should not run when children are cached")

            monkeypatch.setattr("app.main.probe_earth_location", fail_if_called)
            cached_refine = client.post(
                "/api/v1/analogs/refine",
                json={
                    "earth_cell_h3": sample["earth_cell_h3"],
                    "site_id": "mars_jezero_crater",
                    "model_type": "ridge",
                    "test_profile": "manual_custom",
                    "custom_iv_weights": {"slope_deg": 1.0},
                    "custom_dv_weights": {"mean_surface_temp_k": 1.0},
                },
            )
            assert cached_refine.status_code == 200
            assert len(cached_refine.json()["matches"]) == 7
            top_deltas = {
                d["variable"]: d for d in cached_refine.json()["top_comparison"]["variable_deltas"]
            }
            assert top_deltas["slope_deg"]["weight"] == 1.0
            assert top_deltas["mean_surface_temp_k"]["weight"] == 1.0
    finally:
        state.duckdb_path = None
