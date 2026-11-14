"""Expert rule engine translating analog scores & breakage into mission test diagnostics."""

from app.models.schemas import (
    BreakageBoundary,
    EngineeringRecommendations,
    PlanetarySite,
    ViabilityTier,
)


def evaluate_mission_recommendations(
    site: PlanetarySite,
    s_ind: float,
    s_dep: float,
    iv_sim: dict[str, float],
    dv_sim: dict[str, float],
    breakage_alerts: list[BreakageBoundary],
    earth_aridity: float,
    earth_iv: dict[str, float] | None = None,
    earth_dv: dict[str, float] | None = None,
) -> EngineeringRecommendations:
    """Translate decoupled similarity & physical breakage into valid/invalid test keys."""
    valid_tests: list[str] = []
    invalid_tests: list[str] = []
    e_iv = earth_iv or {}
    e_dv = earth_dv or {}
    earth_lai = e_iv.get("vegetation_lai_proxy", 0.0)

    if earth_aridity < 0.45 or earth_lai > 1.2:
        valid_tests.append("tests.valid.none_humid_mismatch")
        tier: ViabilityTier = "partial"
    else:
        if iv_sim.get("topographic_roughness", 0.0) >= 0.72 and iv_sim.get("slope_deg", 0.0) >= 0.65:
            valid_tests.append("tests.valid.lidar_hazard_avoidance")

        if iv_sim.get("topographic_roughness", 0.0) >= 0.70 and iv_sim.get("aridity_index", 0.0) >= 0.75:
            valid_tests.append("tests.valid.rover_wheel_mobility")

        if (
            dv_sim.get("diurnal_temp_amplitude_k", 0.0) >= 0.55
            and dv_sim.get("nocturnal_cooling_k_hr", 0.0) >= 0.50
        ):
            valid_tests.append("tests.valid.battery_thermal_cycling")

        if (
            e_dv.get("mean_surface_temp_k", 300.0) <= 258.0
            and dv_sim.get("mean_surface_temp_k", 0.0) >= 0.65
        ):
            valid_tests.append("tests.valid.cryogenic_seal_lubrication")

        if site.body == "mars" and dv_sim.get("aeolian_dust_flux", 0.0) >= 0.68:
            valid_tests.append("tests.valid.optical_dust_abrasion")

        if site.body == "mars" and dv_sim.get("surface_wind_ms", 0.0) >= 0.68:
            valid_tests.append("tests.valid.drone_rotor_stability")

        if (
            e_iv.get("uv_irradiance_index", 0.0) >= 6.5
            and iv_sim.get("uv_irradiance_index", 0.0) >= 0.65
        ):
            valid_tests.append("tests.valid.uv_polymer_degradation")

        if (
            e_iv.get("relative_humidity_pct", 100.0) <= 35.0
            and iv_sim.get("relative_humidity_pct", 0.0) >= 0.55
        ):
            valid_tests.append("tests.valid.spectrometer_low_humidity")

        if (
            site.variables.independent.get("subsurface_ice_frac", 0.0) >= 0.15
            and iv_sim.get("subsurface_ice_frac", 0.0) >= 0.65
        ):
            valid_tests.append("tests.valid.subsurface_ice_drilling")

        if (
            site.variables.independent.get("surface_albedo", 1.0) <= 0.15
            and iv_sim.get("surface_albedo", 0.0) >= 0.75
            and iv_sim.get("topographic_roughness", 0.0) >= 0.70
        ):
            valid_tests.append("tests.valid.lava_tube_habitat_recon")

        if (
            site.variables.independent.get("solar_flux_wm2", 500.0) <= 260.0
            and iv_sim.get("solar_flux_wm2", 0.0) >= 0.75
        ):
            valid_tests.append("tests.valid.solar_low_angle_power")

        if not valid_tests:
            valid_tests.append("tests.valid.baseline_instrument_calibration")

        combined = 0.60 * s_ind + 0.40 * s_dep
        if combined >= 0.74:
            tier = "high"
        elif combined >= 0.56:
            tier = "moderate"
        else:
            tier = "partial"

    broken_vars = {b.variable for b in breakage_alerts if b.is_broken}
    if "atm_pressure_mbar" in broken_vars:
        invalid_tests.append("tests.invalid.parachute_aerodynamics")
        invalid_tests.append("tests.invalid.convective_thermal_cooling")
    if "gravity_g" in broken_vars:
        invalid_tests.append("tests.invalid.reduced_gravity_kinematics")
    if "radiation_msv_yr" in broken_vars:
        invalid_tests.append("tests.invalid.unshielded_gcr_electronics")
    if site.body == "moon":
        invalid_tests.append("tests.invalid.electrostatic_vacuum_dust")

    return EngineeringRecommendations(
        viability_tier=tier,
        valid_tests=valid_tests,
        invalid_tests=invalid_tests,
    )


TEST_PROFILE_WEIGHTS: dict[str, dict[str, float]] = {
    "navigation_landing": {
        "topographic_roughness": 0.32,
        "slope_deg": 0.30,
        "surface_albedo": 0.16,
        "aridity_index": 0.12,
        "vegetation_lai_proxy": 0.10,
    },
    "rover_mobility": {
        "topographic_roughness": 0.26,
        "slope_deg": 0.22,
        "aridity_index": 0.22,
        "vegetation_lai_proxy": 0.18,
        "thermal_inertia": 0.12,
    },
    "isru_ice_drilling": {
        "subsurface_ice_frac": 0.42,
        "thermal_inertia": 0.20,
        "solar_flux_wm2": 0.14,
        "relative_humidity_pct": 0.12,
        "aridity_index": 0.12,
    },
    "lava_tube_habitat": {
        "surface_albedo": 0.34,
        "topographic_roughness": 0.28,
        "slope_deg": 0.18,
        "thermal_inertia": 0.12,
        "vegetation_lai_proxy": 0.08,
    },
    "solar_power_thermal": {
        "solar_flux_wm2": 0.34,
        "uv_irradiance_index": 0.24,
        "thermal_inertia": 0.18,
        "surface_albedo": 0.14,
        "relative_humidity_pct": 0.10,
    },
}


def resolve_profile_weights(
    test_profile: str,
    custom_weights: dict[str, float] | None,
) -> dict[str, float] | None:
    """Return user custom weights if provided, otherwise preset Artemis/Mars test profile weights."""
    if custom_weights:
        return custom_weights
    return TEST_PROFILE_WEIGHTS.get(test_profile)

