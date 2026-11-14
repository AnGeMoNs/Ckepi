import type {
  AnalogRefineResponse,
  AnalogSearchResponse,
  ApiErrorDetail,
  DecompositionModelType,
  DecompositionResponse,
  DistanceMetricType,
  MultiAgencyCatalogResponse,
  PlanetaryBody,
  PlanetaryProbeResponse,
  PlanetarySite,
  SiteComparisonResponse,
  TestProfileType,
} from "../types/analog";

export class ApiClientError extends Error {
  public readonly errorKey: string;
  public readonly params: Record<string, string>;

  constructor(errorKey: string, params: Record<string, string> = {}) {
    super(errorKey);
    this.name = "ApiClientError";
    this.errorKey = errorKey;
    this.params = params;
  }
}

interface FastApiErrorPayload {
  detail?: ApiErrorDetail | string;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiClientError("errors.network_error");
  }

  if (!response.ok) {
    try {
      const payload = (await response.json()) as FastApiErrorPayload;
      if (payload.detail && typeof payload.detail === "object" && payload.detail.error_key) {
        throw new ApiClientError(payload.detail.error_key, payload.detail.params ?? {});
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        throw err;
      }
    }
    throw new ApiClientError("errors.unknown_error");
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiClientError("errors.invalid_response");
  }
}

export function fetchPlanetarySites(signal?: AbortSignal): Promise<PlanetarySite[]> {
  return requestJson<PlanetarySite[]>("/api/v1/planetary-sites", { signal });
}

export function runDecomposition(
  siteId: string,
  modelType: DecompositionModelType,
  signal?: AbortSignal
): Promise<DecompositionResponse> {
  return requestJson<DecompositionResponse>("/api/v1/decompose", {
    method: "POST",
    signal,
    body: JSON.stringify({
      site_id: siteId,
      model_type: modelType,
    }),
  });
}

export interface SearchAnalogsParams {
  siteId: string;
  modelType: DecompositionModelType;
  distanceMetric?: DistanceMetricType;
  testProfile: TestProfileType;
  minSInd: number;
  minSDep: number;
  excludeBenchmarks: boolean;
  penalizeEstimated?: boolean;
  limit: number;
  customIvWeights?: Record<string, number>;
  customDvWeights?: Record<string, number>;
  customMinSimilarity?: Record<string, number>;
  signal?: AbortSignal;
}

export function searchAnalogs(params: SearchAnalogsParams): Promise<AnalogSearchResponse> {
  return requestJson<AnalogSearchResponse>("/api/v1/analogs/search", {
    method: "POST",
    signal: params.signal,
    body: JSON.stringify({
      site_id: params.siteId,
      model_type: params.modelType,
      distance_metric: params.distanceMetric ?? "euclidean",
      test_profile: params.testProfile,
      min_s_ind: params.minSInd,
      min_s_dep: params.minSDep,
      exclude_benchmarks: params.excludeBenchmarks,
      penalize_estimated: params.penalizeEstimated ?? false,
      limit: params.limit,
      custom_iv_weights: params.customIvWeights,
      custom_dv_weights: params.customDvWeights,
      custom_min_similarity: params.customMinSimilarity,
    }),
  });
}

export interface CompareCellOptions {
  signal?: AbortSignal;
  testProfile?: TestProfileType;
  penalizeEstimated?: boolean;
  customIvWeights?: Record<string, number>;
  customDvWeights?: Record<string, number>;
}

function appendWeightParams(
  params: URLSearchParams,
  options?: Omit<CompareCellOptions, "signal">
): void {
  if (!options) return;
  if (options.testProfile && options.testProfile !== "causal_auto") {
    params.set("test_profile", options.testProfile);
  }
  if (options.penalizeEstimated) {
    params.set("penalize_estimated", "true");
  }
  if (
    options.testProfile === "manual_custom" &&
    options.customIvWeights &&
    Object.keys(options.customIvWeights).length > 0
  ) {
    params.set("iv_weights", JSON.stringify(options.customIvWeights));
  }
  if (
    options.testProfile === "manual_custom" &&
    options.customDvWeights &&
    Object.keys(options.customDvWeights).length > 0
  ) {
    params.set("dv_weights", JSON.stringify(options.customDvWeights));
  }
}

export function compareCellWithSite(
  h3Index: string,
  siteId: string,
  modelType: DecompositionModelType,
  signalOrOptions?: AbortSignal | CompareCellOptions
): Promise<SiteComparisonResponse> {
  const isSignal =
    signalOrOptions != null &&
    ("aborted" in signalOrOptions ||
      (typeof AbortSignal !== "undefined" && signalOrOptions instanceof AbortSignal));
  const options: CompareCellOptions = isSignal
    ? { signal: signalOrOptions as AbortSignal }
    : (signalOrOptions as CompareCellOptions | undefined) ?? {};

  const query = new URLSearchParams({ model_type: modelType });
  appendWeightParams(query, options);
  return requestJson<SiteComparisonResponse>(
    `/api/v1/analogs/${encodeURIComponent(h3Index)}/compare/${encodeURIComponent(siteId)}?${query.toString()}`,
    { signal: options.signal }
  );
}

export function probeEarthCoordinate(
  lat: number,
  lon: number,
  siteId: string,
  modelType: DecompositionModelType,
  options?: Omit<CompareCellOptions, "signal">
): Promise<SiteComparisonResponse> {
  return requestJson<SiteComparisonResponse>("/api/v1/earth/probe", {
    method: "POST",
    body: JSON.stringify({
      lat,
      lon,
      site_id: siteId,
      model_type: modelType,
      test_profile: options?.testProfile ?? "causal_auto",
      penalize_estimated: options?.penalizeEstimated ?? false,
      custom_iv_weights:
        options?.testProfile === "manual_custom" ? options.customIvWeights : undefined,
      custom_dv_weights:
        options?.testProfile === "manual_custom" ? options.customDvWeights : undefined,
    }),
  });
}

export function refreshDatasets(): Promise<{ status: string }> {
  return requestJson<{ status: string }>("/api/v1/datasets/refresh", {
    method: "POST",
  });
}

export interface ProbePlanetaryParams {
  body: PlanetaryBody;
  lat: number;
  lon: number;
  modelType: DecompositionModelType;
  distanceMetric?: DistanceMetricType;
  testProfile: TestProfileType;
  minSInd: number;
  minSDep: number;
  excludeBenchmarks: boolean;
  penalizeEstimated?: boolean;
  limit: number;
  customIvWeights?: Record<string, number>;
  customDvWeights?: Record<string, number>;
  customMinSimilarity?: Record<string, number>;
}

export function probePlanetaryLocation(
  params: ProbePlanetaryParams
): Promise<PlanetaryProbeResponse> {
  return requestJson<PlanetaryProbeResponse>("/api/v1/planetary/probe", {
    method: "POST",
    body: JSON.stringify({
      body: params.body,
      lat: params.lat,
      lon: params.lon,
      model_type: params.modelType,
      distance_metric: params.distanceMetric ?? "euclidean",
      test_profile: params.testProfile,
      min_s_ind: params.minSInd,
      min_s_dep: params.minSDep,
      exclude_benchmarks: params.excludeBenchmarks,
      penalize_estimated: params.penalizeEstimated ?? false,
      limit: params.limit,
      custom_iv_weights: params.customIvWeights,
      custom_dv_weights: params.customDvWeights,
      custom_min_similarity: params.customMinSimilarity,
    }),
  });
}

export function fetchMultiAgencyDatasets(h3Index: string): Promise<MultiAgencyCatalogResponse> {
  return requestJson<MultiAgencyCatalogResponse>(
    `/api/v1/earth/${encodeURIComponent(h3Index)}/datasets`
  );
}

export function refineAnalogCell(
  h3Index: string,
  siteId: string,
  modelType: DecompositionModelType,
  penalizeEstimated = false,
  testProfile: TestProfileType = "causal_auto",
  customIvWeights?: Record<string, number>,
  customDvWeights?: Record<string, number>
): Promise<AnalogRefineResponse> {
  return requestJson<AnalogRefineResponse>("/api/v1/analogs/refine", {
    method: "POST",
    body: JSON.stringify({
      earth_cell_h3: h3Index,
      site_id: siteId,
      model_type: modelType,
      test_profile: testProfile,
      penalize_estimated: penalizeEstimated,
      custom_iv_weights: testProfile === "manual_custom" ? customIvWeights : undefined,
      custom_dv_weights: testProfile === "manual_custom" ? customDvWeights : undefined,
    }),
  });
}

