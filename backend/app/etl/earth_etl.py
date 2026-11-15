"""Terrestrial H3 grid ETL hydrated from real NASA POWER, Copernicus DEM, and ERA5 APIs."""

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
import httpx
import pandas as pd

from app.etl.earth_api import probe_earth_location
from app.etl.http_utils import create_http_client


@dataclass(frozen=True)
class EarthAnchor:
    """Geographic anchor for terrestrial analog calibration and discovery."""

    region_key: str
    country_code: str
    biome_key: str
    lat: float
    lon: float
    is_benchmark: bool


EARTH_ANCHORS: tuple[EarthAnchor, ...] = (
    # Calibration Benchmarks
    EarthAnchor("regions.atacama_yungay", "CL", "biomes.hyperarid_desert", -24.10, -69.90, True),
    EarthAnchor("regions.mcmurdo_dry_valleys", "AQ", "biomes.polar_cold_desert", -77.47, 162.52, True),
    EarthAnchor("regions.haughton_crater", "CA", "biomes.arctic_impact_crater", 75.37, -89.68, True),
    EarthAnchor("regions.krafla_iceland", "IS", "biomes.volcanic_basalt", 65.71, -16.75, True),
    EarthAnchor("regions.mauna_kea_tephra", "US", "biomes.volcanic_basalt", 19.82, -155.47, True),
    EarthAnchor("regions.mojave_death_valley", "US", "biomes.hyperarid_desert", 36.24, -116.82, True),
    EarthAnchor("regions.rio_tinto_basin", "ES", "biomes.acidic_evaporite", 37.70, -6.55, True),
    # Discovery Candidates
    EarthAnchor("regions.qaidam_dalangtan", "CN", "biomes.evaporite_playa", 38.52, 91.45, False),
    EarthAnchor("regions.puna_ojos_salado", "CL", "biomes.high_altitude_volcanic", -27.11, -68.54, False),
    EarthAnchor("regions.salar_uyuni_margin", "BO", "biomes.evaporite_playa", -20.13, -67.49, False),
    EarthAnchor("regions.harrat_khaybar_lava", "SA", "biomes.lava_tube_basalt", 25.68, 39.92, False),
    EarthAnchor("regions.erta_ale_shield", "ET", "biomes.lava_tube_basalt", 13.60, 40.67, False),
    EarthAnchor("regions.svalbard_adventdalen", "NO", "biomes.polar_permafrost", 78.20, 15.95, False),
    EarthAnchor("regions.lut_yardangs", "IR", "biomes.hyperarid_desert", 30.55, 58.95, False),
    EarthAnchor("regions.tanezrouft_reg", "DZ", "biomes.hyperarid_desert", 24.80, 1.25, False),
    EarthAnchor("regions.namib_gravel_plains", "NA", "biomes.hyperarid_desert", -24.75, 15.28, False),
    EarthAnchor("regions.taklamakan_margin", "CN", "biomes.aeolian_basin", 39.05, 82.60, False),
    EarthAnchor("regions.kangerlussuaq_periglacial", "GL", "biomes.polar_permafrost", 67.01, -50.69, False),
    EarthAnchor("regions.torngat_polar_cirques", "CA", "biomes.polar_permafrost", 59.15, -63.85, False),
    EarthAnchor("regions.tolbachik_tephra", "RU", "biomes.lava_tube_basalt", 55.83, 160.33, False),
    EarthAnchor("regions.allan_hills_icefield", "AQ", "biomes.polar_cold_desert", -76.72, 159.35, False),
    EarthAnchor("regions.chott_el_djerid", "TN", "biomes.evaporite_playa", 33.70, 8.43, False),
    # Negative Controls (Humid / Vegetated)
    EarthAnchor("regions.amazon_central_basin", "BR", "biomes.tropical_rainforest", -3.12, -60.02, False),
    EarthAnchor("regions.pantanal_wetland", "BR", "biomes.humid_wetland", -17.75, -57.35, False),
)


def _hydrate_anchor(anchor: EarthAnchor, h3_resolution: int, client: httpx.Client) -> dict[str, object]:
    """Fetch real NASA POWER + Open-Meteo metrics for one anchor coordinate."""
    return probe_earth_location(
        lat=anchor.lat,
        lon=anchor.lon,
        region_key=anchor.region_key,
        country_code=anchor.country_code,
        biome_key=anchor.biome_key,
        is_benchmark=anchor.is_benchmark,
        h3_resolution=h3_resolution,
        is_live_probed=False,
        client=client,
    )


def build_real_earth_h3_grid(h3_resolution: int = 3) -> pd.DataFrame:
    """Hydrate all terrestrial H3 anchor cells concurrently from live open APIs."""
    records: list[dict[str, object]] = []
    with create_http_client(timeout=30.0) as client:
        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = {
                pool.submit(_hydrate_anchor, anchor, h3_resolution, client): anchor
                for anchor in EARTH_ANCHORS
            }
            for future in as_completed(futures):
                anchor = futures[future]
                try:
                    records.append(future.result())
                except Exception as exc:
                    raise RuntimeError(
                        f"Failed to hydrate Earth anchor {anchor.region_key}: {exc}"
                    ) from exc

    df = pd.DataFrame(records)
    return df.drop_duplicates(subset=["earth_cell_h3"]).reset_index(drop=True)
