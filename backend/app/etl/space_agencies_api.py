"""Multi-agency open dataset discovery for NASA Earthdata CMR, ESA Copernicus, CSA RADARSAT & JAXA."""

from datetime import datetime, timezone
from typing import TypedDict
import httpx

from app.etl.http_utils import create_http_client


class SpaceAgencyCatalogResult(TypedDict):
    """Typed multi-agency catalog discovery result."""

    lat: float
    lon: float
    queried_at: str
    products: list[dict[str, str]]


NASA_CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
ESA_COPERNICUS_ODATA_URL = "https://catalogue.dataspace.copernicus.eu/odata/v1/Products"
CSA_CKAN_PACKAGE_URL = "https://donnees-data.asc-csa.gc.ca/api/3/action/package_show"


def query_nasa_cmr_granules(
    lat: float,
    lon: float,
    client: httpx.Client,
) -> list[dict[str, str]]:
    """Query NASA Earthdata CMR for real MODIS LST (MOD11A1) & SMAP (SPL3SMP) granules."""
    bbox = f"{max(-180.0, lon - 0.5):.2f},{max(-90.0, lat - 0.5):.2f},{min(180.0, lon + 0.5):.2f},{min(90.0, lat + 0.5):.2f}"
    items: list[dict[str, str]] = []
    for short_name, label in (("MOD11A1", "NASA MODIS Terra LST"), ("SPL3SMP", "NASA SMAP Soil Moisture")):
        try:
            resp = client.get(
                NASA_CMR_GRANULES_URL,
                params={
                    "short_name": short_name,
                    "bounding_box": bbox,
                    "page_size": "2",
                    "sort_key": "-start_date",
                },
            )
            resp.raise_for_status()
            entries = resp.json().get("feed", {}).get("entry", [])
            for entry in entries:
                links = entry.get("links", [])
                href = next(
                    (str(lnk.get("href")) for lnk in links if str(lnk.get("rel", "")).endswith("/data#")),
                    f"https://search.earthdata.nasa.gov/search?q={short_name}&sb={bbox}",
                )
                items.append(
                    {
                        "agency": "NASA",
                        "mission": label,
                        "product_id": str(entry.get("title", short_name)),
                        "sensing_date": str(entry.get("time_start", ""))[:10],
                        "url": href,
                    }
                )
        except Exception:
            continue
    return items


def query_esa_copernicus_products(
    lat: float,
    lon: float,
    client: httpx.Client,
) -> list[dict[str, str]]:
    """Query ESA Copernicus Data Space OData API for real Sentinel-1 SAR & Sentinel-2 scenes."""
    point_wkt = f"geography'SRID=4326;POINT({lon:.4f} {lat:.4f})'"
    items: list[dict[str, str]] = []
    for collection, label in (("SENTINEL-1", "ESA Sentinel-1 SAR"), ("SENTINEL-2", "ESA Sentinel-2 MSI")):
        try:
            odata_filter = (
                f"Collection/Name eq '{collection}' and "
                f"OData.CSC.Intersects(area={point_wkt})"
            )
            resp = client.get(
                ESA_COPERNICUS_ODATA_URL,
                params={
                    "$filter": odata_filter,
                    "$top": "2",
                    "$orderby": "ContentDate/Start desc",
                },
            )
            resp.raise_for_status()
            values = resp.json().get("value", [])
            for prod in values:
                prod_id = str(prod.get("Id", ""))
                items.append(
                    {
                        "agency": "ESA",
                        "mission": label,
                        "product_id": str(prod.get("Name", collection)),
                        "sensing_date": str(prod.get("ContentDate", {}).get("Start", ""))[:10],
                        "url": f"https://browser.dataspace.copernicus.eu/?zoom=8&lat={lat:.3f}&lng={lon:.3f}&datasetId={collection}"
                        if not prod_id
                        else f"https://catalogue.dataspace.copernicus.eu/odata/v1/Products({prod_id})",
                    }
                )
        except Exception:
            continue
    return items


def query_csa_and_jaxa_references(
    lat: float,
    lon: float,
    client: httpx.Client,
) -> list[dict[str, str]]:
    """Query CSA RADARSAT Open Data metadata and provide JAXA G-Portal & ESA Open Science links."""
    items: list[dict[str, str]] = []
    for pkg_id, label in (("radarsat1", "CSA RADARSAT-1 SAR"), ("rcm", "CSA RADARSAT Constellation (RCM)")):
        title = pkg_id.upper()
        try:
            resp = client.get(CSA_CKAN_PACKAGE_URL, params={"id": pkg_id}, timeout=6.0)
            if resp.status_code == 200:
                res = resp.json().get("result", {})
                title = str(res.get("title", title))
        except Exception:
            pass
        items.append(
            {
                "agency": "CSA",
                "mission": label,
                "product_id": title,
                "sensing_date": "Open Archive",
                "url": f"https://donnees-data.asc-csa.gc.ca/en/dataset/{pkg_id}",
            }
        )

    items.append(
        {
            "agency": "JAXA",
            "mission": "JAXA G-Portal (GCOM-C / AMSR2 / GSMaP)",
            "product_id": f"Region ({lat:.2f}, {lon:.2f})",
            "sensing_date": "Global Archive",
            "url": "https://gportal.jaxa.jp/gpr/search",
        }
    )
    items.append(
        {
            "agency": "ESA",
            "mission": "ESA Open Science Catalog",
            "product_id": "Geoscience Workflows & STAC",
            "sensing_date": "Open Catalog",
            "url": "https://opensciencedata.esa.int/",
        }
    )
    return items


def discover_space_agency_datasets(lat: float, lon: float) -> SpaceAgencyCatalogResult:
    """Aggregate real NASA CMR, ESA Copernicus, CSA RADARSAT & JAXA datasets for (lat, lon)."""
    with create_http_client(timeout=15.0) as client:
        nasa_items = query_nasa_cmr_granules(lat, lon, client)
        esa_items = query_esa_copernicus_products(lat, lon, client)
        csa_jaxa_items = query_csa_and_jaxa_references(lat, lon, client)

    return {
        "lat": round(lat, 4),
        "lon": round(lon, 4),
        "queried_at": datetime.now(timezone.utc).isoformat(),
        "products": [*nasa_items, *esa_items, *csa_jaxa_items],
    }

