"""Causal variable decomposition engine (Independent X -> Dependent Y + Breakage B)."""

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import RidgeCV
from sklearn.metrics import r2_score, root_mean_squared_error
from sklearn.model_selection import cross_val_predict
from sklearn.preprocessing import StandardScaler

from app.config import (
    BREAKAGE_VARIABLES,
    DEPENDENT_VARIABLES,
    INDEPENDENT_VARIABLES,
    settings,
)
from app.models.schemas import (
    BreakageBoundary,
    DecompositionModelType,
    DecompositionResponse,
    DependentDecomposition,
    PCAComponentSummary,
    PlanetarySite,
)


EARTH_BASELINE_BREAKAGE: dict[str, float] = {
    "gravity_g": 1.0,
    "atm_pressure_mbar": 1013.25,
    "radiation_msv_yr": 2.4,
}

BREAKAGE_ALERT_KEYS: dict[str, str] = {
    "gravity_g": "breakage.alerts.gravity_mismatch",
    "atm_pressure_mbar": "breakage.alerts.pressure_mismatch",
    "radiation_msv_yr": "breakage.alerts.radiation_mismatch",
}


def compute_breakage_index(planetary_value: float, earth_value: float) -> float:
    """Compute normalized physical breakage divergence in [0, 1]."""
    denom = max(abs(planetary_value), abs(earth_value), 1e-9)
    return float(min(1.0, abs(planetary_value - earth_value) / denom))


def build_breakage_profile(
    planetary_breakage: dict[str, float],
    earth_breakage: dict[str, float] | None = None,
) -> list[BreakageBoundary]:
    """Evaluate irreproducible planetary boundaries against Earth or cell conditions."""
    baseline = earth_breakage or EARTH_BASELINE_BREAKAGE
    profile: list[BreakageBoundary] = []
    for var in BREAKAGE_VARIABLES:
        p_val = float(planetary_breakage.get(var, 0.0))
        e_val = float(baseline.get(var, EARTH_BASELINE_BREAKAGE[var]))
        idx = compute_breakage_index(p_val, e_val)
        profile.append(
            BreakageBoundary(
                variable=var,
                planetary_value=p_val,
                earth_baseline_value=e_val,
                breakage_index=round(idx, 4),
                is_broken=idx >= settings.breakage_alert_threshold,
                alert_key=BREAKAGE_ALERT_KEYS[var],
            )
        )
    return profile


def _normalize_weights(raw_weights: np.ndarray) -> dict[str, float]:
    """Normalize non-negative importance vector so weights sum to 1.0."""
    abs_w = np.abs(raw_weights).astype(float)
    total = float(np.sum(abs_w))
    if total <= 1e-12:
        uniform = 1.0 / len(INDEPENDENT_VARIABLES)
        return {col: round(uniform, 4) for col in INDEPENDENT_VARIABLES}
    normed = abs_w / total
    return {col: round(float(val), 4) for col, val in zip(INDEPENDENT_VARIABLES, normed)}


def decompose_planetary_site(
    site: PlanetarySite,
    df_timeseries: pd.DataFrame,
    model_type: DecompositionModelType = "ridge",
) -> DecompositionResponse:
    """Decompose Y = f(X) for a planetary ROI and extract causal weights & PCA structure."""
    site_df = df_timeseries[df_timeseries["site_id"] == site.site_id].copy()
    if site_df.empty:
        raise ValueError(f"No timeseries observations found for site_id={site.site_id}")

    x_raw = site_df[list(INDEPENDENT_VARIABLES)].to_numpy(dtype=float)
    scaler_x = StandardScaler()
    x_scaled = scaler_x.fit_transform(x_raw)

    dependent_models: list[DependentDecomposition] = []
    unavailable_dvs: list[str] = []
    weighted_sum = np.zeros(len(INDEPENDENT_VARIABLES), dtype=float)
    total_r2_weight = 0.0

    for dv_col in DEPENDENT_VARIABLES:
        y_raw = site_df[dv_col].to_numpy(dtype=float)
        if np.isnan(y_raw).all() or float(np.nanstd(y_raw)) < 1e-6:
            unavailable_dvs.append(dv_col)
            dependent_models.append(
                DependentDecomposition(
                    dv_name=dv_col,
                    r2_score=0.0,
                    cv_r2_score=0.0,
                    rmse_normalized=0.0,
                    prediction_interval_90=0.0,
                    is_available=False,
                    weights={col: 0.0 for col in INDEPENDENT_VARIABLES},
                )
            )
            continue

        scaler_y = StandardScaler()
        y_scaled = scaler_y.fit_transform(y_raw.reshape(-1, 1)).ravel()

        if model_type == "random_forest":
            model = RandomForestRegressor(n_estimators=80, max_depth=6, random_state=42)
            model.fit(x_scaled, y_scaled)
            y_pred = model.predict(x_scaled)
            raw_importance = model.feature_importances_
        else:
            model = RidgeCV(alphas=np.logspace(-2, 2, 15))
            model.fit(x_scaled, y_scaled)
            y_pred = model.predict(x_scaled)
            raw_importance = np.abs(model.coef_)

        r2 = float(np.clip(r2_score(y_scaled, y_pred), 0.0, 1.0))
        rmse = float(root_mean_squared_error(y_scaled, y_pred))

        # Empirical out-of-sample cross-validation R^2 and 90% conformal/jackknife residual interval
        if len(y_scaled) >= 8:
            try:
                y_cv = cross_val_predict(model, x_scaled, y_scaled, cv=min(5, len(y_scaled)))
                cv_r2 = float(np.clip(r2_score(y_scaled, y_cv), 0.0, 1.0))
                abs_res = np.abs(y_scaled - y_cv)
                pi_90 = float(np.quantile(abs_res, 0.90))
            except Exception:
                cv_r2 = r2
                pi_90 = rmse * 1.645
        else:
            cv_r2 = r2
            pi_90 = rmse * 1.645

        norm_weights = _normalize_weights(raw_importance)

        if r2 > 0.05:
            vec = np.array([norm_weights[col] for col in INDEPENDENT_VARIABLES], dtype=float)
            weighted_sum += r2 * vec
            total_r2_weight += r2

        dependent_models.append(
            DependentDecomposition(
                dv_name=dv_col,
                r2_score=round(r2, 4),
                cv_r2_score=round(cv_r2, 4),
                rmse_normalized=round(rmse, 4),
                prediction_interval_90=round(pi_90, 4),
                is_available=True,
                weights=norm_weights,
            )
        )

    if total_r2_weight > 1e-9:
        global_weights = _normalize_weights(weighted_sum / total_r2_weight)
    else:
        global_weights = _normalize_weights(np.ones(len(INDEPENDENT_VARIABLES)))

    # PCA on standardized independent substrate/forcing matrix X
    n_components = min(3, len(INDEPENDENT_VARIABLES), len(site_df))
    pca = PCA(n_components=n_components, random_state=42)
    pca.fit(x_scaled)

    pca_summaries: list[PCAComponentSummary] = []
    for idx in range(n_components):
        loadings = {
            col: round(float(val), 4)
            for col, val in zip(INDEPENDENT_VARIABLES, pca.components_[idx])
        }
        sorted_loadings = dict(
            sorted(loadings.items(), key=lambda item: abs(item[1]), reverse=True)[:4]
        )
        pca_summaries.append(
            PCAComponentSummary(
                component_index=idx + 1,
                explained_variance_ratio=round(float(pca.explained_variance_ratio_[idx]), 4),
                top_loadings=sorted_loadings,
            )
        )

    breakage_profile = build_breakage_profile(site.variables.breakage)

    return DecompositionResponse(
        site_id=site.site_id,
        body=site.body,
        model_type=model_type,
        sample_count=int(len(site_df)),
        global_iv_weights=global_weights,
        dependent_models=dependent_models,
        unavailable_dvs=unavailable_dvs,
        pca_components=pca_summaries,
        breakage_profile=breakage_profile,
        provenance=site.provenance,
    )

