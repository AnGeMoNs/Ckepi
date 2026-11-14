"""Geology (Macrostrat), subsurface lava-tube/cave analogs, and extremophile habitability."""

from math import asin, cos, radians, sin, sqrt
import httpx

from app.models.schemas import (
    GeologySummary,
    HabitabilityProfile,
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

