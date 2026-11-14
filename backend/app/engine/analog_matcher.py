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
from app.engine.causal_decomposer import build_breakage_profile
from app.engine.known_analogs import match_known_analog
from app.engine.mission_advisor import evaluate_mission_recommendations
from app.models.schemas import (
    AnalogMatchItem,
    AnalogSearchResponse,
    Coordinates,
    DataProvenance,
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


def load_earth_grid(duckdb_path: Path, exclude_benchmarks: bool = False) -> pd.DataFrame:
    """Query Earth H3 grid from DuckDB using parameterized filtering."""
    conn = duckdb.connect(str(duckdb_path), read_only=True)
    try:
        if exclude_benchmarks:
            df = conn.execute(
                "SELECT * FROM earth_h3_grid WHERE is_benchmark = ?", [False]
            ).df()
            if not df.empty:
                mask = df.apply(
                    lambda r: match_known_analog(float(r["lat"]), float(r["lon"])) is None,
                    axis=1,
                )
                return df[mask].reset_index(drop=True)
            return df
        return conn.execute("SELECT * FROM earth_h3_grid").df()
    finally:
        conn.close()


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

    matches: list[AnalogMatchItem] = []

    for row in df_earth.itertuples(index=False):
        row_dict = row._asdict()

        # 1. Independent Substrate Similarity S_ind
        sq_dist_ind = 0.0
        iv_sim_breakdown: dict[str, float] = {}
        earth_iv: dict[str, float] = {}
        for col in INDEPENDENT_VARIABLES:
            e_val = float(row_dict[col])
            p_val = float(p_iv[col])
            earth_iv[col] = round(e_val, 4)
            scale = FEATURE_SCALES[col]
            norm_diff = (p_val - e_val) / scale
            sq_dist_ind += norm_w[col] * (norm_diff ** 2)
            iv_sim_breakdown[col] = round(_compute_variable_similarity(p_val, e_val, scale), 4)

        s_ind = 1.0 if ignore_ind else float(np.exp(-np.sqrt(sq_dist_ind)))

        # 2. Dependent Response Similarity S_dep
        sq_dist_dep = 0.0
        dv_sim_breakdown: dict[str, float] = {}
        earth_dv: dict[str, float] = {}
        for col in DEPENDENT_VARIABLES:
            e_val = float(row_dict[col])
            p_val = float(p_dv[col])
            earth_dv[col] = round(e_val, 4)
            scale = FEATURE_SCALES[col]
            norm_diff = (p_val - e_val) / scale
            sq_dist_dep += norm_dv_w[col] * (norm_diff ** 2)
            dv_sim_breakdown[col] = round(_compute_variable_similarity(p_val, e_val, scale), 4)

        s_dep = 1.0 if ignore_dv else float(np.exp(-np.sqrt(sq_dist_dep)))

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

        # 3. Physical Breakage R_break
        earth_breakage = {col: float(row_dict[col]) for col in BREAKAGE_VARIABLES}
        breakage_alerts = build_breakage_profile(site.variables.breakage, earth_breakage)
        r_break_overall = float(np.mean([b.breakage_index for b in breakage_alerts]))

        # 4. Engineering Mission Recommendations
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

        if ignore_ind and not ignore_dv:
            combined_score = s_dep
        elif ignore_dv and not ignore_ind:
            combined_score = s_ind
        else:
            combined_score = 0.60 * s_ind + 0.40 * s_dep
        conf_score = site.confidence.score if site.confidence else 0.70
        confidence_adjusted_score = combined_score * (0.75 + 0.25 * conf_score)
        score_uncertainty = (1.0 - conf_score) * 0.22
        ci_low = round(max(0.0, combined_score - score_uncertainty), 4)
        ci_high = round(min(1.0, combined_score + score_uncertainty), 4)
        h3_res = int(row_dict["h3_resolution"])
        scale_map = {0: 1107.7, 1: 418.7, 2: 158.2, 3: 59.8, 4: 22.6, 5: 8.5, 6: 3.2}
        effective_scale_km = scale_map.get(h3_res, round(158.2 / (2.64 ** max(0, h3_res - 2)), 1))

        known_name = match_known_analog(float(row_dict["lat"]), float(row_dict["lon"]))
        effective_is_benchmark = bool(row_dict["is_benchmark"]) or (known_name is not None)

        matches.append(
            AnalogMatchItem(
                earth_cell_h3=str(row_dict["earth_cell_h3"]),
                h3_resolution=h3_res,
                coordinates=Coordinates(lat=float(row_dict["lat"]), lon=float(row_dict["lon"])),
                h3_boundary=boundary,
                region_key=str(row_dict["region_key"]),
                country_code=str(row_dict["country_code"]),
                biome_key=str(row_dict["biome_key"]),
                is_benchmark=effective_is_benchmark,
                known_analog_name=known_name,
                s_ind=round(s_ind, 4),
                s_dep=round(s_dep, 4),
                combined_score=round(combined_score, 4),
                confidence_adjusted_score=round(confidence_adjusted_score, 4),
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

    matches.sort(
        key=lambda item: item.confidence_adjusted_score if penalize_estimated else item.combined_score,
        reverse=True,
    )
    limited = matches[:limit]

    return AnalogSearchResponse(
        site_id=site.site_id,
        body=site.body,
        total_evaluated=int(len(df_earth)),
        returned_count=len(limited),
        causal_weights_used={k: round(v, 4) for k, v in norm_w.items()},
        matches=limited,
    )

