"""Application configuration and physical variable definitions."""

from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


INDEPENDENT_VARIABLES: tuple[str, ...] = (
    "topographic_roughness",
    "slope_deg",
    "thermal_inertia",
    "surface_albedo",
    "solar_flux_wm2",
    "subsurface_ice_frac",
    "aridity_index",
    "relative_humidity_pct",
    "uv_irradiance_index",
    "vegetation_lai_proxy",
)

DEPENDENT_VARIABLES: tuple[str, ...] = (
    "diurnal_temp_amplitude_k",
    "nocturnal_cooling_k_hr",
    "mean_surface_temp_k",
    "surface_wind_ms",
    "aeolian_dust_flux",
    "ice_sublimation_rate",
)

BREAKAGE_VARIABLES: tuple[str, ...] = (
    "gravity_g",
    "atm_pressure_mbar",
    "radiation_msv_yr",
)

# Physical scaling sigmas for normalized distance computation across planetary & Earth domains
FEATURE_SCALES: dict[str, float] = {
    "topographic_roughness": 0.25,
    "slope_deg": 10.0,
    "thermal_inertia": 220.0,
    "surface_albedo": 0.15,
    "solar_flux_wm2": 350.0,
    "subsurface_ice_frac": 0.30,
    "aridity_index": 0.25,
    "relative_humidity_pct": 28.0,
    "uv_irradiance_index": 4.5,
    "vegetation_lai_proxy": 0.85,
    "diurnal_temp_amplitude_k": 45.0,
    "nocturnal_cooling_k_hr": 5.5,
    "mean_surface_temp_k": 38.0,
    "surface_wind_ms": 5.0,
    "aeolian_dust_flux": 0.25,
    "ice_sublimation_rate": 0.25,
}


class Settings(BaseSettings):
    """Runtime settings for Ckepi API and data store."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Ckepi API"
    app_version: str = "0.1.0"
    data_dir: Path = Path(__file__).resolve().parent / "data"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
    ]
    breakage_alert_threshold: float = 0.60
    default_h3_resolution: int = 3
    # No configured token means administrative refresh is disabled (HTTP 401).
    admin_token: str | None = None
    probe_rate_limit_per_min: int = 30
    max_probed_sites: int = 50
    openrouter_api_key: str | None = None
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "openrouter/free"
    openrouter_fallback_models: list[str] = []
    openrouter_timeout_seconds: float = 35.0
    openrouter_site_url: str = "https://github.com/ckepi"
    openrouter_app_name: str = "Ckepi Planetary Analogs"
    ai_rate_limit_per_min: int = 12
    ai_cache_ttl_hours: int = 168


settings = Settings()
