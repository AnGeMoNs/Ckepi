import type {
  AnalogRefineResponse,
  AnalogSearchResponse,
  ApiErrorDetail,
  DecompositionModelType,
  DecompositionResponse,
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
  } catch {
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

  return (await response.json()) as T;
}

export function fetchPlanetarySites(): Promise<PlanetarySite[]> {
  return requestJson<PlanetarySite[]>("/api/v1/planetary-sites");
}

export function runDecomposition(
  siteId: string,
  modelType: DecompositionModelType
): Promise<DecompositionResponse> {
  return requestJson<DecompositionResponse>("/api/v1/decompose", {
    method: "POST",
    body: JSON.stringify({
      site_id: siteId,
      model_type: modelType,
    }),
  });
}

export interface SearchAnalogsParams {
  siteId: string;
  modelType: DecompositionModelType;
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

export function compareCellWithSite(
  h3Index: string,
  siteId: string,
  modelType: DecompositionModelType
): Promise<SiteComparisonResponse> {
  const query = new URLSearchParams({ model_type: modelType }).toString();
  return requestJson<SiteComparisonResponse>(
    `/api/v1/analogs/${encodeURIComponent(h3Index)}/compare/${encodeURIComponent(siteId)}?${query}`
  );
}

export function probeEarthCoordinate(
  lat: number,
  lon: number,
  siteId: string,
  modelType: DecompositionModelType
): Promise<SiteComparisonResponse> {
  return requestJson<SiteComparisonResponse>("/api/v1/earth/probe", {
    method: "POST",
    body: JSON.stringify({
      lat,
      lon,
      site_id: siteId,
      model_type: modelType,
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
  testProfile: TestProfileType;
  minSInd: number;
  minSDep: number;
  excludeBenchmarks: boolean;
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
      test_profile: params.testProfile,
      min_s_ind: params.minSInd,
      min_s_dep: params.minSDep,
      exclude_benchmarks: params.excludeBenchmarks,
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
  testProfile: TestProfileType = "causal_auto"
): Promise<AnalogRefineResponse> {
  return requestJson<AnalogRefineResponse>("/api/v1/analogs/refine", {
    method: "POST",
    body: JSON.stringify({
      earth_cell_h3: h3Index,
      site_id: siteId,
      model_type: modelType,
      test_profile: testProfile,
      penalize_estimated: penalizeEstimated,
    }),
  });
}

