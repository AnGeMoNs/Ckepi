export type PlanetaryBody = "moon" | "mars";
export type DecompositionModelType = "ridge" | "random_forest";
export type DistanceMetricType = "euclidean" | "mahalanobis";
export type ConfidenceLevel = "high" | "medium" | "estimated";
export type VariableOrigin = "measured" | "derived" | "model" | "constant" | "default";
export type TestProfileType =
  | "causal_auto"
  | "navigation_landing"
  | "rover_mobility"
  | "isru_ice_drilling"
  | "lava_tube_habitat"
  | "solar_power_thermal"
  | "manual_custom";
export type ViabilityTier = "high" | "moderate" | "partial";
export type SupportedLocale = "es" | "pt" | "en";
export type ThemeMode = "light" | "dark";
export type ReadingMode = "mission" | "explorer";
export type EarthOverlayLayer =
  | "basemap"
  | "satellite_hd"
  | "sentinel2_cloudless"
  | "gibs_truecolor"
  | "gibs_lst"
  | "gibs_aerosol";
export type PlanetaryOverlayLayer = "moon_wac" | "moon_lola" | "mars_color" | "mars_mola";

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface DataProvenance {
  source_apis: string[];
  observation_window: string;
  fetched_at: string;
  is_live_probed: boolean;
}

export interface PhysicalVariables {
  independent: Record<string, number>;
  dependent: Record<string, number>;
  breakage: Record<string, number>;
}

export interface DataConfidence {
  level: ConfidenceLevel;
  score: number;
  is_tracked_zone: boolean;
  nearest_tracked_site_id: string | null;
  distance_to_tracked_km: number | null;
  pds_products_found: number | null;
  real_variables: string[];
  estimated_variables: string[];
  variable_provenance?: Record<string, VariableOrigin>;
  notice_key: string;
}

export interface PlanetaryFeatureInfo {
  feature_name: string;
  feature_type: string;
  diameter_km: number | null;
  distance_km: number;
  elevation_m: number;
  gazetteer_source: string;
}

export interface PlanetarySite {
  site_id: string;
  body: PlanetaryBody;
  name_key: string;
  mission_context_key: string;
  data_sources: string[];
  coordinates: Coordinates;
  variables: PhysicalVariables;
  provenance: DataProvenance;
  confidence?: DataConfidence | null;
  planetary_feature?: PlanetaryFeatureInfo | null;
}

export interface DependentDecomposition {
  dv_name: string;
  r2_score: number;
  cv_r2_score?: number;
  rmse_normalized: number;
  prediction_interval_90?: number;
  is_available: boolean;
  weights: Record<string, number>;
}

export interface PCAComponentSummary {
  component_index: number;
  explained_variance_ratio: number;
  top_loadings: Record<string, number>;
}

export interface BreakageBoundary {
  variable: string;
  planetary_value: number;
  earth_baseline_value: number;
  breakage_index: number;
  is_broken: boolean;
  alert_key: string;
}

export interface DecompositionResponse {
  site_id: string;
  body: PlanetaryBody;
  model_type: DecompositionModelType;
  sample_count: number;
  global_iv_weights: Record<string, number>;
  dependent_models: DependentDecomposition[];
  unavailable_dvs: string[];
  pca_components: PCAComponentSummary[];
  breakage_profile: BreakageBoundary[];
  provenance: DataProvenance;
}

export interface EngineeringRecommendations {
  viability_tier: ViabilityTier;
  valid_tests: string[];
  invalid_tests: string[];
}

export interface AnalogMatchItem {
  earth_cell_h3: string;
  h3_resolution: number;
  coordinates: Coordinates;
  h3_boundary: number[][];
  region_key: string;
  country_code: string;
  biome_key: string;
  is_benchmark: boolean;
  is_pareto_optimal?: boolean;
  known_analog_name?: string | null;
  s_ind: number;
  s_dep: number;
  combined_score: number;
  confidence_adjusted_score?: number;
  score_uncertainty?: number;
  confidence_interval?: [number, number];
  effective_scale_km?: number;
  r_break_overall: number;
  iv_similarity_breakdown: Record<string, number>;
  dv_similarity_breakdown: Record<string, number>;
  breakage_alerts: BreakageBoundary[];
  engineering_recommendations: EngineeringRecommendations;
  earth_variables: PhysicalVariables;
  provenance: DataProvenance;
}

export interface AnalogSearchResponse {
  site_id: string;
  body: PlanetaryBody;
  distance_metric?: DistanceMetricType;
  total_evaluated: number;
  returned_count: number;
  causal_weights_used: Record<string, number>;
  matches: AnalogMatchItem[];
}

export interface VariableDelta {
  variable: string;
  layer: "independent" | "dependent" | "breakage";
  planetary_value: number;
  earth_value: number;
  similarity_score: number;
  weight?: number;
  is_breakage: boolean;
}

export interface ScaleSensitivityPoint {
  resolution_m: number;
  slope_wasserstein_deg: number;
  slope_w1_ci_low: number;
  slope_w1_ci_high: number;
  slope_ks_stat: number;
  slope_ks_ci_low: number;
  slope_ks_ci_high: number;
  relief_wasserstein_m: number;
  relief_w1_ci_low: number;
  relief_w1_ci_high: number;
  relief_ks_stat: number;
  planetary_slope_median_deg: number;
  earth_slope_median_deg: number;
  planetary_slope_p90_deg: number;
  earth_slope_p90_deg: number;
}

export interface DistributionHistogram {
  metric: "slope_deg" | "local_relief_m";
  unit: string;
  bin_centers: number[];
  planetary_density: number[];
  earth_density: number[];
  control_yungay_density: number[];
  wasserstein_distance: number;
  w1_ci_95: [number, number];
  ks_statistic: number;
  ks_ci_95: [number, number];
  control_yungay_w1: number;
  control_yungay_ks: number;
}

export interface TerrainDistributionComparison {
  common_resolution_m: number;
  window_size_km: number;
  block_bootstrap_size_px: number;
  bootstrap_iterations: number;
  earth_projection: string;
  planetary_projection: string;
  planetary_dem_source: string;
  earth_dem_source: string;
  control_benchmark_name: string;
  slope_distribution: DistributionHistogram;
  relief_distribution: DistributionHistogram;
  scale_sensitivity: ScaleSensitivityPoint[];
  profile_distance_m: number[];
  planetary_profile_elev_m: number[];
  earth_profile_elev_m: number[];
  control_yungay_profile_elev_m: number[];
}

export interface SiteComparisonResponse {
  site: PlanetarySite;
  match: AnalogMatchItem;
  variable_deltas: VariableDelta[];
  statistical_distribution?: TerrainDistributionComparison | null;
}

export interface PlanetaryProbeResponse {
  site: PlanetarySite;
  decomposition: DecompositionResponse;
  analogs: AnalogSearchResponse;
  top_comparison: SiteComparisonResponse | null;
}

export interface SpaceAgencyProduct {
  agency: string;
  mission: string;
  product_id: string;
  sensing_date: string;
  url: string;
}

export interface GeologySummary {
  unit_name: string;
  lithology: string;
  age: string;
  source: string;
}

export interface SubsurfaceAnalogInfo {
  has_lava_tubes_or_caves: boolean;
  nearest_feature: string | null;
  feature_type: string;
  note_key: string;
}

export interface HabitabilityProfile {
  habitability_index: number;
  regime_key: string;
  extremophiles: string[];
  biosignature_relevance_key: string;
}

export interface RegolithSimulantCandidate {
  code: string;
  name_key: string;
  target_body: PlanetaryBody;
  affinity_score: number;
  mineralogy_key: string;
}

export interface RegolithSimulantProfile {
  recommended_code: string;
  recommended_name_key: string;
  affinity_score: number;
  isru_o2_index: number;
  astrobiology_purity_index: number;
  sand_pct: number;
  clay_pct: number;
  silt_pct: number;
  bulk_density_g_cm3: number;
  organic_carbon_pct: number;
  candidates: RegolithSimulantCandidate[];
}

export interface MultiAgencyCatalogResponse {
  earth_cell_h3: string;
  lat: number;
  lon: number;
  queried_at: string;
  products: SpaceAgencyProduct[];
  geology?: GeologySummary | null;
  subsurface?: SubsurfaceAnalogInfo | null;
  habitability?: HabitabilityProfile | null;
  regolith_simulant?: RegolithSimulantProfile | null;
}

export interface AnalogRefineResponse {
  parent_h3: string;
  child_resolution: number;
  matches: AnalogMatchItem[];
  top_comparison: SiteComparisonResponse | null;
}

export interface ApiErrorDetail {
  error_key: string;
  params?: Record<string, string>;
}

