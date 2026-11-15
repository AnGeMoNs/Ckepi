"""Curated catalog of well-known terrestrial planetary analog sites.

Used to distinguish established literature benchmarks (Atacama, Haughton,
McMurdo Dry Valleys, etc.) from newly discovered candidate H3 cells.
"""

from math import asin, cos, radians, sin, sqrt
from typing import TypedDict


class KnownAnalogSite(TypedDict):
    name: str
    lat: float
    lon: float
    radius_km: float


KNOWN_ANALOG_SITES: tuple[KnownAnalogSite, ...] = (
    {"name": "Atacama Desert (Yungay)", "lat": -24.08, "lon": -69.91, "radius_km": 85.0},
    {"name": "Puna de Atacama / Altiplano", "lat": -25.80, "lon": -67.50, "radius_km": 95.0},
    {"name": "Salar de Uyuni", "lat": -20.13, "lon": -67.49, "radius_km": 180.0},
    {"name": "Haughton Impact Crater (Devon Island)", "lat": 75.38, "lon": -89.68, "radius_km": 200.0},
    {"name": "Axel Heiberg Island", "lat": 79.42, "lon": -90.75, "radius_km": 180.0},
    {"name": "Death Valley / Mojave", "lat": 36.50, "lon": -117.07, "radius_km": 200.0},
    {"name": "Craters of the Moon (Idaho)", "lat": 43.42, "lon": -113.56, "radius_km": 160.0},
    {"name": "Channeled Scablands (Washington)", "lat": 47.45, "lon": -119.25, "radius_km": 180.0},
    {"name": "Meteor Crater / San Francisco Volcanic Field", "lat": 35.03, "lon": -111.02, "radius_km": 160.0},
    {"name": "McMurdo Dry Valleys (Antarctica)", "lat": -77.47, "lon": 162.52, "radius_km": 250.0},
    {"name": "Lake Untersee (Antarctica)", "lat": -71.34, "lon": 13.45, "radius_km": 200.0},
    {"name": "Concordia Station / Dome C", "lat": -75.10, "lon": 123.35, "radius_km": 250.0},
    {"name": "Río Tinto (Spain)", "lat": 37.70, "lon": -6.55, "radius_km": 150.0},
    {"name": "Lanzarote / Timanfaya", "lat": 29.00, "lon": -13.75, "radius_km": 160.0},
    {"name": "Tenerife / Mount Teide", "lat": 28.27, "lon": -16.64, "radius_km": 160.0},
    {"name": "Askja / Krafla (Iceland)", "lat": 65.03, "lon": -16.75, "radius_km": 200.0},
    {"name": "Svalbard Arctic Analog", "lat": 78.22, "lon": 15.65, "radius_km": 200.0},
    {"name": "Mauna Kea / Kīlauea (Hawaii)", "lat": 19.82, "lon": -155.47, "radius_km": 180.0},
    {"name": "Dallol / Danakil Depression", "lat": 14.24, "lon": 40.30, "radius_km": 180.0},
    {"name": "Richat Structure (Mauritania)", "lat": 21.12, "lon": -11.40, "radius_km": 200.0},
    {"name": "Namib Sand Sea", "lat": -24.75, "lon": 15.25, "radius_km": 200.0},
    {"name": "Wadi Rum (Jordan)", "lat": 29.57, "lon": 35.42, "radius_km": 160.0},
    {"name": "Qaidam Basin (Qinghai)", "lat": 37.50, "lon": 93.50, "radius_km": 240.0},
    {"name": "Pilbara Craton (Western Australia)", "lat": -21.30, "lon": 119.10, "radius_km": 220.0},
    {"name": "Ladakh / Tso Kar", "lat": 33.30, "lon": 78.00, "radius_km": 180.0},
)


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r_earth_km = 6371.0
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat / 2.0) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2.0) ** 2
    return 2.0 * r_earth_km * asin(min(1.0, sqrt(a)))


def match_known_analog(lat: float, lon: float) -> str | None:
    """Return the closest curated known analog site name if within its influence radius."""
    best_name: str | None = None
    best_dist = float("inf")
    for site in KNOWN_ANALOG_SITES:
        dist = _haversine_km(lat, lon, site["lat"], site["lon"])
        if dist <= site["radius_km"] and dist < best_dist:
            best_dist = dist
            best_name = site["name"]
    return best_name

