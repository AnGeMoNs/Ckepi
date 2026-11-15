"""Strictly typed Pydantic v2 models for decomposition, matching, provenance, and mission diagnostics."""

import math
from typing import Literal
from pydantic import BaseModel, Field, field_validator

from app.config import DEPENDENT_VARIABLES, INDEPENDENT_VARIABLES

PlanetaryBody = Literal["moon", "mars"]
DecompositionModelType = Literal["ridge", "random_forest"]
DistanceMetricType = Literal["euclidean", "mahalanobis"]
ViabilityTier = Literal["high", "moderate", "partial"]
ConfidenceLevel = Literal["high", "medium", "estimated"]
VariableOrigin = Literal["measured", "derived", "model", "constant", "default"]
ReadingModeType = Literal["mission", "explorer"]
SupportedLocaleType = Literal["es", "pt", "en"]

_VALID_IV_SET = set(INDEPENDENT_VARIABLES)
_VALID_DV_SET = set(DEPENDENT_VARIABLES)
_VALID_ALL_VARS = _VALID_IV_SET | _VALID_DV_SET


def _validate_unit_dict(
    val: dict[str, float] | None,
    allowed_keys: set[str],
) -> dict[str, float] | None:
    if val is None:
        return None
    cleaned: dict[str, float] = {}
    for k, v in val.items():
        if k not in allowed_keys:
            raise ValueError(f"Unknown variable key: {k}")
        f = float(v)
        if not math.isfinite(f) or f < 0.0 or f > 1.0:
            raise ValueError(f"Value for {k} must be in [0.0, 1.0]")
        cleaned[k] = f
    return cleaned


class DataConfidence(BaseModel):
    """Transparency metadata indicating real instrumental coverage vs. physical estimation."""

    level: ConfidenceLevel
    score: float = Field(..., ge=0.0, le=1.0)
    is_tracked_zone: bool
    nearest_tracked_site_id: str | None = None
    distance_to_tracked_km: float | None = None
    pds_products_found: int | None = None
    real_variables: list[str] = Field(default_factory=list)
    estimated_variables: list[str] = Field(default_factory=list)
    variable_provenance: dict[str, VariableOrigin] = Field(default_factory=dict)
    notice_key: str


class Coordinates(BaseModel):
    """Geographic or selenographic/areographic coordinates."""

    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)


class DataProvenance(BaseModel):
    """Real-data lineage metadata for planetary and terrestrial observations."""

    source_apis: list[str]
    observation_window: str
    fetched_at: str
    is_live_probed: bool = False


class PhysicalVariables(BaseModel):
    """Three-layer variable structure: Independent (X), Dependent (Y), and Breakage (B)."""

    independent: dict[str, float]
    dependent: dict[str, float]
    breakage: dict[str, float]


class PlanetaryFeatureInfo(BaseModel):
    """Official IAU / USGS planetary geological feature and MOLA/LOLA elevation metadata."""

    feature_name: str
    feature_type: str
    diameter_km: float | None = None
    distance_km: float = 0.0
    elevation_m: float = 0.0
    gazetteer_source: str


class PlanetarySite(BaseModel):
    """Candidate lunar or Martian landing site / ROI."""

    site_id: str
    body: PlanetaryBody
    name_key: str
    mission_context_key: str
    data_sources: list[str]
    coordinates: Coordinates
    variables: PhysicalVariables
    provenance: DataProvenance
    confidence: DataConfidence | None = None
    planetary_feature: PlanetaryFeatureInfo | None = None


class DecompositionRequest(BaseModel):
    """Request payload for causal decomposition of a planetary ROI."""

    site_id: str
    model_type: DecompositionModelType = "ridge"


class DependentDecomposition(BaseModel):
    """Regression fit summary for a single dependent variable Y_k = f(X)."""

    dv_name: str
    r2_score: float = Field(..., ge=0.0, le=1.0)
    cv_r2_score: float = Field(default=0.0, ge=0.0, le=1.0)
    rmse_normalized: float = Field(..., ge=0.0)
    prediction_interval_90: float = Field(default=0.0, ge=0.0)
    is_available: bool = True
    weights: dict[str, float]


class PCAComponentSummary(BaseModel):
    """Principal component summary on independent variables X."""

    component_index: int
    explained_variance_ratio: float
    top_loadings: dict[str, float]


class BreakageBoundary(BaseModel):
    """Irreproducible planetary boundary metric compared against Earth baseline."""

    variable: str
    planetary_value: float
    earth_baseline_value: float
    breakage_index: float = Field(..., ge=0.0, le=1.0)
    is_broken: bool
    alert_key: str


class DecompositionResponse(BaseModel):
    """Complete variable decomposition profile for a planetary ROI."""

    site_id: str
    body: PlanetaryBody
    model_type: DecompositionModelType
    sample_count: int
    global_iv_weights: dict[str, float]
    dependent_models: list[DependentDecomposition]
    unavailable_dvs: list[str]
    pca_components: list[PCAComponentSummary]
    breakage_profile: list[BreakageBoundary]
    provenance: DataProvenance


TestProfileType = Literal[
    "causal_auto",
    "navigation_landing",
    "rover_mobility",
    "isru_ice_drilling",
    "lava_tube_habitat",
    "solar_power_thermal",
    "manual_custom",
]


class _CustomWeightsMixin(BaseModel):
    """Shared mission-profile and manual-weight override fields with [0, 1] validation."""

    distance_metric: DistanceMetricType = "euclidean"
    test_profile: TestProfileType = "causal_auto"
    penalize_estimated: bool = False
    custom_iv_weights: dict[str, float] | None = None
    custom_dv_weights: dict[str, float] | None = None

    @field_validator("custom_iv_weights")
    @classmethod
    def _val_iv_weights(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_IV_SET)

    @field_validator("custom_dv_weights")
    @classmethod
    def _val_dv_weights(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_DV_SET)


class AnalogSearchRequest(_CustomWeightsMixin):
    """Search criteria for terrestrial H3 analog cells."""

    site_id: str
    model_type: DecompositionModelType = "ridge"
    min_s_ind: float = Field(default=0.0, ge=0.0, le=1.0)
    min_s_dep: float = Field(default=0.0, ge=0.0, le=1.0)
    exclude_benchmarks: bool = False
    limit: int = Field(default=250, ge=1, le=12000)
    compact_tail: bool = False
    detail_limit: int = Field(default=250, ge=0, le=12000)
    custom_min_similarity: dict[str, float] | None = None

    @field_validator("custom_min_similarity")
    @classmethod
    def _val_min_sim(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_ALL_VARS)


class PlanetaryProbeRequest(_CustomWeightsMixin):
    """Request to probe any Moon or Mars coordinate and match against all Earth H3 cells."""

    body: PlanetaryBody
    lat: float = Field(..., ge=-90.0, le=90.0)
    lon: float = Field(..., ge=-180.0, le=180.0)
    model_type: DecompositionModelType = "ridge"
    distance_metric: DistanceMetricType = "euclidean"
    min_s_ind: float = Field(default=0.0, ge=0.0, le=1.0)
    min_s_dep: float = Field(default=0.0, ge=0.0, le=1.0)
    exclude_benchmarks: bool = False
    limit: int = Field(default=500, ge=1, le=12000)
    custom_min_similarity: dict[str, float] | None = None

    @field_validator("custom_min_similarity")
    @classmethod
    def _val_probe_min_sim(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_ALL_VARS)


class EarthProbeRequest(_CustomWeightsMixin):
    """Request to probe any Earth coordinate live via NASA POWER + Open-Meteo."""

    lat: float = Field(..., ge=-89.5, le=89.5)
    lon: float = Field(..., ge=-180.0, le=180.0)
    site_id: str
    model_type: DecompositionModelType = "ridge"


class EngineeringRecommendations(BaseModel):
    """Translated engineering test suitability using i18n keys."""

    viability_tier: ViabilityTier
    valid_tests: list[str]
    invalid_tests: list[str]


class AnalogMatchItem(BaseModel):
    """Scored Earth H3 analog cell matching a target planetary site."""

    earth_cell_h3: str
    h3_resolution: int
    coordinates: Coordinates
    h3_boundary: list[list[float]]
    region_key: str
    country_code: str
    biome_key: str
    is_benchmark: bool
    is_pareto_optimal: bool = False
    known_analog_name: str | None = None
    s_ind: float = Field(..., ge=0.0, le=1.0)
    s_dep: float = Field(..., ge=0.0, le=1.0)
    combined_score: float = Field(..., ge=0.0, le=1.0)
    confidence_adjusted_score: float = Field(default=0.0, ge=0.0, le=1.0)
    score_uncertainty: float = Field(default=0.0, ge=0.0, le=1.0)
    confidence_interval: tuple[float, float] = Field(default=(0.0, 1.0))
    effective_scale_km: float = Field(default=158.0, ge=0.0)
    r_break_overall: float = Field(..., ge=0.0, le=1.0)
    iv_similarity_breakdown: dict[str, float]
    dv_similarity_breakdown: dict[str, float]
    breakage_alerts: list[BreakageBoundary]
    engineering_recommendations: EngineeringRecommendations
    earth_variables: PhysicalVariables
    provenance: DataProvenance


class AnalogSearchResponse(BaseModel):
    """Search results for terrestrial analog discovery."""

    site_id: str
    body: PlanetaryBody
    distance_metric: DistanceMetricType = "euclidean"
    total_evaluated: int
    returned_count: int
    causal_weights_used: dict[str, float]
    matches: list[AnalogMatchItem]


class VariableDelta(BaseModel):
    """Side-by-side comparison for a single physical variable."""

    variable: str
    layer: Literal["independent", "dependent", "breakage"]
    planetary_value: float
    earth_value: float
    similarity_score: float
    weight: float = 0.0
    is_breakage: bool


class ScaleSensitivityPoint(BaseModel):
    """Distribution distance and percentiles evaluated at a specific spatial resolution (30m, 60m, 90m)."""

    resolution_m: int
    slope_wasserstein_deg: float
    slope_w1_ci_low: float
    slope_w1_ci_high: float
    slope_ks_stat: float
    slope_ks_ci_low: float
    slope_ks_ci_high: float
    relief_wasserstein_m: float
    relief_w1_ci_low: float
    relief_w1_ci_high: float
    relief_ks_stat: float
    planetary_slope_median_deg: float
    earth_slope_median_deg: float
    planetary_slope_p90_deg: float
    earth_slope_p90_deg: float


class DistributionHistogram(BaseModel):
    """Overlapping histogram density and formal statistical distances (Wasserstein-1 & KS with block bootstrap)."""

    metric: Literal["slope_deg", "local_relief_m"]
    unit: str
    bin_centers: list[float]
    planetary_density: list[float]
    earth_density: list[float]
    control_yungay_density: list[float]
    wasserstein_distance: float
    w1_ci_95: tuple[float, float]
    ks_statistic: float
    ks_ci_95: tuple[float, float]
    control_yungay_w1: float
    control_yungay_ks: float


class TerrainDistributionComparison(BaseModel):
    """Complete statistical terrain comparison at common metric scale with block-bootstrap uncertainty."""

    common_resolution_m: int = 30
    window_size_km: float = 3.6
    block_bootstrap_size_px: int = 10
    bootstrap_iterations: int = 120
    earth_projection: str
    planetary_projection: str
    planetary_dem_source: str
    earth_dem_source: str
    control_benchmark_name: str
    slope_distribution: DistributionHistogram
    relief_distribution: DistributionHistogram
    scale_sensitivity: list[ScaleSensitivityPoint]
    profile_distance_m: list[float]
    planetary_profile_elev_m: list[float]
    earth_profile_elev_m: list[float]
    control_yungay_profile_elev_m: list[float]


class SiteComparisonResponse(BaseModel):
    """Detailed comparison between a planetary site and an Earth H3 cell."""

    site: PlanetarySite
    match: AnalogMatchItem
    variable_deltas: list[VariableDelta]
    statistical_distribution: TerrainDistributionComparison | None = None


class PlanetaryProbeResponse(BaseModel):
    """Combined response for clicking an arbitrary Moon or Mars coordinate."""

    site: PlanetarySite
    decomposition: DecompositionResponse
    analogs: AnalogSearchResponse
    top_comparison: SiteComparisonResponse | None = None


class SpaceAgencyProduct(BaseModel):
    """Real satellite granule or catalog entry from NASA, ESA, CSA, or JAXA."""

    agency: str
    mission: str
    product_id: str
    sensing_date: str
    url: str


class GeologySummary(BaseModel):
    """Surface geologic unit and lithology from Macrostrat open geologic API."""

    unit_name: str
    lithology: str
    age: str
    source: str


class SubsurfaceAnalogInfo(BaseModel):
    """Subsurface cave, lava-tube, or karst analog relevance."""

    has_lava_tubes_or_caves: bool
    nearest_feature: str | None = None
    feature_type: str
    note_key: str


class HabitabilityProfile(BaseModel):
    """Extremophile habitability and biosignature profile derived from cell physics."""

    habitability_index: float = Field(..., ge=0.0, le=1.0)
    regime_key: str
    extremophiles: list[str]
    biosignature_relevance_key: str


class RegolithSimulantCandidate(BaseModel):
    """Affinity score against a standard NASA/ESA laboratory regolith simulant."""

    code: str
    name_key: str
    target_body: PlanetaryBody
    affinity_score: float = Field(..., ge=0.0, le=1.0)
    mineralogy_key: str


class RegolithSimulantProfile(BaseModel):
    """SoilGrids + Macrostrat mineralogical & granulometric comparison against standard regolith simulants."""

    recommended_code: str
    recommended_name_key: str
    affinity_score: float = Field(..., ge=0.0, le=1.0)
    isru_o2_index: float = Field(..., ge=0.0, le=1.0)
    astrobiology_purity_index: float = Field(..., ge=0.0, le=1.0)
    sand_pct: float
    clay_pct: float
    silt_pct: float
    bulk_density_g_cm3: float
    organic_carbon_pct: float
    candidates: list[RegolithSimulantCandidate]


class MultiAgencyCatalogResponse(BaseModel):
    """Multi-agency satellite dataset discovery response for an Earth H3 cell."""

    earth_cell_h3: str
    lat: float
    lon: float
    queried_at: str
    products: list[SpaceAgencyProduct]
    geology: GeologySummary | None = None
    subsurface: SubsurfaceAnalogInfo | None = None
    habitability: HabitabilityProfile | None = None
    regolith_simulant: RegolithSimulantProfile | None = None


class AnalogRefineRequest(_CustomWeightsMixin):
    """Request to subdivide an Earth H3 cell into 7 finer child cells and score them."""

    earth_cell_h3: str
    site_id: str
    model_type: DecompositionModelType = "ridge"


class AnalogRefineResponse(BaseModel):
    """Refined sub-cell analog matches for a parent Earth H3 cell."""

    parent_h3: str
    child_resolution: int
    matches: list[AnalogMatchItem]
    top_comparison: SiteComparisonResponse | None = None


class MissionAiInsightItem(BaseModel):
    """Single grounded strength or physical gap identified by the AI mission advisor."""

    title: str = Field(..., min_length=1, max_length=320)
    detail: str = Field(..., min_length=1, max_length=2500)
    related_variables: list[str] = Field(default_factory=list)


class BreakageMitigationItem(BaseModel):
    """Engineering facility or test protocol compensating for an Earth breakage boundary."""

    variable: str = Field(..., min_length=1, max_length=120)
    earth_gap_impact: str = Field(..., min_length=1, max_length=1500)
    recommended_facility_or_protocol: str = Field(..., min_length=1, max_length=1500)


class MissionAiStructuredPayload(BaseModel):
    """Strict structured output expected from the OpenRouter mission advisor."""

    executive_synthesis: str = Field(..., min_length=1, max_length=2000)
    viability_assessment: str = Field(..., min_length=1, max_length=3000)
    confidence_and_scale_note: str = Field(..., min_length=1, max_length=2000)
    key_strengths: list[MissionAiInsightItem] = Field(default_factory=list)
    physical_limitations_and_gaps: list[MissionAiInsightItem] = Field(default_factory=list)
    breakage_mitigation_plan: list[BreakageMitigationItem] = Field(default_factory=list)
    field_campaign_considerations: list[str] = Field(default_factory=list)
    recommended_next_steps: list[str] = Field(default_factory=list)


class MissionAiAnalysisRequest(BaseModel):
    """Request payload for OpenRouter mission viability & considerations analysis."""

    site_id: str
    earth_cell_h3: str
    model_type: DecompositionModelType = "ridge"
    distance_metric: DistanceMetricType = "euclidean"
    test_profile: TestProfileType = "causal_auto"
    reading_mode: ReadingModeType = "mission"
    locale: SupportedLocaleType = "es"
    penalize_estimated: bool = False
    custom_iv_weights: dict[str, float] | None = None
    custom_dv_weights: dict[str, float] | None = None
    custom_min_similarity: dict[str, float] | None = None
    catalog_context: MultiAgencyCatalogResponse | None = None
    force_refresh: bool = False
    cache_only: bool = False

    @field_validator("custom_iv_weights")
    @classmethod
    def _val_ai_iv_weights(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_IV_SET)

    @field_validator("custom_dv_weights")
    @classmethod
    def _val_ai_dv_weights(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_DV_SET)

    @field_validator("custom_min_similarity")
    @classmethod
    def _val_ai_min_sim(cls, v: dict[str, float] | None) -> dict[str, float] | None:
        return _validate_unit_dict(v, _VALID_ALL_VARS)


class MissionAiAnalysisResponse(MissionAiStructuredPayload):
    """Grounded mission viability report returned to the UI and Markdown exporter."""

    site_id: str
    earth_cell_h3: str
    locale: SupportedLocaleType
    reading_mode: ReadingModeType
    test_profile: TestProfileType
    model_used: str
    provider: Literal["openrouter"] = "openrouter"
    cached: bool = False
    generated_at: str


class MissionAiStatusResponse(BaseModel):
    """Public AI advisor availability indicator (never leaks API secrets)."""

    enabled: bool
    provider: str
    default_model: str
