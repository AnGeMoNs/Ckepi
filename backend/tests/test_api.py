"""End-to-end FastAPI integration tests against real NASA & Open-Meteo APIs."""

from fastapi.testclient import TestClient

from app.main import app


def test_api_real_data_and_live_probe_flow() -> None:
    """Verify sites, real decomposition, analog search, live coordinate probe, and i18n errors."""
    with TestClient(app) as client:
        health = client.get("/api/v1/health")
        assert health.status_code == 200

        sites_res = client.get("/api/v1/planetary-sites")
        assert sites_res.status_code == 200
        sites = sites_res.json()
        assert len(sites) == 5
        assert sites[0]["provenance"]["source_apis"]

        decomp_res = client.post(
            "/api/v1/decompose",
            json={"site_id": "mars_gale_crater", "model_type": "ridge"},
        )
        assert decomp_res.status_code == 200
        decomp_data = decomp_res.json()
        assert decomp_data["sample_count"] >= 100
        assert "NASA Mars MSL Curiosity REMS API" in decomp_data["provenance"]["source_apis"][0]

        search_res = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "mars_jezero_crater",
                "model_type": "ridge",
                "min_s_ind": 0.2,
                "min_s_dep": 0.2,
                "exclude_benchmarks": False,
                "limit": 500,
            },
        )
        assert search_res.status_code == 200
        search_data = search_res.json()
        assert search_data["total_evaluated"] >= 200
        assert search_data["returned_count"] > 0

        # Test arbitrary Moon coordinate probe (Tycho Crater) -> global Earth match
        moon_probe = client.post(
            "/api/v1/planetary/probe",
            json={
                "body": "moon",
                "lat": -43.3,
                "lon": -11.2,
                "model_type": "ridge",
                "limit": 100,
            },
        )
        assert moon_probe.status_code == 200
        moon_data = moon_probe.json()
        assert moon_data["site"]["body"] == "moon"
        assert moon_data["analogs"]["total_evaluated"] >= 200
        assert moon_data["top_comparison"] is not None

        # Test arbitrary Mars coordinate probe (Gusev Crater) -> global Earth match
        mars_probe = client.post(
            "/api/v1/planetary/probe",
            json={
                "body": "mars",
                "lat": -14.6,
                "lon": 175.4,
                "model_type": "ridge",
                "limit": 100,
            },
        )
        assert mars_probe.status_code == 200
        assert mars_probe.json()["site"]["body"] == "mars"

        # Test live coordinate probing (Mojave / Death Valley coordinates)
        probe_res = client.post(
            "/api/v1/earth/probe",
            json={
                "lat": 36.24,
                "lon": -116.82,
                "site_id": "mars_jezero_crater",
                "model_type": "ridge",
            },
        )
        assert probe_res.status_code == 200
        probe_data = probe_res.json()
        assert probe_data["match"]["provenance"]["is_live_probed"] is True
        assert "NASA POWER" in probe_data["match"]["provenance"]["source_apis"]

        # Test multi-agency catalog discovery (NASA CMR, ESA Copernicus, CSA, JAXA)
        first_cell = search_data["matches"][0]["earth_cell_h3"]
        datasets_res = client.get(f"/api/v1/earth/{first_cell}/datasets")
        assert datasets_res.status_code == 200
        datasets_data = datasets_res.json()
        assert len(datasets_data["products"]) >= 4
        agencies = {p["agency"] for p in datasets_data["products"]}
        assert "NASA" in agencies and "ESA" in agencies

        err_res = client.post(
            "/api/v1/decompose",
            json={"site_id": "nonexistent_site", "model_type": "ridge"},
        )
        assert err_res.status_code == 404
        assert err_res.json()["detail"]["error_key"] == "errors.site_not_found"
