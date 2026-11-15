import type {
  AnalogRefineResponse,
  AnalogSearchResponse,
  ApiErrorDetail,
  DecompositionModelType,
  DecompositionResponse,
  DistanceMetricType,
  MissionAiAnalysisRequest,
  MissionAiAnalysisResponse,
  MissionAiStatusResponse,
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

const MAX_CACHE_ENTRIES = 64;
const responseCache = new Map<string, unknown>();

function getCached<T>(key: string): T | undefined {
  if (!responseCache.has(key)) return undefined;
  const val = responseCache.get(key) as T;
  responseCache.delete(key);
  responseCache.set(key, val);
  return val;
}

function setCached<T>(key: string, val: T): T {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(key, val);
  return val;
}

export function clearApiCache(): void {
  responseCache.clear();
}

async function fetchApiResponse(url: string, init?: RequestInit): Promise<Response> {
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
    throw new ApiClientError(response.status >= 500 ? "errors.analysis_server_error" : "errors.unknown_error");
  }

  return response;
}

async function requestJson<T>(url: string, init?: RequestInit, cacheKey?: string): Promise<T> {
  if (cacheKey) {
    const hit = getCached<T>(cacheKey);
    if (hit !== undefined) return hit;
  }
  const response = await fetchApiResponse(url, init);
  try {
    const data = (await response.json()) as T;
    if (cacheKey) {
      setCached(cacheKey, data);
    }
    return data;
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw new ApiClientError("errors.invalid_response");
  }
}

export function fetchPlanetarySites(signal?: AbortSignal): Promise<PlanetarySite[]> {
  return requestJson<PlanetarySite[]>("/api/v1/planetary-sites", { signal }, "sites");
}

export function runDecomposition(
  siteId: string,
  modelType: DecompositionModelType,
  signal?: AbortSignal
): Promise<DecompositionResponse> {
  const body = JSON.stringify({
    site_id: siteId,
    model_type: modelType,
  });
  return requestJson<DecompositionResponse>(
    "/api/v1/decompose",
    {
      method: "POST",
      signal,
      body,
    },
    `decomp:${body}`
  );
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
  compactTail?: boolean;
  customIvWeights?: Record<string, number>;
  customDvWeights?: Record<string, number>;
  customMinSimilarity?: Record<string, number>;
  signal?: AbortSignal;
}

export function searchAnalogs(params: SearchAnalogsParams): Promise<AnalogSearchResponse> {
  const body = JSON.stringify({
    site_id: params.siteId,
    model_type: params.modelType,
    distance_metric: params.distanceMetric ?? "euclidean",
    test_profile: params.testProfile,
    min_s_ind: params.minSInd,
    min_s_dep: params.minSDep,
    exclude_benchmarks: params.excludeBenchmarks,
    penalize_estimated: params.penalizeEstimated ?? false,
    limit: params.limit,
    compact_tail: params.compactTail ?? false,
    custom_iv_weights: params.customIvWeights,
    custom_dv_weights: params.customDvWeights,
    custom_min_similarity: params.customMinSimilarity,
  });
  return requestJson<AnalogSearchResponse>(
    "/api/v1/analogs/search",
    {
      method: "POST",
      signal: params.signal,
      body,
    },
    `search:${body}`
  );
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
  const url = `/api/v1/analogs/${encodeURIComponent(h3Index)}/compare/${encodeURIComponent(siteId)}?${query.toString()}`;
  return requestJson<SiteComparisonResponse>(url, { signal: options.signal }, `cmp:${url}`);
}

export async function probeEarthCoordinate(
  lat: number,
  lon: number,
  siteId: string,
  modelType: DecompositionModelType,
  options?: Omit<CompareCellOptions, "signal">
): Promise<SiteComparisonResponse> {
  clearApiCache();
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

export async function refreshDatasets(): Promise<{ status: string }> {
  clearApiCache();
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

export async function probePlanetaryLocation(
  params: ProbePlanetaryParams
): Promise<PlanetaryProbeResponse> {
  clearApiCache();
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
  const url = `/api/v1/earth/${encodeURIComponent(h3Index)}/datasets`;
  return requestJson<MultiAgencyCatalogResponse>(url, undefined, `datasets:${h3Index}`);
}

export async function refineAnalogCell(
  h3Index: string,
  siteId: string,
  modelType: DecompositionModelType,
  penalizeEstimated = false,
  testProfile: TestProfileType = "causal_auto",
  customIvWeights?: Record<string, number>,
  customDvWeights?: Record<string, number>,
  radiusK = 0
): Promise<AnalogRefineResponse> {
  clearApiCache();
  return requestJson<AnalogRefineResponse>("/api/v1/analogs/refine", {
    method: "POST",
    body: JSON.stringify({
      earth_cell_h3: h3Index,
      site_id: siteId,
      model_type: modelType,
      test_profile: testProfile,
      penalize_estimated: penalizeEstimated,
      radius_k: radiusK,
      custom_iv_weights: testProfile === "manual_custom" ? customIvWeights : undefined,
      custom_dv_weights: testProfile === "manual_custom" ? customDvWeights : undefined,
    }),
  });
}

export function fetchAiStatus(): Promise<MissionAiStatusResponse> {
  return requestJson<MissionAiStatusResponse>("/api/v1/ai/status");
}

export async function requestMissionAiAnalysis(
  payload: MissionAiAnalysisRequest,
  signal?: AbortSignal
): Promise<MissionAiAnalysisResponse | null> {
  const response = await fetchApiResponse("/api/v1/mission/ai-analysis", {
    method: "POST",
    signal,
    body: JSON.stringify(payload),
  });
  if (response.status === 204) {
    return null;
  }
  return (await response.json()) as MissionAiAnalysisResponse;
}

