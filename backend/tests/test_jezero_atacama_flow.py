"""Offline end-to-end integration test for the Jezero <-> Atacama cached DuckDB flow."""

from fastapi.testclient import TestClient

from app.main import app


def test_offline_jezero_atacama_comparison_flow() -> None:
    """Verify health, sites, Jezero decomposition, analog search, and Atacama comparison offline."""
    with TestClient(app) as client:
        health = client.get("/api/v1/health")
        assert health.status_code == 200
        assert health.json()["status"] == "ok"

        sites_res = client.get("/api/v1/planetary-sites")
        assert sites_res.status_code == 200
        sites = sites_res.json()
        assert any(s["site_id"] == "mars_jezero_crater" for s in sites)

        decomp_res = client.post(
            "/api/v1/decompose",
            json={"site_id": "mars_jezero_crater", "model_type": "ridge"},
        )
        assert decomp_res.status_code == 200
        decomp = decomp_res.json()
        assert len(decomp["breakage_profile"]) > 0
        assert all(b["is_broken"] for b in decomp["breakage_profile"])

        search_res = client.post(
            "/api/v1/analogs/search",
            json={
                "site_id": "mars_jezero_crater",
                "model_type": "ridge",
                "min_s_ind": 0.2,
                "min_s_dep": 0.0,
                "limit": 2000,
            },
        )
        assert search_res.status_code == 200
        matches = search_res.json()["matches"]
        assert len(matches) > 0

        # Atacama / Yungay cell at H3 res 3 (the global grid moved from res 2 to res 3).
        # With ~10,700 cells it need not be in the top results, so compare it directly.
        atacama_h3 = "83b220fffffffff"

        comp_res = client.get(
            f"/api/v1/analogs/{atacama_h3}/compare/mars_jezero_crater"
        )
        assert comp_res.status_code == 200
        comp = comp_res.json()
        assert comp["site"]["site_id"] == "mars_jezero_crater"
        assert any(d["variable"] == "slope_deg" for d in comp["variable_deltas"])
        assert any(d["is_breakage"] for d in comp["variable_deltas"])
