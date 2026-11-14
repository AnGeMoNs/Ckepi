"""Geospatial analog matcher computing S_ind, S_dep, and R_break over Earth H3 cells."""

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
from app.engine.causal_decomposer import build_breakage_profile, compute_breakage_index
from app.engine.known_analogs import match_known_analog
from app.engine.mission_advisor import evaluate_mission_recommendations
from app.models.schemas import (
    AnalogMatchItem,
    AnalogSearchResponse,
    Coordinates,
    DataProvenance,
    DistanceMetricType,
    PhysicalVariables,
    PlanetarySite,
)


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
                mask = df.apply(
                    lambda r: match_known_analog(float(r["lat"]), float(r["lon"])) is None,
                    axis=1,
                )
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
    n = len( columns)
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
    n = len(items)
    for i in range(n):
        ge_all = np.all(objs >= objs[i] - 1e-6, axis=1)
        gt_any = np.any(objs > objs[i] + 0.002, axis=1)
        ge_all[i] = False
        items[i].is_pareto_optimal = not bool(np.any(ge_all & gt_any))


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
) -> AnalogSearchResponse:
    """Score every Earth H3 cell against a planetary ROI using decoupled S_ind, S_dep, R_break."""
    ignore_ind = custom_weights is not None and _normalize_custom_weights(custom_weights, INDEPENDENT_VARIABLES) is None
    ignore_dv = custom_dv_weights is not None and _normalize_custom_weights(custom_dv_weights, DEPENDENT_VARIABLES) is None

    active_weights = _normalize_custom_weights(custom_weights, INDEPENDENT_VARIABLES) or causal_weights
    # Ensure exact normalization
    w_total = sum(active_weights.get(col, 0.0) for col in INDEPENDENT_VARIABLES)
    norm_w = {
        col: (active_weights.get(col, 0.0) / w_total if w_total > 0 else 1.0 / len(INDEPENDENT_VARIABLES))
        for col in INDEPENDENT_VARIABLES
    }

    norm_dv_w = _normalize_custom_weights(custom_dv_weights, DEPENDENT_VARIABLES) or {
        col: 1.0 / len(DEPENDENT_VARIABLES) for col in DEPENDENT_VARIABLES
    }
    p_iv = site.variables.independent
    p_dv = site.variables.dependent

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
    sqrt_w_iv = np.array([np.sqrt(norm_w[col]) for col in INDEPENDENT_VARIABLES], dtype=float)
    sqrt_w_dv = np.array([np.sqrt(norm_dv_w[col]) for col in DEPENDENT_VARIABLES], dtype=float)
    conf_score = site.confidence.score if site.confidence else 0.70
    scale_map = {0: 1107.7, 1: 418.7, 2: 158.2, 3: 59.8, 4: 22.6, 5: 8.5, 6: 3.2}

    candidates: list[dict[str, object]] = []

    for row in df_earth.itertuples(index=False):
        row_dict = row._asdict()

        # 1. Independent Substrate Similarity S_ind
        sq_dist_ind = 0.0
        iv_sim_breakdown: dict[str, float] = {}
        earth_iv: dict[str, float] = {}
        iv_diffs = np.zeros(len(INDEPENDENT_VARIABLES), dtype=float)
        for idx_col, col in enumerate(INDEPENDENT_VARIABLES):
            e_val = float(row_dict[col])
            p_val = float(p_iv[col])
            earth_iv[col] = round(e_val, 4)
            scale = FEATURE_SCALES[col]
            norm_diff = (p_val - e_val) / scale
            iv_diffs[idx_col] = norm_diff
            sq_dist_ind += norm_w[col] * (norm_diff ** 2)
            iv_sim_breakdown[col] = round(_compute_variable_similarity(p_val, e_val, scale), 4)

        if prec_iv is not None:
            u_iv = sqrt_w_iv * iv_diffs
            mahal_ind = float(u_iv @ prec_iv @ u_iv)
            if mahal_ind > 0.0:
                sq_dist_ind = mahal_ind

        s_ind = 1.0 if ignore_ind else float(np.exp(-np.sqrt(max(0.0, sq_dist_ind))))

        # 2. Dependent Response Similarity S_dep
        sq_dist_dep = 0.0
        dv_sim_breakdown: dict[str, float] = {}
        earth_dv: dict[str, float] = {}
        dv_diffs = np.zeros(len(DEPENDENT_VARIABLES), dtype=float)
        for idx_col, col in enumerate(DEPENDENT_VARIABLES):
            e_val = float(row_dict[col])
            p_val = float(p_dv[col])
            earth_dv[col] = round(e_val, 4)
            scale = FEATURE_SCALES[col]
            norm_diff = (p_val - e_val) / scale
            dv_diffs[idx_col] = norm_diff
            sq_dist_dep += norm_dv_w[col] * (norm_diff ** 2)
            dv_sim_breakdown[col] = round(_compute_variable_similarity(p_val, e_val, scale), 4)

        if prec_dv is not None:
            u_dv = sqrt_w_dv * dv_diffs
            mahal_dep = float(u_dv @ prec_dv @ u_dv)
            if mahal_dep > 0.0:
                sq_dist_dep = mahal_dep

        s_dep = 1.0 if ignore_dv else float(np.exp(-np.sqrt(max(0.0, sq_dist_dep))))

        if (not ignore_ind and s_ind < min_s_ind) or (not ignore_dv and s_dep < min_s_dep):
            continue

        if custom_min_similarity:
            combined_sim = {**iv_sim_breakdown, **dv_sim_breakdown}
            fails_var_threshold = any(
                col in combined_sim and float(min_req) > 0.0 and combined_sim[col] < float(min_req)
                for col, min_req in custom_min_similarity.items()
            )
            if fails_var_threshold:
                continue

        earth_breakage = {col: float(row_dict[col]) for col in BREAKAGE_VARIABLES}
        r_break_overall = float(
            np.mean(
                [
                    compute_breakage_index(site.variables.breakage[col], earth_breakage[col])
                    for col in BREAKAGE_VARIABLES
                ]
            )
        )

        if ignore_ind and not ignore_dv:
            combined_score = s_dep
        elif ignore_dv and not ignore_ind:
            combined_score = s_ind
        else:
            combined_score = 0.60 * s_ind + 0.40 * s_dep
        confidence_adjusted_score = combined_score * (0.75 + 0.25 * conf_score)

        candidates.append(
            {
                "row_dict": row_dict,
                "s_ind": s_ind,
                "s_dep": s_dep,
                "r_break_overall": r_break_overall,
                "combined_score": round(combined_score, 4),
                "confidence_adjusted_score": round(confidence_adjusted_score, 4),
                "iv_sim_breakdown": iv_sim_breakdown,
                "dv_sim_breakdown": dv_sim_breakdown,
                "earth_iv": earth_iv,
                "earth_dv": earth_dv,
                "earth_breakage": earth_breakage,
            }
        )

    candidates.sort(
        key=lambda c: float(c["confidence_adjusted_score"] if penalize_estimated else c["combined_score"]),
        reverse=True,
    )
    top_candidates = candidates[:limit]

    all_objs = (
        np.array(
            [
                [
                    round(float(c["s_ind"]), 4),
                    round(float(c["s_dep"]), 4),
                    round(1.0 - round(float(c["r_break_overall"]), 4), 4),
                ]
                for c in candidates
            ],
            dtype=float,
        )
        if candidates
        else np.empty((0, 3), dtype=float)
    )

    limited: list[AnalogMatchItem] = []
    for idx, cand in enumerate(top_candidates):
        row_dict = cand["row_dict"]  # type: ignore[assignment]
        s_ind = float(cand["s_ind"])
        s_dep = float(cand["s_dep"])
        r_break_overall = float(cand["r_break_overall"])
        combined_score = float(cand["combined_score"])
        confidence_adjusted_score = float(cand["confidence_adjusted_score"])
        iv_sim_breakdown = cand["iv_sim_breakdown"]  # type: ignore[assignment]
        dv_sim_breakdown = cand["dv_sim_breakdown"]  # type: ignore[assignment]
        earth_iv = cand["earth_iv"]  # type: ignore[assignment]
        earth_dv = cand["earth_dv"]  # type: ignore[assignment]
        earth_breakage = cand["earth_breakage"]  # type: ignore[assignment]

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

        boundary_raw = row_dict["h3_boundary_json"]
        boundary = json.loads(boundary_raw) if isinstance(boundary_raw, str) else list(boundary_raw)

        src_raw = row_dict.get("source_apis_json", "[]")
        source_apis = json.loads(src_raw) if isinstance(src_raw, str) else list(src_raw)

        sim_vals = np.array(
            list(iv_sim_breakdown.values()) + list(dv_sim_breakdown.values()),
            dtype=float,
        )
        jackknife_spread = float(np.std(sim_vals)) / np.sqrt(len(sim_vals))
        score_uncertainty = float(
            np.clip((1.0 - conf_score) * 0.14 + jackknife_spread * 0.45, 0.015, 0.25)
        )
        ci_low = round(max(0.0, combined_score - score_uncertainty), 4)
        ci_high = round(min(1.0, combined_score + score_uncertainty), 4)
        h3_res = int(row_dict["h3_resolution"])
        effective_scale_km = scale_map.get(
            h3_res, round(158.2 / (2.64 ** max(0, h3_res - 2)), 1)
        )

        known_name = match_known_analog(float(row_dict["lat"]), float(row_dict["lon"]))
        effective_is_benchmark = bool(row_dict["is_benchmark"]) or (known_name is not None)

        ge_all = np.all(all_objs >= all_objs[idx] - 1e-6, axis=1)
        gt_any = np.any(all_objs > all_objs[idx] + 0.002, axis=1)
        ge_all[idx] = False
        is_pareto = not bool(np.any(ge_all & gt_any))

        limited.append(
            AnalogMatchItem(
                earth_cell_h3=str(row_dict["earth_cell_h3"]),
                h3_resolution=h3_res,
                coordinates=Coordinates(lat=float(row_dict["lat"]), lon=float(row_dict["lon"])),
                h3_boundary=boundary,
                region_key=str(row_dict["region_key"]),
                country_code=str(row_dict["country_code"]),
                biome_key=str(row_dict["biome_key"]),
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
                earth_variables=PhysicalVariables(
                    independent=earth_iv,
                    dependent=earth_dv,
                    breakage={k: round(v, 4) for k, v in earth_breakage.items()},
                ),
                provenance=DataProvenance(
                    source_apis=[str(s) for s in source_apis],
                    observation_window=str(row_dict.get("observation_window", "")),
                    fetched_at=str(row_dict.get("fetched_at", "")),
                    is_live_probed=bool(row_dict.get("is_live_probed", False)),
                ),
            )
        )

    return AnalogSearchResponse(
        site_id=site.site_id,
        body=site.body,
        distance_metric=distance_metric,
        total_evaluated=int(len(df_earth)),
        returned_count=len(limited),
        causal_weights_used={k: round(v, 4) for k, v in norm_w.items()},
        matches=limited,
    )

