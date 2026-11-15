"""The Jezero <-> Antofagasta terrain comparison must use real DEM windows and label any surrogate."""

import json
from pathlib import Path
from types import SimpleNamespace

import numpy as np

from app.engine.terrain_statistics import _load_real_windows, compute_terrain_distribution_comparison
from app.models.schemas import PlanetarySite

DATA = Path(__file__).resolve().parents[1] / "app" / "data"


def _jezero() -> PlanetarySite:
    sites = json.loads((DATA / "planetary_sites.json").read_text(encoding="utf-8"))
    return PlanetarySite(**next(s for s in sites if s["site_id"] == "mars_jezero_crater"))


def _match(h3: str, lat: float, lon: float) -> SimpleNamespace:
    return SimpleNamespace(
        earth_cell_h3=h3,
        coordinates=SimpleNamespace(lat=lat, lon=lon),
        earth_variables=SimpleNamespace(independent={}),
    )


def test_real_windows_have_sources_and_plausible_elevations() -> None:
    arrays, meta = _load_real_windows()
    assert {"mars_jezero_crater", "control_yungay"} <= set(arrays)
    for key, dem in arrays.items():
        assert dem.shape == (200, 200)
        assert np.isfinite(dem).all()
        assert meta[key]["source"]["url"].startswith("https://")
        assert len(meta[key]["source"]["sha256"]) == 64
    # Jezero floor sits ~2.6 km below the Mars datum; Yungay ~1 km above sea level.
    assert -3000 < arrays["mars_jezero_crater"].mean() < -2000
    assert 800 < arrays["control_yungay"].mean() < 1500


def test_comparison_uses_real_dems_and_is_deterministic() -> None:
    first = compute_terrain_distribution_comparison(_jezero(), _match("83b220fffffffff", -24.14, -69.58))
    second = compute_terrain_distribution_comparison(_jezero(), _match("83b220fffffffff", -24.14, -69.58))
    assert "CTX DEM" in first.planetary_dem_source
    assert "Copernicus" in first.earth_dem_source
    assert "real DEM" in first.control_benchmark_name
    assert "SYNTHETIC" not in first.planetary_dem_source + first.earth_dem_source
    assert first.slope_distribution == second.slope_distribution


def test_cells_without_real_dem_are_labelled_synthetic() -> None:
    result = compute_terrain_distribution_comparison(_jezero(), _match("82b227fffffffff", -20.0, -70.0))
    assert result.earth_dem_source.startswith("SYNTHETIC")
    assert len(result.earth_profile_elev_m) == len(result.planetary_profile_elev_m)
