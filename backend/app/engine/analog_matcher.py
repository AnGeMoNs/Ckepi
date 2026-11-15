"""Geospatial analog matcher computing S_ind, S_dep, and R_break over Earth H3 cells."""

from collections import OrderedDict
from dataclasses import dataclass
import json
from pathlib import Path
import duckdb
import numpy as np
import pandas as pd

from app.config import (
    BREAKAGE_VARIABLES,
    DEPENDENT_VARIABLES,
    FEATURE_SCALES,
    INDEPENDENT_VARIABLES,
)
from app.engine.causal_decomposer import build_breakage_profile
from app.engine.known_analogs import KNOWN_ANALOG_SITES
from app.engine.mission_advisor import evaluate_mission_recommendations
from app.models.schemas import (
    AnalogMatchItem,
    AnalogSearchResponse,
    Coordinates,
    DataProvenance,
    DistanceMetricType,
    EngineeringRecommendations,
    PhysicalVariables,
    PlanetarySite,
    ViabilityTier,
)

_SCALE_MAP: dict[int, float] = {0: 1107.7, 1: 418.7, 2: 158.2, 3: 59.8, 4: 22.6, 5: 8.5, 6: 3.2}
_IV_SCALES = np.array([max(float(FEATURE_SCALES[c]), 1e-6) for c in INDEPENDENT_VARIABLES], dtype=np.float64)
_DV_SCALES = np.array([max(float(FEATURE_SCALES[c]), 1e-6) for c in DEPENDENT_VARIABLES], dtype=np.float64)
_IV_INDEX = {col: idx for idx, col in enumerate(INDEPENDENT_VARIABLES)}
_DV_INDEX = {col: idx for idx, col in enumerate(DEPENDENT_VARIABLES)}
_SITE_LATS_RAD = np.radians([s["lat"] for s in KNOWN_ANALOG_SITES])[None, :]
_SITE_LONS_RAD = np.radians([s["lon"] for s in KNOWN_ANALOG_SITES])[None, :]
_SITE_RADII = np.array([s["radius_km"] for s in KNOWN_ANALOG_SITES], dtype=np.float64)[None, :]


@dataclass(frozen=True)
class _PreparedEarthGrid:
    iv_mat: np.ndarray
    dv_mat: np.ndarray
    breakage_mat: np.ndarray
    lats: np.ndarray
    lons: np.ndarray
    h3_cells: list[str]
    h3_res: np.ndarray
    region_keys: list[str]
    country_codes: list[str]
    biome_keys: list[str]
    is_benchmarks: np.ndarray
    boundaries: list[list[list[float]]]
    boundaries_compact: list[list[list[float]]]
    source_apis: list[list[str]]
    obs_windows: list[str]
    fetched_ats: list[str]
    is_live_probed: list[bool]
    known_names: list[str | None]


_PREPARED_GRID_BY_ID: OrderedDict[int, tuple[pd.DataFrame, _PreparedEarthGrid]] = OrderedDict()


def _match_known_analog_batch(lats: np.ndarray, lons: np.ndarray) -> list[str | None]:
    """Vectorized matching of Earth cell centers to curated literature benchmark sites."""
    if len(lats) == 0:
        return []
    lat1_r = np.radians(lats)[:, None]
    lon1_r = np.radians(lons)[:, None]
    dlat = _SITE_LATS_RAD - lat1_r
    dlon = _SITE_LONS_RAD - lon1_r
    a = np.sin(dlat * 0.5) ** 2 + np.cos(lat1_r) * np.cos(_SITE_LATS_RAD) * np.sin(dlon * 0.5) ** 2
    dists = 2.0 * 6371.0 * np.arcsin(np.minimum(1.0, np.sqrt(a)))
    masked = np.where(dists <= _SITE_RADII, dists, np.inf)
    best_idx = np.argmin(masked, axis=1)
    has_match = np.isfinite(masked[np.arange(len(lats)), best_idx])
    return [
        KNOWN_ANALOG_SITES[int(j)]["name"] if ok else None
        for j, ok in zip(best_idx, has_match)
    ]


def _parse_json_list_field(values: list[object]) -> list[list[list[float]]]:
    parsed: list[list[list[float]]] = []
    for raw in values:
        if isinstance(raw, str):
            parsed.append(json.loads(raw))
        else:
            parsed.append(list(raw))  # type: ignore[arg-type]
    return parsed


def _parse_source_apis_field(values: list[object]) -> list[list[str]]:
    parsed: list[list[str]] = []
    for raw in values:
        items = json.loads(raw) if isinstance(raw, str) else list(raw)  # type: ignore[arg-type]
        parsed.append([str(s) for s in items])
    return parsed


def _prepare_earth_grid(df_earth: pd.DataFrame) -> _PreparedEarthGrid:
    n = len(df_earth)
    # Store grids are immutable snapshots invalidated by database mtime. Arbitrary
    # caller-owned frames may be edited in place, so never cache them by identity.
    cacheable = n >= 50 and any(df_earth is cached for cached in tuple(_EARTH_GRID_CACHE.values()))
    if cacheable:
        cache_entry = _PREPARED_GRID_BY_ID.get(id(df_earth))
        if cache_entry is not None and cache_entry[0] is df_earth and len(cache_entry[0]) == n:
            _PREPARED_GRID_BY_ID.move_to_end(id(df_earth))
            return cache_entry[1]

    iv_mat = df_earth[list(INDEPENDENT_VARIABLES)].to_numpy(dtype=np.float64)
    dv_mat = df_earth[list(DEPENDENT_VARIABLES)].to_numpy(dtype=np.float64)
    breakage_mat = df_earth[list(BREAKAGE_VARIABLES)].to_numpy(dtype=np.float64)
    lats = df_earth["lat"].to_numpy(dtype=np.float64)
    lons = df_earth["lon"].to_numpy(dtype=np.float64)
    boundaries = _parse_json_list_field(df_earth["h3_boundary_json"].tolist())
    boundaries_compact = [
        [[round(float(pt[0]), 4), round(float(pt[1]), 4)] for pt in poly]
        for poly in boundaries
    ]
    source_raw = (
        df_earth["source_apis_json"].tolist()
        if "source_apis_json" in df_earth.columns
        else ["[]"] * n
    )
    obs_raw = (
        [str(v) for v in df_earth["observation_window"].tolist()]
        if "observation_window" in df_earth.columns
        else [""] * n
    )
    fetched_raw = (
        [str(v) for v in df_earth["fetched_at"].tolist()]
        if "fetched_at" in df_earth.columns
        else [""] * n
    )
    live_raw = (
        [bool(v) for v in df_earth["is_live_probed"].tolist()]
        if "is_live_probed" in df_earth.columns
        else [False] * n
    )

    grid = _PreparedEarthGrid(
        iv_mat=iv_mat,
        dv_mat=dv_mat,
        breakage_mat=breakage_mat,
        lats=lats,
        lons=lons,
        h3_cells=[str(v) for v in df_earth["earth_cell_h3"].tolist()],
        h3_res=df_earth["h3_resolution"].to_numpy(dtype=np.int64),
        region_keys=[str(v) for v in df_earth["region_key"].tolist()],
        country_codes=[str(v) for v in df_earth["country_code"].tolist()],
        biome_keys=[str(v) for v in df_earth["biome_key"].tolist()],
        is_benchmarks=df_earth["is_benchmark"].to_numpy(dtype=bool),
        boundaries=boundaries,
        boundaries_compact=boundaries_compact,
        source_apis=_parse_source_apis_field(source_raw),
        obs_windows=obs_raw,
        fetched_ats=fetched_raw,
        is_live_probed=live_raw,
        known_names=_match_known_analog_batch(lats, lons),
    )

    if cacheable:
        _PREPARED_GRID_BY_ID[id(df_earth)] = (df_earth, grid)
        while len(_PREPARED_GRID_BY_ID) > 8:
            _PREPARED_GRID_BY_ID.popitem(last=False)
    return grid


def _compute_pareto_mask(objs: np.ndarray, query_indices: np.ndarray | None = None) -> np.ndarray:
    """Compute exact Pareto non-dominated boolean mask over (s_ind, s_dep, 1 - r_break_overall)."""
    m = len(objs)
    if m == 0:
        return np.zeros(0, dtype=bool)
    uniq_objs, inv = np.unique(objs, axis=0, return_inverse=True)
    # Rank-limited responses need only those candidates' flags, while dominance
    # must still be tested against every eligible cell, including the hidden tail.
    queries = uniq_objs if query_indices is None else uniq_objs[inv[query_indices]]
    u = len(uniq_objs)
    top_k = min(u, 64)
    top_indices = np.argpartition(np.sum(uniq_objs, axis=1), -top_k)[-top_k:]
    anchors = uniq_objs[top_indices]

    ge_top = np.all(anchors[None, :, :] >= queries[:, None, :] - 1e-6, axis=2)
    gt_top = np.any(anchors[None, :, :] > queries[:, None, :] + 0.002, axis=2)
    dominated = np.any(ge_top & gt_top, axis=1)

    survivors = np.flatnonzero(~dominated)
    chunk_size = 128
    for start in range(0, len(survivors), chunk_size):
        chunk_idx = survivors[start : start + chunk_size]
        chunk = queries[chunk_idx]
        ge_all = np.all(uniq_objs[None, :, :] >= chunk[:, None, :] - 1e-6, axis=2)
        gt_any = np.any(uniq_objs[None, :, :] > chunk[:, None, :] + 0.002, axis=2)
        dominated[chunk_idx] = np.any(ge_all & gt_any, axis=1)

    return (~dominated)[inv] if query_indices is None else ~dominated


def _normalize_custom_weights(
    custom_weights: dict[str, float] | None,
    variables: tuple[str, ...] = INDEPENDENT_VARIABLES,
) -> dict[str, float] | None:
    """Validate and normalize optional user-supplied variable weights."""
    if not custom_weights:
        return None
    raw = {col: max(0.0, float(custom_weights.get(col, 0.0))) for col in variables}
    total = sum(raw.values())
    if total <= 1e-12:
        return None
    return {col: val / total for col, val in raw.items()}


def _compute_variable_similarity(p_val: float, e_val: float, scale: float) -> float:
    """Exponential normalized L1 similarity in (0, 1]."""
    diff = abs(p_val - e_val) / max(scale, 1e-6)
    return float(np.exp(-diff))


CURATED_CELL_METADATA: dict[str, tuple[str, str, str, bool]] = {
    "83b220fffffffff": ("regions.atacama_yungay", "CL", "biomes.hyperarid_desert", True),
    "832985fffffffff": ("regions.mojave_death_valley", "US", "biomes.hyperarid_desert", True),
    "83b22afffffffff": ("regions.puna_ojos_salado", "CL", "biomes.high_altitude_volcanic", False),
    "83b225fffffffff": ("regions.antofagasta_cordillera_sal", "CL", "biomes.evaporite_playa", False),
    "83b221fffffffff": ("regions.antofagasta_salar_pajonales", "CL", "biomes.high_altitude_volcanic", False),
    "83b224fffffffff": ("regions.antofagasta_pampa_central", "CL", "biomes.hyperarid_desert", False),
}

_EARTH_GRID_CACHE: dict[tuple[str, int, bool], pd.DataFrame] = {}


def normalize_earth_grid_metadata(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure curated regional anchors and Antofagasta sectors retain accurate labels in memory."""
    if df.empty or "earth_cell_h3" not in df.columns:
        return df
    out = df.copy()
    for cell_id, (reg_key, country, biome, is_bench) in CURATED_CELL_METADATA.items():
        mask = out["earth_cell_h3"] == cell_id
        if mask.any():
            out.loc[mask, "region_key"] = reg_key
            out.loc[mask, "country_code"] = country
            out.loc[mask, "biome_key"] = biome
            out.loc[mask, "is_benchmark"] = is_bench
    return out


def load_earth_grid(duckdb_path: Path, exclude_benchmarks: bool = False) -> pd.DataFrame:
    """Query Earth H3 grid from DuckDB using parameterized filtering with mtime cache."""
    resolved = duckdb_path.resolve()
    mtime_ns = resolved.stat().st_mtime_ns if resolved.exists() else 0
    cache_key = (str(resolved), mtime_ns, exclude_benchmarks)
    cached = _EARTH_GRID_CACHE.get(cache_key)
    if cached is not None:
        return cached

    conn = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        df = normalize_earth_grid_metadata(conn.execute("SELECT * FROM earth_h3_grid").df())
        if exclude_benchmarks:
            df = df[~df["is_benchmark"]].reset_index(drop=True)
            if not df.empty:
                known = _match_known_analog_batch(
                    df["lat"].to_numpy(dtype=np.float64),
                    df["lon"].to_numpy(dtype=np.float64),
                )
                mask = np.array([name is None for name in known], dtype=bool)
                df = df[mask].reset_index(drop=True)
        if len(_EARTH_GRID_CACHE) >= 8:
            _EARTH_GRID_CACHE.clear()
        _EARTH_GRID_CACHE[cache_key] = df
        return df
    finally:
        conn.close()


def _build_precision_matrix(
    df_earth: pd.DataFrame,
    columns: tuple[str, ...],
    shrinkage: float = 0.28,
) -> np.ndarray | None:
    """Compute Ledoit-Wolf style shrinkage precision matrix (inverse correlation) for Mahalanobis distance."""
    n = len(columns)
    if len(df_earth) < max(8, n):
        return None
    try:
        mat = np.column_stack(
            [df_earth[col].to_numpy(dtype=float) / max(FEATURE_SCALES[col], 1e-6) for col in columns]
        )
        corr = np.corrcoef(mat, rowvar=False)
        if corr.shape != (n, n) or not np.all(np.isfinite(corr)):
            return None
        reg_corr = (1.0 - shrinkage) * corr + shrinkage * np.eye(n, dtype=float)
        inv_corr = np.linalg.inv(reg_corr)
        mean_diag = float(np.mean(np.diag(inv_corr)))
        return inv_corr / max(mean_diag, 1e-6)
    except Exception:
        return None


def _mark_pareto_frontier(items: list[AnalogMatchItem]) -> None:
    """Mark non-dominated candidates across (s_ind, s_dep, 1 - r_break_overall)."""
    if not items:
        return
    objs = np.array(
        [[m.s_ind, m.s_dep, round(1.0 - m.r_break_overall, 4)] for m in items],
        dtype=float,
    )
    pareto_mask = _compute_pareto_mask(objs)
    for item, is_p in zip(items, pareto_mask):
        item.is_pareto_optimal = bool(is_p)


def match_terrestrial_analogs(
    site: PlanetarySite,
    causal_weights: dict[str, float],
    df_earth: pd.DataFrame,
    min_s_ind: float = 0.0,
    min_s_dep: float = 0.0,
    limit: int = 25,
    custom_weights: dict[str, float] | None = None,
    custom_dv_weights: dict[str, float] | None = None,
    custom_min_similarity: dict[str, float] | None = None,
    penalize_estimated: bool = False,
    distance_metric: DistanceMetricType = "euclidean",
    compact_tail: bool = False,
    detail_limit: int = 250,
) -> AnalogSearchResponse:
    """Score every Earth H3 cell against a planetary ROI using decoupled S_ind, S_dep, R_break."""
    ignore_ind = custom_weights is not None and _normalize_custom_weights(custom_weights, INDEPENDENT_VARIABLES) is None
    ignore_dv = custom_dv_weights is not None and _normalize_custom_weights(custom_dv_weights, DEPENDENT_VARIABLES) is None

    active_weights = _normalize_custom_weights(custom_weights, INDEPENDENT_VARIABLES) or causal_weights
    w_total = sum(active_weights.get(col, 0.0) for col in INDEPENDENT_VARIABLES)
    norm_w = {
        col: (active_weights.get(col, 0.0) / w_total if w_total > 0 else 1.0 / len(INDEPENDENT_VARIABLES))
        for col in INDEPENDENT_VARIABLES
    }
    norm_dv_w = _normalize_custom_weights(custom_dv_weights, DEPENDENT_VARIABLES) or {
        col: 1.0 / len(DEPENDENT_VARIABLES) for col in DEPENDENT_VARIABLES
    }

    if df_earth.empty:
        return AnalogSearchResponse(
            site_id=site.site_id,
            body=site.body,
            distance_metric=distance_metric,
            total_evaluated=0,
            returned_count=0,
            causal_weights_used={k: round(v, 4) for k, v in norm_w.items()},
            matches=[],
        )

    grid = _prepare_earth_grid(df_earth)
    n_rows = len(df_earth)
    p_iv = site.variables.independent
    p_dv = site.variables.dependent
    p_iv_arr = np.array([float(p_iv[c]) for c in INDEPENDENT_VARIABLES], dtype=np.float64)
    p_dv_arr = np.array([float(p_dv[c]) for c in DEPENDENT_VARIABLES], dtype=np.float64)
    p_b_arr = np.array([float(site.variables.breakage[c]) for c in BREAKAGE_VARIABLES], dtype=np.float64)

    w_iv_arr = np.array([norm_w[c] for c in INDEPENDENT_VARIABLES], dtype=np.float64)
    w_dv_arr = np.array([norm_dv_w[c] for c in DEPENDENT_VARIABLES], dtype=np.float64)
    sqrt_w_iv = np.sqrt(w_iv_arr)
    sqrt_w_dv = np.sqrt(w_dv_arr)

    prec_iv = (
        _build_precision_matrix(df_earth, INDEPENDENT_VARIABLES)
        if distance_metric == "mahalanobis"
        else None
    )
    prec_dv = (
        _build_precision_matrix(df_earth, DEPENDENT_VARIABLES)
        if distance_metric == "mahalanobis"
        else None
    )

    # Vectorized Independent Similarity S_ind
    iv_diffs = (p_iv_arr[None, :] - grid.iv_mat) / _IV_SCALES[None, :]
    iv_sim_rounded = np.round(np.exp(-np.abs(iv_diffs)), 4)
    sq_dist_ind = (iv_diffs ** 2) @ w_iv_arr
    if prec_iv is not None:
        u_iv = iv_diffs * sqrt_w_iv[None, :]
        mahal_ind = np.einsum("ni,ij,nj->n", u_iv, prec_iv, u_iv)
        sq_dist_ind = np.where(mahal_ind > 0.0, mahal_ind, sq_dist_ind)
    s_ind_arr = np.ones(n_rows, dtype=np.float64) if ignore_ind else np.exp(-np.sqrt(np.maximum(0.0, sq_dist_ind)))

    # Vectorized Dependent Similarity S_dep
    dv_diffs = (p_dv_arr[None, :] - grid.dv_mat) / _DV_SCALES[None, :]
    dv_sim_rounded = np.round(np.exp(-np.abs(dv_diffs)), 4)
    sq_dist_dep = (dv_diffs ** 2) @ w_dv_arr
    if prec_dv is not None:
        u_dv = dv_diffs * sqrt_w_dv[None, :]
        mahal_dep = np.einsum("ni,ij,nj->n", u_dv, prec_dv, u_dv)
        sq_dist_dep = np.where(mahal_dep > 0.0, mahal_dep, sq_dist_dep)
    s_dep_arr = np.ones(n_rows, dtype=np.float64) if ignore_dv else np.exp(-np.sqrt(np.maximum(0.0, sq_dist_dep)))

    mask = np.ones(n_rows, dtype=bool)
    if not ignore_ind and min_s_ind > 0.0:
        mask &= s_ind_arr >= min_s_ind
    if not ignore_dv and min_s_dep > 0.0:
        mask &= s_dep_arr >= min_s_dep

    if custom_min_similarity:
        for col, min_req in custom_min_similarity.items():
            req = float(min_req)
            if req <= 0.0:
                continue
            if col in _IV_INDEX:
                mask &= iv_sim_rounded[:, _IV_INDEX[col]] >= req
            elif col in _DV_INDEX:
                mask &= dv_sim_rounded[:, _DV_INDEX[col]] >= req

    valid_idx = np.flatnonzero(mask)
    if len(valid_idx) == 0:
        return AnalogSearchResponse(
            site_id=site.site_id,
            body=site.body,
            distance_metric=distance_metric,
            total_evaluated=n_rows,
            returned_count=0,
            causal_weights_used={k: round(v, 4) for k, v in norm_w.items()},
            matches=[],
        )

    b_sub = grid.breakage_mat[valid_idx]
    denom_b = np.maximum(np.maximum(np.abs(p_b_arr[None, :]), np.abs(b_sub)), 1e-9)
    r_break_arr = np.mean(np.minimum(1.0, np.abs(p_b_arr[None, :] - b_sub) / denom_b), axis=1)

    s_ind_valid = s_ind_arr[valid_idx]
    s_dep_valid = s_dep_arr[valid_idx]

    if ignore_ind and not ignore_dv:
        combined_raw = s_dep_valid
    elif ignore_dv and not ignore_ind:
        combined_raw = s_ind_valid
    else:
        combined_raw = 0.60 * s_ind_valid + 0.40 * s_dep_valid

    conf_score = site.confidence.score if site.confidence else 0.70
    combined_rounded = np.round(combined_raw, 4)
    conf_adj_rounded = np.round(combined_raw * (0.75 + 0.25 * conf_score), 4)

    sort_key = conf_adj_rounded if penalize_estimated else combined_rounded
    order = np.argsort(-sort_key, kind="mergesort")
    top_pos = order[:limit]

    all_objs = np.column_stack(
        [
            np.round(s_ind_valid, 4),
            np.round(s_dep_valid, 4),
            np.round(1.0 - np.round(r_break_arr, 4), 4),
        ]
    )
    pareto_top = _compute_pareto_mask(all_objs, top_pos)

    # Decide which ranked positions receive full diagnostic payloads when compact_tail=True.
    full_detail_ranks: set[int] | None = None
    if compact_tail:
        full_detail_ranks = set(range(min(len(top_pos), detail_limit)))
        disc_added = 0
        bench_added = 0
        for rank_idx, pos in enumerate(top_pos):
            orig = int(valid_idx[pos])
            eff_bench = bool(grid.is_benchmarks[orig]) or (grid.known_names[orig] is not None)
            if eff_bench and bench_added < 5:
                full_detail_ranks.add(rank_idx)
                bench_added += 1
            elif not eff_bench and disc_added < 10:
                full_detail_ranks.add(rank_idx)
                disc_added += 1
            if bench_added >= 5 and disc_added >= 10 and rank_idx >= detail_limit:
                break

    all_sims_rounded = np.concatenate([iv_sim_rounded, dv_sim_rounded], axis=1)
    jackknife_all = np.std(all_sims_rounded, axis=1) / np.sqrt(all_sims_rounded.shape[1])

    arid_idx = _IV_INDEX["aridity_index"]
    lai_idx = _IV_INDEX["vegetation_lai_proxy"]
    slope_idx = _IV_INDEX["slope_deg"]
    temp_idx = _DV_INDEX["mean_surface_temp_k"]
    rad_idx = BREAKAGE_VARIABLES.index("radiation_msv_yr")

    limited: list[AnalogMatchItem] = []
    for rank_idx, pos in enumerate(top_pos):
        orig = int(valid_idx[pos])
        s_ind = float(s_ind_valid[pos])
        s_dep = float(s_dep_valid[pos])
        r_break_overall = float(r_break_arr[pos])
        combined_score = float(combined_rounded[pos])
        confidence_adjusted_score = float(conf_adj_rounded[pos])

        score_uncertainty = float(
            np.clip((1.0 - conf_score) * 0.14 + float(jackknife_all[orig]) * 0.45, 0.015, 0.25)
        )
        ci_low = round(max(0.0, combined_score - score_uncertainty), 4)
        ci_high = round(min(1.0, combined_score + score_uncertainty), 4)
        h3_res = int(grid.h3_res[orig])
        effective_scale_km = _SCALE_MAP.get(
            h3_res, round(158.2 / (2.64 ** max(0, h3_res - 2)), 1)
        )
        known_name = grid.known_names[orig]
        effective_is_benchmark = bool(grid.is_benchmarks[orig]) or (known_name is not None)
        is_pareto = bool(pareto_top[rank_idx])

        include_full = full_detail_ranks is None or rank_idx in full_detail_ranks
        if include_full:
            iv_sim_breakdown = {
                col: float(iv_sim_rounded[orig, idx_c])
                for idx_c, col in enumerate(INDEPENDENT_VARIABLES)
            }
            dv_sim_breakdown = {
                col: float(dv_sim_rounded[orig, idx_c])
                for idx_c, col in enumerate(DEPENDENT_VARIABLES)
            }
            earth_iv = {
                col: round(float(grid.iv_mat[orig, idx_c]), 4)
                for idx_c, col in enumerate(INDEPENDENT_VARIABLES)
            }
            earth_dv = {
                col: round(float(grid.dv_mat[orig, idx_c]), 4)
                for idx_c, col in enumerate(DEPENDENT_VARIABLES)
            }
            earth_breakage = {
                col: float(grid.breakage_mat[orig, idx_c])
                for idx_c, col in enumerate(BREAKAGE_VARIABLES)
            }
            breakage_alerts = build_breakage_profile(site.variables.breakage, earth_breakage)
            recommendations = evaluate_mission_recommendations(
                site=site,
                s_ind=s_ind,
                s_dep=s_dep,
                iv_sim=iv_sim_breakdown,
                dv_sim=dv_sim_breakdown,
                breakage_alerts=breakage_alerts,
                earth_aridity=earth_iv["aridity_index"],
                earth_iv=earth_iv,
                earth_dv=earth_dv,
            )
            boundary = grid.boundaries[orig]
            earth_vars = PhysicalVariables(
                independent=earth_iv,
                dependent=earth_dv,
                breakage={k: round(v, 4) for k, v in earth_breakage.items()},
            )
            provenance = DataProvenance(
                source_apis=grid.source_apis[orig],
                observation_window=grid.obs_windows[orig],
                fetched_at=grid.fetched_ats[orig],
                is_live_probed=grid.is_live_probed[orig],
            )
        else:
            earth_arid = round(float(grid.iv_mat[orig, arid_idx]), 4)
            earth_lai = round(float(grid.iv_mat[orig, lai_idx]), 4)
            if earth_arid < 0.45 or earth_lai > 1.2:
                tier: ViabilityTier = "partial"
            else:
                raw_comb = 0.60 * s_ind + 0.40 * s_dep
                tier = "high" if raw_comb >= 0.74 else ("moderate" if raw_comb >= 0.56 else "partial")
            iv_sim_breakdown = {}
            dv_sim_breakdown = {}
            breakage_alerts = []
            recommendations = EngineeringRecommendations(
                viability_tier=tier,
                valid_tests=[],
                invalid_tests=[],
            )
            boundary = grid.boundaries_compact[orig]
            earth_vars = PhysicalVariables(
                independent={
                    "slope_deg": round(float(grid.iv_mat[orig, slope_idx]), 4),
                    "aridity_index": earth_arid,
                },
                dependent={
                    "mean_surface_temp_k": round(float(grid.dv_mat[orig, temp_idx]), 4),
                },
                breakage={
                    "radiation_msv_yr": round(float(grid.breakage_mat[orig, rad_idx]), 4),
                },
            )
            provenance = DataProvenance(
                source_apis=grid.source_apis[orig],
                observation_window="",
                fetched_at="",
                is_live_probed=grid.is_live_probed[orig],
            )

        limited.append(
            AnalogMatchItem(
                earth_cell_h3=grid.h3_cells[orig],
                h3_resolution=h3_res,
                coordinates=Coordinates(lat=float(grid.lats[orig]), lon=float(grid.lons[orig])),
                h3_boundary=boundary,
                region_key=grid.region_keys[orig],
                country_code=grid.country_codes[orig],
                biome_key=grid.biome_keys[orig],
                is_benchmark=effective_is_benchmark,
                is_pareto_optimal=is_pareto,
                known_analog_name=known_name,
                s_ind=round(s_ind, 4),
                s_dep=round(s_dep, 4),
                combined_score=combined_score,
                confidence_adjusted_score=confidence_adjusted_score,
                score_uncertainty=round(score_uncertainty, 4),
                confidence_interval=(ci_low, ci_high),
                effective_scale_km=effective_scale_km,
                r_break_overall=round(r_break_overall, 4),
                iv_similarity_breakdown=iv_sim_breakdown,
                dv_similarity_breakdown=dv_sim_breakdown,
                breakage_alerts=breakage_alerts,
                engineering_recommendations=recommendations,
                earth_variables=earth_vars,
                provenance=provenance,
            )
        )

    return AnalogSearchResponse(
        site_id=site.site_id,
        body=site.body,
        distance_metric=distance_metric,
        total_evaluated=n_rows,
        returned_count=len(limited),
        causal_weights_used={k: round(v, 4) for k, v in norm_w.items()},
        matches=limited,
    )

