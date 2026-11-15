"""Unit and API integration tests for OpenRouter AI mission diagnostics & caching."""

from collections.abc import Generator
import json
from pathlib import Path
import duckdb
from fastapi.testclient import TestClient
import httpx
import numpy as np
import pandas as pd
import pytest

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES, settings
from app import main
from app.main import app
from app.models.schemas import (
    Coordinates,
    DataConfidence,
    DataProvenance,
    GeologySummary,
    MultiAgencyCatalogResponse,
    PhysicalVariables,
    PlanetarySite,
)


def _sample_ai_json(locale: str = "es") -> dict[str, object]:
    return {
        "executive_synthesis": (
            f"[{locale}] Celda analoga con 70,7% de similitud combinada (+-6,8% a escala ~59,8 km)."
        ),
        "viability_assessment": (
            "Viabilidad moderada para pruebas de movilidad y calibracion optica; requiere validacion de polvo."
        ),
        "confidence_and_scale_note": (
            "La escala H3 (~59,8 km) promedia heterogeneidades locales; se recomienda subdividir a H3-5."
        ),
        "key_strengths": [
            {
                "title": "Topografia e hiperaridez compatibles",
                "detail": "Rugosidad y sequedad superficial alineadas con el delta lacustre de Jezero.",
                "related_variables": ["topographic_roughness", "aridity_index"],
            }
        ],
        "physical_limitations_and_gaps": [
            {
                "title": "Fronteras planetarias irreproducibles",
                "detail": "La gravedad (0,38 g), presion CO2 (6,5 mbar) y GCR no pueden simularse al aire libre.",
                "related_variables": ["gravity_g", "atm_pressure_mbar", "radiation_msv_yr"],
            }
        ],
        "breakage_mitigation_plan": [
            {
                "variable": "atm_pressure_mbar",
                "earth_gap_impact": "Invalidez de pruebas de paracaidas y enfriamiento convectivo.",
                "recommended_facility_or_protocol": "Camara hipobarica de CO2 a 6-8 mbar.",
            }
        ],
        "field_campaign_considerations": [
            "Ejecutar refino H3 a resolucion 5 para evaluar micro-pendientes reales."
        ],
        "recommended_next_steps": [
            "Subdividir la celda seleccionada en 7 sub-hexagonos H3."
        ],
    }


@pytest.fixture()
def isolated_env(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Generator[Path, None, None]:
    """Build a self-contained Parquet + DuckDB dataset directory in tmp_path."""
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    site = PlanetarySite(
        site_id="mars_jezero_crater",
        body="mars",
        name_key="sites.mars_jezero_crater.name",
        mission_context_key="sites.mars_jezero_crater.context",
        data_sources=["NASA Mars2020 MEDA", "MOLA"],
        coordinates=Coordinates(lat=18.38, lon=77.58),
        variables=PhysicalVariables(
            independent={k: 0.5 for k in INDEPENDENT_VARIABLES},
            dependent={k: 0.5 for k in DEPENDENT_VARIABLES},
            breakage={"gravity_g": 0.378, "atm_pressure_mbar": 6.5, "radiation_msv_yr": 230.0},
        ),
        provenance=DataProvenance(
            source_apis=["NASA Mars2020 MEDA"],
            observation_window="2024",
            fetched_at="2026-01-01T00:00:00Z",
            is_live_probed=False,
        ),
        confidence=DataConfidence(
            level="high",
            score=0.82,
            is_tracked_zone=True,
            nearest_tracked_site_id="mars_jezero_crater",
            distance_to_tracked_km=0.0,
            variable_provenance={"mean_surface_temp_k": "measured"},
            notice_key="confidence.tracked_mars_curated",
        ),
    )
    (data_dir / "planetary_sites.json").write_text(
        json.dumps([site.model_dump()]),
        encoding="utf-8",
    )

    rng = np.random.default_rng(7)
    n_rows = 24
    ts_rows = []
    for idx in range(n_rows):
        row: dict[str, object] = {"site_id": "mars_jezero_crater", "sol": idx + 1}
        for col in INDEPENDENT_VARIABLES:
            row[col] = float(0.2 + 0.6 * rng.random())
        for col in DEPENDENT_VARIABLES:
            row[col] = float(0.3 + 0.5 * rng.random())
        ts_rows.append(row)
    df_ts = pd.DataFrame(ts_rows)
    ts_path = data_dir / "planetary_timeseries.parquet"
    df_ts.to_parquet(ts_path, index=False)

    earth_row: dict[str, object] = {
        "earth_cell_h3": "837b59fffffffff",
        "h3_resolution": 3,
        "lat": -24.1,
        "lon": -69.9,
        "h3_boundary_json": json.dumps([[0.0, 0.0], [0.0, 1.0], [1.0, 1.0]]),
        "source_apis_json": json.dumps(["NASA POWER", "ESA Copernicus"]),
        "region_key": "regions.global_h3_cell",
        "country_code": "CL",
        "biome_key": "biomes.hyperarid_desert",
        "is_benchmark": False,
        "observation_window": "2024",
        "fetched_at": "2026-01-01T00:00:00Z",
        "is_live_probed": False,
        "gravity_g": 1.0,
        "atm_pressure_mbar": 1013.25,
        "radiation_msv_yr": 4.2,
    }
    for col in INDEPENDENT_VARIABLES:
        earth_row[col] = 0.52
    for col in DEPENDENT_VARIABLES:
        earth_row[col] = 0.48
    df_earth = pd.DataFrame([earth_row])
    earth_path = data_dir / "earth_h3_grid.parquet"
    df_earth.to_parquet(earth_path, index=False)

    duckdb_path = data_dir / "ckepi.duckdb"
    conn = duckdb.connect(str(duckdb_path))
    try:
        conn.execute(
            "CREATE OR REPLACE TABLE earth_h3_grid AS SELECT * FROM read_parquet(?)",
            [str(earth_path)],
        )
        conn.execute(
            "CREATE OR REPLACE TABLE planetary_timeseries AS SELECT * FROM read_parquet(?)",
            [str(ts_path)],
        )
    finally:
        conn.close()

    monkeypatch.setattr(settings, "data_dir", data_dir)
    monkeypatch.setattr(settings, "openrouter_api_key", None)
    monkeypatch.setattr(settings, "openrouter_model", "openrouter/free")
    monkeypatch.setattr(settings, "ai_rate_limit_per_min", 12)

    main.state.sites_by_id.clear()
    main.state.duckdb_path = None
    main.state.decomposition_cache.clear()
    main.state.ai_cache.clear()
    main.state.ai_inflight.clear()
    main.state.ai_timestamps.clear()

    yield data_dir

    main.state.sites_by_id.clear()
    main.state.duckdb_path = None
    main.state.decomposition_cache.clear()
    main.state.ai_cache.clear()
    main.state.ai_inflight.clear()
    main.state.ai_timestamps.clear()


def test_ai_status_and_unconfigured_behavior(isolated_env: Path) -> None:
    with TestClient(app) as client:
        status_off = client.get("/api/v1/ai/status")
        assert status_off.status_code == 200
        assert status_off.json()["enabled"] is False

        # cache_only returns 204 cleanly even when key is not set
        cache_miss = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
                "cache_only": True,
            },
        )
        assert cache_miss.status_code == 204

        # Live generation returns structured 503 error key
        unconfigured = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
            },
        )
        assert unconfigured.status_code == 503
        assert unconfigured.json()["detail"]["error_key"] == "errors.ai_not_configured"


def test_openrouter_grounded_fallback_and_multilevel_cache(
    isolated_env: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", "sk-or-test-key-never-logged")
    captured_requests: list[dict[str, object]] = []
    call_counter = {"count": 0}

    def _handler(request: httpx.Request) -> httpx.Response:
        assert request.headers.get("Authorization") == "Bearer sk-or-test-key-never-logged"
        body = json.loads(request.content.decode("utf-8"))
        captured_requests.append(body)
        call_counter["count"] += 1

        # First call rejects json_schema to verify graceful fallback to json_object
        fmt = body.get("response_format", {})
        if isinstance(fmt, dict) and fmt.get("type") == "json_schema":
            return httpx.Response(400, json={"error": "json_schema unsupported on provider"})

        wrapped_content = "```json\n" + json.dumps(_sample_ai_json("es")) + "\n```"
        return httpx.Response(
            200,
            json={
                "model": "meta-llama/llama-3.3-70b-instruct:free",
                "choices": [{"message": {"content": wrapped_content}}],
            },
        )

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(_handler))

    with TestClient(app) as client:
        main.state.async_http = mock_client

        status_on = client.get("/api/v1/ai/status")
        assert status_on.status_code == 200
        assert status_on.json()["enabled"] is True
        assert "sk-or-test" not in status_on.text

        catalog = MultiAgencyCatalogResponse(
            earth_cell_h3="837b59fffffffff",
            lat=-24.1,
            lon=-69.9,
            queried_at="2026-01-01T00:00:00Z",
            products=[],
            geology=GeologySummary(
                unit_name="Formacion Atacama",
                lithology="Evaporite / Basalt",
                age="Miocene",
                source="Macrostrat API",
            ),
        )

        # 1. Live generation (triggers json_schema 400 -> json_object 200)
        res1 = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
                "test_profile": "rover_mobility",
                "reading_mode": "mission",
                "locale": "es",
                "catalog_context": catalog.model_dump(),
            },
        )
        assert res1.status_code == 200
        data1 = res1.json()
        assert data1["cached"] is False
        assert data1["model_used"] == "meta-llama/llama-3.3-70b-instruct:free"
        assert data1["provider"] == "openrouter"
        assert call_counter["count"] == 2  # 1 failed json_schema + 1 fallback json_object

        # Verify deterministic grounding data was passed in user prompt
        user_msg = str(captured_requests[0]["messages"][1]["content"])  # type: ignore[index]
        assert "score_uncertainty" in user_msg
        assert "effective_scale_km" in user_msg
        assert "Formacion Atacama" in user_msg
        assert "gravity_g" in user_msg

        # 2. Second request hits L1 LRU cache (no extra OpenRouter call)
        res2 = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
                "test_profile": "rover_mobility",
                "reading_mode": "mission",
                "locale": "es",
            },
        )
        assert res2.status_code == 200
        assert res2.json()["cached"] is True
        assert call_counter["count"] == 2

        # 3. Clear L1 LRU and verify L2 DuckDB cache hit even with cache_only=True
        main.state.ai_cache.clear()
        res3 = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
                "test_profile": "rover_mobility",
                "reading_mode": "mission",
                "locale": "es",
                "cache_only": True,
            },
        )
        assert res3.status_code == 200
        assert res3.json()["cached"] is True
        assert call_counter["count"] == 2

        # 4. force_refresh bypasses cache and calls OpenRouter again
        res4 = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
                "test_profile": "rover_mobility",
                "reading_mode": "mission",
                "locale": "es",
                "force_refresh": True,
            },
        )
        assert res4.status_code == 200
        assert res4.json()["cached"] is False
        assert call_counter["count"] == 4


def test_ai_invalid_response_and_rate_limit(
    isolated_env: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "openrouter_api_key", "sk-or-test-key")
    monkeypatch.setattr(settings, "ai_rate_limit_per_min", 1)

    def _bad_handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "model": "openrouter/free",
                "choices": [{"message": {"content": "not valid json output"}}],
            },
        )

    mock_client = httpx.AsyncClient(transport=httpx.MockTransport(_bad_handler))

    with TestClient(app) as client:
        main.state.async_http = mock_client

        bad_res = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
            },
        )
        assert bad_res.status_code == 502
        assert bad_res.json()["detail"]["error_key"] == "errors.ai_invalid_response"

        limited_res = client.post(
            "/api/v1/mission/ai-analysis",
            json={
                "site_id": "mars_jezero_crater",
                "earth_cell_h3": "837b59fffffffff",
            },
        )
        assert limited_res.status_code == 429
        assert limited_res.json()["detail"]["error_key"] == "errors.ai_rate_limited"
