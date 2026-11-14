"""FastAPI entrypoint for Ckepi backend."""

import asyncio
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from io import BytesIO
import json
import logging
from pathlib import Path
import threading
import time
import duckdb
import h3
import pandas as pd
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import httpx
from PIL import Image

logger = logging.getLogger("ckepi.api")

from app.config import (
    BREAKAGE_VARIABLES,
    DEPENDENT_VARIABLES,
    INDEPENDENT_VARIABLES,
    settings,
)
from app.engine.analog_matcher import load_earth_grid, match_terrestrial_analogs
from app.engine.causal_decomposer import compute_breakage_index, decompose_planetary_site
from app.engine.mission_advisor import resolve_profile_weights
from app.etl.earth_api import probe_earth_location
from app.etl.http_utils import create_async_http_client, create_http_client
from app.etl.geology_and_habitability import (
    evaluate_habitability_profile,
    evaluate_subsurface_analog,
    fetch_macrostrat_geology,
)
from app.etl.planetary_probe import probe_planetary_coordinate
from app.etl.space_agencies_api import discover_space_agency_datasets
from app.etl.seed_datasets import (
    ensure_datasets_built,
    load_cached_planetary_sites,
    upsert_earth_cell,
)
from app.models.schemas import (
    AnalogMatchItem,
    AnalogRefineRequest,
    AnalogRefineResponse,
    AnalogSearchRequest,
    AnalogSearchResponse,
    DecompositionModelType,
    DecompositionRequest,
    DecompositionResponse,
    EarthProbeRequest,
    MultiAgencyCatalogResponse,
    PlanetaryProbeRequest,
    PlanetaryProbeResponse,
    PlanetarySite,
    SiteComparisonResponse,
    VariableDelta,
)


class AppState:
    """In-memory index of planetary ROIs, caches, and concurrency locks."""

    sites_by_id: dict[str, PlanetarySite] = {}
    duckdb_path: Path | None = None
    decomposition_cache: OrderedDict[tuple[str, str], DecompositionResponse] = OrderedDict()
    tile_cache: OrderedDict[tuple[str, int, int, int], tuple[bytes, str]] = OrderedDict()
    probe_timestamps: dict[str, list[float]] = {}
    write_lock: threading.Lock = threading.Lock()
    async_http: httpx.AsyncClient | None = None


state = AppState()
MAX_TILE_CACHE_ENTRIES = 512
MAX_DECOMP_CACHE_ENTRIES = 128


def _enforce_probe_rate_limit(request: Request) -> None:
    """Simple sliding-window rate limiter per client IP for live external API probes."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    window_start = now - 60.0
    # Prune stale IP buckets periodically to prevent unbounded memory growth
    if len(state.probe_timestamps) > 256:
        stale_ips = [
            ip
            for ip, times in state.probe_timestamps.items()
            if not times or times[-1] < window_start
        ]
        for ip in stale_ips:
            state.probe_timestamps.pop(ip, None)
    history = [ts for ts in state.probe_timestamps.get(client_ip, []) if ts >= window_start]
    if len(history) >= settings.probe_rate_limit_per_min:
        raise HTTPException(
            status_code=429,
            detail={"error_key": "errors.rate_limited", "params": {}},
        )
    history.append(now)
    state.probe_timestamps[client_ip] = history


def _verify_admin_token(x_admin_token: str | None = Header(default=None)) -> None:
    """Require X-Admin-Token on dataset refresh when ADMIN_TOKEN is configured."""
    if settings.admin_token and x_admin_token != settings.admin_token:
        raise HTTPException(
            status_code=401,
            detail={"error_key": "errors.unauthorized", "params": {}},
        )


def _get_decomposition_cached(
    site: PlanetarySite,
    db_path: Path,
    model_type: DecompositionModelType,
) -> DecompositionResponse:
    key = (site.site_id, model_type)
    cached = state.decomposition_cache.get(key)
    if cached is not None:
        state.decomposition_cache.move_to_end(key)
        return cached
    df_ts = _load_planetary_timeseries(db_path, site.site_id)
    if df_ts.empty:
        raise HTTPException(
            status_code=404,
            detail={"error_key": "errors.timeseries_not_found", "params": {"site_id": site.site_id}},
        )
    decomp = decompose_planetary_site(site, df_ts, model_type=model_type)
    if not site.site_id.startswith("probe_"):
        state.decomposition_cache[key] = decomp
        if len(state.decomposition_cache) > MAX_DECOMP_CACHE_ENTRIES:
            state.decomposition_cache.popitem(last=False)
    return decomp


def _store_probed_site(site: PlanetarySite) -> None:
    """Store a probed site in memory while capping total dynamic entries."""
    state.sites_by_id[site.site_id] = site
    probed_keys = [k for k in state.sites_by_id if k.startswith("probe_")]
    while len(probed_keys) > settings.max_probed_sites:
        oldest = probed_keys.pop(0)
        state.sites_by_id.pop(oldest, None)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Build real-API Parquet/DuckDB datasets on startup and manage shared HTTP client."""
    state.duckdb_path = ensure_datasets_built()
    state.sites_by_id = {site.site_id: site for site in load_cached_planetary_sites()}
    state.async_http = create_async_http_client(timeout=20.0)
    try:
        yield
    finally:
        if state.async_http is not None:
            await state.async_http.aclose()
            state.async_http = None


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_site_or_404(site_id: str) -> PlanetarySite:
    """Return a planetary ROI or raise a structured i18n 404 error."""
    if not state.sites_by_id:
        state.sites_by_id = {s.site_id: s for s in load_cached_planetary_sites()}
    site = state.sites_by_id.get(site_id)
    if site is None:
        raise HTTPException(
            status_code=404,
            detail={"error_key": "errors.site_not_found", "params": {"site_id": site_id}},
        )
    return site


def _get_duckdb_path() -> Path:
    """Ensure DuckDB store exists and return its path."""
    if state.duckdb_path is None or not state.duckdb_path.exists():
        state.duckdb_path = ensure_datasets_built()
    return state.duckdb_path


def _load_planetary_timeseries(duckdb_path: Path, site_id: str) -> pd.DataFrame:
    """Fetch planetary ROI timeseries from DuckDB via parameterized query."""
    conn = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        return conn.execute(
            "SELECT * FROM planetary_timeseries WHERE site_id = ?", [site_id]
        ).df()
    finally:
        conn.close()


def _build_comparison_response(
    site: PlanetarySite,
    match: AnalogMatchItem,
    weights: dict[str, float] | None = None,
    dv_weights: dict[str, float] | None = None,
) -> SiteComparisonResponse:
    """Build variable-by-variable comparison payload for a site & Earth H3 match."""
    deltas: list[VariableDelta] = []
    iv_weights = weights or {}
    if dv_weights:
        dv_raw = {v: max(0.0, float(dv_weights.get(v, 0.0))) for v in DEPENDENT_VARIABLES}
        dv_sum = sum(dv_raw.values())
        norm_dv = (
            {v: dv_raw[v] / dv_sum for v in DEPENDENT_VARIABLES}
            if dv_sum > 1e-12
            else {v: 1.0 / len(DEPENDENT_VARIABLES) for v in DEPENDENT_VARIABLES}
        )
    else:
        norm_dv = {v: 1.0 / len(DEPENDENT_VARIABLES) for v in DEPENDENT_VARIABLES}
    for var in INDEPENDENT_VARIABLES:
        deltas.append(
            VariableDelta(
                variable=var,
                layer="independent",
                planetary_value=site.variables.independent[var],
                earth_value=match.earth_variables.independent[var],
                similarity_score=match.iv_similarity_breakdown[var],
                weight=round(float(iv_weights.get(var, 0.0)), 4),
                is_breakage=False,
            )
        )
    for var in DEPENDENT_VARIABLES:
        deltas.append(
            VariableDelta(
                variable=var,
                layer="dependent",
                planetary_value=site.variables.dependent[var],
                earth_value=match.earth_variables.dependent[var],
                similarity_score=match.dv_similarity_breakdown[var],
                weight=round(norm_dv[var], 4),
                is_breakage=False,
            )
        )
    for var in BREAKAGE_VARIABLES:
        p_val = site.variables.breakage[var]
        e_val = match.earth_variables.breakage[var]
        b_idx = compute_breakage_index(p_val, e_val)
        deltas.append(
            VariableDelta(
                variable=var,
                layer="breakage",
                planetary_value=p_val,
                earth_value=e_val,
                similarity_score=round(1.0 - b_idx, 4),
                weight=0.0,
                is_breakage=b_idx >= settings.breakage_alert_threshold,
            )
        )

    return SiteComparisonResponse(site=site, match=match, variable_deltas=deltas)


@app.get("/api/v1/health")
def health_check() -> dict[str, str]:
    """Readiness probe returning status key and API version."""
    return {"status": "ok", "version": settings.app_version}


@app.get("/api/v1/tiles/trek/{body}/{z}/{y}/{x}.jpg")
async def proxy_nasa_trek_tile(body: str, z: int, y: int, x: int) -> Response:
    """Proxy NASA Moon/Mars Trek WMTS raster tiles with bounds validation & LRU cache."""
    if body not in ("moon", "mars"):
        raise HTTPException(
            status_code=404,
            detail={"error_key": "errors.unknown_body", "params": {"body": body}},
        )
    if z < 0 or z > 8 or y < 0 or x < 0 or y >= (1 << z) or x >= (1 << (z + 1)):
        raise HTTPException(
            status_code=400,
            detail={"error_key": "errors.invalid_tile_coords", "params": {}},
        )

    cache_key = (body, z, y, x)
    cached = state.tile_cache.get(cache_key)
    if cached is not None:
        state.tile_cache.move_to_end(cache_key)
        content, media_type = cached
        return Response(
            content=content,
            media_type=media_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    if body == "moon":
        url = (
            "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02"
            f"/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
        )
    else:
        url = (
            "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m"
            f"/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
        )

    if state.async_http is not None:
        resp = await state.async_http.get(url, timeout=15.0)
    else:
        async with create_async_http_client(timeout=15.0) as client:
            resp = await client.get(url)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail={"error_key": "errors.tile_unavailable", "params": {}},
        )
    media_type = resp.headers.get("content-type", "image/jpeg")
    state.tile_cache[cache_key] = (resp.content, media_type)
    if len(state.tile_cache) > MAX_TILE_CACHE_ENTRIES:
        state.tile_cache.popitem(last=False)
    return Response(
        content=resp.content,
        media_type=media_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


PLANET_TEXTURE_LAYERS: dict[tuple[str, str], tuple[str, str]] = {
    ("moon", "moon_wac"): (
        "https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/2",
        "jpg",
    ),
    ("moon", "moon_lola"): (
        "https://trek.nasa.gov/tiles/Moon/EQ/LRO_LOLA_ClrShade_Global_128ppd_v04/1.0.0/default/default028mm/2",
        "png",
    ),
    ("mars", "mars_color"): (
        "https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/2",
        "jpg",
    ),
    ("mars", "mars_mola"): (
        "https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/2",
        "jpg",
    ),
}


@app.get("/api/v1/textures/planet/{body}/{layer}.jpg")
async def get_planetary_global_texture(body: str, layer: str) -> Response:
    """Return a seamless 2048x1024 equirectangular NASA Trek mosaic for the 3D Moon/Mars globe."""
    cfg = PLANET_TEXTURE_LAYERS.get((body, layer))
    if not cfg:
        raise HTTPException(status_code=404, detail="Unknown planetary body or layer")

    base_url, tile_ext = cfg
    cache_path = settings.data_dir / f"planet_texture_{body}_{layer}.jpg"
    if cache_path.exists():
        return Response(
            content=cache_path.read_bytes(),
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=604800"},
        )

    cols, rows = 8, 4
    tile_size = 256
    canvas = Image.new("RGB", (cols * tile_size, rows * tile_size))

    if state.async_http is not None:
        async def fetch_tile(x: int, y: int) -> tuple[int, int, bytes | None]:
            assert state.async_http is not None
            resp = await state.async_http.get(f"{base_url}/{y}/{x}.{tile_ext}", timeout=20.0)
            return x, y, (resp.content if resp.status_code == 200 else None)

        tasks = [fetch_tile(x, y) for y in range(rows) for x in range(cols)]
        tiles = await asyncio.gather(*tasks)
    else:
        async with create_async_http_client(timeout=20.0) as client:
            async def fetch_tile_local(x: int, y: int) -> tuple[int, int, bytes | None]:
                resp = await client.get(f"{base_url}/{y}/{x}.{tile_ext}")
                return x, y, (resp.content if resp.status_code == 200 else None)

            tasks = [fetch_tile_local(x, y) for y in range(rows) for x in range(cols)]
            tiles = await asyncio.gather(*tasks)

    for x, y, data in tiles:
        if data:
            tile_img = Image.open(BytesIO(data)).convert("RGB")
            canvas.paste(tile_img, (x * tile_size, y * tile_size))

    buf = BytesIO()
    canvas.save(buf, format="JPEG", quality=88)
    raw_bytes = buf.getvalue()
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(raw_bytes)
    return Response(
        content=raw_bytes,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=604800"},
    )


@app.get("/api/v1/textures/planet/{body}.jpg")
async def get_planetary_default_texture(body: str) -> Response:
    """Default global texture endpoint for backwards compatibility."""
    default_layer = "moon_wac" if body == "moon" else "mars_color"
    return await get_planetary_global_texture(body, default_layer)


@app.get("/api/v1/planetary-sites", response_model=list[PlanetarySite])
def list_planetary_sites() -> list[PlanetarySite]:
    """Return all curated Moon and Mars target ROIs with real provenance."""
    if not state.sites_by_id:
        state.sites_by_id = {s.site_id: s for s in load_cached_planetary_sites()}
    return list(state.sites_by_id.values())


@app.post("/api/v1/datasets/refresh", dependencies=[Depends(_verify_admin_token)])
def refresh_datasets() -> dict[str, str]:
    """Re-hydrate planetary and Earth H3 datasets directly from live NASA & Open-Meteo APIs."""
    try:
        with state.write_lock:
            state.duckdb_path = ensure_datasets_built(force=True)
            state.sites_by_id = {s.site_id: s for s in load_cached_planetary_sites()}
            state.decomposition_cache.clear()
        return {"status": "refreshed"}
    except Exception as exc:
        logger.exception("Dataset refresh failed")
        raise HTTPException(
            status_code=502,
            detail={"error_key": "errors.external_api_unavailable", "params": {}},
        ) from exc


@app.post("/api/v1/decompose", response_model=DecompositionResponse)
def run_decomposition(payload: DecompositionRequest) -> DecompositionResponse:
    """Decompose dependent climate responses Y into independent forcings X and breakage B."""
    site = _get_site_or_404(payload.site_id)
    db_path = _get_duckdb_path()
    return _get_decomposition_cached(site, db_path, payload.model_type)


@app.post("/api/v1/analogs/search", response_model=AnalogSearchResponse)
def search_analogs(payload: AnalogSearchRequest) -> AnalogSearchResponse:
    """Run causal decomposition on the planetary site and score Earth H3 cells."""
    site = _get_site_or_404(payload.site_id)
    db_path = _get_duckdb_path()
    decomposition = _get_decomposition_cached(site, db_path, payload.model_type)

    df_earth = load_earth_grid(db_path, exclude_benchmarks=payload.exclude_benchmarks)
    return match_terrestrial_analogs(
        site=site,
        causal_weights=decomposition.global_iv_weights,
        df_earth=df_earth,
        min_s_ind=payload.min_s_ind,
        min_s_dep=payload.min_s_dep,
        limit=payload.limit,
        custom_weights=resolve_profile_weights(payload.test_profile, payload.custom_iv_weights),
        custom_dv_weights=payload.custom_dv_weights,
        custom_min_similarity=payload.custom_min_similarity,
        penalize_estimated=payload.penalize_estimated,
    )


@app.post(
    "/api/v1/planetary/probe",
    response_model=PlanetaryProbeResponse,
    dependencies=[Depends(_enforce_probe_rate_limit)],
)
def probe_planetary_location(payload: PlanetaryProbeRequest) -> PlanetaryProbeResponse:
    """Probe any Moon or Mars (lat, lon), decompose its variables, and match globally on Earth."""
    db_path = _get_duckdb_path()
    try:
        site, df_ts = probe_planetary_coordinate(
            body=payload.body,
            lat=payload.lat,
            lon=payload.lon,
        )
    except Exception as exc:
        logger.exception("Planetary probe failed for %s (%s, %s)", payload.body, payload.lat, payload.lon)
        raise HTTPException(
            status_code=502,
            detail={"error_key": "errors.external_api_unavailable", "params": {}},
        ) from exc

    _store_probed_site(site)
    with state.write_lock:
        conn = duckdb.connect(str(db_path))
        try:
            conn.execute("DELETE FROM planetary_timeseries WHERE site_id = ?", [site.site_id])
            conn.register("probe_ts_df", df_ts)
            conn.execute("INSERT INTO planetary_timeseries BY NAME SELECT * FROM probe_ts_df")
            conn.unregister("probe_ts_df")
        finally:
            conn.close()

    decomposition = decompose_planetary_site(site, df_ts, model_type=payload.model_type)
    df_earth = load_earth_grid(db_path, exclude_benchmarks=payload.exclude_benchmarks)
    analogs = match_terrestrial_analogs(
        site=site,
        causal_weights=decomposition.global_iv_weights,
        df_earth=df_earth,
        min_s_ind=payload.min_s_ind,
        min_s_dep=payload.min_s_dep,
        limit=payload.limit,
        custom_weights=resolve_profile_weights(payload.test_profile, payload.custom_iv_weights),
        custom_dv_weights=payload.custom_dv_weights,
        custom_min_similarity=payload.custom_min_similarity,
        penalize_estimated=payload.penalize_estimated,
    )
    top_comp = (
        _build_comparison_response(
            site, analogs.matches[0], analogs.causal_weights_used, payload.custom_dv_weights
        )
        if analogs.matches
        else None
    )
    return PlanetaryProbeResponse(
        site=site,
        decomposition=decomposition,
        analogs=analogs,
        top_comparison=top_comp,
    )


@app.post(
    "/api/v1/earth/probe",
    response_model=SiteComparisonResponse,
    dependencies=[Depends(_enforce_probe_rate_limit)],
)
def probe_earth_coordinate(payload: EarthProbeRequest) -> SiteComparisonResponse:
    """Probe any Earth coordinate live via NASA POWER + Open-Meteo, store H3 cell & score it."""
    site = _get_site_or_404(payload.site_id)
    db_path = _get_duckdb_path()

    try:
        cell_record = probe_earth_location(
            lat=payload.lat,
            lon=payload.lon,
            h3_resolution=settings.default_h3_resolution,
            is_live_probed=True,
        )
    except Exception as exc:
        logger.exception("Earth probe failed for (%s, %s)", payload.lat, payload.lon)
        raise HTTPException(
            status_code=502,
            detail={"error_key": "errors.external_api_unavailable", "params": {}},
        ) from exc

    with state.write_lock:
        upsert_earth_cell(db_path, cell_record)

    conn = duckdb.connect(str(db_path), read_only=True)
    try:
        df_cell = conn.execute(
            "SELECT * FROM earth_h3_grid WHERE earth_cell_h3 = ?",
            [str(cell_record["earth_cell_h3"])],
        ).df()
    finally:
        conn.close()

    decomposition = _get_decomposition_cached(site, db_path, payload.model_type)
    search_res = match_terrestrial_analogs(
        site=site,
        causal_weights=decomposition.global_iv_weights,
        df_earth=df_cell,
        limit=1,
    )
    return _build_comparison_response(site, search_res.matches[0], search_res.causal_weights_used)


@app.get("/api/v1/analogs/{h3_index}/compare/{site_id}", response_model=SiteComparisonResponse)
def compare_cell_with_site(
    h3_index: str,
    site_id: str,
    model_type: DecompositionModelType = Query(default="ridge"),
) -> SiteComparisonResponse:
    """Compare one specific Earth H3 cell side-by-side against a planetary ROI."""
    site = _get_site_or_404(site_id)
    db_path = _get_duckdb_path()

    conn = duckdb.connect(str(db_path), read_only=True)
    try:
        df_cell = conn.execute(
            "SELECT * FROM earth_h3_grid WHERE earth_cell_h3 = ?", [h3_index]
        ).df()
    finally:
        conn.close()

    if df_cell.empty:
        raise HTTPException(
            status_code=404,
            detail={"error_key": "errors.cell_not_found", "params": {"h3_index": h3_index}},
        )

    df_ts = _load_planetary_timeseries(db_path, site.site_id)
    decomposition = decompose_planetary_site(site, df_ts, model_type=model_type)
    search_res = match_terrestrial_analogs(
        site=site,
        causal_weights=decomposition.global_iv_weights,
        df_earth=df_cell,
        limit=1,
    )
    return _build_comparison_response(site, search_res.matches[0], search_res.causal_weights_used)


@app.get("/api/v1/earth/{h3_index}/datasets", response_model=MultiAgencyCatalogResponse)
def get_earth_cell_datasets(h3_index: str) -> MultiAgencyCatalogResponse:
    """Discover real NASA CMR, ESA Copernicus, CSA & JAXA open datasets for an Earth H3 cell."""
    db_path = _get_duckdb_path()
    conn = duckdb.connect(str(db_path), read_only=True)
    try:
        row = conn.execute(
            """
            SELECT lat, lon, mean_surface_temp_k, aridity_index, uv_irradiance_index, subsurface_ice_frac
            FROM earth_h3_grid WHERE earth_cell_h3 = ?
            """,
            [h3_index],
        ).fetchone()
    finally:
        conn.close()

    if row is None:
        raise HTTPException(
            status_code=404,
            detail={"error_key": "errors.cell_not_found", "params": {"h3_index": h3_index}},
        )

    lat, lon = float(row[0]), float(row[1])
    mean_temp_k = float(row[2])
    aridity_index = float(row[3])
    uv_index = float(row[4])
    subsurface_ice_frac = float(row[5])

    catalog = discover_space_agency_datasets(lat=lat, lon=lon)
    with create_http_client(timeout=5.0) as client:
        geology = fetch_macrostrat_geology(lat=lat, lon=lon, client=client)
    subsurface = evaluate_subsurface_analog(lat=lat, lon=lon, geology=geology)
    habitability = evaluate_habitability_profile(
        mean_temp_k=mean_temp_k,
        aridity_index=aridity_index,
        uv_index=uv_index,
        subsurface_ice_frac=subsurface_ice_frac,
        geology=geology,
    )
    return MultiAgencyCatalogResponse(
        earth_cell_h3=h3_index,
        lat=catalog["lat"],
        lon=catalog["lon"],
        queried_at=catalog["queried_at"],
        products=catalog["products"],
        geology=geology,
        subsurface=subsurface,
        habitability=habitability,
    )


@app.post(
    "/api/v1/analogs/refine",
    response_model=AnalogRefineResponse,
    dependencies=[Depends(_enforce_probe_rate_limit)],
)
def refine_analog_cell(payload: AnalogRefineRequest) -> AnalogRefineResponse:
    """Subdivide an Earth H3 cell into 7 finer child cells, hydrate via live APIs, and score them."""
    if not h3.is_valid_cell(payload.earth_cell_h3):
        raise HTTPException(
            status_code=400,
            detail={"error_key": "errors.cell_not_found", "params": {"h3_index": payload.earth_cell_h3}},
        )

    site = _get_site_or_404(payload.site_id)
    db_path = _get_duckdb_path()
    parent_res = h3.get_resolution(payload.earth_cell_h3)
    child_res = min(parent_res + 1, 5)
    child_cells = sorted(h3.cell_to_children(payload.earth_cell_h3, child_res))[:7]

    def _hydrate_child(child_id: str) -> dict[str, object]:
        c_lat, c_lon = h3.cell_to_latlng(child_id)
        return probe_earth_location(
            lat=c_lat,
            lon=c_lon,
            region_key="regions.custom_probed_cell",
            country_code="--",
            biome_key="biomes.probed_location",
            is_benchmark=False,
            h3_resolution=child_res,
            is_live_probed=True,
        )

    try:
        with ThreadPoolExecutor(max_workers=4) as pool:
            child_records = list(pool.map(_hydrate_child, child_cells))
    except Exception as exc:
        logger.exception("H3 cell refinement failed for %s", payload.earth_cell_h3)
        raise HTTPException(
            status_code=502,
            detail={"error_key": "errors.external_api_unavailable", "params": {}},
        ) from exc

    with state.write_lock:
        for rec in child_records:
            upsert_earth_cell(db_path, rec)

    df_children = pd.DataFrame(child_records)
    df_children["h3_boundary_json"] = df_children["h3_boundary_json"].apply(
        lambda v: v if isinstance(v, str) else json.dumps(v)
    )
    df_children["source_apis_json"] = df_children["source_apis_json"].apply(
        lambda v: v if isinstance(v, str) else json.dumps(v)
    )

    decomposition = _get_decomposition_cached(site, db_path, payload.model_type)
    search_res = match_terrestrial_analogs(
        site=site,
        causal_weights=decomposition.global_iv_weights,
        df_earth=df_children,
        limit=len(child_records),
        custom_weights=resolve_profile_weights(payload.test_profile, None),
        penalize_estimated=payload.penalize_estimated,
    )
    top_comp = (
        _build_comparison_response(site, search_res.matches[0], search_res.causal_weights_used)
        if search_res.matches
        else None
    )
    return AnalogRefineResponse(
        parent_h3=payload.earth_cell_h3,
        child_resolution=child_res,
        matches=search_res.matches,
        top_comparison=top_comp,
    )
