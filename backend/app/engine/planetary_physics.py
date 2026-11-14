"""Physical equations for planetary hypsometry, Hertz-Knudsen ice sublimation, PARMA cosmic radiation, and IAU nomenclature."""

from __future__ import annotations

from functools import lru_cache
import math
from pathlib import Path
import httpx
import numpy as np
from PIL import Image

from app.models.schemas import PlanetaryBody, PlanetaryFeatureInfo

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

# Physical constants
KB_BOLTZMANN = 1.380649e-23          # J / K
M_H2O_KG = 2.9915e-26                # kg per H2O molecule (18.01528 g/mol)
R_GAS_UNIVERSAL = 8.314462           # J / (mol K)
M_CO2_KG_MOL = 0.04334               # Mean Martian atmospheric molar mass (kg/mol)
G_MARS_MS2 = 3.72076                 # Martian surface gravity (m/s^2)
G_MOON_MS2 = 1.625                   # Lunar surface gravity (m/s^2)

USGS_WFS_BASE_URL = "https://astrocloud.wr.usgs.gov/dataset/data/nomenclature"


# Curated IAU Planetary Gazetteer (official IAU feature names, coordinates, radii, types, and elevations)
IAU_GAZETTEER_FEATURES: dict[PlanetaryBody, tuple[dict[str, object], ...]] = {
    "mars": (
        {"name": "Olympus Mons", "ftype": "Mons (Shield Volcano)", "lat": 18.65, "lon": -133.80, "diam_km": 610.0, "elev_m": 21229.0},
        {"name": "Ascraeus Mons", "ftype": "Mons (Shield Volcano)", "lat": 11.92, "lon": -104.08, "diam_km": 456.0, "elev_m": 18209.0},
        {"name": "Pavonis Mons", "ftype": "Mons (Shield Volcano)", "lat": 1.48, "lon": -112.96, "diam_km": 375.0, "elev_m": 14058.0},
        {"name": "Arsia Mons", "ftype": "Mons (Shield Volcano)", "lat": -8.26, "lon": -120.09, "diam_km": 430.0, "elev_m": 17761.0},
        {"name": "Elysium Mons", "ftype": "Mons (Volcanic Rise)", "lat": 25.02, "lon": 147.21, "diam_km": 410.0, "elev_m": 13862.0},
        {"name": "Alba Mons", "ftype": "Mons (Volcanic Caldera)", "lat": 40.80, "lon": -110.50, "diam_km": 1015.0, "elev_m": 6800.0},
        {"name": "Valles Marineris (Coprates Chasma)", "ftype": "Chasma (Tectonic Canyon)", "lat": -13.38, "lon": -60.75, "diam_km": 966.0, "elev_m": -4850.0},
        {"name": "Valles Marineris (Candor Chasma)", "ftype": "Chasma (Sulfate Basin)", "lat": -6.53, "lon": -70.78, "diam_km": 810.0, "elev_m": -3900.0},
        {"name": "Hellas Planitia", "ftype": "Planitia (Impact Basin)", "lat": -42.40, "lon": 70.50, "diam_km": 2300.0, "elev_m": -7152.0},
        {"name": "Argyre Planitia", "ftype": "Planitia (Impact Basin)", "lat": -49.70, "lon": -43.40, "diam_km": 892.0, "elev_m": -5200.0},
        {"name": "Isidis Planitia", "ftype": "Planitia (Impact Basin)", "lat": 12.90, "lon": 87.00, "diam_km": 1224.0, "elev_m": -3800.0},
        {"name": "Jezero Crater", "ftype": "Crater (Paleolake Delta)", "lat": 18.38, "lon": 77.58, "diam_km": 47.5, "elev_m": -2560.0},
        {"name": "Gale Crater (Aeolis Mons)", "ftype": "Crater (Layered Mound)", "lat": -5.40, "lon": 137.80, "diam_km": 154.0, "elev_m": -4501.0},
        {"name": "Gusev Crater", "ftype": "Crater (Fluvial Basin)", "lat": -14.59, "lon": 175.47, "diam_km": 158.0, "elev_m": -1900.0},
        {"name": "Arcadia Planitia", "ftype": "Planitia (Ice-Rich Plains)", "lat": 46.70, "lon": -172.00, "diam_km": 1872.0, "elev_m": -3900.0},
        {"name": "Utopia Planitia", "ftype": "Planitia (Scalloped Ice Basin)", "lat": 46.70, "lon": 117.50, "diam_km": 3560.0, "elev_m": -4380.0},
        {"name": "Acidalia Planitia", "ftype": "Planitia (Northern Lowlands)", "lat": 49.80, "lon": -20.70, "diam_km": 3360.0, "elev_m": -4600.0},
        {"name": "Chryse Planitia", "ftype": "Planitia (Outflow Channel Plain)", "lat": 28.40, "lon": -40.30, "diam_km": 1540.0, "elev_m": -3750.0},
        {"name": "Amazonis Planitia", "ftype": "Planitia (Dust-Covered Lava Plain)", "lat": 24.80, "lon": -164.00, "diam_km": 2816.0, "elev_m": -3850.0},
        {"name": "Elysium Planitia", "ftype": "Planitia (Equatorial Volcanic Plain)", "lat": 3.00, "lon": 154.70, "diam_km": 3002.0, "elev_m": -2950.0},
        {"name": "Syrtis Major Planum", "ftype": "Planum (Basaltic Shield)", "lat": 8.40, "lon": 69.50, "diam_km": 1215.0, "elev_m": 1650.0},
        {"name": "Meridiani Planum", "ftype": "Planum (Hematite Plains)", "lat": -1.95, "lon": -5.53, "diam_km": 1058.0, "elev_m": -1420.0},
        {"name": "Mawrth Vallis", "ftype": "Vallis (Phyllosilicate Channel)", "lat": 24.00, "lon": -19.00, "diam_km": 635.0, "elev_m": -2200.0},
        {"name": "Planum Boreum (Chasma Boreale)", "ftype": "Planum (North Polar Ice Cap)", "lat": 84.00, "lon": 15.00, "diam_km": 1060.0, "elev_m": -2100.0},
        {"name": "Planum Australe", "ftype": "Planum (South Polar Ice Cap)", "lat": -85.00, "lon": 160.00, "diam_km": 1430.0, "elev_m": 3200.0},
        {"name": "Arabia Terra", "ftype": "Terra (Cratered Highlands)", "lat": 20.00, "lon": 30.00, "diam_km": 4850.0, "elev_m": -500.0},
        {"name": "Noachis Terra", "ftype": "Terra (Ancient Southern Highlands)", "lat": -45.00, "lon": -30.00, "diam_km": 5500.0, "elev_m": 1850.0},
        {"name": "Terra Sirenum", "ftype": "Terra (Magnetic Crustal Highlands)", "lat": -39.70, "lon": -150.00, "diam_km": 3900.0, "elev_m": 2450.0},
    ),
    "moon": (
        {"name": "Shackleton Crater", "ftype": "Crater (South Pole PSR)", "lat": -89.68, "lon": 129.78, "diam_km": 21.0, "elev_m": -1850.0},
        {"name": "Cabeus Crater", "ftype": "Crater (Polar Volatile Trap)", "lat": -84.90, "lon": -35.50, "diam_km": 98.0, "elev_m": -3900.0},
        {"name": "Haworth Crater", "ftype": "Crater (South Polar Cold Trap)", "lat": -87.45, "lon": -5.17, "diam_km": 51.4, "elev_m": -3200.0},
        {"name": "Mare Tranquillitatis", "ftype": "Mare (Ti-Rich Basaltic Basin)", "lat": 8.33, "lon": 33.22, "diam_km": 875.0, "elev_m": -1750.0},
        {"name": "Mare Imbrium", "ftype": "Mare (Flood Basalt Basin)", "lat": 32.80, "lon": -15.60, "diam_km": 1145.0, "elev_m": -2400.0},
        {"name": "Mare Serenitatis", "ftype": "Mare (Mascon Basalt Basin)", "lat": 28.00, "lon": 17.50, "diam_km": 674.0, "elev_m": -2650.0},
        {"name": "Mare Crisium", "ftype": "Mare (Isolated Impact Basin)", "lat": 17.00, "lon": 59.10, "diam_km": 555.0, "elev_m": -3500.0},
        {"name": "Mare Fecunditatis", "ftype": "Mare (Eastern Basaltic Mare)", "lat": -7.80, "lon": 53.70, "diam_km": 840.0, "elev_m": -1900.0},
        {"name": "Oceanus Procellarum", "ftype": "Oceanus (KREEP Basalt Province)", "lat": 18.40, "lon": -57.40, "diam_km": 2592.0, "elev_m": -1950.0},
        {"name": "Tycho Crater", "ftype": "Crater (Copernican Ray Crater)", "lat": -43.31, "lon": -11.36, "diam_km": 85.3, "elev_m": -2100.0},
        {"name": "Copernicus Crater", "ftype": "Crater (Central-Peak Crater)", "lat": 9.62, "lon": -20.08, "diam_km": 96.0, "elev_m": -1950.0},
        {"name": "Aristarchus Plateau", "ftype": "Crater / Pyroclastic Plateau", "lat": 23.73, "lon": -47.49, "diam_km": 160.0, "elev_m": 450.0},
        {"name": "Marius Hills", "ftype": "Tholus / Lava Tube Pit Field", "lat": 14.10, "lon": -56.80, "diam_km": 220.0, "elev_m": -1450.0},
        {"name": "Von Kármán Crater (South Pole–Aitken)", "ftype": "Crater (Farside SPA Basin)", "lat": -44.45, "lon": 176.25, "diam_km": 186.0, "elev_m": -5900.0},
        {"name": "Schrödinger Basin", "ftype": "Basin (Peak-Ring Impact Basin)", "lat": -75.00, "lon": 132.40, "diam_km": 316.0, "elev_m": -4200.0},
        {"name": "South Pole–Aitken Basin", "ftype": "Basin (Deep Mantle Impact Basin)", "lat": -53.00, "lon": -169.00, "diam_km": 2500.0, "elev_m": -6200.0},
        {"name": "Lunar Descartes Highlands", "ftype": "Terra (Anorthositic Highlands)", "lat": -8.97, "lon": 15.50, "diam_km": 950.0, "elev_m": 1850.0},
        {"name": "Peary Crater", "ftype": "Crater (North Polar Rim)", "lat": 88.63, "lon": 24.40, "diam_km": 78.7, "elev_m": -1600.0},
    ),
}


def _spherical_distance_km(body: PlanetaryBody, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Compute great-circle distance on Moon (R=1737.4 km) or Mars (R=3389.5 km)."""
    radius = 1737.4 if body == "moon" else 3389.5
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * (math.sin(dl / 2.0) ** 2)
    return 2.0 * radius * math.asin(min(1.0, math.sqrt(a)))


@lru_cache(maxsize=4)
def _load_optical_texture(body: PlanetaryBody) -> np.ndarray | None:
    """Load equirectangular NASA Trek optical reflectance mosaic (LRO WAC or Mars MDIM2.1)."""
    filename = (
        "planet_texture_moon_moon_wac.jpg"
        if body == "moon"
        else "planet_texture_mars_mars_color.jpg"
    )
    path = DATA_DIR / filename
    if not path.exists():
        return None
    try:
        with Image.open(path) as img:
            return np.asarray(img.convert("L"), dtype=np.float32)
    except Exception:
        return None


@lru_cache(maxsize=4)
def _load_dem_texture(body: PlanetaryBody) -> np.ndarray | None:
    """Load equirectangular NASA Trek MOLA / LOLA shaded-relief DEM texture."""
    filename = (
        "planet_texture_moon_moon_lola.jpg"
        if body == "moon"
        else "planet_texture_mars_mars_mola.jpg"
    )
    path = DATA_DIR / filename
    if not path.exists():
        return None
    try:
        with Image.open(path) as img:
            return np.asarray(img.convert("L"), dtype=np.float32)
    except Exception:
        return None


def compute_hertz_knudsen_sublimation_rate(
    subsurface_ice_frac: float,
    mean_temp_k: float,
    diurnal_amp_k: float,
    atm_pressure_mbar: float,
    relative_humidity_pct: float = 0.0,
) -> float:
    """
    Compute dimensionless ice sublimation index in [0.0, 0.95] via the kinetic
    Hertz-Knudsen-Langmuir equation & Murphy-Koop (2005) saturation vapor pressure over ice:
        ln(P_sat) = 9.550426 - 5723.265/T + 3.53068*ln(T) - 0.00728332*T  [Pa]
        J = alpha * f_ice * max(0, P_sat(T_peak) - P_vap) / sqrt(2 * pi * m_H2O * k_B * T_peak)
    """
    if subsurface_ice_frac <= 0.01:
        return 0.0

    # Peak daytime regolith/surface skin temperature drives kinetic sublimation
    t_peak = float(np.clip(mean_temp_k + 0.45 * diurnal_amp_k, 60.0, 295.0))
    ln_p_sat = (
        9.550426
        - (5723.265 / t_peak)
        + 3.53068 * math.log(t_peak)
        - 0.00728332 * t_peak
    )
    p_sat_pa = math.exp(min(25.0, max(-45.0, ln_p_sat)))

    # Ambient water vapor partial pressure
    ln_p_mean = (
        9.550426
        - (5723.265 / max(60.0, min(273.15, mean_temp_k)))
        + 3.53068 * math.log(max(60.0, min(273.15, mean_temp_k)))
        - 0.00728332 * max(60.0, min(273.15, mean_temp_k))
    )
    p_vap_pa = (relative_humidity_pct / 100.0) * math.exp(min(25.0, max(-45.0, ln_p_mean)))

    delta_p = max(0.0, p_sat_pa - p_vap_pa)
    if delta_p <= 1e-12:
        return 0.0

    # Kinetic Hertz-Knudsen flux (kg m^-2 s^-1) attenuated by regolith overburden diffusivity & ambient pressure
    regolith_barrier = 1.0 / (1.0 + 0.018 * max(0.0, atm_pressure_mbar))
    j_flux = (
        0.15
        * subsurface_ice_frac
        * regolith_barrier
        * delta_p
        / math.sqrt(2.0 * math.pi * M_H2O_KG * KB_BOLTZMANN * t_peak)
    )

    # Map logarithmic mass flux across [1e-11, 1e-3] kg m^-2 s^-1 onto normalized [0.0, 0.92]
    if j_flux <= 1e-11:
        return 0.0
    log_norm = (math.log10(j_flux) + 11.0) / 8.5
    return round(float(np.clip(subsurface_ice_frac * 0.35 + 0.65 * log_norm, 0.01, 0.92)), 4)


def compute_terrestrial_radiation_msv_yr(
    atm_pressure_mbar: float,
    lat: float,
    aridity_index: float = 0.5,
    subsurface_ice_frac: float = 0.0,
) -> float:
    """
    Compute Earth surface ionizing radiation dose (mSv/yr) using the analytical
    Sato/PARMA barometric cosmic-ray attenuation + geomagnetic latitude cutoff model:
      - Cosmic secondary neutron/muon flux increases exponentially as barometric overburden P drops.
      - Geomagnetic shielding decreases from equator to poles (sin^2(lat) dependence).
      - Crustal gamma background is lower over ice sheets and slightly higher in arid felsic/volcanic terrains.
    """
    p_clamped = float(np.clip(atm_pressure_mbar, 420.0, 1040.0))
    delta_p = max(0.0, 1013.25 - p_clamped)

    # Geomagnetic latitude factor (higher cosmic ray flux at high latitudes)
    sin2_lat = math.sin(math.radians(abs(lat))) ** 2
    d_sea_cosmic = 0.28 * (1.0 + 0.38 * sin2_lat)

    # Double-exponential barometric attenuation (muonic L1 ~ 225 mbar, nucleonic/neutron L2 ~ 138 mbar)
    attenuation_factor = 0.25 * math.exp(delta_p / 225.0) + 0.75 * math.exp(delta_p / 138.0)
    d_cosmic = d_sea_cosmic * attenuation_factor

    # Crustal radionuclide dose (K-40, Th-232, U-238): suppressed by ice sheets, enhanced in exposed dry rock
    d_crustal = (1.85 + 0.35 * aridity_index) * (1.0 - 0.55 * subsurface_ice_frac)
    total_msv = d_cosmic + d_crustal
    return round(float(np.clip(total_msv, 1.2, 14.5)), 2)


def estimate_planetary_elevation_m(body: PlanetaryBody, lat: float, lon: float) -> float:
    """
    Estimate selenographic (LOLA) or areographic (MOLA) elevation in meters relative to datum.
    Combines spherical-harmonic hemispheric dichotomy + Gaussian radial kernels for major IAU
    volcanic shields, impact basins, and chasmata, modulated by local NASA Trek DEM relief.
    """
    if body == "mars":
        # Martian hemispheric dichotomy (~ -3300m in northern lowlands, +1800m in southern highlands)
        dichotomy = -750.0 - 2550.0 * math.tanh((lat - 8.0 * math.cos(math.radians(lon + 35.0))) / 18.0)
        # Tharsis crustal bulge centered near (-2 deg, -110 deg)
        d_tharsis = _spherical_distance_km("mars", lat, lon, -2.0, -110.0)
        tharsis_bulge = 4200.0 * math.exp(-((d_tharsis / 2400.0) ** 2))
        elev = dichotomy + tharsis_bulge
    else:
        # Lunar farside highlands (+1800m) vs nearside mare basins (-1800m)
        nearside_weight = math.cos(math.radians(lat)) * math.cos(math.radians(lon))
        elev = -1100.0 * nearside_weight + 450.0

    # Blend from broadest regional provinces down to localized craters/peaks so peaks are not diluted
    sorted_features = sorted(
        IAU_GAZETTEER_FEATURES[body],
        key=lambda item: float(item["diam_km"]),
        reverse=True,
    )
    for feat in sorted_features:
        f_lat = float(feat["lat"])
        f_lon = float(feat["lon"])
        f_diam = float(feat["diam_km"])
        f_elev = float(feat["elev_m"])
        dist = _spherical_distance_km(body, lat, lon, f_lat, f_lon)
        sigma = max(45.0, f_diam * 0.45)
        if dist <= sigma * 2.2:
            w = math.exp(-((dist / sigma) ** 2))
            elev = (1.0 - w) * elev + w * f_elev

    # Local high-frequency topographic modulation from LOLA/MOLA texture
    dem = _load_dem_texture(body)
    if dem is not None:
        h, w_px = dem.shape
        px = int(round(((lon + 180.0) / 360.0) * (w_px - 1)))
        py = int(round(((90.0 - lat) / 180.0) * (h - 1)))
        px = max(0, min(w_px - 1, px))
        py = max(0, min(h - 1, py))
        norm_val = (float(dem[py, px]) - 127.5) / 127.5
        elev += norm_val * 380.0

    return round(float(np.clip(elev, -8200.0, 21300.0)), 1)


def compute_mars_hypsometric_state(
    lat: float,
    lon: float,
    rover_ref_pressure_mbar: float,
    rover_ref_elevation_m: float = -4501.0,
    mean_temp_k: float = 215.0,
) -> dict[str, float]:
    """
    Scale Martian atmospheric pressure, radiation dose, and thermal amplitude by MOLA elevation z
    using the barometric hypsometric equation:
        P(z) = P_ref * exp(-(z - z_ref) / H(T)),   where H(T) = R*T / (M_CO2 * g_Mars) ~ 11.1 km
    """
    elev_m = estimate_planetary_elevation_m("mars", lat, lon)
    scale_height_m = (R_GAS_UNIVERSAL * max(150.0, mean_temp_k)) / (M_CO2_KG_MOL * G_MARS_MS2)
    pressure_factor = math.exp(-(elev_m - rover_ref_elevation_m) / scale_height_m)
    local_pressure_mbar = float(np.clip(rover_ref_pressure_mbar * pressure_factor, 0.45, 14.2))

    # Mars surface radiation (MSL RAD baseline = 230 mSv/yr at Gale Crater -4501 m, ~7.8 mbar)
    # Atmospheric column shielding scales with pressure P(z): thinner air on Olympus Mons -> ~315 mSv/yr
    radiation_msv_yr = float(
        np.clip(230.0 * math.exp((7.8 - local_pressure_mbar) / 18.5), 165.0, 330.0)
    )

    # Thinner atmosphere reduces IR thermal blanketing -> larger diurnal temperature swing
    diurnal_amp_multiplier = float(np.clip(1.0 + 0.09 * math.log(max(7.5, rover_ref_pressure_mbar) / local_pressure_mbar), 0.85, 1.28))

    return {
        "elevation_m": round(elev_m, 1),
        "atm_pressure_mbar": round(local_pressure_mbar, 3),
        "pressure_scale_factor": round(pressure_factor, 4),
        "radiation_msv_yr": round(radiation_msv_yr, 1),
        "diurnal_amp_multiplier": round(diurnal_amp_multiplier, 4),
    }


def sample_orbital_regolith_properties(
    body: PlanetaryBody,
    lat: float,
    lon: float,
) -> dict[str, float]:
    """
    Derive spatially continuous surface_albedo, thermal_inertia, and subsurface_ice_frac from
    NASA Trek optical reflectance mosaics + MGS TES / Mars Odyssey GRS / LRO Diviner & LEND physics.
    """
    tex = _load_optical_texture(body)
    opt_norm = 0.5
    if tex is not None:
        h, w_px = tex.shape
        px = int(round(((lon + 180.0) / 360.0) * (w_px - 1)))
        py = int(round(((90.0 - lat) / 180.0) * (h - 1)))
        px = max(1, min(w_px - 2, px))
        py = max(1, min(h - 2, py))
        opt_norm = float(np.mean(tex[py - 1 : py + 2, px - 1 : px + 2])) / 255.0

    abs_lat = abs(lat)
    elev_m = estimate_planetary_elevation_m(body, lat, lon)

    if body == "moon":
        # Calibrate LRO WAC optical reflectance to LRO Diviner bolometric albedo [0.06, 0.24]
        albedo = float(np.clip(0.06 + 0.17 * opt_norm, 0.06, 0.24))
        # LRO Diviner H-parameter / thermal inertia: mare basalts & young rocky craters have higher TI
        mare_factor = max(0.0, 1.0 - opt_norm)
        base_ti = float(np.clip(52.0 + 42.0 * mare_factor - 0.002 * elev_m, 45.0, 115.0))
        # LRO LEND / LCROSS polar hydrogen cold traps poleward of 75 deg
        if abs_lat >= 75.0:
            polar_weight = (abs_lat - 75.0) / 15.0
            cold_trap_bonus = 0.12 if elev_m < -1500.0 else 0.0
            ice_frac = float(np.clip(0.08 + 0.34 * polar_weight + cold_trap_bonus, 0.05, 0.48))
        else:
            ice_frac = 0.0
    else:
        # Calibrate Mars color mosaic reflectance to MGS TES bolometric albedo [0.10, 0.38]
        albedo = float(np.clip(0.11 + 0.24 * opt_norm, 0.10, 0.38))
        # MGS TES Thermal Inertia (Putzig & Mellon 2007): anti-correlated with bright dust cover & altitude
        dust_blanket = max(0.0, (albedo - 0.14) / 0.20)
        elev_penalty = max(0.0, elev_m) * 0.0055
        base_ti = float(np.clip(365.0 - 165.0 * dust_blanket - elev_penalty, 75.0, 460.0))

        # Mars Odyssey GRS/MONS Epithermal Neutron Water-Equivalent Hydrogen (WEH)
        if abs_lat >= 55.0:
            polar_frac = (abs_lat - 55.0) / 35.0
            ice_frac = float(np.clip(0.22 + 0.56 * polar_frac, 0.20, 0.78))
        elif abs_lat >= 38.0:
            mid_frac = (abs_lat - 38.0) / 17.0
            ice_frac = float(np.clip(0.04 + 0.22 * mid_frac, 0.04, 0.26))
        else:
            # Equatorial hydrated sulfate/phyllosilicate/Medusae Fossae hydrogen signature
            equatorial_hydrated = 0.06 if (-25.0 <= lat <= 25.0 and (135.0 <= lon <= 180.0 or -75.0 <= lon <= -15.0)) else 0.02
            ice_frac = equatorial_hydrated

    return {
        "surface_albedo": round(albedo, 4),
        "thermal_inertia": round(base_ti, 1),
        "subsurface_ice_frac": round(ice_frac, 4),
        "elevation_m": round(elev_m, 1),
    }


def resolve_iau_planetary_feature(
    body: PlanetaryBody,
    lat: float,
    lon: float,
    client: httpx.Client | None = None,
) -> PlanetaryFeatureInfo:
    """
    Identify the official IAU planetary geological feature at (lat, lon).
    Queries USGS Astrogeology OGC WFS Gazetteer first (best-effort) and falls back to the
    curated IAU Gazetteer of Planetary Nomenclature with elevation from MOLA/LOLA.
    """
    elev_m = estimate_planetary_elevation_m(body, lat, lon)

    # 1. Try USGS Astrogeology WFS Gazetteer live lookup within +/- 2.5 deg bounding box
    target_upper = "MOON" if body == "moon" else "MARS"
    lon_360 = lon % 360.0
    try:
        own_client = client is None
        http = client or httpx.Client(timeout=3.0)
        try:
            resp = http.get(
                f"{USGS_WFS_BASE_URL}/{target_upper}/WFS",
                params={
                    "SERVICE": "WFS",
                    "VERSION": "1.1.0",
                    "REQUEST": "GetFeature",
                    "TYPENAME": "feature",
                    "OUTPUTFORMAT": "application/json",
                    "MAXFEATURES": "5",
                    "BBOX": f"{lat - 2.5:.2f},{lon_360 - 2.5:.2f},{lat + 2.5:.2f},{lon_360 + 2.5:.2f}",
                },
                timeout=3.0,
            )
            if resp.status_code == 200:
                features = resp.json().get("features", [])
                if features:
                    props = features[0].get("properties", {})
                    fname = str(props.get("name") or props.get("clean_name") or "").strip()
                    ftype = str(props.get("type") or props.get("code") or "IAU Feature").strip()
                    diam = float(props.get("diameter") or 0.0)
                    if fname:
                        return PlanetaryFeatureInfo(
                            feature_name=fname,
                            feature_type=ftype,
                            diameter_km=round(diam, 1) if diam > 0 else None,
                            distance_km=0.0,
                            elevation_m=elev_m,
                            gazetteer_source="USGS Astrogeology / IAU WFS",
                        )
        finally:
            if own_client:
                http.close()
    except Exception:
        pass

    # 2. Match against curated IAU Gazetteer of Planetary Nomenclature
    best_feat: dict[str, object] | None = None
    best_score = float("inf")
    best_dist = float("inf")

    for feat in IAU_GAZETTEER_FEATURES[body]:
        dist = _spherical_distance_km(body, lat, lon, float(feat["lat"]), float(feat["lon"]))
        radius = max(40.0, float(feat["diam_km"]) * 0.5)
        # Normalized proximity relative to feature radius
        rel_score = dist / radius
        if rel_score < best_score:
            best_score = rel_score
            best_dist = dist
            best_feat = feat

    if best_feat is not None:
        return PlanetaryFeatureInfo(
            feature_name=str(best_feat["name"]),
            feature_type=str(best_feat["ftype"]),
            diameter_km=round(float(best_feat["diam_km"]), 1),
            distance_km=round(best_dist, 1),
            elevation_m=elev_m,
            gazetteer_source="IAU Planetary Gazetteer / NASA MOLA-LOLA",
        )

    return PlanetaryFeatureInfo(
        feature_name=f"{body.capitalize()} ({lat:.2f}°, {lon:.2f}°)",
        feature_type="Planetary Surface",
        diameter_km=None,
        distance_km=0.0,
        elevation_m=elev_m,
        gazetteer_source="NASA MOLA / LOLA Hypsometry",
    )
