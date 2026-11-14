"""Geology (Macrostrat), subsurface lava-tube/cave analogs, and extremophile habitability."""

from math import asin, cos, exp, radians, sin, sqrt
import httpx
import numpy as np

from app.etl.earth_api import fetch_soilgrids_metrics
from app.models.schemas import (
    GeologySummary,
    HabitabilityProfile,
    PlanetaryBody,
    RegolithSimulantCandidate,
    RegolithSimulantProfile,
    SubsurfaceAnalogInfo,
)

MACROSTRAT_MAP_URL = "https://macrostrat.org/api/v2/geologic_units/map"

# Curated global volcanic lava tubes, ice caves, and karst analog features
SUBSURFACE_ANALOG_FEATURES: tuple[dict[str, object], ...] = (
    {"name": "Cueva de los Verdes / Corona (Lanzarote)", "lat": 29.16, "lon": -13.44, "radius_km": 160.0, "ftype": "lava_tube"},
    {"name": "Kazumura / Kīlauea Lava Tubes (Hawaii)", "lat": 19.47, "lon": -155.04, "radius_km": 160.0, "ftype": "lava_tube"},
    {"name": "Craters of the Moon Lava Tubes (Idaho)", "lat": 43.46, "lon": -113.56, "radius_km": 160.0, "ftype": "lava_tube"},
    {"name": "Lava Beds National Monument (California)", "lat": 41.71, "lon": -121.51, "radius_km": 150.0, "ftype": "lava_tube"},
    {"name": "Undara Lava Tubes (Queensland)", "lat": -18.20, "lon": 144.57, "radius_km": 180.0, "ftype": "lava_tube"},
    {"name": "Manjanggul Lava Tube (Jeju)", "lat": 33.53, "lon": 126.77, "radius_km": 140.0, "ftype": "lava_tube"},
    {"name": "Raufarhólshellir / Askja Volcanic Tubes (Iceland)", "lat": 63.94, "lon": -21.40, "radius_km": 220.0, "ftype": "lava_tube"},
    {"name": "Cueva del Viento (Tenerife)", "lat": 28.35, "lon": -16.70, "radius_km": 150.0, "ftype": "lava_tube"},
    {"name": "Mount Etna Grotta del Gelo (Sicily)", "lat": 37.75, "lon": 14.99, "radius_km": 140.0, "ftype": "ice_lava_cave"},
    {"name": "Eisriesenwelt Alpine Ice Cave (Austria)", "lat": 47.50, "lon": 13.19, "radius_km": 150.0, "ftype": "ice_cave"},
    {"name": "Lechuguilla / Carlsbad Sulfuric Karst (New Mexico)", "lat": 32.18, "lon": -104.50, "radius_km": 180.0, "ftype": "chem_karst"},
    {"name": "Atacama Salt / Nitrate Caves (Chile)", "lat": -22.90, "lon": -68.25, "radius_km": 200.0, "ftype": "evaporite_cave"},
)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r_earth = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2.0) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0) ** 2
    return 2.0 * r_earth * asin(min(1.0, sqrt(a)))


def fetch_macrostrat_geology(
    lat: float,
    lon: float,
    client: httpx.Client,
) -> GeologySummary | None:
    """Best-effort query to Macrostrat open geologic map API (4s timeout)."""
    try:
        resp = client.get(
            MACROSTRAT_MAP_URL,
            params={"lat": round(lat, 4), "lng": round(lon, 4)},
            timeout=4.0,
        )
        resp.raise_for_status()
        units = resp.json().get("success", {}).get("data", [])
        if not units:
            return None
        top = units[0]
        unit_name = str(top.get("name") or top.get("strat_name") or "Geologic Unit").strip()
        lithology = str(top.get("lith") or top.get("descrip") or "Mixed").strip()
        age = str(top.get("best_int_name") or top.get("t_int_name") or "").strip()
        return GeologySummary(
            unit_name=unit_name[:120],
            lithology=lithology[:140] if lithology else "Unspecified",
            age=age[:60] if age else "Unknown",
            source="Macrostrat API",
        )
    except Exception:
        return None


def evaluate_subsurface_analog(
    lat: float,
    lon: float,
    geology: GeologySummary | None,
) -> SubsurfaceAnalogInfo:
    """Check proximity to documented lava tubes / ice caves or volcanic/karst lithology."""
    best_name: str | None = None
    best_type = "none"
    best_dist = float("inf")
    for feat in SUBSURFACE_ANALOG_FEATURES:
        dist = _haversine_km(lat, lon, float(feat["lat"]), float(feat["lon"]))  # type: ignore[arg-type]
        if dist <= float(feat["radius_km"]) and dist < best_dist:  # type: ignore[arg-type]
            best_dist = dist
            best_name = str(feat["name"])
            best_type = str(feat["ftype"])

    if best_name is not None:
        return SubsurfaceAnalogInfo(
            has_lava_tubes_or_caves=True,
            nearest_feature=best_name,
            feature_type=best_type,
            note_key="subsurface.documented_system",
        )

    lith_text = f"{geology.lithology} {geology.unit_name}".lower() if geology else ""
    if any(k in lith_text for k in ("basalt", "volcanic", "lava", "mafic", "andesite")):
        return SubsurfaceAnalogInfo(
            has_lava_tubes_or_caves=True,
            nearest_feature=geology.unit_name if geology else None,
            feature_type="volcanic_terrain",
            note_key="subsurface.volcanic_potential",
        )
    if any(k in lith_text for k in ("limestone", "dolomite", "carbonate", "evaporite", "gypsum", "halite")):
        return SubsurfaceAnalogInfo(
            has_lava_tubes_or_caves=True,
            nearest_feature=geology.unit_name if geology else None,
            feature_type="karst_evaporite",
            note_key="subsurface.karst_potential",
        )

    return SubsurfaceAnalogInfo(
        has_lava_tubes_or_caves=False,
        nearest_feature=None,
        feature_type="surface_only",
        note_key="subsurface.no_known_caves",
    )


def evaluate_habitability_profile(
    mean_temp_k: float,
    aridity_index: float,
    uv_index: float,
    subsurface_ice_frac: float,
    geology: GeologySummary | None,
) -> HabitabilityProfile:
    """Derive extremophile habitability regime and biosignature relevance from cell physics."""
    lith_text = f"{geology.lithology} {geology.unit_name}".lower() if geology else ""

    if mean_temp_k <= 268.0 or subsurface_ice_frac >= 0.20:
        regime_key = "habitability.regimes.cryophilic"
        extremophiles = ["Psychrobacter arcticus", "Planococcus halocryophilus", "Cryptoendolithic fungi"]
        biosig_key = "habitability.biosig.ice_permafrost"
        score = 0.78
    elif any(k in lith_text for k in ("evaporite", "halite", "gypsum", "salt")) or (
        aridity_index >= 0.85 and mean_temp_k >= 280.0
    ):
        regime_key = "habitability.regimes.halophilic_xerophilic"
        extremophiles = ["Chroococcidiopsis", "Halobacterium salinarum", "Deinococcus radiodurans"]
        biosig_key = "habitability.biosig.endolithic_salts"
        score = 0.72
    elif any(k in lith_text for k in ("basalt", "volcanic", "sulf", "rhyolit")):
        regime_key = "habitability.regimes.chemolithotrophic"
        extremophiles = ["Acidithiobacillus ferrooxidans", "Sulfolobus", "Methanobacterium"]
        biosig_key = "habitability.biosig.iron_sulfur_mineral"
        score = 0.81
    elif uv_index >= 7.0 and aridity_index >= 0.75:
        regime_key = "habitability.regimes.uv_endolithic"
        extremophiles = ["Chroococcidiopsis", "Deinococcus radiodurans"]
        biosig_key = "habitability.biosig.uv_shielded_rock"
        score = 0.66
    else:
        regime_key = "habitability.regimes.polyextremophile"
        extremophiles = ["Bacillus subtilis", "Chroococcidiopsis"]
        biosig_key = "habitability.biosig.general_organic"
        score = 0.85

    return HabitabilityProfile(
        habitability_index=round(score, 2),
        regime_key=regime_key,
        extremophiles=extremophiles,
        biosignature_relevance_key=biosig_key,
    )


# Reference specifications for standard NASA / ESA / Exolith Lab planetary regolith simulants
REGOLITH_SIMULANT_SPECS: tuple[dict[str, object], ...] = (
    {
        "code": "LMS-1",
        "name_key": "simulants.lms1.name",
        "target_body": "moon",
        "mineralogy_key": "simulants.lms1.mineralogy",
        "sand_pct": 64.0,
        "clay_pct": 2.0,
        "bdod": 1.54,
        "albedo": 0.09,
        "lith_keywords": ("basalt", "mafic", "volcanic", "lava", "gabbro", "diabase"),
    },
    {
        "code": "LHS-1",
        "name_key": "simulants.lhs1.name",
        "target_body": "moon",
        "mineralogy_key": "simulants.lhs1.mineralogy",
        "sand_pct": 60.0,
        "clay_pct": 2.5,
        "bdod": 1.34,
        "albedo": 0.18,
        "lith_keywords": ("anorthosit", "granit", "gneiss", "feldspar", "plagioclase", "felsic", "metamorphic"),
    },
    {
        "code": "MGS-1",
        "name_key": "simulants.mgs1.name",
        "target_body": "mars",
        "mineralogy_key": "simulants.mgs1.mineralogy",
        "sand_pct": 56.0,
        "clay_pct": 7.5,
        "bdod": 1.29,
        "albedo": 0.20,
        "lith_keywords": ("basalt", "volcanic", "andesit", "olivine", "pyroxen", "igneous"),
    },
    {
        "code": "MMS-2",
        "name_key": "simulants.mms2.name",
        "target_body": "mars",
        "mineralogy_key": "simulants.mms2.mineralogy",
        "sand_pct": 52.0,
        "clay_pct": 11.0,
        "bdod": 1.38,
        "albedo": 0.25,
        "lith_keywords": ("evaporit", "gypsum", "sulfat", "hematit", "sandstone", "red bed", "volcanic"),
    },
    {
        "code": "JEZ-1",
        "name_key": "simulants.jez1.name",
        "target_body": "mars",
        "mineralogy_key": "simulants.jez1.mineralogy",
        "sand_pct": 44.0,
        "clay_pct": 16.5,
        "bdod": 1.32,
        "albedo": 0.22,
        "lith_keywords": ("carbonat", "dolomit", "limestone", "shale", "mudstone", "clay", "alluvi", "lacustrin"),
    },
)


def evaluate_regolith_simulant_affinity(
    lat: float,
    lon: float,
    aridity_index: float,
    surface_albedo: float,
    thermal_inertia: float,
    geology: GeologySummary | None,
) -> RegolithSimulantProfile:
    """
    Compare Earth cell soil granulometry (ISRIC SoilGrids v2.0) and Macrostrat lithology
    against standard NASA / ESA planetary regolith simulants (LMS-1, LHS-1, MGS-1, MMS-2, JEZ-1).
    """
    soil = fetch_soilgrids_metrics(lat, lon)
    lith_text = f"{geology.lithology} {geology.unit_name}".lower() if geology else ""

    if soil is not None:
        sand_pct = float(soil["sand_pct"])
        clay_pct = float(soil["clay_pct"])
        bdod = float(soil["bdod_g_cm3"])
        # Correct SoilGrids global ML baseline for hyper-arid UV/oxidative organic depletion
        raw_soc = float(soil["soc_pct"])
        soc_pct = round(raw_soc * max(0.12, 1.0 - 0.85 * (aridity_index ** 2)), 2)
    else:
        # Physics-grounded fallback when cell is bare bedrock, hyper-arid salt flat, or ice cap
        is_mafic = any(k in lith_text for k in ("basalt", "volcanic", "lava", "mafic"))
        sand_pct = round(float(np.clip(42.0 + 24.0 * aridity_index + (6.0 if is_mafic else 0.0), 25.0, 82.0)), 1)
        clay_pct = round(float(np.clip(22.0 * (1.0 - aridity_index) + 4.0, 2.0, 32.0)), 1)
        bdod = round(float(np.clip(1.18 + (thermal_inertia / 1600.0), 1.15, 1.68)), 2)
        soc_pct = round(float(np.clip(3.2 * ((1.0 - aridity_index) ** 1.8), 0.04, 4.5)), 2)

    silt_pct = round(max(0.0, 100.0 - sand_pct - clay_pct), 1)

    candidates: list[RegolithSimulantCandidate] = []
    for spec in REGOLITH_SIMULANT_SPECS:
        d_sand = abs(sand_pct - float(spec["sand_pct"])) / 35.0
        d_clay = abs(clay_pct - float(spec["clay_pct"])) / 18.0
        d_bdod = abs(bdod - float(spec["bdod"])) / 0.35
        d_alb = abs(surface_albedo - float(spec["albedo"])) / 0.18

        base_dist = 0.32 * d_sand + 0.28 * d_clay + 0.22 * d_bdod + 0.18 * d_alb
        lith_bonus = 0.12 if any(k in lith_text for k in spec["lith_keywords"]) else 0.0  # type: ignore[union-attr]
        org_penalty = min(0.25, soc_pct * 0.08)
        score = float(np.clip(exp(-base_dist) + lith_bonus - org_penalty, 0.12, 0.98))

        candidates.append(
            RegolithSimulantCandidate(
                code=str(spec["code"]),
                name_key=str(spec["name_key"]),
                target_body=str(spec["target_body"]),  # type: ignore[arg-type]
                affinity_score=round(score, 3),
                mineralogy_key=str(spec["mineralogy_key"]),
            )
        )

    candidates.sort(key=lambda c: c.affinity_score, reverse=True)
    best = candidates[0]

    # Astrobiological purity index: hyper-arid & ultra-low organic carbon (<0.3% SOC) prevents false positives
    astro_purity = float(np.clip(exp(-soc_pct / 1.1) * (0.45 + 0.55 * aridity_index), 0.08, 0.99))

    # ISRU O2 / sintering suitability: favors dense, low-organic, high-sand/mafic/oxide regolith
    mafic_bonus = 0.14 if any(k in lith_text for k in ("basalt", "volcanic", "anorthosit", "hematit", "sulfat")) else 0.0
    isru_o2 = float(
        np.clip(
            0.40 * (sand_pct / 75.0)
            + 0.30 * (bdod / 1.60)
            + 0.20 * astro_purity
            + mafic_bonus,
            0.15,
            0.97,
        )
    )

    return RegolithSimulantProfile(
        recommended_code=best.code,
        recommended_name_key=best.name_key,
        affinity_score=best.affinity_score,
        isru_o2_index=round(isru_o2, 3),
        astrobiology_purity_index=round(astro_purity, 3),
        sand_pct=round(sand_pct, 1),
        clay_pct=round(clay_pct, 1),
        silt_pct=silt_pct,
        bulk_density_g_cm3=round(bdod, 2),
        organic_carbon_pct=round(soc_pct, 2),
        candidates=candidates,
    )


