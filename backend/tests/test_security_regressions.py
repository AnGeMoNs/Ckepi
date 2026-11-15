"""Security regressions without external requests or shared database writes."""

from concurrent.futures import ThreadPoolExecutor
from types import SimpleNamespace

import duckdb
from fastapi import HTTPException
from fastapi.testclient import TestClient
import h3
import pandas as pd
import pytest
from starlette.requests import Request

from app import main
from app.config import settings
from app.etl.seed_datasets import upsert_earth_cell


@pytest.mark.parametrize("configured,supplied,allowed", [
    (None, None, False), (None, "guess", False),
    ("test-only-token", None, False), ("test-only-token", "wrong", False),
    ("test-only-token", "test-only-token", True),
])
def test_refresh_authorization(monkeypatch, configured, supplied, allowed):
    monkeypatch.setattr(settings, "admin_token", configured)
    calls = []
    monkeypatch.setattr(main, "ensure_datasets_built", lambda **kw: calls.append(kw))
    monkeypatch.setattr(main, "load_cached_planetary_sites", lambda: [])
    # No lifespan: this test must not initialize datasets or use the network.
    client = TestClient(main.app)
    headers = {"X-Admin-Token": supplied} if supplied else {}
    result = client.post("/api/v1/datasets/refresh", headers=headers)
    assert result.status_code == (200 if allowed else 401)
    assert len(calls) == int(allowed)


def test_rate_limit_is_atomic(monkeypatch):
    monkeypatch.setattr(settings, "probe_rate_limit_per_min", 5)
    request = Request({"type": "http", "client": ("test-client", 123)})
    def attempt(_):
        try:
            main._enforce_probe_rate_limit(request)
            return 200
        except HTTPException as exc:
            assert exc.headers == {"Retry-After": "60"}
            return exc.status_code
    with ThreadPoolExecutor(max_workers=12) as pool:
        codes = list(pool.map(attempt, range(40)))
    assert codes.count(200) == 5
    assert codes.count(429) == 35


def test_catalog_obeys_probe_limit(monkeypatch):
    monkeypatch.setattr(settings, "probe_rate_limit_per_min", 0)
    result = TestClient(main.app).get("/api/v1/earth/837b59fffffffff/datasets")
    assert result.status_code == 429


@pytest.mark.parametrize("resolution", [5, 6, 15])
def test_refine_rejects_terminal_resolution_before_io(resolution):
    result = TestClient(main.app).post("/api/v1/analogs/refine", json={
        "earth_cell_h3": h3.latlng_to_cell(-24, -69, resolution),
        "site_id": "not-loaded",
    })
    assert result.status_code == 400


def test_failed_upsert_preserves_existing_row(tmp_path):
    path = tmp_path / "rollback.duckdb"
    with duckdb.connect(str(path)) as conn:
        conn.execute("CREATE TABLE earth_h3_grid (earth_cell_h3 VARCHAR, value INTEGER)")
        conn.execute("INSERT INTO earth_h3_grid VALUES ('test-cell', 7)")
    with pytest.raises(duckdb.Error):
        upsert_earth_cell(path, {
            "earth_cell_h3": "test-cell", "h3_boundary_json": [], "source_apis_json": [],
        })
    with duckdb.connect(str(path), read_only=True) as conn:
        assert conn.execute("SELECT * FROM earth_h3_grid").fetchall() == [("test-cell", 7)]


def test_failed_planetary_write_preserves_data_and_catalog(tmp_path, monkeypatch):
    path = tmp_path / "planetary-rollback.duckdb"
    with duckdb.connect(str(path)) as conn:
        conn.execute("CREATE TABLE planetary_timeseries (site_id VARCHAR, value INTEGER)")
        conn.execute("INSERT INTO planetary_timeseries VALUES ('probe_test', 7)")
    monkeypatch.setattr(main, "_get_duckdb_path", lambda: path)
    monkeypatch.setattr(main, "probe_planetary_coordinate", lambda **kw: (
        SimpleNamespace(site_id="probe_test"),
        pd.DataFrame({"site_id": ["probe_test"], "unknown_column": [1]}),
    ))
    client = TestClient(main.app, raise_server_exceptions=False)
    response = client.post("/api/v1/planetary/probe", json={
        "body": "moon", "lat": 0, "lon": 0,
    })
    assert response.status_code == 500
    assert "probe_test" not in main.state.sites_by_id
    with duckdb.connect(str(path), read_only=True) as conn:
        assert conn.execute("SELECT * FROM planetary_timeseries").fetchall() == [("probe_test", 7)]
