"""Keep API/ETL tests away from the team's working datasets."""

from pathlib import Path
import shutil

import pytest

from app.config import settings
from app import main


@pytest.fixture(autouse=True)
def isolated_data_store(tmp_path: Path, monkeypatch):
    source = settings.data_dir
    target = tmp_path / "data"
    target.mkdir()
    # Only the materialized store is needed; never copy credentials or huge raw rasters.
    for name in ("ckepi.duckdb", "planetary_sites.json", "planetary_timeseries.parquet", "earth_h3_grid.parquet"):
        if (source / name).exists():
            shutil.copy2(source / name, target / name)
    monkeypatch.setattr(settings, "data_dir", target)
    monkeypatch.setattr(main, "state", main.AppState())
    # API contracts do not need startup prewarming. Real DEM tests exercise the
    # statistical engine directly; avoid recomputing six bootstraps per API test.
    monkeypatch.setattr(main, "warm_real_comparisons", lambda *_: None)
    yield
